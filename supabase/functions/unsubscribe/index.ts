import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// Validation constants
const MAX_EMAIL_LENGTH = 255;
const MAX_TOKEN_LENGTH = 100;

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

async function checkRateLimit(supabase: SupabaseClient, scope: string, identifier: string, maxAttempts: number) {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    _scope: scope,
    _identifier_hash: await hashIdentifier(identifier),
    _max_attempts: maxAttempts,
    _window_seconds: RATE_LIMIT_WINDOW_SECONDS,
  });
  if (error) throw error;
  const result = data as { allowed?: boolean; reset_at?: string } | null;
  const resetIn = result?.reset_at ? Math.max(1, Math.ceil((Date.parse(result.reset_at) - Date.now()) / 1000)) : RATE_LIMIT_WINDOW_SECONDS;
  return { allowed: result?.allowed === true, resetIn };
}

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
    const ipRateLimit = await checkRateLimit(supabase, "unsubscribe:ip", clientIP, MAX_ATTEMPTS_PER_IP);
    if (!ipRateLimit.allowed) {
      console.warn(`[unsubscribe] Rate limit exceeded for IP: ${clientIP}`);
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

    const { email, token } = await req.json();

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

    // Rate limit by email
    const normalizedEmail = email.toLowerCase().trim();
    const emailRateLimit = await checkRateLimit(supabase, "unsubscribe:email", normalizedEmail, MAX_ATTEMPTS_PER_EMAIL);
    if (!emailRateLimit.allowed) {
      console.warn("[unsubscribe] Email rate limit exceeded");
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
      return new Response(
        JSON.stringify({ success: false, error: "Authentication token is required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (token.length > MAX_TOKEN_LENGTH || !UUID_REGEX.test(token)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token format" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[unsubscribe] Verifying token for unsubscribe request from IP: ${clientIP}`);

    // First verify the token matches the email
    const { data: existingSubscription, error: lookupError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("verification_token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (lookupError) {
      console.error("[unsubscribe] Lookup error:", lookupError);
      throw lookupError;
    }

    if (!existingSubscription) {
      // Generic message to prevent enumeration - but still return success
      // since we don't want to reveal whether an email is subscribed
      console.log(`[unsubscribe] No matching subscription found`);
      return new Response(
        JSON.stringify({ success: true, message: "If this email was subscribed, it has been unsubscribed." }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[unsubscribe] Unsubscribing subscription: ${existingSubscription.id}`);

    // Soft delete - mark as inactive rather than deleting
    const { error } = await supabase
      .from("subscriptions")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingSubscription.id);

    if (error) {
      console.error("[unsubscribe] Database error:", error);
      throw error;
    }

    console.log(`[unsubscribe] Successfully unsubscribed`);
    
    return new Response(
      JSON.stringify({ success: true, message: "You have been unsubscribed from security alerts." }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[unsubscribe] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
