import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { z } from 'npm:zod@3.23.8';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
import {
  hasCompleteSlowMistPage,
  isHighConfidenceSlowMistDuplicate,
  normalizeSlowMistIncident,
  parseSlowMistPage,
  slowMistRecordNeedsWrite,
  slowMistTargetFromTitle,
  SLOWMIST_EXPECTED_PAGE_SIZE,
  SLOWMIST_PAGE_URL,
  type NormalizedSlowMistArticle,
  type SlowMistDuplicateCandidate,
} from '../_shared/slowmist.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const RequestSchema = z.object({}).strict();
const DATABASE_BATCH_SIZE = 50;
const MAX_RESPONSE_BYTES = 750_000;
const FETCH_TIMEOUT_MS = 15_000;
const CANONICAL_PROVIDERS = new Set(['quillmonitor', 'web3-incidents', 'web3']);
const MAX_RELATED_ROWS = 500;

type ExistingIncidentRow = {
  uid: string;
  title: string;
  published_at: string;
  source_name: string | null;
  metadata: unknown;
};

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

async function readBoundedText(response: Response): Promise<string> {
  const advertisedLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(advertisedLength) && advertisedLength > MAX_RESPONSE_BYTES) {
    throw new Error('SlowMist response exceeded the size limit');
  }
  if (!response.body) throw new Error('SlowMist returned an empty response');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_RESPONSE_BYTES) throw new Error('SlowMist response exceeded the size limit');
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return body;
  } finally {
    reader.releaseLock();
  }
}

async function fetchSlowMistPage(): Promise<string> {
  let lastError = 'SlowMist request failed';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    try {
      const response = await fetch(SLOWMIST_PAGE_URL, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'DigiBastion-ThreatIntel/1.0 (+https://www.digibastion.com)',
        },
        redirect: 'error',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        lastError = `SlowMist returned HTTP ${response.status}`;
        if (response.status !== 429 && response.status < 500) throw new Error(lastError);
        continue;
      }
      const contentType = response.headers.get('content-type')?.toLowerCase() || '';
      if (!contentType.includes('text/html')) throw new Error('SlowMist returned an unsupported content type');
      return await readBoundedText(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      lastError = message.startsWith('SlowMist returned') || message.startsWith('SlowMist response')
        ? message
        : 'SlowMist request failed';
      if (attempt === 2 || lastError.includes('HTTP 4') || lastError.includes('unsupported content type')) {
        throw new Error(lastError);
      }
    }
  }
  throw new Error(lastError);
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function rowDuplicateCandidate(row: ExistingIncidentRow): SlowMistDuplicateCandidate | null {
  const metadata = metadataRecord(row.metadata);
  const metadataTarget = typeof metadata.project_name === 'string' ? metadata.project_name.trim() : '';
  const target = metadataTarget || slowMistTargetFromTitle(row.title);
  const metadataDate = typeof metadata.incident_date === 'string' ? metadata.incident_date : '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(metadataDate)
    ? metadataDate
    : row.published_at?.slice(0, 10);
  if (!target || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    target,
    date,
    attackMethod: typeof metadata.attack_type === 'string' ? metadata.attack_type : null,
    amountInUsd: typeof metadata.amount_lost_usd === 'number' && Number.isFinite(metadata.amount_lost_usd)
      ? metadata.amount_lost_usd
      : null,
    reference: typeof metadata.reference_url === 'string' ? metadata.reference_url : null,
  };
}

function rowProvider(row: ExistingIncidentRow): string {
  const provider = metadataRecord(row.metadata).provider;
  if (typeof provider === 'string') return provider.trim().toLowerCase();
  return row.source_name?.trim().toLowerCase() === 'slowmist hacked' ? 'slowmist' : '';
}

function canonicalPriority(row: ExistingIncidentRow): number {
  const provider = rowProvider(row);
  if (provider === 'quillmonitor') return 0;
  if (provider === 'web3-incidents' || provider === 'web3') return 1;
  return 2;
}

