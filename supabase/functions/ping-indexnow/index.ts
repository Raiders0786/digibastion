import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
import {
  buildIndexNowBody,
  chunkUrls,
  classifyIndexNowResponse,
  filterSubmittableUrls,
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  indexNowResponseStatus,
  INDEXNOW_MAX_URLS_PER_RUN,
  isIndexNowKey,
  planIndexNowRun,
  resolveSince,
} from '../_shared/indexnow.ts';
import { INDEXABLE_INCIDENT_POSTGREST_FILTER, isIndexableIncidentMetadata, SAFE_ARTICLE_ID, WEEK_START } from '../_shared/publishable.ts';
import { canonicalIncidentUrl, canonicalWeeklyUrl, SITE_URL } from '../_shared/site-urls.ts';

// Tells IndexNow (Bing, Yandex, Seznam, Naver, Yep) about new and changed
// incident pages and new weekly deep-dives. Cron calls it at :22 and :52, five
// minutes after each QuillMonitor sync.
//
// Body: { mode?: 'run' | 'urls' | 'backfill', dryRun?: boolean, urls?: string[] }
//   run       (default, cron) rows created or status-changed since the last
//             successful run's cursor, at most 1,000 URLs
//   urls      admin or service role: submit up to 1,000 given URLs on our host
//   backfill  admin or service role: every indexable incident and weekly issue
//
// The cursor lives in threat_intel_ingestion_runs.metadata.cursor of the last
// successful run. A dry run records nothing, and a failed submission keeps the
// old cursor, so the next run sends the same URLs again.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Principal = { kind: 'cron' | 'service' } | { kind: 'admin'; email: string | null };
type Mode = 'run' | 'urls' | 'backfill';

const PAGE = 1_000; // supabase/config.toml max_rows
const ID_CHUNK = 100;
const MAX_BACKFILL_ROWS = 100_000;
// Rows from a sync that is still committing get a created_at slightly in the
// past. Stopping the window two minutes back keeps them for the next run.
const SETTLE_MS = 2 * 60_000;
const REQUEST_TIMEOUT_MS = 10_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function timingSafeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index++) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
}

async function authorize(req: Request, url: string, anonKey: string, serviceKey: string): Promise<Principal | null> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && await timingSafeEqual(token, cronSecret)) return { kind: 'cron' };
  if (await timingSafeEqual(token, serviceKey)) return { kind: 'service' };

  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return null;
  const admin = createClient(url, serviceKey);
  const { data: role } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  return role ? { kind: 'admin', email: user.email ?? null } : null;
}

interface Plan {
  urls: string[];
  truncated: boolean;
  /** Where the next `run` starts; undefined when this call must not move it. */
  cursor?: string;
}

function chunk<T>(values: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < values.length; index += size) out.push(values.slice(index, index + size));
  return out;
}

const weekOf = (periodStart: unknown) => String(periodStart ?? '').slice(0, 10);

async function planRun(db: SupabaseClient): Promise<Plan> {
  const until = new Date(Date.now() - SETTLE_MS).toISOString();
  // Only runs that carry a cursor count: a `urls` run must not move the window.
  const { data: last, error: lastError } = await db.from('threat_intel_ingestion_runs').select('attempted_at, metadata')
    .eq('pipeline', 'indexnow').eq('success', true).not('metadata->>cursor', 'is', null)
    .order('attempted_at', { ascending: false }).limit(1).maybeSingle();
  if (lastError) throw lastError;
  const since = resolveSince(last ?? null, new Date(until));

  // New incidents, oldest first so a truncated run resumes where it stopped.
  const { data: fresh, error: freshError } = await db.from('news_articles').select('id, created_at, metadata')
    .or(INDEXABLE_INCIDENT_POSTGREST_FILTER).gt('created_at', since).lte('created_at', until)
    .order('created_at', { ascending: true }).order('id', { ascending: true }).limit(INDEXNOW_MAX_URLS_PER_RUN);
  if (freshError) throw freshError;

  // Status changes (confirmed, revised, retracted) logged in the window, oldest
  // first, for records that are still indexable.
  const { data: events, error: eventsError } = await db.from('incident_status_events').select('article_id, created_at')
    .gt('created_at', since).lte('created_at', until).not('article_id', 'is', null)
    .order('created_at', { ascending: true }).limit(PAGE);
  if (eventsError) throw eventsError;
  const changedIds = [...new Set((events ?? []).map((event) => String(event.article_id)))].filter((id) => SAFE_ARTICLE_ID.test(id));
  const stillIndexable = new Set<string>();
  for (const ids of chunk(changedIds, ID_CHUNK)) {
    const { data: rows, error } = await db.from('news_articles').select('id, metadata')
      .in('id', ids).or(INDEXABLE_INCIDENT_POSTGREST_FILTER);
    if (error) throw error;
    for (const row of rows ?? []) if (isIndexableIncidentMetadata(row.metadata)) stillIndexable.add(String(row.id));
  }

  const { data: weeks, error: weeksError } = await db.from('newsletter_issues').select('period_start')
    .eq('kind', 'weekly').in('status', ['ready', 'sent']).gt('generated_at', since).lte('generated_at', until);
  if (weeksError) throw weeksError;

  return planIndexNowRun({
    until,
    weeklyStarts: (weeks ?? []).map((week) => weekOf(week.period_start)).filter((week) => WEEK_START.test(week)),
    fresh: (fresh ?? []).map((row) => ({
      id: String(row.id),
      at: String(row.created_at),
      indexable: SAFE_ARTICLE_ID.test(String(row.id)) && isIndexableIncidentMetadata(row.metadata),
    })),
    freshLimit: INDEXNOW_MAX_URLS_PER_RUN,
    statusChanges: (events ?? []).map((event) => ({
      id: String(event.article_id),
      at: String(event.created_at),
      indexable: stillIndexable.has(String(event.article_id)),
    })),
    statusLimit: PAGE,
  });
}

