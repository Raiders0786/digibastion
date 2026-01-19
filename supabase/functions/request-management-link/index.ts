import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// Validation constants
const MAX_EMAIL_LENGTH = 255;

// Rate limiting configuration - stricter for this endpoint
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS_PER_IP = 5; // Max attempts per IP per hour
const MAX_ATTEMPTS_PER_EMAIL = 2; // Max attempts per email per hour (prevent spam)

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         "unknown";
}

function checkRateLimit(key: string, maxAttempts: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
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

// HTML escape function
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateManagementLinkEmail(name: string | null, manageUrl: string): string {
  const displayName = escapeHtml(name || 'Security Professional');
  const escapedUrl = escapeHtml(manageUrl);
  
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
                    <h2 style="color: #f3f4f6; margin: 0 0 16px 0; font-size: 22px;">Manage Your Subscription</h2>
                    <p style="color: #d1d5db; margin: 0; font-size: 16px; line-height: 1.6;">
                      Hi ${displayName},<br><br>
                      You requested a new link to manage your Digibastion Security Alert subscription. Click the button below to update your preferences or unsubscribe.
                    </p>
                  </td>
                </tr>
                
                <!-- Button -->
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${escapedUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Manage Subscription
                    </a>
                  </td>
                </tr>
                
                <!-- Security Notice -->
                <tr>
                  <td style="padding: 24px; background: rgba(0, 0, 0, 0.2); border-radius: 8px; margin-top: 24px;">
                    <p style="color: #9ca3af; margin: 0; font-size: 14px; line-height: 1.6;">
                      <strong style="color: #f3f4f6;">🔒 Security Note:</strong><br>
                      This link is unique to your subscription. Do not share it with others as it provides full access to manage your alert preferences.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 32px;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                      If you didn't request this link, you can safely ignore this email. Your subscription settings remain unchanged.
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    const { email } = await req.json();

    // Rate limit by IP first
    const ipRateLimit = checkRateLimit(`mgmt-link:ip:${clientIP}`, MAX_ATTEMPTS_PER_IP);
    if (!ipRateLimit.allowed) {
      console.warn(`[request-management-link] Rate limit exceeded for IP: ${clientIP}`);
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

    // Validate email
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit by email (stricter to prevent spam)
    const emailRateLimit = checkRateLimit(`mgmt-link:email:${normalizedEmail}`, MAX_ATTEMPTS_PER_EMAIL);
    if (!emailRateLimit.allowed) {
      console.warn(`[request-management-link] Rate limit exceeded for email: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "A management link was recently sent to this email. Please check your inbox or try again later.",
          retryAfter: Math.ceil(emailRateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(emailRateLimit.resetIn / 1000))
          } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[request-management-link] Looking up subscription for: ${normalizedEmail}`);

    // Find the subscription
    const { data: subscription, error: findError } = await supabase
      .from("subscriptions")
      .select("id, email, name, is_active, is_verified")
      .eq("email", normalizedEmail)
      .eq("is_active", true)
      .maybeSingle();

    if (findError) {
      console.error("[request-management-link] Database error:", findError);
      throw findError;
    }

    // Always return success to prevent email enumeration attacks
    // Even if the email doesn't exist, we don't reveal that
    if (!subscription) {
      console.log(`[request-management-link] No subscription found for: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If an active subscription exists for this email, a management link will be sent shortly." 
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a new management token
    const newToken = crypto.randomUUID();

    // Update the subscription with the new token
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ 
        verification_token: newToken,
        updated_at: new Date().toISOString()
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("[request-management-link] Update error:", updateError);
      throw updateError;
    }

    console.log(`[request-management-link] Generated new token for: ${normalizedEmail}`);

    // Send the email with the new management link
    if (resendApiKey) {
      const manageUrl = `https://digibastion.com/manage-subscription?email=${encodeURIComponent(normalizedEmail)}&token=${encodeURIComponent(newToken)}`;
      
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Digibastion Security <alerts@digibastion.com>',
            to: [normalizedEmail],
            subject: '🔑 Your Digibastion Subscription Management Link',
            html: generateManagementLinkEmail(subscription.name, manageUrl),
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error("[request-management-link] Resend API error:", errorText);
          // Don't fail the request, just log the error
        } else {
          console.log(`[request-management-link] Email sent to: ${normalizedEmail}`);
        }
      } catch (emailError) {
        console.error("[request-management-link] Email send error:", emailError);
        // Don't fail the request
      }
    } else {
      console.warn("[request-management-link] RESEND_API_KEY not configured");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "If an active subscription exists for this email, a management link will be sent shortly." 
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("[request-management-link] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
