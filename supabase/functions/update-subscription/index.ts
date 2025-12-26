import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation constants
const MAX_EMAIL_LENGTH = 255;
const MAX_TOKEN_LENGTH = 100;
const MAX_NAME_LENGTH = 100;
const MAX_CATEGORIES = 10;
const MAX_TECHNOLOGIES = 20;
const VALID_FREQUENCIES = ["immediate", "daily", "weekly"];
const VALID_SEVERITIES = ["critical", "high", "medium", "low", "info"];

// Validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const { email, token, name, categories, technologies, frequency, severity_threshold } = await req.json();

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

    console.log(`[update-subscription] Verifying token for subscription update`);

    // First verify the token matches the email
    const { data: existingSubscription, error: lookupError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("email", email.toLowerCase().trim())
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
    const updateData = {
      name: name ? sanitizeString(String(name)).slice(0, MAX_NAME_LENGTH) : null,
      categories: categories.slice(0, MAX_CATEGORIES).map((c: unknown) => String(c).slice(0, 50)),
      technologies: (technologies || []).slice(0, MAX_TECHNOLOGIES).map((t: unknown) => String(t).slice(0, 50)),
      frequency: frequency || "daily",
      severity_threshold: severity_threshold || "medium",
      updated_at: new Date().toISOString(),
    };

    console.log(`[update-subscription] Updating subscription: ${existingSubscription.id}`);

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", existingSubscription.id)
      .select("id, email, name, categories, technologies, frequency, severity_threshold")
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
