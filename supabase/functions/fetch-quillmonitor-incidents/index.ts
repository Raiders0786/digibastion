import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { z } from 'npm:zod@3.23.8';
import {
  assessQuillMonitorRunHealth,
  buildQuillMonitorRequestUrl,
  hasCompleteQuillMonitorResult,
  isSafeQuillMonitorSyncWindow,
  normalizeQuillMonitorIncident,
  parseQuillMonitorPage,
  parseQuillMonitorIncident,
  type NormalizedQuillMonitorArticle,
} from '../_shared/quillmonitor.ts';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';

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
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    for (let offset = 0; offset < articles.length; offset += DATABASE_BATCH_SIZE) {
      const batch = articles.slice(offset, offset + DATABASE_BATCH_SIZE);
      const uids = batch.map((article) => article.uid);
      const { data: existing, error: readError } = await db.from('news_articles').select('uid').in('uid', uids);
      if (readError) {
        errors.push(`${batch.length} incident lookups failed`);
        continue;
      }
      const existingUids = new Set((existing ?? []).map((article) => article.uid));
      const { error: writeError } = await db.from('news_articles').upsert(batch, { onConflict: 'uid' });
      if (writeError) {
        errors.push(`${batch.length} incident writes failed`);
        continue;
      }
      const updatedInBatch = batch.filter((article) => existingUids.has(article.uid)).length;
      updated += updatedInBatch;
      inserted += batch.length - updatedInBatch;
    }

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
    console.log(`[fetch-quillmonitor-incidents] pages=${pagesFetched} found=${recordsFound} normalized=${articles.length} inserted=${inserted} updated=${updated} invalid=${invalidRecords} persistence_errors=${persistenceErrors} healthy=${health.success}`);
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
        taxonomy_version: articles[0]?.metadata.taxonomy_version || null,
        category_counts: categoryCounts,
      },
    });
    return new Response(JSON.stringify({
      success: health.success,
      recordsFound,
      incidentsFound: articles.length,
      incidentsInserted: inserted,
      incidentsUpdated: updated,
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
