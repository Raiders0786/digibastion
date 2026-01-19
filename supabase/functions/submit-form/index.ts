import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// Input validation schemas
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_SOCIAL_LENGTH = 100;
const MAX_URL_LENGTH = 500;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBSCRIPTIONS_PER_EMAIL = 3; // Max subscription attempts per email per hour
const MAX_CONTACTS_PER_IP = 5; // Max contact form submissions per IP per hour

// In-memory rate limit store (resets on cold start, but provides basic protection)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface ContactFormData {
  name: string;
  email: string;
  inquiryType?: string;
  social?: string;
  meetingLink?: string;
  message: string;
}

interface SubscriptionFormData {
  name?: string;
  email: string;
  categories: string[];
  technologies?: string[];
  frequency: string;
  severity: string;
  preferred_hour?: number;
  timezone_offset?: number;
  preferred_day?: number;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= MAX_EMAIL_LENGTH;
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return url.length <= MAX_URL_LENGTH;
  } catch {
    return false;
  }
}

function sanitizeString(str: string, maxLength: number): string {
  return str.trim().slice(0, maxLength);
}

// HTML escape function to prevent injection attacks in emails
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         "unknown";
}

function checkRateLimit(key: string, maxAttempts: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  // Clean up expired entries
  if (record && now > record.resetAt) {
    rateLimitStore.delete(key);
  }
  
  const current = rateLimitStore.get(key);
  
  if (!current) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxAttempts - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (current.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetIn: current.resetAt - now };
  }
  
  current.count++;
  return { allowed: true, remaining: maxAttempts - current.count, resetIn: current.resetAt - now };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    const web3formsKey = Deno.env.get("WEB3FORMS_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!web3formsKey) {
      console.error("WEB3FORMS_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formData: Record<string, string>;

    if (type === "contact") {
      const contactData = data as ContactFormData;
      
      // Validate required fields
      if (!contactData.name || !contactData.email || !contactData.message) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate email
      if (!validateEmail(contactData.email)) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid email address" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rate limit by IP for contact forms
      const clientIP = getClientIP(req);
      const ipRateLimit = checkRateLimit(`contact:${clientIP}`, MAX_CONTACTS_PER_IP);
      
      if (!ipRateLimit.allowed) {
        console.warn(`[submit-form] Rate limit exceeded for IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Too many requests. Please try again later.",
            retryAfter: Math.ceil(ipRateLimit.resetIn / 1000)
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "Retry-After": String(Math.ceil(ipRateLimit.resetIn / 1000))
            } 
          }
        );
      }

      // Validate meeting link if provided
      if (contactData.meetingLink && !validateUrl(contactData.meetingLink)) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid meeting link URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[submit-form] Contact form from IP ${clientIP}, remaining: ${ipRateLimit.remaining}`);

      // Sanitize inputs
      formData = {
        access_key: web3formsKey,
        subject: "New Contact Form Submission - Digibastion",
        from_name: "Digibastion Contact Form",
        name: sanitizeString(contactData.name, MAX_NAME_LENGTH),
        email: sanitizeString(contactData.email, MAX_EMAIL_LENGTH),
        inquiry_type: sanitizeString(contactData.inquiryType || "general", 50),
        social: sanitizeString(contactData.social || "", MAX_SOCIAL_LENGTH),
        meeting_link: contactData.meetingLink ? sanitizeString(contactData.meetingLink, MAX_URL_LENGTH) : "",
        message: sanitizeString(contactData.message, MAX_MESSAGE_LENGTH),
      };

      // Send to Web3Forms
      console.log("Submitting contact form to Web3Forms");
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log("Web3Forms response:", result.success ? "success" : "failed");

      return new Response(
        JSON.stringify({ success: result.success, message: result.message }),
        { status: result.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (type === "subscription") {
      const subData = data as SubscriptionFormData;
      
      // Validate required fields
      if (!subData.email || !subData.categories || subData.categories.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate email
      if (!validateEmail(subData.email)) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid email address" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rate limit by email for subscriptions (prevent spam signups)
      const normalizedEmail = subData.email.toLowerCase().trim();
      const emailRateLimit = checkRateLimit(`subscription:${normalizedEmail}`, MAX_SUBSCRIPTIONS_PER_EMAIL);
      
      // Also rate limit by IP as secondary protection
      const clientIP = getClientIP(req);
      const ipRateLimit = checkRateLimit(`subscription-ip:${clientIP}`, MAX_CONTACTS_PER_IP);
      
      if (!emailRateLimit.allowed || !ipRateLimit.allowed) {
        const resetIn = Math.max(emailRateLimit.resetIn, ipRateLimit.resetIn);
        console.warn(`[submit-form] Subscription rate limit exceeded for email: ${normalizedEmail}, IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Too many subscription attempts. Please try again later.",
            retryAfter: Math.ceil(resetIn / 1000)
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "Retry-After": String(Math.ceil(resetIn / 1000))
            } 
          }
        );
      }

      // Initialize Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Check if this email already has a verified subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id, is_verified')
        .eq('email', sanitizeString(subData.email, MAX_EMAIL_LENGTH).toLowerCase())
        .maybeSingle();

      const isNewSubscription = !existingSub;
      const needsVerification = !existingSub?.is_verified;

      // Generate new verification token
      const verificationToken = crypto.randomUUID();
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      // Sanitize and prepare subscription data
      const subscriptionData = {
        email: sanitizeString(subData.email, MAX_EMAIL_LENGTH).toLowerCase(),
        name: subData.name ? sanitizeString(subData.name, MAX_NAME_LENGTH) : null,
        categories: subData.categories.slice(0, 10).map(c => sanitizeString(c, 50)),
        technologies: (subData.technologies || []).slice(0, 20).map(t => sanitizeString(t, 50)),
        frequency: sanitizeString(subData.frequency, 20),
        severity_threshold: sanitizeString(subData.severity, 20),
        preferred_hour: typeof subData.preferred_hour === 'number' ? Math.min(23, Math.max(0, subData.preferred_hour)) : 9,
        timezone_offset: typeof subData.timezone_offset === 'number' ? Math.min(14, Math.max(-12, subData.timezone_offset)) : 0,
        preferred_day: typeof subData.preferred_day === 'number' ? Math.min(6, Math.max(0, subData.preferred_day)) : 0,
        is_active: true,
        is_verified: existingSub?.is_verified || false, // Keep verified status if already verified
        verification_token: needsVerification ? verificationToken : null,
        verification_token_expires_at: needsVerification ? tokenExpiresAt : null,
      };

      console.log(`[submit-form] Subscription from IP ${clientIP}, email: ${subscriptionData.email}, isNew: ${isNewSubscription}, needsVerification: ${needsVerification}`);

      // Upsert subscription (update if email exists)
      const { data: subscription, error: dbError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'email' })
        .select()
        .single();

      if (dbError) {
        console.error("[submit-form] Database error:", dbError);
        throw new Error("Failed to save subscription");
      }

      console.log("[submit-form] Subscription saved:", subscription.id);

      // Send verification email if needed
      if (needsVerification) {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          const verifyUrl = `${supabaseUrl}/functions/v1/verify-email?token=${verificationToken}`;
          
          try {
            await resend.emails.send({
              from: "Digibastion Security <onboarding@resend.dev>",
              to: [subscriptionData.email],
              subject: "Verify your Digibastion Security Alert Subscription",
              html: generateVerificationEmail(subscriptionData.name, verifyUrl, subscriptionData.categories),
            });
            console.log("[submit-form] Verification email sent to:", subscriptionData.email);
          } catch (emailError) {
            console.error("[submit-form] Failed to send verification email:", emailError);
            // Don't fail the whole request if email fails
          }
        } else {
          console.warn("[submit-form] RESEND_API_KEY not configured, skipping verification email");
        }
      }

      // Also send notification to admin via Web3Forms
      formData = {
        access_key: web3formsKey,
        subject: "New Digibastion Threat Intel Subscription",
        from_name: "Digibastion Threat Intel",
        name: sanitizeString(subData.name || "Subscriber", MAX_NAME_LENGTH),
        email: sanitizeString(subData.email, MAX_EMAIL_LENGTH),
        message: `
New subscription request:
- Email: ${subscriptionData.email}
- Name: ${subscriptionData.name || 'Not provided'}
- Categories: ${subscriptionData.categories.join(', ')}
- Technologies: ${subscriptionData.technologies.join(', ') || 'None selected'}
- Frequency: ${subscriptionData.frequency}
- Min Severity: ${subscriptionData.severity_threshold}
- Verified: ${subscriptionData.is_verified ? 'Yes' : 'Pending verification'}
        `.trim()
      };

      // Send admin notification (fire and forget)
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(formData),
      }).catch(e => console.error("[submit-form] Web3Forms notification error:", e));

      const responseMessage = needsVerification 
        ? "Please check your email to verify your subscription."
        : "Subscription updated successfully.";

      return new Response(
        JSON.stringify({ success: true, message: responseMessage, needsVerification }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid form type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error in submit-form function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

function generateVerificationEmail(name: string | null, verifyUrl: string, categories: string[]): string {
  const displayName = escapeHtml(name || 'Security Professional');
  const escapedVerifyUrl = escapeHtml(verifyUrl);
  const categoryList = categories.slice(0, 5).map(c => `<li style="margin-bottom: 4px;">${escapeHtml(c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</li>`).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1a1a2e;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(30, 30, 50, 0.95) 100%); border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.3);">
          <tr>
            <td style="padding: 40px;">
              <!-- Header -->
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <h1 style="color: #f3f4f6; margin: 0; font-size: 28px;">🛡️ Digibastion</h1>
                    <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 14px;">Security Threat Intelligence</p>
                  </td>
                </tr>
              </table>
              
              <!-- Content -->
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 24px;">
                    <h2 style="color: #f3f4f6; margin: 0 0 16px 0; font-size: 22px;">Verify Your Email</h2>
                    <p style="color: #d1d5db; margin: 0; font-size: 16px; line-height: 1.6;">
                      Hi ${displayName},<br><br>
                      Thanks for subscribing to Digibastion Security Alerts! Please verify your email address to start receiving threat intelligence updates.
                    </p>
                  </td>
                </tr>
                
                <!-- Button -->
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${escapedVerifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
                
                <!-- Subscription Details -->
                <tr>
                  <td style="padding: 24px; background: rgba(0, 0, 0, 0.2); border-radius: 8px; margin-top: 24px;">
                    <h3 style="color: #f3f4f6; margin: 0 0 12px 0; font-size: 16px;">Your Subscription Includes:</h3>
                    <ul style="color: #9ca3af; margin: 0; padding-left: 20px; font-size: 14px;">
                      ${categoryList}
                    </ul>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 32px;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                      This link will expire in 24 hours. If you didn't sign up for Digibastion alerts, you can safely ignore this email.
                    </p>
                    <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0 0;">
                      <a href="https://digibastion.com" style="color: #8b5cf6; text-decoration: none;">digibastion.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
