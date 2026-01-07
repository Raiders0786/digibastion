import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.digibastion.com";

// Static routes with their priorities and change frequencies
const staticRoutes = [
  { path: "/", priority: 1.0, changefreq: "weekly", image: "/og-image.png" },
  { path: "/threat-intel", priority: 0.95, changefreq: "daily", image: "/og-threat-intel.png" },
  { path: "/quiz", priority: 0.9, changefreq: "monthly", image: "/og-quiz.png" },
  { path: "/quiz-result", priority: 0.85, changefreq: "monthly", image: "/og-quiz.png" },
  { path: "/leaderboard", priority: 0.85, changefreq: "daily", image: "/og-quiz.png" },
  { path: "/tools", priority: 0.9, changefreq: "weekly", image: "/og-tools.png" },
  { path: "/articles", priority: 0.9, changefreq: "weekly", image: "/og-image.png" },
  { path: "/links", priority: 0.85, changefreq: "weekly", image: "/og-image.png" },
  { path: "/about", priority: 0.8, changefreq: "monthly", image: "/og-image.png" },
  { path: "/support", priority: 0.7, changefreq: "monthly", image: "/og-image.png" },
  { path: "/contact", priority: 0.7, changefreq: "monthly", image: "/og-image.png" },
  { path: "/license", priority: 0.5, changefreq: "yearly", image: "/og-image.png" },
  { path: "/share", priority: 0.7, changefreq: "monthly", image: "/og-image.png" },
];

// Security category routes
const categoryRoutes = [
  "opsec", "wallet", "defi", "developers", "authentication",
  "browsing", "email", "social", "os", "mobile", "jobs"
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];

    // Fetch news articles from database
    const { data: articles, error } = await supabase
      .from("news_articles")
      .select("id, title, published_at, updated_at")
      .order("published_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Error fetching articles:", error);
    }

    // Build XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

<!-- Main pages -->
`;

    // Add static routes
    for (const route of staticRoutes) {
      xml += `<url>
  <loc>${SITE_URL}${route.path}</loc>
  <lastmod>${today}</lastmod>
  <priority>${route.priority}</priority>
  <changefreq>${route.changefreq}</changefreq>
  <image:image>
    <image:loc>${SITE_URL}${route.image}</image:loc>
    <image:caption>Digibastion - Web3 Security Platform</image:caption>
  </image:image>
</url>
`;
    }

    // Add category routes
    xml += `
<!-- Security category pages -->
`;
    for (const category of categoryRoutes) {
      xml += `<url>
  <loc>${SITE_URL}/category/${category}</loc>
  <lastmod>${today}</lastmod>
  <priority>0.85</priority>
  <changefreq>weekly</changefreq>
  <image:image>
    <image:loc>${SITE_URL}/og-image.png</image:loc>
    <image:caption>${category.charAt(0).toUpperCase() + category.slice(1)} Security Checklist</image:caption>
  </image:image>
</url>
`;
    }

    // Add news articles if available
    if (articles && articles.length > 0) {
      xml += `
<!-- News articles -->
`;
      for (const article of articles) {
        const lastmod = article.updated_at 
          ? new Date(article.updated_at).toISOString().split("T")[0]
          : new Date(article.published_at).toISOString().split("T")[0];
        
        xml += `<url>
  <loc>${SITE_URL}/threat-intel/${article.id}</loc>
  <lastmod>${lastmod}</lastmod>
  <priority>0.7</priority>
  <changefreq>monthly</changefreq>
</url>
`;
      }
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
