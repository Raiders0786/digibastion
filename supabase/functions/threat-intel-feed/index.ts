import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import {
  FEED_CHANNEL,
  FEED_CONTENT_TYPES,
  incidentFeedItem,
  renderFeed,
  sortFeedItems,
  weeklyFeedItem,
  type FeedChannel,
  type FeedFormat,
  type FeedItem,
} from '../_shared/feed-render.ts';
import { toNewsletterItem, type NewsletterSourceRow } from '../_shared/newsletter-content.ts';
import { INDEXABLE_INCIDENT_POSTGREST_FILTER, isIndexableIncidentMetadata, SAFE_ARTICLE_ID } from '../_shared/publishable.ts';
import { FUNCTIONS_BASE_URL, SITE_URL } from '../_shared/site-urls.ts';
import { isWeeklyPublicContent, toPublicWeekly } from '../_shared/weekly-render.ts';

// Public RSS 2.0, Atom 1.0 and JSON Feed 1.1 of the threat-intel feed: the
// 50 newest Web3 incidents and the 10 newest weekly deep-dives. Read-only.
//
//   ?format=rss (default) | atom | json
//   ?type=all (default) | incidents | weekly
//
// RSS relays, merged duplicates and classifier rejects are never included.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
};

const INCIDENT_LIMIT = 50;
const WEEKLY_LIMIT = 10;
const SOURCE_COLUMNS = 'id, uid, title, summary, severity, category, link, source_name, cve_id, tags, affected_technologies, created_at, metadata';
const FORMATS: readonly FeedFormat[] = ['rss', 'atom', 'json'];
const TYPES = ['all', 'incidents', 'weekly'] as const;
type FeedType = typeof TYPES[number];

const CHANNELS: Record<FeedType, FeedChannel> = {
  all: FEED_CHANNEL,
  incidents: { ...FEED_CHANNEL, title: 'Digibastion Threat Intel: incidents' },
  weekly: {
    title: 'Digibastion weekly Web3 security report',
    description: 'One report a week on the Web3 incidents added that week, with reported losses and each item linked to its source.',
    homePageUrl: `${SITE_URL}/threat-intel/weekly`,
  },
};

function plain(request: Request, body: string, status: number, extra: Record<string, string> = {}): Response {
  return new Response(request.method === 'HEAD' ? null : body, {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { ...corsHeaders, Allow: 'GET, HEAD, OPTIONS' } });
  }

  const params = new URL(request.url).searchParams;
  const format = (params.get('format') ?? 'rss') as FeedFormat;
  const type = (params.get('type') ?? 'all') as FeedType;
  if (!FORMATS.includes(format)) return plain(request, 'Unknown format. Use rss, atom or json.', 400);
  if (!TYPES.includes(type)) return plain(request, 'Unknown type. Use all, incidents or weekly.', 400);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return plain(request, 'Feed is not configured.', 503, { 'Retry-After': '900' });
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const items: FeedItem[] = [];
  try {
    if (type !== 'weekly') {
      const { data, error } = await db.from('news_articles').select(SOURCE_COLUMNS)
        .or(INDEXABLE_INCIDENT_POSTGREST_FILTER)
        .order('created_at', { ascending: false }).order('id', { ascending: true })
        .limit(INCIDENT_LIMIT);
      if (error) throw error;
      for (const row of (data ?? []) as NewsletterSourceRow[]) {
        if (!SAFE_ARTICLE_ID.test(String(row.id)) || !isIndexableIncidentMetadata(row.metadata)) continue;
        items.push(incidentFeedItem(toNewsletterItem(row, SITE_URL)));
      }
    }
    if (type !== 'incidents') {
      const { data, error } = await db.from('newsletter_issues').select('content, generated_at')
        .eq('kind', 'weekly').in('status', ['ready', 'sent'])
        .order('period_start', { ascending: false }).limit(WEEKLY_LIMIT);
      if (error) throw error;
      for (const issue of data ?? []) {
        if (!isWeeklyPublicContent(issue.content)) continue;
        // toPublicWeekly drops the private archive (prompt, raw model output).
        items.push(weeklyFeedItem(toPublicWeekly(issue.content), String(issue.generated_at)));
      }
    }
  } catch (error) {
    // An empty feed would look like every item was withdrawn; ask readers to retry.
    console.error('[threat-intel-feed] database read failed:', error instanceof Error ? error.message : String(error));
    return plain(request, 'Feed temporarily unavailable.', 503, { 'Retry-After': '900' });
  }

  const selfUrl = `${FUNCTIONS_BASE_URL}/threat-intel-feed?format=${format}${type === 'all' ? '' : `&type=${type}`}`;
  const body = renderFeed(format, CHANNELS[type], sortFeedItems(items), selfUrl);
  return new Response(request.method === 'HEAD' ? null : body, {
    headers: {
      ...corsHeaders,
      'Content-Type': FEED_CONTENT_TYPES[format],
      'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600',
    },
  });
});
