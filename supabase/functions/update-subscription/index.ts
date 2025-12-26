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
    const { email, name, categories, technologies, frequency, severity_threshold } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "At least one category is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[update-subscription] Updating subscription for: ${email}`);

    const updateData = {
      name: name || null,
      categories: categories.slice(0, 10), // Limit categories
      technologies: (technologies || []).slice(0, 20), // Limit technologies
      frequency: frequency || "daily",
      severity_threshold: severity_threshold || "medium",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .select()
      .single();

    if (error) {
      console.error("[update-subscription] Database error:", error);
      throw error;
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: "Subscription not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[update-subscription] Successfully updated subscription for ${email}`);
    
    return new Response(
      JSON.stringify({ success: true, subscription: data }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[update-subscription] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});