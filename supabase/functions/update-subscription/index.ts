import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// Validation constants
const MAX_EMAIL_LENGTH = 255;
const MAX_TOKEN_LENGTH = 100;
const MAX_NAME_LENGTH = 100;
const MAX_CATEGORIES = 10;
const MAX_TECHNOLOGIES = 20;
const VALID_FREQUENCIES = ["immediate", "daily", "weekly"];
const VALID_SEVERITIES = ["critical", "high", "medium", "low", "info"];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS_PER_IP = 10; // Max attempts per IP per hour
const MAX_ATTEMPTS_PER_EMAIL = 5; // Max attempts per email per hour

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const { email, token, name, categories, technologies, frequency, severity_threshold, preferred_hour, timezone_offset, preferred_day } = await req.json();

    // Rate limit by IP first
    const ipRateLimit = checkRateLimit(`update-sub:ip:${clientIP}`, MAX_ATTEMPTS_PER_IP);
    if (!ipRateLimit.allowed) {
      console.warn(`[update-subscription] Rate limit exceeded for IP: ${clientIP}`);
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

    // Rate limit by email
    const normalizedEmail = email.toLowerCase().trim();
    const emailRateLimit = checkRateLimit(`update-sub:email:${normalizedEmail}`, MAX_ATTEMPTS_PER_EMAIL);
    if (!emailRateLimit.allowed) {
      console.warn(`[update-subscription] Rate limit exceeded for email: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Too many requests for this email. Please try again later.",
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

    // Validate categories
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "At least one category is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate frequency
    if (frequency && !VALID_FREQUENCIES.includes(frequency)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid frequency value" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate severity
    if (severity_threshold && !VALID_SEVERITIES.includes(severity_threshold)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid severity value" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[update-subscription] Verifying token for subscription update from IP: ${clientIP}`);

    // First verify the token matches the email
    const { data: existingSubscription, error: lookupError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("verification_token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (lookupError) {
      console.error("[update-subscription] Lookup error:", lookupError);
      throw lookupError;
    }

    if (!existingSubscription) {
      console.log(`[update-subscription] Token validation failed`);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email or token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize and prepare update data
    const updateData: Record<string, unknown> = {
      name: name ? sanitizeString(String(name)).slice(0, MAX_NAME_LENGTH) : null,
      categories: categories.slice(0, MAX_CATEGORIES).map((c: unknown) => String(c).slice(0, 50)),
      technologies: (technologies || []).slice(0, MAX_TECHNOLOGIES).map((t: unknown) => String(t).slice(0, 50)),
      frequency: frequency || "daily",
      severity_threshold: severity_threshold || "medium",
      updated_at: new Date().toISOString(),
    };

    // Add time preferences if provided
    if (typeof preferred_hour === 'number') {
      updateData.preferred_hour = Math.min(23, Math.max(0, preferred_hour));
    }
    if (typeof timezone_offset === 'number') {
      updateData.timezone_offset = Math.min(14, Math.max(-12, timezone_offset));
    }
    if (typeof preferred_day === 'number') {
      updateData.preferred_day = Math.min(6, Math.max(0, preferred_day));
    }

    console.log(`[update-subscription] Updating subscription: ${existingSubscription.id}`);

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", existingSubscription.id)
      .select("id, email, name, categories, technologies, frequency, severity_threshold, preferred_hour, timezone_offset, preferred_day")
      .single();

    if (error) {
      console.error("[update-subscription] Database error:", error);
      throw error;
    }

    console.log(`[update-subscription] Successfully updated subscription`);
    
    return new Response(
      JSON.stringify({ success: true, subscription: data }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[update-subscription] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
