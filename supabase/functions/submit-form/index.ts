import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { emailHash, normalizeEmail } from "../_shared/email-compliance.ts";
import { parseSubscriptionPreferences, readDeliveryChannels } from "../_shared/subscription-preferences.ts";
import {
  OPTIN_TTL_MS,
  RESUBSCRIBE_RATE_LIMIT,
  describeChannels,
  optinConfirmUrl,
  parseSignupConsentSource,
  planSubscribeRequest,
  renderNextStepsHtml,
  renderNextStepsText,
  renderResubscribeEmail,
  subscriptionColumns,
} from "../_shared/subscription-optin.ts";
import { SITE_URL } from "../_shared/site-urls.ts";

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
const MAX_SUBSCRIPTIONS_PER_EMAIL = 3; // Max subscription attempts per email per hour
const MAX_CONTACTS_PER_IP = 5; // Max contact form submissions per IP per hour

interface ContactFormData {
  name: string;
  email: string;
  inquiryType?: string;
  social?: string;
  meetingLink?: string;
  message: string;
}

/**
 * Subscription payload. Preferences are validated by
 * parseSubscriptionPreferences, which also accepts the legacy frequency shape.
 */
interface SubscriptionFormData extends Record<string, unknown> {
  name?: string;
  email?: string;
  consent_source?: string;
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

async function hashIdentifier(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let formData: Record<string, string>;

    if (type === "contact") {
      if (!web3formsKey) {
        console.error("WEB3FORMS_KEY not configured");
        return new Response(
          JSON.stringify({ success: false, error: "Server configuration error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
      const { data: ipRateLimit, error: limitError } = await supabase.rpc('consume_rate_limit', { _scope: 'contact:ip', _identifier_hash: await hashIdentifier(clientIP), _max_attempts: MAX_CONTACTS_PER_IP, _window_seconds: 3600 });
      if (limitError) throw limitError;
      
      if (!ipRateLimit.allowed) {
        console.warn(`[submit-form] Rate limit exceeded for IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Too many requests. Please try again later.",
            retryAfter: 3600
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "Retry-After": "3600"
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

       console.log(`[submit-form] Contact form accepted, remaining: ${ipRateLimit.remaining}`);

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
      const subData = (data ?? {}) as SubscriptionFormData;
      const json = (body: Record<string, unknown>, status = 200) => new Response(
        JSON.stringify(body),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );

      if (typeof subData.email !== "string" || !subData.email) {
        return json({ success: false, error: "Missing required fields" }, 400);
      }
      if (!validateEmail(subData.email)) {
        return json({ success: false, error: "Invalid email address" }, 400);
      }

      // Same validation as update-subscription: new payload (wants_*,
      // include_preliminary, chains, timezone) or the legacy frequency one.
      const parsed = parseSubscriptionPreferences(subData);
      if (!parsed.ok) return json({ success: false, error: parsed.error }, 400);
      const preferences = parsed.value;
      const consentSource = parseSignupConsentSource(subData.consent_source);
      if (!consentSource) return json({ success: false, error: "Invalid consent source" }, 400);

      // Rate limit by email for subscriptions (prevent spam signups)
      const normalizedEmail = normalizeEmail(sanitizeString(subData.email, MAX_EMAIL_LENGTH));
      const { data: emailRateLimit, error: emailLimitError } = await supabase.rpc('consume_rate_limit', { _scope: 'subscription:email', _identifier_hash: await hashIdentifier(normalizedEmail), _max_attempts: MAX_SUBSCRIPTIONS_PER_EMAIL, _window_seconds: 3600 });

      // Also rate limit by IP as secondary protection
      const clientIP = getClientIP(req);
      const { data: ipRateLimit, error: ipLimitError } = await supabase.rpc('consume_rate_limit', { _scope: 'subscription:ip', _identifier_hash: await hashIdentifier(clientIP), _max_attempts: MAX_CONTACTS_PER_IP, _window_seconds: 3600 });
      if (emailLimitError || ipLimitError) throw emailLimitError || ipLimitError;

      if (!emailRateLimit.allowed || !ipRateLimit.allowed) {
        console.warn("[submit-form] Subscription rate limit exceeded");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Too many subscription attempts. Please try again later.",
            retryAfter: 3600
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Retry-After": "3600"
            }
          }
        );
      }

      // The response a brand-new signup gets. Suppressed addresses get it too,
      // so the form never reveals that an address bounced or complained.
      const checkEmailResponse = () => json({
        success: true,
        message: "Please check your email to verify your subscription.",
        needsVerification: true,
        alreadyVerified: false,
        isNewSubscription: true,
        inactive: false,
      });

      const [{ data: existingSub, error: lookupError }, { data: suppression, error: suppressionError }] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('id, email, name, is_verified, is_active, verification_token, verification_token_expires_at, frequency, wants_realtime, wants_daily, wants_weekly, preferred_hour, timezone_offset, timezone, categories')
          .eq('email', normalizedEmail)
          .maybeSingle(),
        supabase
          .from('email_suppressions')
          .select('email_hash')
          .eq('email_hash', await emailHash(normalizedEmail))
          .maybeSingle(),
      ]);
      if (lookupError) throw lookupError;
      if (suppressionError) throw suppressionError;

      const action = planSubscribeRequest({ existing: existingSub, suppressed: Boolean(suppression) });
      console.log(`[submit-form] Subscription request: action=${action}`);

      if (action === 'suppressed') return checkEmailResponse();

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      const sendEmail = async (to: string, subject: string, html: string, text: string, label: string) => {
        if (!resendApiKey) {
          console.warn("[submit-form] RESEND_API_KEY not configured");
          return;
        }
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Digibastion Security <alerts@digibastion.com>',
              reply_to: 'support@digibastion.com',
              to: [to],
              subject,
              html,
              text,
            }),
          });
          if (!emailResponse.ok) {
            console.error(`[submit-form] Resend API error (${label}): status ${emailResponse.status}`);
          } else {
            console.log(`[submit-form] ${label} email sent`);
          }
        } catch (emailError) {
          console.error(`[submit-form] Failed to send ${label} email:`, emailError);
        }
      };

      if (action === 'resubscribe') {
        // Re-activation only happens when the address owner clicks the opt-in
        // link; is_active, the saved preferences and the management token stay
        // as they are until then.
        const { data: resubscribeLimit, error: resubscribeLimitError } = await supabase.rpc('consume_rate_limit', {
          _scope: RESUBSCRIBE_RATE_LIMIT.scope,
          _identifier_hash: await hashIdentifier(normalizedEmail),
          _max_attempts: RESUBSCRIBE_RATE_LIMIT.maxAttempts,
          _window_seconds: RESUBSCRIBE_RATE_LIMIT.windowSeconds,
        });
        if (resubscribeLimitError) throw resubscribeLimitError;
        if (resubscribeLimit?.allowed) {
          const optinToken = crypto.randomUUID();
          const { error: optinError } = await supabase
            .from('subscriptions')
            .update({
              optin_token: optinToken,
              optin_token_expires_at: new Date(Date.now() + OPTIN_TTL_MS).toISOString(),
              optin_pending: subscriptionColumns(preferences),
            })
            .eq('id', existingSub!.id)
            .eq('is_verified', true)
            .eq('is_active', false);
          if (optinError) throw optinError;
          const email = renderResubscribeEmail({
            name: existingSub!.name ?? null,
            channels: preferences.channels,
            categories: preferences.categories,
            confirmUrl: optinConfirmUrl(optinToken),
          });
          await sendEmail(normalizedEmail, email.subject, email.html, email.text, 'Re-subscribe opt-in');
        } else {
          console.warn("[submit-form] Re-subscribe rate limit reached; no email sent");
        }
        return json({
          success: true,
          message: "Check your inbox to confirm you want these emails again.",
          needsVerification: false,
          alreadyVerified: true,
          isNewSubscription: false,
          inactive: true,
        });
      }

      if (action === 'already-active') {
        // Public signup never overwrites an existing subscriber's preferences.
        // The management link goes to the address they already proved they control.
        const manageUrl = `${SITE_URL}/manage-subscription?email=${encodeURIComponent(existingSub!.email)}&token=${encodeURIComponent(existingSub!.verification_token || '')}`;
        const channels = describeChannels(readDeliveryChannels(existingSub!));
        await sendEmail(
          normalizedEmail,
          "You're already subscribed - Digibastion Security",
          generateAlreadyVerifiedEmail(existingSub!.name, channels, existingSub!.preferred_hour, existingSub!.timezone_offset, existingSub!.timezone, existingSub!.categories || [], manageUrl),
          generateAlreadyVerifiedEmailText(existingSub!.name, channels, existingSub!.preferred_hour, existingSub!.timezone_offset, existingSub!.timezone, existingSub!.categories || [], manageUrl),
          'Existing subscriber',
        );
        return json({
          success: true,
          message: "You're already subscribed! We've sent a confirmation to your email.",
          needsVerification: false,
          alreadyVerified: true,
          isNewSubscription: false,
          inactive: false,
        });
      }

      // New or still-unverified address: (re)send the verification link. Keep
      // a pending subscriber's valid token so a public retry cannot invalidate
      // a link already delivered to their inbox.
      const existingTokenIsValid = Boolean(
        existingSub?.verification_token &&
        existingSub.verification_token_expires_at &&
        new Date(existingSub.verification_token_expires_at) > new Date()
      );
      const verificationToken = existingTokenIsValid
        ? existingSub?.verification_token as string
        : crypto.randomUUID();
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      const subscriberName = subData.name ? sanitizeString(String(subData.name), MAX_NAME_LENGTH) : null;

      if (action === 'create') {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            email: normalizedEmail,
            name: subscriberName,
            ...subscriptionColumns(preferences),
            is_active: true,
            is_verified: false,
            verification_token: verificationToken,
            verification_token_expires_at: tokenExpiresAt,
            consent_source: consentSource,
            consent_ip_hash: clientIP === "unknown" ? null : await hashIdentifier(clientIP),
          });
        if (insertError) {
          console.error("[submit-form] Database error:", insertError);
          throw new Error("Failed to save subscription");
        }
      } else if (!existingTokenIsValid) {
        const { error: refreshError } = await supabase
          .from('subscriptions')
          .update({
            verification_token: verificationToken,
            verification_token_expires_at: tokenExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSub!.id)
          .eq('is_verified', false);
        if (refreshError) {
          console.error("[submit-form] Database error:", refreshError);
          throw new Error("Failed to save subscription");
        }
      }
      console.log("[submit-form] Subscription request saved");

      const verifyUrl = `${SITE_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;
      const verificationName = action === 'create' ? subscriberName : existingSub?.name || null;
      const verificationCategories = action === 'create' ? preferences.categories : existingSub?.categories || [];
      await sendEmail(
        normalizedEmail,
        'Verify your email - Digibastion Security Alerts',
        generateVerificationEmail(verificationName, verifyUrl, verificationCategories),
        generateVerificationEmailText(verificationName, verifyUrl, verificationCategories),
        'Verification',
      );

      return json({
        success: true,
        message: "Please check your email to verify your subscription.",
        needsVerification: true,
        alreadyVerified: false,
        isNewSubscription: action === 'create',
        inactive: false,
      });

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
                
                <tr>
                  <td style="padding-top: 24px;">
                    ${renderNextStepsHtml('While you wait')}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 32px;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                      This link will expire in 24 hours. If you didn't sign up for Digibastion alerts, you can safely ignore this email.
                    </p>
                    <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0 0;">
                      <a href="${SITE_URL}" style="color: #8b5cf6; text-decoration: none;">www.digibastion.com</a>
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

function generateVerificationEmailText(name: string | null, verifyUrl: string, categories: string[]): string {
  const displayName = name || 'Security Professional';
  const categoryList = categories.slice(0, 5).map(c => `- ${c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('\n');
  
  return `
Digibastion Security - Verify Your Email

Hi ${displayName},

Thanks for subscribing to Digibastion Security Alerts! Please verify your email address to start receiving threat intelligence updates.

Verify your email: ${verifyUrl}

Your Subscription Includes:
${categoryList}

${renderNextStepsText('While you wait')}

This link will expire in 24 hours. If you didn't sign up for Digibastion alerts, you can safely ignore this email.

---
Digibastion Security Threat Intelligence
${SITE_URL}
  `.trim();
}

// Delivery time for the daily brief and weekly: the IANA zone when the
// subscriber has one, otherwise the stored UTC offset.
function formatDeliveryTime(hour: number, offset: number, timezone: string | null): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  if (timezone) return `${displayHour}:00 ${period} (${timezone})`;
  const sign = offset >= 0 ? '+' : '';
  return `${displayHour}:00 ${period} UTC${sign}${offset}`;
}

function categoryName(category: string): string {
  return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function generateAlreadyVerifiedEmail(
  name: string | null,
  channels: string[],
  preferredHour: number,
  timezoneOffset: number,
  timezone: string | null,
  categories: string[],
  manageUrl: string,
): string {
  const displayName = escapeHtml(name || 'Security Professional');
  const escapedManageUrl = escapeHtml(manageUrl);
  const categoryList = categories.slice(0, 5).map(c => `<li style="margin-bottom: 4px;">${escapeHtml(categoryName(c))}</li>`).join('');
  const channelList = channels.map(c => `<li style="margin-bottom: 4px;">${escapeHtml(c)}</li>`).join('');
  const showDelivery = channels.some((channel) => channel !== 'Real-time alerts');
  const deliveryRow = showDelivery
    ? `<tr>
                        <td style="color: #9ca3af; font-size: 14px; padding-bottom: 8px;">
                          <strong style="color: #f3f4f6;">Daily and weekly delivery:</strong> ${escapeHtml(formatDeliveryTime(preferredHour, timezoneOffset, timezone))}
                        </td>
                      </tr>`
    : '';

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
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(30, 30, 50, 0.95) 100%); border-radius: 16px; border: 1px solid rgba(34, 197, 94, 0.3);">
          <tr>
            <td style="padding: 40px;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <h1 style="color: #f3f4f6; margin: 0; font-size: 28px;">Digibastion</h1>
                    <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 14px;">Security Threat Intelligence</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 24px;">
                    <h2 style="color: #f3f4f6; margin: 0 0 16px 0; font-size: 22px;">You're already subscribed</h2>
                    <p style="color: #d1d5db; margin: 0; font-size: 16px; line-height: 1.6;">
                      Hi ${displayName},<br><br>
                      Your email is already verified. Here are your current settings:
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px; background: rgba(0, 0, 0, 0.2); border-radius: 8px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #9ca3af; font-size: 14px; padding-bottom: 8px;">
                          <strong style="color: #f3f4f6;">Emails:</strong>
                          <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                            ${channelList}
                          </ul>
                        </td>
                      </tr>
                      ${deliveryRow}
                      <tr>
                        <td style="color: #9ca3af; font-size: 14px; padding-top: 8px;">
                          <strong style="color: #f3f4f6;">Categories:</strong>
                          <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                            ${categoryList}
                          </ul>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${escapedManageUrl}" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Manage preferences
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    ${renderNextStepsHtml('More from Digibastion')}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                      You're receiving this because someone tried to subscribe with your email. If this wasn't you, you can safely ignore this message.
                    </p>
                    <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0 0;">
                      <a href="${SITE_URL}" style="color: #22c55e; text-decoration: none;">www.digibastion.com</a>
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

function generateAlreadyVerifiedEmailText(
  name: string | null,
  channels: string[],
  preferredHour: number,
  timezoneOffset: number,
  timezone: string | null,
  categories: string[],
  manageUrl: string,
): string {
  const displayName = name || 'Security Professional';
  const lines = [
    "Digibastion Security - You're already subscribed",
    '',
    `Hi ${displayName},`,
    '',
    'Your email is already verified. Here are your current settings:',
    '',
    'Emails:',
    ...channels.map((channel) => `- ${channel}`),
  ];
  if (channels.some((channel) => channel !== 'Real-time alerts')) {
    lines.push(`Daily and weekly delivery: ${formatDeliveryTime(preferredHour, timezoneOffset, timezone)}`);
  }
  lines.push(
    'Categories:',
    ...categories.slice(0, 5).map((c) => `- ${categoryName(c)}`),
    '',
    `To update your preferences, visit: ${manageUrl}`,
    '',
    renderNextStepsText('More from Digibastion'),
    '',
    '---',
    'Digibastion Security Threat Intelligence',
    SITE_URL,
  );
  return lines.join('\n');
}