function pickCanonical(current: ExistingIncidentRow | undefined, candidate: ExistingIncidentRow): ExistingIncidentRow {
  if (!current) return candidate;
  const priorityDifference = canonicalPriority(candidate) - canonicalPriority(current);
  if (priorityDifference < 0) return candidate;
  if (priorityDifference > 0) return current;
  return candidate.uid.localeCompare(current.uid) < 0 ? candidate : current;
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString();
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  const attemptedAt = new Date().toISOString();
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) {
    if (url && serviceKey) {
      await recordIngestionRun(createClient(url, serviceKey), {
        pipeline: 'slowmist', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
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

  if (Deno.env.get('SLOWMIST_INGESTION_ENABLED') !== 'true') {
    return new Response(JSON.stringify({
      success: false,
      error: 'SlowMist ingestion is disabled pending reuse permission',
    }), { status: 503, headers: jsonHeaders });
  }

  try {
    const db = createClient(url, serviceKey);
    const html = await fetchSlowMistPage();
    const parsed = parseSlowMistPage(html);
    if (!hasCompleteSlowMistPage(parsed)) {
      throw new Error('SlowMist page did not contain the expected 20 valid incidents');
    }

    const normalized = await Promise.all(
      parsed.incidents.map((incident) => normalizeSlowMistIncident(incident, attemptedAt)),
    );
    if (new Set(normalized.map((article) => article.uid)).size !== normalized.length) {
      throw new Error('SlowMist page contained duplicate incident identities');
    }

    const incidentDates = normalized.map((article) => String(article.metadata.incident_date));
    const minimumDate = incidentDates.reduce((minimum, date) => date < minimum ? date : minimum);
    const maximumDate = incidentDates.reduce((maximum, date) => date > maximum ? date : maximum);
    const { data: relatedRows, error: relatedReadError, count: relatedCount } = await db
      .from('news_articles')
      .select('uid,title,published_at,source_name,metadata', { count: 'exact' })
      .gte('published_at', shiftDate(minimumDate, -2))
      .lt('published_at', shiftDate(maximumDate, 3))
      .or('metadata->>is_web3_incident.eq.true,metadata->>provider.in.(quillmonitor,web3-incidents,web3,slowmist)')
      .limit(MAX_RELATED_ROWS);
    if (relatedReadError) throw new Error('Existing incident matches could not be read');
    if (relatedCount !== null && relatedCount > MAX_RELATED_ROWS) {
      throw new Error('Existing incident match window exceeded the safety limit');
    }

    const existingRows = (relatedRows ?? []) as ExistingIncidentRow[];
    const existingSlowMistUids = new Set(
      existingRows.filter((row) => rowProvider(row) === 'slowmist').map((row) => row.uid),
    );
    const existingSlowMistByUid = new Map(
      existingRows.filter((row) => rowProvider(row) === 'slowmist').map((row) => [row.uid, row]),
    );
    const canonicalRows: ExistingIncidentRow[] = [];
    for (const row of existingRows) {
      const provider = rowProvider(row);
      if (!CANONICAL_PROVIDERS.has(provider)) continue;
      if (metadataRecord(row.metadata).classification_relevant === false) continue;
      if (!rowDuplicateCandidate(row)) continue;
      canonicalRows.push(row);
    }

    const articles: NormalizedSlowMistArticle[] = [];
    let crossProviderDuplicatesSkipped = 0;
    let existingDuplicatesSuppressed = 0;
    let unchangedRecords = 0;
    for (let index = 0; index < normalized.length; index++) {
      const article = normalized[index];
      const metadata = metadataRecord(article.metadata);
      const incident = parsed.incidents[index];
      let canonical: ExistingIncidentRow | undefined;
      for (const row of canonicalRows) {
        const candidate = rowDuplicateCandidate(row);
        if (candidate && isHighConfidenceSlowMistDuplicate(incident, candidate)) {
          canonical = pickCanonical(canonical, row);
        }
      }
      const existing = existingSlowMistByUid.get(article.uid);
      if (canonical && !existing) {
        crossProviderDuplicatesSkipped++;
        continue;
      }

      const desired = canonical
        ? {
          ...article,
          metadata: {
            ...article.metadata,
            classification_relevant: false,
            duplicate_of_uid: canonical.uid,
          },
        }
        : article;
      if (!existing) {
        articles.push(desired);
        continue;
      }

      const existingMetadata = metadataRecord(existing.metadata);
      if (!slowMistRecordNeedsWrite(existingMetadata, metadata, canonical?.uid ?? null)) {
        unchangedRecords++;
        continue;
      }
      articles.push(desired);
      if (canonical) existingDuplicatesSuppressed++;
    }

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    for (let offset = 0; offset < articles.length; offset += DATABASE_BATCH_SIZE) {
      const batch = articles.slice(offset, offset + DATABASE_BATCH_SIZE);
      const { error: writeError } = await db.from('news_articles').upsert(batch, { onConflict: 'uid' });
      if (writeError) {
        errors.push(`${batch.length} incident writes failed`);
        continue;
      }
      const updatedInBatch = batch.filter((article) => existingSlowMistUids.has(article.uid)).length;
      updated += updatedInBatch;
      inserted += batch.length - updatedInBatch;
    }

    const persistenceErrors = errors.reduce(
      (total, error) => total + (Number.parseInt(error, 10) || 1),
      0,
    );
    const success = persistenceErrors === 0;
    const categoryCounts = articles.reduce((counts: Record<string, number>, article) => {
      counts[article.category] = (counts[article.category] || 0) + 1;
      return counts;
    }, {});
    const recordsAccepted = normalized.length - crossProviderDuplicatesSkipped;
    console.log(`[fetch-slowmist-incidents] page=1 found=${parsed.recordsFound} accepted=${recordsAccepted} writes=${articles.length} unchanged=${unchangedRecords} inserted=${inserted} updated=${updated} cross_provider_skipped=${crossProviderDuplicatesSkipped} existing_suppressed=${existingDuplicatesSuppressed} persistence_errors=${persistenceErrors} healthy=${success}`);
    await recordIngestionRun(db, {
      pipeline: 'slowmist', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
      success, records_found: parsed.recordsFound, records_inserted: inserted,
      records_updated: updated, records_invalid: persistenceErrors,
      duration_ms: Date.now() - startedAt,
      error_summary: success ? undefined : `${persistenceErrors} incident persistence operations failed`,
      metadata: {
        page: 1,
        expected_records: SLOWMIST_EXPECTED_PAGE_SIZE,
        records_accepted: recordsAccepted,
        records_written: articles.length,
        records_unchanged: unchangedRecords,
        cross_provider_duplicates_skipped: crossProviderDuplicatesSkipped,
        existing_duplicates_suppressed: existingDuplicatesSuppressed,
        similar_skipped: crossProviderDuplicatesSkipped + existingDuplicatesSuppressed,
        persistence_errors: persistenceErrors,
        taxonomy_version: articles[0]?.metadata.taxonomy_version || null,
        category_counts: categoryCounts,
      },
    });
    return new Response(JSON.stringify({
      success,
      recordsFound: parsed.recordsFound,
      incidentsAccepted: recordsAccepted,
      incidentsWritten: articles.length,
      incidentsUnchanged: unchangedRecords,
      incidentsInserted: inserted,
      incidentsUpdated: updated,
      crossProviderDuplicatesSkipped,
      existingDuplicatesSuppressed,
      errors: errors.length ? errors.slice(0, 10) : undefined,
    }), { status: success ? 200 : 207, headers: jsonHeaders });
  } catch (error) {
    const knownMessage = error instanceof Error && error.message.startsWith('SlowMist')
      ? error.message
      : error instanceof Error && error.message.startsWith('Existing incident')
      ? error.message
      : 'SlowMist synchronization failed';
    console.error(`[fetch-slowmist-incidents] ${knownMessage}`);
    await recordIngestionRun(createClient(url, serviceKey), {
      pipeline: 'slowmist', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
      success: false, duration_ms: Date.now() - startedAt,
      error_summary: knownMessage,
    });
    return new Response(JSON.stringify({ success: false, error: knownMessage }), { status: 502, headers: jsonHeaders });
  }
});
