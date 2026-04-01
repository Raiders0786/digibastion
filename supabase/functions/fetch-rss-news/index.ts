import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── HTML Entity Decoding ───────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: ' ', mdash: '—', ndash: '–', hellip: '…',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D',
  bull: '•', middot: '·', copy: '©', reg: '®', trade: '™',
  times: '×', divide: '÷', deg: '°', para: '¶', sect: '§',
  laquo: '«', raquo: '»', cent: '¢', pound: '£', euro: '€',
  yen: '¥', micro: 'µ', plusmn: '±', frac12: '½', frac14: '¼', frac34: '¾',
};

function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    // Numeric decimal: &#8217; → '
    .replace(/&#(\d+);/g, (_, code) => {
      const n = parseInt(code, 10);
      return n > 0 && n < 0x10FFFF ? String.fromCodePoint(n) : '';
    })
    // Numeric hex: &#x2019; → '
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const n = parseInt(hex, 16);
      return n > 0 && n < 0x10FFFF ? String.fromCodePoint(n) : '';
    })
    // Named entities: &amp; → &
    .replace(/&([a-zA-Z]+);/g, (full, name) => {
      return NAMED_ENTITIES[name.toLowerCase()] ?? full;
    });
}

function stripHtml(html: string): string {
  if (!html) return '';
  let text = html
    .replace(/<[^>]*>/g, '')          // Strip tags
    .replace(/\s+/g, ' ');            // Collapse whitespace
  text = decodeHtmlEntities(text);
  return text.trim();
}

function cleanSummary(text: string): string {
  if (!text) return '';
  return text
    // Remove "The post ... appeared first on ..." RSS boilerplate
    .replace(/The post\s.*?\sappeared first on\s.*?\.?\s*$/i, '')
    // Remove "Continue reading →" patterns
    .replace(/Continue reading\s*→?\s*$/i, '')
    // Remove "[…]" or "[...]"
    .replace(/\[\u2026\]|\[\.\.\.\]/g, '…')
    .trim();
}

// ─── RSS / Atom XML Parsing ─────────────────────────────────────────────────

function getTagContent(xml: string, tag: string): string {
  // Handle CDATA sections
  const cdataPattern = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();

  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(pattern);
  return match ? match[1].trim() : '';
}

/** Extract link from Atom <link href="..."/> or RSS <link>text</link> */
function extractLink(xml: string): string {
  // 1) Atom: <link rel="alternate" href="..."/>
  const altHref = xml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
    || xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']/i);
  if (altHref) return altHref[1].trim();

  // 2) Any <link href="..."/>  (self-closing)
  const anyHref = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (anyHref) return anyHref[1].trim();

  // 3) RSS: <link>https://...</link>
  return getTagContent(xml, 'link');
}

interface ParsedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

function parseRSSItem(itemXml: string): ParsedItem | null {
  try {
    const title = getTagContent(itemXml, 'title');
    const link = extractLink(itemXml) || getTagContent(itemXml, 'guid');
    const description = getTagContent(itemXml, 'description')
      || getTagContent(itemXml, 'summary')
      || getTagContent(itemXml, 'content');
    const pubDate = getTagContent(itemXml, 'pubDate')
      || getTagContent(itemXml, 'published')
      || getTagContent(itemXml, 'updated')
      || getTagContent(itemXml, 'dc:date');
    const guid = getTagContent(itemXml, 'guid') || getTagContent(itemXml, 'id') || link;

    if (!title || !link) return null;
    return { title, link, description, pubDate, guid };
  } catch (e) {
    console.error('Error parsing RSS item:', e);
    return null;
  }
}

function parseRSSFeed(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const itemPattern = /<item[^>]*>[\s\S]*?<\/item>|<entry[^>]*>[\s\S]*?<\/entry>/gi;
  const matches = xml.match(itemPattern) || [];
  for (const match of matches) {
    const parsed = parseRSSItem(match);
    if (parsed) items.push(parsed);
  }
  return items;
}

// ─── Dedup UID ──────────────────────────────────────────────────────────────

