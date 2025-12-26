import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple XML parser for RSS feeds
function parseRSSItem(itemXml: string): { title: string; link: string; description: string; pubDate: string; guid: string } | null {
  try {
    const getTagContent = (xml: string, tag: string): string => {
      // Handle CDATA sections
      const cdataPattern = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
      const cdataMatch = xml.match(cdataPattern);
      if (cdataMatch) return cdataMatch[1].trim();
      
      const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
      const match = xml.match(pattern);
      return match ? match[1].trim() : '';
    };

    const title = getTagContent(itemXml, 'title');
    const link = getTagContent(itemXml, 'link') || getTagContent(itemXml, 'guid');
    const description = getTagContent(itemXml, 'description') || getTagContent(itemXml, 'summary') || getTagContent(itemXml, 'content');
    const pubDate = getTagContent(itemXml, 'pubDate') || getTagContent(itemXml, 'published') || getTagContent(itemXml, 'updated');
    const guid = getTagContent(itemXml, 'guid') || link;

    if (!title || !link) return null;

    return { title, link, description, pubDate, guid };
  } catch (e) {
    console.error('Error parsing RSS item:', e);
    return null;
  }
}

function parseRSSFeed(xml: string): { title: string; link: string; description: string; pubDate: string; guid: string }[] {
  const items: { title: string; link: string; description: string; pubDate: string; guid: string }[] = [];
  
  // Match <item> tags (RSS 2.0) or <entry> tags (Atom)
  const itemPattern = /<item[^>]*>[\s\S]*?<\/item>|<entry[^>]*>[\s\S]*?<\/entry>/gi;
  const matches = xml.match(itemPattern) || [];
  
  for (const match of matches) {
    const parsed = parseRSSItem(match);
    if (parsed) items.push(parsed);
  }
  
  return items;
}