async function planBackfill(db: SupabaseClient): Promise<Plan> {
  const until = new Date(Date.now() - SETTLE_MS).toISOString();
  const incidentUrls: string[] = [];
  for (let from = 0; from < MAX_BACKFILL_ROWS; from += PAGE) {
    const { data, error } = await db.from('news_articles').select('id, metadata')
      .or(INDEXABLE_INCIDENT_POSTGREST_FILTER).lte('created_at', until)
      .order('created_at', { ascending: false }).order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      if (SAFE_ARTICLE_ID.test(String(row.id)) && isIndexableIncidentMetadata(row.metadata)) incidentUrls.push(canonicalIncidentUrl(String(row.id)));
    }
    if (!data || data.length < PAGE) break;
  }
  const { data: weeks, error: weeksError } = await db.from('newsletter_issues').select('period_start')
    .eq('kind', 'weekly').in('status', ['ready', 'sent']).order('period_start', { ascending: false }).limit(520);
  if (weeksError) throw weeksError;
  const weeklyUrls = (weeks ?? []).map((week) => weekOf(week.period_start)).filter((week) => WEEK_START.test(week))
    .map((week) => canonicalWeeklyUrl(week));
  const urls = filterSubmittableUrls([
    ...weeklyUrls,
    ...incidentUrls,
    `${SITE_URL}/threat-intel`,
    `${SITE_URL}/threat-intel/weekly`,
  ]);
  return { urls, truncated: false, cursor: until };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: 'Function is not configured' }, 500);

  const principal = await authorize(req, supabaseUrl, anonKey, serviceKey);
  if (!principal) return json({ error: 'Unauthorized' }, 401);

  let body: Record<string, unknown> = {};
  try {
    const raw = await req.text();
    if (raw.trim()) {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'Body must be a JSON object' }, 400);
      body = parsed as Record<string, unknown>;
    }
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const mode = (body.mode ?? 'run') as Mode;
  if (mode !== 'run' && mode !== 'urls' && mode !== 'backfill') return json({ error: 'mode must be run, urls or backfill' }, 400);
  if (body.dryRun !== undefined && typeof body.dryRun !== 'boolean') return json({ error: 'dryRun must be a boolean' }, 400);
  const dryRun = body.dryRun === true;
  if (mode !== 'run' && principal.kind !== 'admin' && principal.kind !== 'service') {
    return json({ error: `mode ${mode} needs an admin or the service role` }, 403);
  }
  if (mode === 'urls') {
    const list = body.urls;
    if (!Array.isArray(list) || list.length === 0 || list.length > INDEXNOW_MAX_URLS_PER_RUN ||
      !list.every((entry) => typeof entry === 'string' && entry.length <= 2_048)) {
      return json({ error: `urls must be 1 to ${INDEXNOW_MAX_URLS_PER_RUN} strings` }, 400);
    }
  }

  const envKey = Deno.env.get('INDEXNOW_KEY');
  // A rotated key also needs public/<key>.txt on the site, or IndexNow answers 403.
  const key = isIndexNowKey(envKey) ? envKey : INDEXNOW_KEY;
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const startedAt = Date.now();
  const attemptedAt = new Date(startedAt).toISOString();

  let plan: Plan;
  try {
    plan = mode === 'run'
      ? await planRun(db)
      : mode === 'backfill'
        ? await planBackfill(db)
        : { urls: filterSubmittableUrls(body.urls as string[]), truncated: false };
  } catch (error) {
    console.error('[ping-indexnow] database read failed:', error instanceof Error ? error.message : String(error));
    if (!dryRun) {
      await recordIngestionRun(db, {
        pipeline: 'indexnow', attempted_at: attemptedAt, completed_at: new Date().toISOString(), success: false,
        duration_ms: Date.now() - startedAt, error_summary: 'database read failed', metadata: { mode },
      });
    }
    return json({ success: false, error: 'Database read failed' }, 503);
  }

  if (dryRun) {
    return json({ success: true, dryRun: true, mode, count: plan.urls.length, truncated: plan.truncated, sample: plan.urls.slice(0, 5) });
  }

  const outcomes: string[] = [];
  const statuses: number[] = [];
  let accepted = 0;
  for (const urls of chunkUrls(plan.urls)) {
    let outcome: string;
    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(buildIndexNowBody(urls, key)),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      await response.body?.cancel();
      statuses.push(response.status);
      outcome = classifyIndexNowResponse(response.status);
    } catch (error) {
      outcome = error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'network_error';
    }
    outcomes.push(outcome);
    if (outcome !== 'ok') break;
    accepted += urls.length;
  }

  const success = outcomes.every((outcome) => outcome === 'ok');
  // Never store the key or the URL list in the run.
  await recordIngestionRun(db, {
    pipeline: 'indexnow',
    attempted_at: attemptedAt,
    completed_at: new Date().toISOString(),
    success,
    records_found: plan.urls.length,
    records_inserted: accepted,
    records_invalid: plan.urls.length - accepted,
    duration_ms: Date.now() - startedAt,
    error_summary: success ? undefined : outcomes.join(','),
    metadata: {
      mode,
      chunks: outcomes.length,
      statuses,
      truncated: plan.truncated,
      ...(success && plan.cursor ? { cursor: plan.cursor } : {}),
    },
  });

  return json({ success, mode, count: plan.urls.length, accepted, truncated: plan.truncated, outcomes }, indexNowResponseStatus(outcomes));
});
