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
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[get-subscription] Looking up: ${email}`);

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[get-subscription] Database error:", error);
      throw error;
    }

    if (!subscription) {
      console.log(`[get-subscription] No active subscription found for ${email}`);
      return new Response(
        JSON.stringify({ success: true, subscription: null }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
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
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});