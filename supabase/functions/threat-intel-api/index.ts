import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

async function hashKey(raw: string): Promise<string> {
  const enc = new TextEncoder().encode(raw);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing x-api-key header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Hash the incoming key and look it up
    const keyHash = await hashKey(apiKey);

    const { data: keyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .single();

    if (keyError || !keyRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check active
    if (!keyRecord.is_active) {
      return new Response(
        JSON.stringify({ error: "API key has been revoked" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "API key has expired" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check permission
    const permissions = keyRecord.permissions as string[];
    if (!permissions.includes("read:threat-intel")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // GET with no body is fine, use defaults
    }

    const limit = Math.min(Number(body.limit) || 20, 100);
    const severity = body.severity as string | undefined;
    const category = body.category as string | undefined;
    const since = body.since as string | undefined;

    // Query news_articles
    let query = supabase
      .from("news_articles")
      .select("id, title, summary, severity, tags, category, link, published_at, affected_technologies, source_name, cve_id")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq("severity", severity);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (since) {
      query = query.gte("published_at", since);
    }

    const { data: articles, error: articlesError } = await query;

    if (articlesError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch articles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last_used_at and request_count
    await supabase
      .from("api_keys")
      .update({
        last_used_at: new Date().toISOString(),
        request_count: (keyRecord.request_count || 0) + 1,
      })
      .eq("id", keyRecord.id);

    return new Response(
      JSON.stringify({
        data: articles,
        count: articles?.length || 0,
        key_name: keyRecord.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
