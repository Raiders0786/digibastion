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

    console.log(`[unsubscribe] Unsubscribing: ${email}`);

    // Soft delete - mark as inactive rather than deleting
    const { data, error } = await supabase
      .from("subscriptions")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("email", email.toLowerCase().trim())
      .select()
      .single();

    if (error) {
      console.error("[unsubscribe] Database error:", error);
      throw error;
    }

    if (!data) {
      // No subscription found, but return success anyway
      console.log(`[unsubscribe] No subscription found for ${email}, but returning success`);
      return new Response(
        JSON.stringify({ success: true, message: "Unsubscribed" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[unsubscribe] Successfully unsubscribed ${email}`);
    
    return new Response(
      JSON.stringify({ success: true, message: "You have been unsubscribed from security alerts." }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[unsubscribe] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});