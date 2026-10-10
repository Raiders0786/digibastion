import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { emailHash, normalizeEmail } from "../_shared/email-compliance.ts";
import { parseSubscriptionPreferences } from "../_shared/subscription-preferences.ts";
import {
  OPTIN_TTL_MS,
  RESUBSCRIBE_RATE_LIMIT,
  mergeStoredPreferences,
  optinConfirmUrl,
  renderResubscribeEmail,
  subscriptionColumns,
} from "../_shared/subscription-optin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// Validation constants
const MAX_EMAIL_LENGTH = 255;
const MAX_TOKEN_LENGTH = 100;
const MAX_NAME_LENGTH = 100;

// The stored row: identity, state and every preference column that
// parseSubscriptionPreferences reads (a resubscribe re-uses them).
const STORED_PREFERENCE_COLUMNS =
  "id, name, is_active, categories, technologies, content_scope, severity_threshold, frequency, wants_realtime, wants_daily, wants_weekly, include_preliminary, chains, timezone, timezone_offset, preferred_hour";
const RETURNED_COLUMNS =
  "id, email, name, categories, technologies, frequency, severity_threshold, content_scope, preferred_hour, timezone_offset, preferred_day, wants_realtime, wants_daily, wants_weekly, include_preliminary, chains, timezone, is_active, unsubscribed_at";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const MAX_ATTEMPTS_PER_IP = 10; // Max attempts per IP per hour
const MAX_ATTEMPTS_PER_EMAIL = 5; // Max attempts per email per hour

// Validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         "unknown";
}

async function hashIdentifier(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function checkRateLimit(supabase: SupabaseClient, scope: string, identifier: string, maxAttempts: number, windowSeconds = RATE_LIMIT_WINDOW_SECONDS) {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    _scope: scope,
    _identifier_hash: await hashIdentifier(identifier),
    _max_attempts: maxAttempts,
    _window_seconds: windowSeconds,
  });
  if (error) throw error;
  const result = data as { allowed?: boolean; reset_at?: string } | null;
  const resetIn = result?.reset_at ? Math.max(1, Math.ceil((Date.parse(result.reset_at) - Date.now()) / 1000)) : windowSeconds;
  return { allowed: result?.allowed === true, resetIn };
}

function respond(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}

