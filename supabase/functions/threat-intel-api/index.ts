import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function hashKey(raw: string): Promise<string> {
  const enc = new TextEncoder().encode(raw);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hashIp(ip: string): string {
  // Simple non-reversible hash for privacy
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function logUsage(
  supabase: ReturnType<typeof createClient>,
  keyId: string,
  statusCode: number,
  startTime: number,
  ipHash: string | null,
  params: Record<string, unknown>,
  errorMessage?: string
) {
  try {
    await supabase.from("api_usage_logs").insert({
      api_key_id: keyId,
      endpoint: "threat-intel-api",
      method: "POST",
      status_code: statusCode,
      response_time_ms: Date.now() - startTime,
      ip_hash: ipHash,
      request_params: params,
      error_message: errorMessage || null,
    });
  } catch (e) {
    console.error("[threat-intel-api] Failed to log usage:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  // Get IP hash for logging (privacy-safe)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || "unknown";
  const ipHash = hashIp(clientIp);

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing x-api-key header" }),
        { status: 401, headers: jsonHeaders }
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
        { status: 403, headers: jsonHeaders }
      );
    }

    // Check active
    if (!keyRecord.is_active) {
      await logUsage(supabase, keyRecord.id, 403, startTime, ipHash, {}, "Key revoked");
      return new Response(
        JSON.stringify({ error: "API key has been revoked" }),
        { status: 403, headers: jsonHeaders }
      );
    }

    // Check expiry
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      await logUsage(supabase, keyRecord.id, 403, startTime, ipHash, {}, "Key expired");
      return new Response(
        JSON.stringify({ error: "API key has expired" }),
        { status: 403, headers: jsonHeaders }
      );
    }

    // Check permission
    const permissions = keyRecord.permissions as string[];
    if (!permissions.includes("read:threat-intel")) {
      await logUsage(supabase, keyRecord.id, 403, startTime, ipHash, {}, "Insufficient permissions");
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: jsonHeaders }
      );
    }

    // Rate limiting: count requests in the last hour
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recentRequests } = await supabase
      .from("api_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("api_key_id", keyRecord.id)
      .gte("created_at", oneHourAgo);

    if ((recentRequests ?? 0) >= RATE_LIMIT_MAX) {
      await logUsage(supabase, keyRecord.id, 429, startTime, ipHash, {}, "Rate limit exceeded");
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          limit: RATE_LIMIT_MAX,
          window: "1 hour",
          retry_after: "Wait and try again later",
        }),
        {
          status: 429,
          headers: {
            ...jsonHeaders,
            "Retry-After": "3600",
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Parse request body
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // GET with no body is fine, use defaults
    }

    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 100);
    const severity = body.severity as string | undefined;
    const category = body.category as string | undefined;
    const since = body.since as string | undefined;
    const search = body.search as string | undefined;
    const offset = Math.max(Number(body.offset) || 0, 0);
    const tags = body.tags as string[] | undefined;

    // Validate severity if provided
    const validSeverities = ["critical", "high", "medium", "low", "info"];
    if (severity && !validSeverities.includes(severity)) {
      await logUsage(supabase, keyRecord.id, 400, startTime, ipHash, body as Record<string, unknown>, "Invalid severity");
      return new Response(
        JSON.stringify({ error: `Invalid severity. Valid values: ${validSeverities.join(", ")}` }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Validate category if provided
    const validCategories = [
      "operational-security", "supply-chain", "personal-protection",
      "web3-security", "defi-exploits", "vulnerability-disclosure", "tools-reviews",
    ];
    if (category && !validCategories.includes(category)) {
      await logUsage(supabase, keyRecord.id, 400, startTime, ipHash, body as Record<string, unknown>, "Invalid category");
      return new Response(
        JSON.stringify({ error: `Invalid category. Valid values: ${validCategories.join(", ")}` }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Query news_articles
    let query = supabase
      .from("news_articles")
      .select(
        "id, title, summary, severity, tags, category, link, published_at, affected_technologies, source_name, cve_id, metadata",
        { count: "exact" }
      )
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (severity) query = query.eq("severity", severity);
    if (category) query = query.eq("category", category);
    if (since) query = query.gte("published_at", since);
    if (tags && Array.isArray(tags) && tags.length > 0) {
      query = query.overlaps("tags", tags);
    }

    const { data: articles, error: articlesError, count: totalCount } = await query;

    if (articlesError) {
      await logUsage(supabase, keyRecord.id, 500, startTime, ipHash, body as Record<string, unknown>, articlesError.message);
      return new Response(
        JSON.stringify({ error: "Failed to fetch articles" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    // Update last_used_at and request_count on api_keys
    await supabase
      .from("api_keys")
      .update({
        last_used_at: new Date().toISOString(),
        request_count: (keyRecord.request_count || 0) + 1,
      })
      .eq("id", keyRecord.id);

    // Log successful request
    await logUsage(supabase, keyRecord.id, 200, startTime, ipHash, {
      limit,
      severity: severity || null,
      category: category || null,
      since: since || null,
      offset,
    });

    const remaining = Math.max(RATE_LIMIT_MAX - (recentRequests ?? 0) - 1, 0);

    return new Response(
      JSON.stringify({
        data: articles,
        pagination: {
          total: totalCount ?? 0,
          limit,
          offset,
          has_more: (totalCount ?? 0) > offset + limit,
        },
      }),
      {
        status: 200,
        headers: {
          ...jsonHeaders,
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