// Generate SHA256 hash for deduplication
async function generateUID(title: string, link: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(title + link);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if content is relevant based on keywords
function isRelevant(title: string, summary: string, keywords: { keyword: string; category: string; weight: number }[]): { relevant: boolean; matchedKeywords: string[]; category: string; weight: number } {
  const content = (title + ' ' + summary).toLowerCase();
  const matchedKeywords: string[] = [];
  let totalWeight = 0;
  const categoryWeights: Record<string, number> = {};

  for (const { keyword, category, weight } of keywords) {
    if (content.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
      totalWeight += weight;
      categoryWeights[category] = (categoryWeights[category] || 0) + weight;
    }
  }

  // Determine primary category based on highest weight
  let primaryCategory = 'web3-security';
  let maxWeight = 0;
  for (const [cat, w] of Object.entries(categoryWeights)) {
    if (w > maxWeight) {
      maxWeight = w;
      primaryCategory = cat;
    }
  }

  // Map keyword category to news category
  const categoryMap: Record<string, string> = {
    'vulnerability': 'vulnerability-disclosure',
    'breach': 'web3-security',
    'malware': 'web3-security',
    'threat': 'operational-security',
    'attack': 'web3-security',
    'supply-chain': 'supply-chain',
    'web3': 'web3-security',
    'opsec': 'operational-security',
    'patch': 'vulnerability-disclosure',
    'general': 'web3-security'
  };

  return {
    relevant: matchedKeywords.length > 0,
    matchedKeywords,
    category: categoryMap[primaryCategory] || 'web3-security',
    weight: totalWeight
  };
}

// Determine severity based on keywords
function determineSeverity(matchedKeywords: string[], title: string): string {
  const titleLower = title.toLowerCase();
  const keywordsLower = matchedKeywords.map(k => k.toLowerCase());
  
  const criticalIndicators = ['critical', 'zero-day', '0day', '0-day', 'rce', 'remote code execution', 'actively exploited', 'emergency'];
  const highIndicators = ['high', 'exploit', 'breach', 'ransomware', 'malware', 'backdoor', 'lazarus', 'north korea'];
  const mediumIndicators = ['medium', 'vulnerability', 'patch', 'update', 'advisory'];
  
  for (const indicator of criticalIndicators) {
    if (titleLower.includes(indicator) || keywordsLower.includes(indicator)) {
      return 'critical';
    }
  }
  
  for (const indicator of highIndicators) {
    if (titleLower.includes(indicator) || keywordsLower.includes(indicator)) {
      return 'high';
    }
  }
  
  for (const indicator of mediumIndicators) {
    if (titleLower.includes(indicator) || keywordsLower.includes(indicator)) {
      return 'medium';
    }
  }
  
  return 'low';
}

// Extract CVE ID if present
function extractCVE(content: string): string | null {
  const cvePattern = /CVE-\d{4}-\d{4,}/gi;
  const match = content.match(cvePattern);
  return match ? match[0].toUpperCase() : null;
}

// Strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[fetch-rss-news] Starting RSS fetch...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active RSS feeds
    const { data: feeds, error: feedsError } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('is_active', true);

    if (feedsError) {
      console.error('[fetch-rss-news] Error fetching feeds:', feedsError);
      throw feedsError;
    }

    console.log(`[fetch-rss-news] Found ${feeds?.length || 0} active feeds`);

    // Fetch keywords for filtering
    const { data: keywords, error: keywordsError } = await supabase
      .from('security_keywords')
      .select('keyword, category, weight');

    if (keywordsError) {
      console.error('[fetch-rss-news] Error fetching keywords:', keywordsError);
      throw keywordsError;
    }

    console.log(`[fetch-rss-news] Loaded ${keywords?.length || 0} keywords`);

    // Calculate cutoff date (7 days ago)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const allArticles: any[] = [];
    const errors: string[] = [];

    // Process each feed
    for (const feed of feeds || []) {
      try {
        console.log(`[fetch-rss-news] Fetching: ${feed.name} (${feed.url})`);
        
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'DigibastonBot/1.0 (+https://digibastion.com)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          }
        });

        if (!response.ok) {
          console.error(`[fetch-rss-news] Failed to fetch ${feed.name}: ${response.status}`);
          errors.push(`${feed.name}: HTTP ${response.status}`);
          continue;
        }

        const xml = await response.text();
        const items = parseRSSFeed(xml);
        
        console.log(`[fetch-rss-news] Parsed ${items.length} items from ${feed.name}`);

        for (const item of items) {
          // Parse publication date
          let pubDate: Date;
          try {
            pubDate = new Date(item.pubDate);
            if (isNaN(pubDate.getTime())) {
              pubDate = new Date();
            }
          } catch {
            pubDate = new Date();
          }

          // Skip articles older than a week
          if (pubDate < oneWeekAgo) {
            continue;
          }

          // Generate unique ID for deduplication
          const uid = await generateUID(item.title, item.link);

          // Check relevance
          const cleanSummary = stripHtml(item.description);
          const relevance = isRelevant(item.title, cleanSummary, keywords || []);

          if (!relevance.relevant) {
            continue;
          }

          // Determine severity and extract CVE
          const severity = determineSeverity(relevance.matchedKeywords, item.title);
          const cveId = extractCVE(item.title + ' ' + cleanSummary);

          allArticles.push({
            uid,
            title: stripHtml(item.title),
            summary: cleanSummary.substring(0, 500),
            content: cleanSummary,
            link: item.link,
            source_url: feed.url,
            source_name: feed.name,
            category: relevance.category,
            severity,
            tags: relevance.matchedKeywords.slice(0, 10),
            affected_technologies: [],
            cve_id: cveId,
            published_at: pubDate.toISOString(),
            raw_content: item.description
          });
        }

        // Update last_fetched_at
        await supabase
          .from('rss_feeds')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', feed.id);

      } catch (e) {
        console.error(`[fetch-rss-news] Error processing ${feed.name}:`, e);
        errors.push(`${feed.name}: ${e.message}`);
      }
    }

    console.log(`[fetch-rss-news] Total relevant articles found: ${allArticles.length}`);

    // Insert new articles (upsert to handle duplicates)
    let insertedCount = 0;
    let duplicateCount = 0;

    for (const article of allArticles) {
      const { error: insertError } = await supabase
        .from('news_articles')
        .upsert(article, { onConflict: 'uid', ignoreDuplicates: true });

      if (insertError) {
        if (insertError.code === '23505') {
          duplicateCount++;
        } else {
          console.error('[fetch-rss-news] Insert error:', insertError);
        }
      } else {
        insertedCount++;
      }
    }

    console.log(`[fetch-rss-news] Inserted: ${insertedCount}, Duplicates: ${duplicateCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${feeds?.length || 0} feeds`,
        articlesFound: allArticles.length,
        articlesInserted: insertedCount,
        duplicatesSkipped: duplicateCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[fetch-rss-news] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
