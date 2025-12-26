import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

      // Sanitize and prepare subscription data
      const subscriptionData = {
        email: sanitizeString(subData.email, MAX_EMAIL_LENGTH).toLowerCase(),
        name: subData.name ? sanitizeString(subData.name, MAX_NAME_LENGTH) : null,
        categories: subData.categories.slice(0, 10).map(c => sanitizeString(c, 50)),
        technologies: (subData.technologies || []).slice(0, 20).map(t => sanitizeString(t, 50)),
        frequency: sanitizeString(subData.frequency, 20),
        severity_threshold: sanitizeString(subData.severity, 20),
        is_active: true,
        is_verified: false, // Will be true after email verification
      };

      console.log(`[submit-form] Subscription from IP ${clientIP}, email: ${subscriptionData.email}, remaining: ${emailRateLimit.remaining}`);

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
        `.trim()
      };

      // Send admin notification (fire and forget)
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(formData),
      }).catch(e => console.error("[submit-form] Web3Forms notification error:", e));

      return new Response(
        JSON.stringify({ success: true, message: "Subscription saved successfully" }),
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
