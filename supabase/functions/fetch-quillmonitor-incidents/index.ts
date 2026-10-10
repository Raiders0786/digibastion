import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { z } from 'npm:zod@3.23.8';
import {
  assessQuillMonitorRunHealth,
  buildQuillMonitorRequestUrl,
  finalizeQuillMonitorArticle,
  hasCompleteQuillMonitorResult,
  isSafeQuillMonitorSyncWindow,
  normalizeQuillMonitorIncident,
  parseQuillMonitorPage,
  parseQuillMonitorIncident,
  type ExistingQuillMonitorRow,
  type NormalizedQuillMonitorArticle,
} from '../_shared/quillmonitor.ts';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
import {
  incidentDateWindows,
  orderCanonicalsFirst,
  planCanonicalMerges,
  planQuillMonitorDuplicates,
  quillMonitorMarkForWrite,
  rowProvider,
  type IncidentRow,
} from '../_shared/incident-dedup.ts';
import { mergeIncidentSources } from '../_shared/incident-fields.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const RequestSchema = z.object({
  page_size: z.number().int().min(1).max(100).optional().default(100),
  max_pages: z.number().int().min(1).max(100).optional().default(20),
  pages: z.number().int().min(1).max(20).optional(),
  mode: z.enum(['auto', 'full']).optional().default('auto'),
}).strict();
const DATABASE_BATCH_SIZE = 50;
const SYNC_CURSOR_KEY = 'QUILLMONITOR_SYNC_SINCE';
// QuillMonitor's own stored rows (same-provider duplicates) and the providers
// that rank below it and can be merged into its records.
const DUPLICATE_LOOKUP_PROVIDERS = ['quillmonitor', 'web3-incidents', 'web3', 'slowmist'];
// Same safety cap as the SlowMist importer, applied per date window.
const MAX_RELATED_ROWS = 500;
// An incremental sync touches a few dates; a full sync spans years and is left
// to the dedupe-incidents backfill rather than issuing hundreds of queries.
const MAX_LOOKUP_WINDOWS = 20;

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

async function authorize(req: Request, url: string, anonKey: string, serviceKey: string): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return false;

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && await timingSafeEqual(token, cronSecret)) return true;
  if (await timingSafeEqual(token, serviceKey)) return true;

  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return false;
  const admin = createClient(url, serviceKey);
  const { data: role } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  return Boolean(role);
}

