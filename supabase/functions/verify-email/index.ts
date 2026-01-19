import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      return new Response(
        JSON.stringify({ success: false, message: "Invalid verification link. Token is missing or malformed." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[verify-email] Verifying token: ${token.substring(0, 8)}...`);

    // Find subscription with this token
    const { data: subscription, error: findError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("verification_token", token)
      .eq("is_verified", false)
      .maybeSingle();

    if (findError) {
      console.error("[verify-email] Database error:", findError);
      return new Response(
        JSON.stringify({ success: false, message: "An error occurred. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!subscription) {
      console.log("[verify-email] Token not found or already verified");
      return new Response(
        JSON.stringify({ success: false, message: "This verification link is invalid or has already been used." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token has expired
    if (subscription.verification_token_expires_at && new Date(subscription.verification_token_expires_at) < new Date()) {
      console.log("[verify-email] Token expired for:", subscription.email);
      return new Response(
        JSON.stringify({ success: false, message: "This verification link has expired. Please subscribe again." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a new permanent management token (different from verification token for security)
    const managementToken = crypto.randomUUID();

    // Mark as verified and set management token
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ 
        is_verified: true,
        verification_token: managementToken, // New token for managing subscription
        verification_token_expires_at: null, // No expiry for management token
        updated_at: new Date().toISOString()
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("[verify-email] Update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to verify email. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const manageUrl = `https://digibastion.com/manage-subscription?email=${encodeURIComponent(subscription.email)}&token=${encodeURIComponent(managementToken)}`;
    
    console.log(`[verify-email] Successfully verified: ${subscription.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Your email ${subscription.email} has been verified! You'll now receive security alerts.`,
        email: subscription.email,
        manageUrl,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("[verify-email] Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
