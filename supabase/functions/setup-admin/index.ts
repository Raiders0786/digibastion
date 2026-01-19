import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, setupKey } = await req.json();

    // Security: require a one-time setup key from env
    const expectedKey = Deno.env.get("ADMIN_SETUP_KEY");
    
    console.log(`[setup-admin] Checking setup key...`);
    console.log(`[setup-admin] Expected key exists: ${!!expectedKey}`);
    console.log(`[setup-admin] Provided key exists: ${!!setupKey}`);
    
    if (!expectedKey) {
      return new Response(
        JSON.stringify({ error: "Setup key not configured in environment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (setupKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Invalid setup key" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log(`[setup-admin] Creating admin user: ${email}`);

    // Create user using admin API
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (createError) {
      // Check if user already exists
      if (createError.message?.includes("already been registered")) {
        // User exists, try to get their ID
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);
        
        if (existingUser) {
          // Assign admin role
          const { error: roleError } = await supabase
            .from("user_roles")
            .upsert({ user_id: existingUser.id, role: "admin" }, { onConflict: "user_id,role" });

          if (roleError) {
            console.error("[setup-admin] Role assignment error:", roleError);
            throw roleError;
          }

          console.log(`[setup-admin] Admin role assigned to existing user: ${email}`);
          return new Response(
            JSON.stringify({ success: true, message: "Admin role assigned to existing user" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      throw createError;
    }

    if (!userData.user) {
      throw new Error("Failed to create user");
    }

    console.log(`[setup-admin] User created: ${userData.user.id}`);

    // Assign admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userData.user.id, role: "admin" });

    if (roleError) {
      console.error("[setup-admin] Role assignment error:", roleError);
      throw roleError;
    }

    console.log(`[setup-admin] Admin role assigned successfully`);

    return new Response(
      JSON.stringify({ success: true, message: "Admin user created and role assigned" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[setup-admin] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Setup failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
