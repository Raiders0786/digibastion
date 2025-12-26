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
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        generateHtmlResponse(false, "Invalid verification link. Token is missing."),
        { status: 400, headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[verify-email] Verifying token: ${token}`);

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
        generateHtmlResponse(false, "An error occurred. Please try again."),
        { status: 500, headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    if (!subscription) {
      console.log("[verify-email] Token not found or already verified");
      return new Response(
        generateHtmlResponse(false, "This verification link is invalid or has already been used."),
        { status: 400, headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    // Check if token has expired
    if (subscription.verification_token_expires_at && new Date(subscription.verification_token_expires_at) < new Date()) {
      console.log("[verify-email] Token expired for:", subscription.email);
      return new Response(
        generateHtmlResponse(false, "This verification link has expired. Please subscribe again."),
        { status: 400, headers: { "Content-Type": "text/html", ...corsHeaders } }
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
        generateHtmlResponse(false, "Failed to verify email. Please try again."),
        { status: 500, headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    // Redirect to manage subscription page with the new management token
    const manageUrl = `https://digibastion.com/manage-subscription?email=${encodeURIComponent(subscription.email)}&token=${encodeURIComponent(managementToken)}&verified=true`;
    
    console.log(`[verify-email] Successfully verified: ${subscription.email}`);

    return new Response(
      generateHtmlResponse(true, `Your email ${subscription.email} has been verified! You'll now receive security alerts.`, manageUrl),
      { headers: { "Content-Type": "text/html", ...corsHeaders } }
    );

  } catch (error) {
    console.error("[verify-email] Error:", error);
    return new Response(
      generateHtmlResponse(false, "An unexpected error occurred."),
      { status: 500, headers: { "Content-Type": "text/html", ...corsHeaders } }
    );
  }
});

function generateHtmlResponse(success: boolean, message: string, manageUrl?: string): string {
  const icon = success 
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';

  const buttonUrl = success && manageUrl ? manageUrl : "https://digibastion.com/news";
  const buttonText = success && manageUrl ? "Manage Preferences" : "Go to Threat Intel";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Email Verified' : 'Verification Failed'} - Digibastion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .icon { margin-bottom: 24px; }
    h1 {
      color: #f3f4f6;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #9ca3af;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .button {
      display: inline-block;
      background: #8b5cf6;
      color: white;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.2s;
    }
    .button:hover { background: #7c3aed; }
    .button-secondary {
      background: transparent;
      border: 1px solid #8b5cf6;
      color: #8b5cf6;
    }
    .button-secondary:hover { background: rgba(139, 92, 246, 0.1); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${success ? 'Email Verified!' : 'Verification Failed'}</h1>
    <p>${message}</p>
    <div class="buttons">
      <a href="${buttonUrl}" class="button">${buttonText}</a>
      ${success && manageUrl ? '<a href="https://digibastion.com/news" class="button button-secondary">View Threats</a>' : ''}
    </div>
  </div>
</body>
</html>
  `;
}
