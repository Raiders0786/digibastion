import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// Validation constants
const MAX_EMAIL_LENGTH = 255;
const MAX_TOKEN_LENGTH = 100;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS_PER_IP = 10; // Max attempts per IP per hour
const MAX_ATTEMPTS_PER_EMAIL = 5; // Max attempts per email per hour

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Simple email validation regex
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    const { email, token } = await req.json();

    // Rate limit by IP first
    const ipRateLimit = checkRateLimit(`get-sub:ip:${clientIP}`, MAX_ATTEMPTS_PER_IP);
    if (!ipRateLimit.allowed) {
      console.warn(`[get-subscription] Rate limit exceeded for IP: ${clientIP}`);
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

    if (email.length > MAX_EMAIL_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: "Email too long" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limit by email (prevents brute-force on specific email)
    const normalizedEmail = email.toLowerCase().trim();
    const emailRateLimit = checkRateLimit(`get-sub:email:${normalizedEmail}`, MAX_ATTEMPTS_PER_EMAIL);
    if (!emailRateLimit.allowed) {
      console.warn(`[get-subscription] Rate limit exceeded for email: ${normalizedEmail}`);
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[get-subscription] Looking up subscription with token from IP: ${clientIP}`);

    // Require BOTH email AND valid token to match - prevents enumeration
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("id, email, name, categories, technologies, frequency, severity_threshold, is_active, is_verified")
      .eq("email", normalizedEmail)
      .eq("verification_token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[get-subscription] Database error:", error);
      throw error;
    }

    if (!subscription) {
      // Generic error message to prevent enumeration attacks
      console.log(`[get-subscription] No matching subscription found`);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email or token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[get-subscription] Found subscription for ${normalizedEmail}`);
    
    return new Response(
      JSON.stringify({ success: true, subscription }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[get-subscription] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