async function fetchPage(
  apiKey: string,
  page: number,
  limit: number,
  since?: string,
  until?: string,
): Promise<unknown> {
  let lastError = 'Unknown provider error';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    try {
      const response = await fetch(buildQuillMonitorRequestUrl({ page, limit, since, until }), {
        headers: { 'x-api-key': apiKey, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.text();
      if (!response.ok) {
        lastError = `QuillMonitor returned HTTP ${response.status}`;
        if (response.status !== 429 && response.status < 500) throw new Error(lastError);
        continue;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        throw new Error('QuillMonitor returned invalid JSON');
      }
      if (!parsed || typeof parsed !== 'object') throw new Error('QuillMonitor returned an invalid response');
      return parsed;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      lastError = message.startsWith('QuillMonitor returned') ? message : 'QuillMonitor request failed';
      if (attempt === 2 || lastError.includes('HTTP 4')) throw new Error(lastError);
    }
  }
  throw new Error(lastError);
}

type DuplicateLookup = { rows: IncidentRow[]; skippedReason: string | null };

// Loads stored QuillMonitor and lower-priority incident rows within two days
// of any incident in the batch. Never throws: a failed lookup only skips
// merging for this sync, and every row keeps the marks it already has.
async function loadDuplicateCandidates(
  db: SupabaseClient,
  articles: NormalizedQuillMonitorArticle[],
): Promise<DuplicateLookup> {
  const windows = incidentDateWindows(articles.map((article) => String(article.metadata.incident_date)));
  if (windows.length === 0) return { rows: [], skippedReason: null };
  if (windows.length > MAX_LOOKUP_WINDOWS) return { rows: [], skippedReason: 'too_many_date_windows' };

  const rows: IncidentRow[] = [];
  for (const window of windows) {
    const { data, error, count } = await db
      .from('news_articles')
      .select('uid,title,published_at,source_name,metadata,link,source_url,updated_at', { count: 'exact' })
      .gte('published_at', window.from)
      .lt('published_at', window.to)
      .in('metadata->>provider', DUPLICATE_LOOKUP_PROVIDERS)
      .order('published_at', { ascending: true })
      .limit(MAX_RELATED_ROWS);
    if (error) return { rows: [], skippedReason: 'lookup_failed' };
    if (count !== null && count > MAX_RELATED_ROWS) return { rows: [], skippedReason: 'window_over_limit' };
    rows.push(...((data ?? []) as IncidentRow[]));
  }
  return { rows, skippedReason: null };
}

function normalizeSyncCursor(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  const attemptedAt = new Date().toISOString();
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apiKey = Deno.env.get('QUILLMONITOR_API_KEY');
  if (!url || !anonKey || !serviceKey || !apiKey) {
    if (url && serviceKey) {
      await recordIngestionRun(createClient(url, serviceKey), {
        pipeline: 'quillmonitor', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
        success: false, duration_ms: Date.now() - startedAt,
        error_summary: 'Server configuration is incomplete',
      });
    }
    return new Response(JSON.stringify({ error: 'Server configuration is incomplete' }), { status: 500, headers: jsonHeaders });
  }
  if (!await authorize(req, url, anonKey, serviceKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  const rawBody: unknown = await req.json().catch(() => ({}));
  const request = RequestSchema.safeParse(rawBody);
  if (!request.success) {
    return new Response(JSON.stringify({ error: request.error.flatten().fieldErrors }), { status: 400, headers: jsonHeaders });
  }

  try {
    const db = createClient(url, serviceKey);
    const { data: cursorConfig, error: cursorReadError } = request.data.mode === 'auto'
      ? await db.from('app_config').select('value').eq('key', SYNC_CURSOR_KEY).maybeSingle()
      : { data: null, error: null };
    if (cursorReadError) throw new Error('QuillMonitor sync cursor could not be read');

    const storedCursor = cursorConfig ? normalizeSyncCursor(cursorConfig.value) : null;
    if (cursorConfig && !storedCursor) throw new Error('QuillMonitor sync cursor is invalid');
    const isIncremental = Boolean(storedCursor);
    const articlesByUid = new Map<string, NormalizedQuillMonitorArticle>();
    let invalidRecords = 0;
    let recordsFound = 0;
    let pagesFetched = 0;
    let nextPage: number | null = 1;
    let pollUntil: string | null = null;
    let expectedTotalIncidents: number | null = null;
    let expectedTotalPages: number | null = null;
    let verifiedRecords = 0;
    let preliminaryRecords = 0;

    while (nextPage !== null) {
      if (pagesFetched >= request.data.max_pages) {
        throw new Error(`QuillMonitor pagination exceeded the ${request.data.max_pages}-page safety limit`);
      }
      const currentPage = nextPage;
      const rawPayload = await fetchPage(
        apiKey,
        currentPage,
        request.data.page_size,
        storedCursor ?? undefined,
        pollUntil ?? undefined,
      );
      const payload = parseQuillMonitorPage(
        rawPayload,
        currentPage,
        request.data.page_size,
        isIncremental && pagesFetched === 0,
      );
      if (!payload) throw new Error('QuillMonitor response did not match the documented format');

      if (expectedTotalIncidents === null) {
        if (
          isIncremental &&
          (!storedCursor || !payload.syncUntil ||
            !isSafeQuillMonitorSyncWindow(storedCursor, payload.syncUntil))
        ) {
          throw new Error('QuillMonitor returned an unsafe synchronization window');
        }
        expectedTotalIncidents = payload.totalIncidents;
        expectedTotalPages = payload.totalPages;
        pollUntil = payload.syncUntil;
      } else if (
        payload.totalIncidents !== expectedTotalIncidents ||
        payload.totalPages !== expectedTotalPages ||
        (payload.syncUntil !== null && payload.syncUntil !== pollUntil)
      ) {
        throw new Error('QuillMonitor pagination window changed during synchronization');
      }

      recordsFound += payload.data.length;
      for (const value of payload.data) {
        const incident = parseQuillMonitorIncident(value);
        if (!incident) {
          invalidRecords++;
          continue;
        }
        if (incident.verificationStatus === 'verified') verifiedRecords++;
        else preliminaryRecords++;
        const article = normalizeQuillMonitorIncident(incident);
        if (articlesByUid.has(article.uid)) {
          throw new Error('QuillMonitor returned a duplicate incident ID in one synchronization window');
        }
        articlesByUid.set(article.uid, article);
      }
      pagesFetched++;
      nextPage = payload.nextPage;
    }

    if (
      expectedTotalIncidents === null ||
      !hasCompleteQuillMonitorResult(recordsFound, expectedTotalIncidents)
    ) {
      throw new Error('QuillMonitor response count did not match its advertised total');
    }

    const articles = [...articlesByUid.values()];
    // Duplicates are planned for every QuillMonitor row in this sync (not only
    // new ones) because each upsert replaces metadata. First QuillMonitor's own
    // duplicates (same incident listed twice), then the cross-provider merge,
    // where only rows that stay visible can be the canonical record.
    const duplicateLookup = await loadDuplicateCandidates(db, articles);
    const lookupRan = duplicateLookup.skippedReason === null;
    const storedQuillRows = duplicateLookup.rows.filter((row) => rowProvider(row) === 'quillmonitor');
    const storedQuillUids = new Set(storedQuillRows.map((row) => row.uid));
    const quillPlan = planQuillMonitorDuplicates(articles, storedQuillRows);
    const mergePlan = planCanonicalMerges(
      articles.filter((article) => !quillPlan.duplicateOfByUid[article.uid]),
      duplicateLookup.rows.filter((row) => rowProvider(row) !== 'quillmonitor'),
    );
    // Canonical rows go first, so a losing row is marked only once its
    // canonical record exists; until then it keeps the mark it has.
    const writeOrder = lookupRan ? orderCanonicalsFirst(articles, quillPlan.duplicateOfByUid) : articles;
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    const writtenUids = new Set<string>();
    for (let offset = 0; offset < writeOrder.length; offset += DATABASE_BATCH_SIZE) {
      const batch = writeOrder.slice(offset, offset + DATABASE_BATCH_SIZE);
      const uids = batch.map((article) => article.uid);
      // One upsert statement writes the whole chunk, so a canonical row in
      // the same chunk exists by the time its loser's mark does.
      const availableUids = new Set([...storedQuillUids, ...writtenUids, ...uids]);
      const { data: existing, error: readError } = await db
        .from('news_articles')
        .select('uid,summary,metadata')
        .in('uid', uids);
      if (readError) {
        errors.push(`${batch.length} incident lookups failed`);
        continue;
      }
      const existingByUid = new Map(
        ((existing ?? []) as (ExistingQuillMonitorRow & { uid: string })[]).map((row) => [row.uid, row]),
      );
      const writes = batch.map((article) => finalizeQuillMonitorArticle(
        article,
        existingByUid.get(article.uid),
        lookupRan
          ? mergeIncidentSources(
            mergePlan.sourcesByCanonical[article.uid] ?? [],
            quillPlan.sourcesByCanonical[article.uid] ?? [],
          )
          : null,
        lookupRan ? quillMonitorMarkForWrite(article.uid, quillPlan.duplicateOfByUid, availableUids) : null,
      ));
      const { error: writeError } = await db.from('news_articles').upsert(writes, { onConflict: 'uid' });
      if (writeError) {
        errors.push(`${batch.length} incident writes failed`);
        continue;
      }
      for (const uid of uids) writtenUids.add(uid);
      const updatedInBatch = batch.filter((article) => existingByUid.has(article.uid)).length;
      updated += updatedInBatch;
      inserted += batch.length - updatedInBatch;
    }

    // Hide the lower-priority copies only once their QuillMonitor record is
    // stored. A failed mark counts as a persistence error, so the cursor does
    // not advance and the next sync retries it.
    let duplicatesMarked = 0;
    for (const mark of mergePlan.marks) {
      if (!mark.needsWrite || !writtenUids.has(mark.duplicateOfUid)) continue;
      const { error: markError } = await db
        .from('news_articles')
        .update({ metadata: mark.metadata })
        .eq('uid', mark.uid);
      if (markError) errors.push('1 duplicate mark failed');
      else duplicatesMarked++;
    }
    // Stored QuillMonitor rows outside this batch: a losing row's mark, a mark
    // that no longer holds, or a canonical row's sources. Same rule as above:
    // only once the batch rows they depend on are stored. Each write applies
    // only if the row is unchanged since the lookup read it (updated_at is
    // bumped by a trigger); a row changed in between is skipped, not an
    // error, and the next sync recomputes it.
    let quillMonitorDuplicateUpdates = 0;
    let quillMonitorDuplicateSkipped = 0;
    for (const update of lookupRan ? quillPlan.updates : []) {
      if (!update.dependsOn.every((uid) => writtenUids.has(uid))) continue;
      let guarded = db
        .from('news_articles')
        .update({ metadata: update.metadata })
        .eq('uid', update.uid);
      if (update.updatedAt) guarded = guarded.eq('updated_at', update.updatedAt);
      const { data: changed, error: updateError } = await guarded.select('uid');
      if (updateError) errors.push('1 duplicate mark failed');
      else if (!changed || changed.length === 0) quillMonitorDuplicateSkipped++;
      else quillMonitorDuplicateUpdates++;
    }
    const quillMonitorDuplicates = lookupRan
      ? Object.values(quillPlan.duplicateOfByUid).filter(Boolean).length
      : 0;

    let persistenceErrors = errors.reduce((total, error) => total + (Number.parseInt(error, 10) || 1), 0);
    let health = assessQuillMonitorRunHealth(recordsFound, invalidRecords, persistenceErrors, isIncremental);
    const nextSince = isIncremental ? pollUntil : attemptedAt;
    let persistedSince = storedCursor;
    if (health.success && nextSince) {
      const { data: advancedCursor, error: cursorWriteError } = await db.rpc(
        'advance_quillmonitor_sync_cursor',
        { candidate: nextSince },
      );
      persistedSince = normalizeSyncCursor(advancedCursor);
      if (cursorWriteError || !persistedSince) errors.push('1 sync cursor write failed');
      persistenceErrors = errors.reduce((total, error) => total + (Number.parseInt(error, 10) || 1), 0);
      health = assessQuillMonitorRunHealth(recordsFound, invalidRecords, persistenceErrors, isIncremental);
    }
    const categoryCounts = articles.reduce((counts: Record<string, number>, article) => {
      counts[article.category] = (counts[article.category] || 0) + 1;
      return counts;
    }, {});
    console.log(`[fetch-quillmonitor-incidents] pages=${pagesFetched} found=${recordsFound} normalized=${articles.length} inserted=${inserted} updated=${updated} duplicates_marked=${duplicatesMarked} quillmonitor_duplicates=${quillMonitorDuplicates} quillmonitor_duplicate_updates=${quillMonitorDuplicateUpdates} quillmonitor_duplicate_skipped=${quillMonitorDuplicateSkipped} merge_lookup=${duplicateLookup.skippedReason ?? 'ok'} invalid=${invalidRecords} persistence_errors=${persistenceErrors} healthy=${health.success}`);
    await recordIngestionRun(db, {
      pipeline: 'quillmonitor', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
      success: health.success, records_found: recordsFound, records_inserted: inserted,
      records_updated: updated, records_invalid: invalidRecords + persistenceErrors,
      duration_ms: Date.now() - startedAt,
      error_summary: health.errorSummary,
      metadata: {
        pages_fetched: pagesFetched,
        poll_mode: isIncremental ? 'incremental' : 'full',
        cursor_advanced: health.success,
        next_since: health.success ? persistedSince : storedCursor,
        records_accepted: articles.length,
        verified_records: verifiedRecords,
        preliminary_records: preliminaryRecords,
        validation_rejection_ratio: Number(health.invalidRatio.toFixed(4)),
        persistence_errors: persistenceErrors,
        duplicates_marked: duplicatesMarked,
        duplicate_candidates: duplicateLookup.rows.length,
        quillmonitor_duplicates: quillMonitorDuplicates,
        quillmonitor_duplicate_updates: quillMonitorDuplicateUpdates,
        quillmonitor_duplicate_skipped: quillMonitorDuplicateSkipped,
        merge_lookup: duplicateLookup.skippedReason ?? 'ok',
        taxonomy_version: articles[0]?.metadata.taxonomy_version || null,
        category_counts: categoryCounts,
      },
    });
    // Newly hidden duplicates also need the poster, so it can edit any post
    // about them to point at the primary incident.
    if (health.success && inserted + updated + duplicatesMarked + quillMonitorDuplicateUpdates > 0) {
      // Post new or changed incidents to Telegram right away instead of waiting
      // for the poster's own half-hour schedule. The poster claims each post
      // before sending, so overlapping with its cron run cannot double-post.
      const trigger = fetch(`${url}/functions/v1/post-telegram-alerts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: '{}',
      }).then((response) => response.body?.cancel()).catch(() => {
        console.warn('[fetch-quillmonitor-incidents] Telegram trigger failed');
      });
      (globalThis as { EdgeRuntime?: { waitUntil(promise: Promise<unknown>): void } }).EdgeRuntime?.waitUntil(trigger);
    }
    return new Response(JSON.stringify({
      success: health.success,
      recordsFound,
      incidentsFound: articles.length,
      incidentsInserted: inserted,
      incidentsUpdated: updated,
      duplicatesMarked,
      quillMonitorDuplicates,
      quillMonitorDuplicateUpdates,
      quillMonitorDuplicateSkipped,
      mergeLookup: duplicateLookup.skippedReason ?? 'ok',
      invalidRecords,
      pagesFetched,
      pollMode: isIncremental ? 'incremental' : 'full',
      cursorAdvanced: health.success,
      verifiedRecords,
      preliminaryRecords,
      errors: errors.length ? errors.slice(0, 10) : undefined,
    }), { status: health.success ? 200 : 207, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'QuillMonitor synchronization failed';
    console.error(`[fetch-quillmonitor-incidents] ${message}`);
    await recordIngestionRun(createClient(url, serviceKey), {
      pipeline: 'quillmonitor', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
      success: false, duration_ms: Date.now() - startedAt,
      error_summary: message,
    });
    return new Response(JSON.stringify({ success: false, error: message }), { status: 502, headers: jsonHeaders });
  }
});
