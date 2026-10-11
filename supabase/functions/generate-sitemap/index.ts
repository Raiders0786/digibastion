import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { INDEXABLE_INCIDENT_POSTGREST_FILTER, isIndexableIncidentMetadata, SAFE_ARTICLE_ID, WEEK_START } from '../_shared/publishable.ts';
import { canonicalIncidentUrl, canonicalWeeklyUrl } from '../_shared/site-urls.ts';
import {
  incidentLastmod,
  pageCount,
  pageEntries,
  renderNewsSitemap,
  renderUrlset,
  renderUrlText,
  sitemapDate,
  type SitemapEntry,
} from '../_shared/sitemap-render.ts';

// Public, read-only sitemaps for the pages that change: every indexable Web3
// incident and every published weekly deep-dive. Static pages are listed in
// https://www.digibastion.com/sitemap.xml. public/robots.txt lists these URLs,
// which is what lets search engines accept a sitemap on this host.
//
//   ?part=dynamic (default)   incidents and weekly issues, 45,000 per page
//   ?part=dynamic&page=N      page N when there are more
//   ?part=dynamic&format=txt  the same URLs, one per line
//   ?part=news                Google News sitemap: incidents stored in the last 48 hours
//
// RSS relays that are not Web3 incidents, merged duplicates and records the
// classifier rejected are never listed.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
};

const PAGE = 1_000; // supabase/config.toml max_rows
const MAX_ROWS = 100_000;
const NEWS_WINDOW_MS = 48 * 3_600_000;
const NEWS_LIMIT = 1_000;
const MAX_PAGE = 1_000;

type IncidentRow = { id: string; title: string; created_at: string; metadata: unknown };

async function indexableIncidents(db: SupabaseClient, sinceIso?: string, limit = MAX_ROWS): Promise<IncidentRow[]> {
  const rows: IncidentRow[] = [];
  for (let from = 0; from < limit; from += PAGE) {
    let query = db.from('news_articles').select('id, title, created_at, metadata')
      .or(INDEXABLE_INCIDENT_POSTGREST_FILTER)
      .order('created_at', { ascending: false }).order('id', { ascending: true })
      .range(from, Math.min(from + PAGE, limit) - 1);
    if (sinceIso) query = query.gte('created_at', sinceIso);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...((data ?? []) as IncidentRow[]));
    if (!data || data.length < PAGE) break;
  }
  return rows.filter((row) => typeof row.id === 'string' && SAFE_ARTICLE_ID.test(row.id) && isIndexableIncidentMetadata(row.metadata));
}

/** Newest logged status change (confirmed, revised, retracted) per article. */
async function latestStatusChanges(db: SupabaseClient): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await db.from('incident_status_events').select('article_id, created_at')
      .not('article_id', 'is', null)
      .order('created_at', { ascending: false }).order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.article_id && !out.has(row.article_id)) out.set(row.article_id, row.created_at);
    }
    if (!data || data.length < PAGE) break;
  }
  return out;
}

async function weeklyEntries(db: SupabaseClient): Promise<SitemapEntry[]> {
  const { data, error } = await db.from('newsletter_issues').select('period_start, generated_at')
    .eq('kind', 'weekly').in('status', ['ready', 'sent']).order('period_start', { ascending: false }).limit(520);
  if (error) throw error;
  return (data ?? []).flatMap((issue) => {
    const day = sitemapDate(String(issue.period_start));
    return day && WEEK_START.test(day) && new Date(`${day}T00:00:00Z`).getUTCDay() === 1
      ? [{ loc: canonicalWeeklyUrl(day), lastmod: sitemapDate(issue.generated_at) }]
      : [];
  });
}

async function dynamicEntries(db: SupabaseClient): Promise<SitemapEntry[]> {
  const [incidents, statusChanges, weekly] = await Promise.all([
    indexableIncidents(db),
    latestStatusChanges(db),
    weeklyEntries(db),
  ]);
  const now = new Date();
  // Weekly issues first so they always sit on page 1.
  return [
    ...weekly,
    ...incidents.map((row) => ({
      loc: canonicalIncidentUrl(row.id),
      lastmod: incidentLastmod(row, statusChanges.get(row.id) ?? null, now),
    })),
  ];
}

function textResponse(request: Request, body: string, status: number, extra: Record<string, string> = {}): Response {
  return new Response(request.method === 'HEAD' ? null : body, {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });
}

function sitemapResponse(request: Request, body: string, contentType: string): Response {
  return new Response(request.method === 'HEAD' ? null : body, {
    headers: {
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      // The sitemap itself should never show up as a search result.
      'X-Robots-Tag': 'noindex',
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { ...corsHeaders, Allow: 'GET, HEAD, OPTIONS' } });
  }

  const params = new URL(request.url).searchParams;
  const part = params.get('part') ?? 'dynamic';
  const format = params.get('format') ?? 'xml';
  const pageParam = params.get('page') ?? '1';
  if (part !== 'dynamic' && part !== 'news') return textResponse(request, 'Unknown part. Use dynamic or news.', 400);
  if (format !== 'xml' && format !== 'txt') return textResponse(request, 'Unknown format. Use xml or txt.', 400);
  if (!/^\d{1,4}$/.test(pageParam) || Number(pageParam) < 1 || Number(pageParam) > MAX_PAGE) {
    return textResponse(request, 'page must be a whole number from 1.', 400);
  }
  if (part === 'news' && (format !== 'xml' || pageParam !== '1')) {
    return textResponse(request, 'The news sitemap is a single XML page.', 400);
  }
  const page = Number(pageParam);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return textResponse(request, 'Sitemap is not configured.', 503, { 'Retry-After': '3600' });
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    if (part === 'news') {
      const since = new Date(Date.now() - NEWS_WINDOW_MS).toISOString();
      const rows = await indexableIncidents(db, since, NEWS_LIMIT);
      const xml = renderNewsSitemap(rows.map((row) => ({
        loc: canonicalIncidentUrl(row.id),
        title: String(row.title ?? '').trim().slice(0, 200) || 'Web3 security incident',
        publishedAt: row.created_at,
      })));
      return sitemapResponse(request, xml, 'application/xml; charset=utf-8');
    }

    const entries = await dynamicEntries(db);
    if (page > pageCount(entries.length)) return textResponse(request, 'No such sitemap page.', 404);
    const slice = pageEntries(entries, page);
    return format === 'txt'
      ? sitemapResponse(request, renderUrlText(slice), 'text/plain; charset=utf-8')
      : sitemapResponse(request, renderUrlset(slice), 'application/xml; charset=utf-8');
  } catch (error) {
    // An empty sitemap would tell crawlers the pages are gone; ask them to come back instead.
    console.error('[generate-sitemap] database read failed:', error instanceof Error ? error.message : String(error));
    return textResponse(request, 'Sitemap temporarily unavailable.', 503, { 'Retry-After': '3600' });
  }
});
