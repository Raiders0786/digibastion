import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import {
  columnsFromOptinPending,
  isOptinTokenUsable,
  resubscribeConfirmedColumns,
} from "../_shared/subscription-optin.ts";
import { emailHash } from "../_shared/email-compliance.ts";
import { SITE_URL } from "../_shared/site-urls.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function respond(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}

function manageUrlFor(email: string, token: string): string {
  return `${SITE_URL}/manage-subscription?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let token: string | null = null;

    // Support both GET (legacy email links) and POST (new frontend)
    if (req.method === "GET") {
      const url = new URL(req.url);
      token = url.searchParams.get("token");
    } else if (req.method === "POST") {
      const body = await req.json();
      token = body.token;
    }

    if (!token || typeof token !== "string" || token.length < 10 || token.length > 100) {
      return respond({ success: false, message: "Invalid verification link. Token is missing or malformed." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const clientIP = getClientIP(req);

    const { data: rateLimit, error: rateLimitError } = await supabase.rpc("consume_rate_limit", {
      _scope: "verify-email:ip",
      _identifier_hash: await hashIdentifier(clientIP),
      _max_attempts: 20,
      _window_seconds: 3600,
    });
    if (rateLimitError) throw rateLimitError;
    if (!rateLimit?.allowed) {
      return new Response(
        JSON.stringify({ success: false, message: "Too many verification attempts. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "3600", ...corsHeaders } }
      );
    }

    console.log("[verify-email] Verifying submitted token");

    // 1. A first-time signup: verification_token on an unverified row.
    const { data: subscription, error: findError } = await supabase
      .from("subscriptions")
      .select("id, email, verification_token_expires_at")
      .eq("verification_token", token)
      .eq("is_verified", false)
      .maybeSingle();

    if (findError) {
      console.error("[verify-email] Database error:", findError);
      return respond({ success: false, message: "An error occurred. Please try again." }, 500);
    }

    if (subscription) {
      // Check if token has expired
      if (subscription.verification_token_expires_at && new Date(subscription.verification_token_expires_at) < new Date()) {
        console.log("[verify-email] Token expired");
        return respond({ success: false, message: "This verification link has expired. Please subscribe again." }, 400);
      }

      // Generate a new permanent management token (different from verification token for security)
      const managementToken = crypto.randomUUID();
      const now = new Date().toISOString();

      // Mark as verified and set management token. The guard on the old token
      // makes the link single-use under concurrent clicks.
      const { data: verified, error: updateError } = await supabase
        .from("subscriptions")
        .update({
          is_verified: true,
          verification_token: managementToken, // New token for managing subscription
          verification_token_expires_at: null, // No expiry for management token
          consented_at: now,
          updated_at: now,
        })
        .eq("id", subscription.id)
        .eq("verification_token", token)
        .eq("is_verified", false)
        .select("id")
        .maybeSingle();

      if (updateError) {
        console.error("[verify-email] Update error:", updateError);
        return respond({ success: false, message: "Failed to verify email. Please try again." }, 500);
      }
      if (!verified) {
        return respond({ success: false, message: "This verification link is invalid or has already been used." }, 400);
      }

      console.log("[verify-email] Subscription verified successfully");
      return respond({
        success: true,
        message: `Your email ${subscription.email} has been verified! You'll now receive security alerts.`,
        email: subscription.email,
        manageUrl: manageUrlFor(subscription.email, managementToken),
      });
    }

    // 2. A re-subscribe confirmation: single-use optin_token on a verified row.
    // optin_token is a uuid column, so anything else cannot match.
    if (!UUID_REGEX.test(token)) {
      console.log("[verify-email] Token not found or already verified");
      return respond({ success: false, message: "This verification link is invalid or has already been used." }, 400);
    }

    const { data: optin, error: optinError } = await supabase
      .from("subscriptions")
      .select("id, email, verification_token, optin_token_expires_at, optin_pending")
      .eq("optin_token", token)
      .eq("is_verified", true)
      .maybeSingle();

    if (optinError) {
      console.error("[verify-email] Database error:", optinError);
      return respond({ success: false, message: "An error occurred. Please try again." }, 500);
    }

    if (!optin) {
      console.log("[verify-email] Token not found or already verified");
      return respond({ success: false, message: "This verification link is invalid or has already been used." }, 400);
    }

    // A bounce or complaint can arrive after the opt-in email went out. Never
    // re-activate a suppressed address; void the link so it cannot be retried.
    const { data: suppression, error: suppressionError } = await supabase
      .from("email_suppressions")
      .select("email_hash")
      .eq("email_hash", await emailHash(optin.email))
      .maybeSingle();
    if (suppressionError) {
      console.error("[verify-email] Suppression lookup error:", suppressionError);
      return respond({ success: false, message: "An error occurred. Please try again." }, 500);
    }
    if (suppression) {
      console.log(`[verify-email] Opt-in for subscription ${optin.id} refused: address suppressed`);
      await supabase
        .from("subscriptions")
        .update({ optin_token: null, optin_token_expires_at: null, optin_pending: null })
        .eq("id", optin.id)
        .eq("optin_token", token);
      return respond({ success: false, message: "This confirmation link is no longer valid. Please contact support@digibastion.com." }, 400);
    }

    const now = new Date();
    if (!isOptinTokenUsable(optin, now)) {
      console.log("[verify-email] Opt-in token expired");
      return respond({ success: false, message: "This confirmation link has expired. Please subscribe again." }, 400);
    }

    const pendingColumns = columnsFromOptinPending(optin.optin_pending);
    if (!pendingColumns || !optin.verification_token) {
      console.error(`[verify-email] Opt-in for subscription ${optin.id} has no usable pending preferences`);
      return respond({ success: false, message: "This confirmation link is no longer valid. Please subscribe again." }, 400);
    }

    const { data: confirmed, error: confirmError } = await supabase
      .from("subscriptions")
      .update(resubscribeConfirmedColumns(pendingColumns, now, clientIP === "unknown" ? null : await hashIdentifier(clientIP)))
      .eq("id", optin.id)
      .eq("optin_token", token)
      .select("id")
      .maybeSingle();

    if (confirmError) {
      console.error("[verify-email] Re-subscribe update error:", confirmError);
      return respond({ success: false, message: "Failed to verify email. Please try again." }, 500);
    }
    if (!confirmed) {
      return respond({ success: false, message: "This verification link is invalid or has already been used." }, 400);
    }

    console.log(`[verify-email] Subscription ${optin.id} re-subscribed`);
    return respond({
      success: true,
      message: `Your email ${optin.email} is confirmed again. You'll now receive security alerts.`,
      email: optin.email,
      manageUrl: manageUrlFor(optin.email, optin.verification_token),
    });
  } catch (error) {
    console.error("[verify-email] Error:", error);
    return respond({ success: false, message: "An unexpected error occurred." }, 500);
  }
});