// Sanitize string input
const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limit by IP first
    const ipRateLimit = await checkRateLimit(supabase, "subscription:update:ip", clientIP, MAX_ATTEMPTS_PER_IP);
    if (!ipRateLimit.allowed) {
      console.warn(`[update-subscription] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Too many requests. Please try again later.",
          retryAfter: ipRateLimit.resetIn
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(ipRateLimit.resetIn)
          } 
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return respond({ success: false, error: "Invalid request" }, 400);
    }
    const { email, token, name, action } = body as Record<string, unknown>;

    // Validate email
    if (!email || typeof email !== "string") {
      return respond({ success: false, error: "Email is required" }, 400);
    }

    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
      return respond({ success: false, error: "Invalid email format" }, 400);
    }

    // Rate limit by email
    const normalizedEmail = normalizeEmail(email);
    const emailRateLimit = await checkRateLimit(supabase, "subscription:update:email", normalizedEmail, MAX_ATTEMPTS_PER_EMAIL);
    if (!emailRateLimit.allowed) {
      console.warn("[update-subscription] Rate limit exceeded for an email address");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many requests for this email. Please try again later.",
          retryAfter: emailRateLimit.resetIn
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(emailRateLimit.resetIn)
          }
        }
      );
    }

    // Validate token - REQUIRED for security
    if (!token || typeof token !== "string") {
      return respond({ success: false, error: "Authentication token is required" }, 401);
    }

    if (token.length > MAX_TOKEN_LENGTH || !UUID_REGEX.test(token)) {
      return respond({ success: false, error: "Invalid token format" }, 401);
    }

    if (action !== undefined && action !== "resubscribe") {
      return respond({ success: false, error: "Invalid action" }, 400);
    }

    console.log(`[update-subscription] Verifying token for subscription update`);

    // First verify the token matches the email
    const { data: existingSubscription, error: lookupError } = await supabase
      .from("subscriptions")
      .select(STORED_PREFERENCE_COLUMNS)
      .eq("email", normalizedEmail)
      .eq("verification_token", token)
      .eq("is_verified", true)
      .maybeSingle();

    if (lookupError) {
      console.error("[update-subscription] Lookup error:", lookupError);
      throw lookupError;
    }

    if (!existingSubscription) {
      console.log(`[update-subscription] Token validation failed`);
      return respond({ success: false, error: "Invalid email or token" }, 401);
    }
    const stored = existingSubscription as unknown as Record<string, unknown>;

    if (action === "resubscribe") {
      if (stored.is_active !== false) {
        return respond({ success: true, alreadyActive: true, message: "Your emails are already on." });
      }
      const resubscribeLimit = await checkRateLimit(
        supabase,
        RESUBSCRIBE_RATE_LIMIT.scope,
        normalizedEmail,
        RESUBSCRIBE_RATE_LIMIT.maxAttempts,
        RESUBSCRIBE_RATE_LIMIT.windowSeconds,
      );
      if (!resubscribeLimit.allowed) {
        return new Response(
          JSON.stringify({ success: false, error: "Too many requests. Please try again later.", retryAfter: resubscribeLimit.resetIn }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(resubscribeLimit.resetIn) } },
        );
      }
      const storedPreferences = parseSubscriptionPreferences(stored);
      if (!storedPreferences.ok) {
        return respond({ success: false, error: `${storedPreferences.error}. Save your preferences first.` }, 400);
      }

      const { data: suppression, error: suppressionError } = await supabase
        .from("email_suppressions")
        .select("email_hash")
        .eq("email_hash", await emailHash(normalizedEmail))
        .maybeSingle();
      if (suppressionError) throw suppressionError;
      // A bounced or complained address gets no mail; the response stays the same.
      if (suppression) {
        console.warn(`[update-subscription] Subscription ${stored.id} is suppressed; no opt-in email sent`);
        return respond({ success: true, message: "Check your inbox to confirm" });
      }

      const optinToken = crypto.randomUUID();
      const { error: optinError } = await supabase
        .from("subscriptions")
        .update({
          optin_token: optinToken,
          optin_token_expires_at: new Date(Date.now() + OPTIN_TTL_MS).toISOString(),
          optin_pending: subscriptionColumns(storedPreferences.value),
        })
        .eq("id", stored.id)
        .eq("is_active", false);
      if (optinError) throw optinError;

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.warn("[update-subscription] RESEND_API_KEY not configured");
      } else {
        const message = renderResubscribeEmail({
          name: typeof stored.name === "string" ? stored.name : null,
          channels: storedPreferences.value.channels,
          categories: storedPreferences.value.categories,
          confirmUrl: optinConfirmUrl(optinToken),
        });
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Digibastion Security <alerts@digibastion.com>",
              reply_to: "support@digibastion.com",
              to: [normalizedEmail],
              subject: message.subject,
              html: message.html,
              text: message.text,
            }),
          });
          if (!emailResponse.ok) console.error(`[update-subscription] Resend API error: status ${emailResponse.status}`);
        } catch (emailError) {
          console.error("[update-subscription] Failed to send opt-in email:", emailError);
        }
      }
      console.log(`[update-subscription] Re-subscribe opt-in started for ${stored.id}`);
      return respond({ success: true, message: "Check your inbox to confirm" });
    }

    // A legacy payload (frequency only) keeps the stored scope, preliminary
    // choice, chains and timezone instead of resetting them.
    const parsed = parseSubscriptionPreferences(mergeStoredPreferences(body, stored));
    if (!parsed.ok) {
      return respond({ success: false, error: parsed.error }, 400);
    }

    // Saving never changes is_active: an unsubscribed address stays
    // unsubscribed until it confirms a re-subscribe link.
    const updateData: Record<string, unknown> = {
      ...subscriptionColumns(parsed.value),
      name: name ? sanitizeString(String(name)).slice(0, MAX_NAME_LENGTH) : null,
      updated_at: new Date().toISOString(),
    };

    console.log(`[update-subscription] Updating subscription: ${stored.id}`);

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", stored.id)
      .select(RETURNED_COLUMNS)
      .single();

    if (error) {
      console.error("[update-subscription] Database error:", error);
      throw error;
    }

    console.log(`[update-subscription] Successfully updated subscription`);

    return respond({ success: true, subscription: data });
  } catch (error) {
    console.error("[update-subscription] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
