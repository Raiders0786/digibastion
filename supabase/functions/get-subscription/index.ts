import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation constants
const MAX_EMAIL_LENGTH = 255;
const MAX_TOKEN_LENGTH = 100;

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token } = await req.json();

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

    console.log(`[get-subscription] Looking up subscription with token`);

    // Require BOTH email AND valid token to match - prevents enumeration
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("id, email, name, categories, technologies, frequency, severity_threshold, is_active, is_verified")
      .eq("email", email.toLowerCase().trim())
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

    console.log(`[get-subscription] Found subscription for ${email}`);
    
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