async function generateUID(title: string, link: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(title + link);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Relevance + Category ───────────────────────────────────────────────────

interface KeywordEntry {
  keyword: string;
  category: string;
  weight: number;
}

interface RelevanceResult {
  relevant: boolean;
  matchedKeywords: string[];
  category: string;
  weight: number;
}

/**
 * Determines if content is relevant and assigns a category.
 * `feedCategory` is used as fallback when keyword matches are weak.
 */
function isRelevant(
  title: string,
  summary: string,
  keywords: KeywordEntry[],
  feedCategory: string
): RelevanceResult {
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

  // Find primary keyword-category by weight
  let keywordCategory = '';
  let maxWeight = 0;
  for (const [cat, w] of Object.entries(categoryWeights)) {
    if (w > maxWeight) {
      maxWeight = w;
      keywordCategory = cat;
    }
  }

  // Map keyword categories → news categories
  const categoryMap: Record<string, string> = {
    'vulnerability': 'vulnerability-disclosure',
    'breach': 'operational-security',
    'malware': 'operational-security',
    'threat': 'operational-security',
    'attack': 'operational-security',
    'supply-chain': 'supply-chain',
    'web3': 'web3-security',
    'defi': 'defi-exploits',
    'opsec': 'operational-security',
    'patch': 'vulnerability-disclosure',
    'cloud': 'vulnerability-disclosure',
    'infrastructure': 'vulnerability-disclosure',
    'advisory': 'vulnerability-disclosure',
    'general': 'vulnerability-disclosure',
  };

  // Decide final category:
  // 1) If feed has a specific category, trust it unless keywords are very strong
  // 2) If strong keyword match exists and feed is generic, use keywords
  // 3) Fallback to vulnerability-disclosure
  let finalCategory: string;
  const feedHasCategory = feedCategory && feedCategory !== 'general';

  if (feedHasCategory && (!keywordCategory || maxWeight < 6)) {
    // Feed has a meaningful category — trust it unless keywords are overwhelming
    finalCategory = feedCategory;
  } else if (keywordCategory && maxWeight >= 3) {
    // Strong keyword signal on a generic feed → use keyword-derived category
    finalCategory = categoryMap[keywordCategory] || 'vulnerability-disclosure';
  } else if (keywordCategory) {
    finalCategory = categoryMap[keywordCategory] || 'vulnerability-disclosure';
  } else {
    finalCategory = feedHasCategory ? feedCategory : 'vulnerability-disclosure';
  }

  // Override: if content has strong web3/defi signals, force web3 category
  const web3Signals = ['blockchain', 'defi', 'smart contract', 'web3', 'nft', 'dao',
    'metamask', 'uniswap', 'aave', 'compound', 'solana', 'ethereum',
    'crypto wallet', 'private key', 'seed phrase', 'rug pull', 'flash loan'];
  const hasWeb3Signal = web3Signals.some(s => content.includes(s));

  if (hasWeb3Signal && finalCategory !== 'defi-exploits') {
    finalCategory = 'web3-security';
  }

  // For vendor advisory feeds, articles are always relevant even without keyword matches
  const isVendorFeed = feedCategory === 'vulnerability-disclosure';
  const isRelevantResult = matchedKeywords.length > 0 || isVendorFeed;

  return {
    relevant: isRelevantResult,
    matchedKeywords,
    category: finalCategory,
    weight: totalWeight
  };
}

// ─── Severity ───────────────────────────────────────────────────────────────

function determineSeverity(matchedKeywords: string[], title: string): string {
  const titleLower = title.toLowerCase();
  const keywordsLower = matchedKeywords.map(k => k.toLowerCase());

  const criticalIndicators = ['critical', 'zero-day', '0day', '0-day', 'rce',
    'remote code execution', 'actively exploited', 'emergency', 'cvss 9', 'cvss 10'];
  const highIndicators = ['high', 'exploit', 'breach', 'ransomware', 'malware',
    'backdoor', 'lazarus', 'north korea', 'apt', 'privilege escalation',
    'authentication bypass', 'code execution'];
  const mediumIndicators = ['medium', 'vulnerability', 'patch', 'update',
    'advisory', 'security bulletin', 'security notice', 'moderate'];

  for (const indicator of criticalIndicators) {
    if (titleLower.includes(indicator) || keywordsLower.includes(indicator)) return 'critical';
  }
  for (const indicator of highIndicators) {
    if (titleLower.includes(indicator) || keywordsLower.includes(indicator)) return 'high';
  }
  for (const indicator of mediumIndicators) {
    if (titleLower.includes(indicator) || keywordsLower.includes(indicator)) return 'medium';
  }
  return 'low';
}

// ─── CVE Extraction ─────────────────────────────────────────────────────────

function extractCVE(content: string): string | null {
  const cvePattern = /CVE-\d{4}-\d{4,}/gi;
  const match = content.match(cvePattern);
  return match ? match[0].toUpperCase() : null;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: accept CRON_SECRET or authenticated admin user
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('authorization');
  let authorized = false;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    authorized = true;
  } else if (authHeader?.startsWith('Bearer ')) {
    // Check if it's an authenticated admin user
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
      if (!claimsError && claimsData?.claims?.sub) {
        authorized = true;
      }
    } catch (e) {
      console.error('[fetch-rss-news] Auth check failed:', e);
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[fetch-rss-news] Starting RSS fetch...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active RSS feeds + keywords in parallel
    const [feedsResult, keywordsResult] = await Promise.all([
      supabase.from('rss_feeds').select('*').eq('is_active', true),
      supabase.from('security_keywords').select('keyword, category, weight'),
    ]);

    if (feedsResult.error) throw feedsResult.error;
    if (keywordsResult.error) throw keywordsResult.error;

    const feeds = feedsResult.data || [];
    const keywords = (keywordsResult.data || []) as KeywordEntry[];

    console.log(`[fetch-rss-news] Found ${feeds.length} active feeds, ${keywords.length} keywords`);

    // 7-day cutoff
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const allArticles: any[] = [];
    const errors: string[] = [];

    for (const feed of feeds) {
      try {
        console.log(`[fetch-rss-news] Fetching: ${feed.name} (${feed.url})`);

        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'DigibastonBot/1.0 (+https://digibastion.com)',
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*'
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
          let pubDate: Date;
          try {
            pubDate = new Date(item.pubDate);
            if (isNaN(pubDate.getTime())) pubDate = new Date();
          } catch {
            pubDate = new Date();
          }

          if (pubDate < oneWeekAgo) continue;

          const uid = await generateUID(item.title, item.link);

          // Decode entities in title/summary before relevance check
          const cleanTitle = decodeHtmlEntities(stripHtml(item.title));
          const cleanDesc = cleanSummary(stripHtml(item.description));

          const relevance = isRelevant(cleanTitle, cleanDesc, keywords, feed.category);
          if (!relevance.relevant) continue;

          const severity = determineSeverity(relevance.matchedKeywords, cleanTitle);
          const cveId = extractCVE(cleanTitle + ' ' + cleanDesc);

          allArticles.push({
            uid,
            title: cleanTitle,
            summary: cleanDesc.substring(0, 500),
            content: cleanDesc,
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

    // Insert new articles
    let insertedCount = 0;
    let duplicateCount = 0;

    for (const article of allArticles) {
      const { data: existing } = await supabase
        .from('news_articles')
        .select('id')
        .eq('uid', article.uid)
        .maybeSingle();

      if (existing) {
        duplicateCount++;
        continue;
      }

      const { error: insertError } = await supabase
        .from('news_articles')
        .insert(article);

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

    // Trigger AI summarization for new articles
    if (insertedCount > 0) {
      console.log('[fetch-rss-news] Triggering AI summarization...');
      try {
        const summarizeUrl = `${supabaseUrl}/functions/v1/summarize-article`;
        fetch(summarizeUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ limit: Math.min(insertedCount, 20) }),
        }).catch(e => console.error('[fetch-rss-news] Summarize trigger error:', e));
      } catch (e) {
        console.error('[fetch-rss-news] Failed to trigger summarization:', e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${feeds.length} feeds`,
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
