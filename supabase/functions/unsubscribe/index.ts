import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation constants
const MAX_EMAIL_LENGTH = 255;
const MAX_TOKEN_LENGTH = 100;

// Validation regex
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[unsubscribe] Verifying token for unsubscribe request`);

    // First verify the token matches the email
    const { data: existingSubscription, error: lookupError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("email", email.toLowerCase().trim())
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
