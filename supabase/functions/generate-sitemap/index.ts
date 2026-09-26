import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
};

const SITE_URL = "https://www.digibastion.com";
const CANONICAL_SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

const fallbackRoutes = [
  "/",
  "/threat-intel",
  "/quiz",
  "/leaderboard",
  "/tools",
  "/articles",
  "/links",
  "/about",
  "/services",
  "/services/opsec-consulting",
  "/services/full-stack-review",
  "/support",
  "/contact",
  "/license",
  "/share",
  ...[
    "opsec",
    "wallet",
    "defi",
    "developers",
    "authentication",
    "browsing",
    "email",
    "social",
    "os",
    "mobile",
    "jobs",
  ].map((category) => `/category/${category}`),
];

const escapeXml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const toSitemapDate = (value: string | null | undefined, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString().slice(0, 10);
};

const buildFallbackSitemap = (today: string) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${fallbackRoutes.map((path) => `<url>
  <loc>${SITE_URL}${path}</loc>
  <lastmod>${today}</lastmod>
</url>`).join("\n")}
</urlset>`;

const fetchCanonicalSitemap = async (today: string) => {
  try {
    const response = await fetch(CANONICAL_SITEMAP_URL, {
      headers: { Accept: "application/xml" },
      signal: AbortSignal.timeout(5_000),
    });
    const xml = await response.text();
    if (!response.ok || !xml.includes("<urlset") || !xml.includes("</urlset>")) {
      throw new Error(`Canonical sitemap returned ${response.status}`);
    }
    return xml;
  } catch (error) {
    console.error("Canonical sitemap unavailable; using safe fallback:", error);
    return buildFallbackSitemap(today);
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...corsHeaders, Allow: "GET, HEAD, OPTIONS" },
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  let xml = await fetchCanonicalSitemap(today);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase sitemap credentials are not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: articles, error } = await supabase
      .from("news_articles")
      .select("id, published_at, updated_at")
      .order("published_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    const dynamicEntries = (articles || [])
      .filter((article) => typeof article.id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(article.id))
      .map((article) => `<url>
  <loc>${SITE_URL}/threat-intel/${escapeXml(encodeURIComponent(article.id))}</loc>
  <lastmod>${toSitemapDate(article.updated_at || article.published_at, today)}</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>`)
      .join("\n");

    if (dynamicEntries) {
      xml = xml.replace("</urlset>", `${dynamicEntries}\n</urlset>`);
    }
  } catch (error) {
    // A database outage must not take the checked-in public sitemap offline.
    console.error("Dynamic threat-intel sitemap entries unavailable:", error);
  }

  return new Response(request.method === "HEAD" ? null : xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
});
