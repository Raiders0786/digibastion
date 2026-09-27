import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, list-unsubscribe-post",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Validation constants
const MAX_EMAIL_LENGTH = 255;
const MAX_TOKEN_LENGTH = 100;

// Validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const MAX_ATTEMPTS_PER_TOKEN = 5;

async function hashIdentifier(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function checkRateLimit(supabase: SupabaseClient, scope: string, identifier: string, maxAttempts: number): Promise<boolean> {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    _scope: scope,
    _identifier_hash: await hashIdentifier(identifier),
    _max_attempts: maxAttempts,
    _window_seconds: RATE_LIMIT_WINDOW_SECONDS,
  });
  if (error) throw error;
  return (data as { allowed?: boolean } | null)?.allowed === true;
}

// Generate success HTML page
function generateSuccessHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed - Digibastion</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #111827;
      color: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
      background: #1f2937;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { margin: 0 0 12px 0; font-size: 24px; }
    p { color: #9ca3af; margin: 0 0 24px 0; line-height: 1.5; }
    a {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1>You've Been Unsubscribed</h1>
    <p>You will no longer receive security alert emails from Digibastion.</p>
    <a href="https://digibastion.com">Return to Digibastion</a>
  </div>
</body>
</html>
`;
}

// Generate error HTML page
function generateErrorHtml(message: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe Error - Digibastion</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #111827;
      color: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
      background: #1f2937;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { margin: 0 0 12px 0; font-size: 24px; color: #ef4444; }
    p { color: #9ca3af; margin: 0 0 24px 0; line-height: 1.5; }
    a {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Unsubscribe Failed</h1>
    <p>${message}</p>
    <a href="https://digibastion.com/manage-subscription">Manage Subscription</a>
  </div>
</body>
</html>
`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Link scanners routinely prefetch GET URLs in email headers. GET must
    // therefore remain non-mutating and send a person to the confirmation UI.
    if (req.method === "GET") {
      const email = url.searchParams.get("email") || "";
      const token = url.searchParams.get("token") || "";
      const manageUrl = new URL("https://www.digibastion.com/manage-subscription");
      if (email) manageUrl.searchParams.set("email", email);
      if (token) manageUrl.searchParams.set("token", token);
      return Response.redirect(manageUrl.toString(), 303);
    }

    if (req.method !== "POST") {
      return new Response(generateErrorHtml("Invalid request method."), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "text/html", "Allow": "GET, POST, OPTIONS" },
      });
    }

    // RFC 8058 requires this exact form-encoded signal for a one-click action.
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/x-www-form-urlencoded")) {
      return new Response(generateErrorHtml("Invalid one-click unsubscribe request."), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }
    const params = new URLSearchParams(await req.text());
    if (params.get("List-Unsubscribe") !== "One-Click") {
      return new Response(generateErrorHtml("Invalid one-click unsubscribe request."), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }
    const token = url.searchParams.get("token");
    const email = url.searchParams.get("email");

    // Validate token
    if (!token || typeof token !== "string") {
      console.warn("[one-click-unsubscribe] Missing token");
      return new Response(
        generateErrorHtml("Invalid or missing unsubscribe token. Please use the link from your email."),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "text/html" } 
        }
      );
    }

    if (token.length > MAX_TOKEN_LENGTH || !UUID_REGEX.test(token)) {
      console.warn("[one-click-unsubscribe] Invalid token format");
      return new Response(
        generateErrorHtml("Invalid unsubscribe token format."),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "text/html" } 
        }
      );
    }

    // Rate limit by token
    if (!await checkRateLimit(supabase, "unsubscribe:one-click:token", token, MAX_ATTEMPTS_PER_TOKEN)) {
      console.warn(`[one-click-unsubscribe] Rate limit exceeded for token`);
      return new Response(
        generateErrorHtml("Too many attempts. Please try again later."),
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "text/html" } 
        }
      );
    }

    // Validate email if provided (optional, for extra security)
    if (email) {
      if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
        console.warn("[one-click-unsubscribe] Invalid email format");
        return new Response(
          generateErrorHtml("Invalid email format."),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "text/html" } 
          }
        );
      }
    }

    console.log(`[one-click-unsubscribe] Processing unsubscribe for token`);

    // Find subscription by token (and optionally email for extra verification)
    let query = supabase
      .from("subscriptions")
      .select("id, email")
      .eq("verification_token", token)
      .eq("is_active", true);
    
    if (email) {
      query = query.eq("email", email.toLowerCase().trim());
    }

    const { data: subscription, error: lookupError } = await query.maybeSingle();

    if (lookupError) {
      console.error("[one-click-unsubscribe] Lookup error:", lookupError);
      throw lookupError;
    }

    if (!subscription) {
      // Return success anyway to prevent enumeration
      console.log(`[one-click-unsubscribe] No matching subscription found`);
      return new Response(
        generateSuccessHtml(),
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    console.log(`[one-click-unsubscribe] Unsubscribing: ${subscription.id}`);

    // Soft delete - mark as inactive
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("[one-click-unsubscribe] Update error:", updateError);
      throw updateError;
    }

    console.log(`[one-click-unsubscribe] Successfully unsubscribed: ${subscription.email}`);

    return new Response(
      generateSuccessHtml(),
      { headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );

  } catch (error) {
    console.error("[one-click-unsubscribe] Error:", error);
    return new Response(
      generateErrorHtml("An unexpected error occurred. Please try again or contact support."),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "text/html" } 
      }
    );
  }
});
