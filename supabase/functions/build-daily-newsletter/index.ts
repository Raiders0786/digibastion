import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { buildDailyBriefContent, dailyIssuePeriod } from '../_shared/daily-brief.ts';
import { readIncidentFields } from '../_shared/incident-fields.ts';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
import {
  statusChangeItem,
  toNewsletterItem,
  type DailyBriefContent,
  type NewsletterItem,
  type NewsletterSourceRow,
  type StatusChange,
} from '../_shared/newsletter-content.ts';

// Builds the shared daily brief for one UTC day (cron 00:05 UTC) into
// newsletter_issues. send-newsletters filters it per subscriber at their
// local hour. An issue that has already gone out to anyone is never rebuilt.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://www.digibastion.com';
const DAY_MS = 86_400_000;
const RECENT_LIMIT = 500;
const UNCONFIRMED_LIMIT = 50;
const UNCONFIRMED_LOOKBACK_MS = 7 * DAY_MS;
const STATUS_EVENT_LIMIT = 500;
const CHUNK = 100;
const ARTICLE_COLUMNS = 'id, uid, title, summary, severity, category, link, source_name, cve_id, tags, affected_technologies, created_at, metadata';
const REBUILDABLE_STATUSES = ['draft', 'ready', 'failed'];

type Db = SupabaseClient;
type Principal = { kind: 'cron' | 'service' } | { kind: 'admin'; email: string | null };

class HttpError extends Error {
  constructor(readonly status: number, message: string, readonly reason?: string) {
    super(message);
  }
}

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

function chunks<T>(values: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < values.length; index += size) out.push(values.slice(index, index + size));
  return out;
}

function metadataOf(row: { metadata: unknown }): Record<string, unknown> {
  return row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : {};
}

/** Not a merged duplicate and not flagged irrelevant by the classifier. */
function isDeliverableRow(row: NewsletterSourceRow): boolean {
  const metadata = metadataOf(row);
  return metadata.classification_relevant !== false && !readIncidentFields(metadata).duplicateOfUid;
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
}

async function loadRecent(db: Db, start: string, end: string): Promise<NewsletterItem[]> {
  const { data, error } = await db
    .from('news_articles')
    .select(ARTICLE_COLUMNS)
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })
    .limit(RECENT_LIMIT);
  if (error) throw new Error('Recent articles could not be read');
  return ((data ?? []) as NewsletterSourceRow[]).filter(isDeliverableRow).map((row) => toNewsletterItem(row, SITE_URL));
}

async function loadStillUnconfirmed(db: Db, end: string): Promise<NewsletterItem[]> {
  const since = new Date(Date.parse(end) - UNCONFIRMED_LOOKBACK_MS).toISOString();
  const { data, error } = await db
    .from('news_articles')
    .select(ARTICLE_COLUMNS)
    .eq('metadata->>is_web3_incident', 'true')
    .eq('metadata->>verification_status', 'unverified')
    .gt('created_at', since)
    .lt('created_at', end)
    .order('created_at', { ascending: false })
    .limit(UNCONFIRMED_LIMIT);
  if (error) throw new Error('Unconfirmed incidents could not be read');
  return ((data ?? []) as NewsletterSourceRow[]).filter(isDeliverableRow).map((row) => toNewsletterItem(row, SITE_URL));
}

/**
 * The day's incident_status_events. Confirmed and revised changes show the
 * record as it is now, and are dropped when it has since been merged into
 * another record or flagged irrelevant (a retraction event covers the
 * latter). Retractions show the snapshot of the row as it was.
 */
async function loadStatusChanges(db: Db, start: string, end: string): Promise<StatusChange[]> {
  const { data, error } = await db
    .from('incident_status_events')
    .select('article_uid, kind, snapshot, previous_amount_usd, amount_usd, created_at')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: true })
    .limit(STATUS_EVENT_LIMIT);
  if (error) throw new Error('Incident status events could not be read');
  const events = data ?? [];

  const uids = [...new Set(events.filter((event) => event.kind !== 'retracted').map((event) => String(event.article_uid)))];
  const current = new Map<string, NewsletterSourceRow>();
  for (const batch of chunks(uids)) {
    const { data: rows, error: rowsError } = await db.from('news_articles').select(ARTICLE_COLUMNS).in('uid', batch);
    if (rowsError) throw new Error('Changed articles could not be read');
    for (const row of (rows ?? []) as NewsletterSourceRow[]) current.set(row.uid, row);
  }

  const changes: StatusChange[] = [];
  for (const event of events) {
    const uid = String(event.article_uid);
    const kind = event.kind as StatusChange['change'];
    if (kind !== 'confirmed' && kind !== 'revised' && kind !== 'retracted') continue;
    let item: NewsletterItem;
    if (kind === 'retracted') {
      item = statusChangeItem(event.snapshot, uid, SITE_URL);
    } else {
      const row = current.get(uid);
      if (row && !isDeliverableRow(row)) continue;
      item = row ? toNewsletterItem(row, SITE_URL) : statusChangeItem(event.snapshot, uid, SITE_URL);
    }
    changes.push({
      change: kind,
      at: String(event.created_at),
      item,
      previousAmountUsd: numberOrNull(event.previous_amount_usd),
      amountUsd: numberOrNull(event.amount_usd),
    });
  }
  return changes;
}

async function countSends(db: Db, issueId: string): Promise<number> {
  const { count, error } = await db
    .from('email_sends')
    .select('id', { count: 'exact', head: true })
    .eq('issue_id', issueId);
  if (error) throw new Error('email_sends could not be counted');
  return count ?? 0;
}

function summarize(content: DailyBriefContent) {
  return {
    incidents: content.incidents.length,
    unconfirmed: content.unconfirmed.length,
    status_changes: content.statusChanges.length,
    vulnerabilities: content.vulnerabilities.length,
    action: content.action.id,
  };
}

/** Writes the issue unless it has gone out; returns the issue id. */
async function saveIssue(db: Db, content: DailyBriefContent, force: boolean, now: Date): Promise<{ id: string; rebuilt: boolean } | { skipped: string; id: string }> {
  const { data: existing, error } = await db
    .from('newsletter_issues')
    .select('id, status')
    .eq('kind', 'daily')
    .eq('period_start', content.periodStart)
    .maybeSingle();
  if (error) throw new Error('newsletter_issues could not be read');

  const values = {
    period_end: content.periodEnd,
    status: 'ready',
    content,
    error: null,
    generated_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  if (!existing) {
    const { data: inserted, error: insertError } = await db
      .from('newsletter_issues')
      .insert({ kind: 'daily', period_start: content.periodStart, ...values })
      .select('id')
      .single();
    if (insertError || !inserted) throw new HttpError(409, 'The issue was created by another run', 'concurrent_build');
    return { id: String(inserted.id), rebuilt: false };
  }

  const id = String(existing.id);
  if (await countSends(db, id) > 0 || existing.status === 'sent') {
    throw new HttpError(409, 'This issue has already been sent and cannot be rebuilt', 'already_sent');
  }
  if (existing.status === 'ready' && !force) return { skipped: 'already_built', id };

  // Guarded by status: the sender marks the issue sent after its first send.
  const { data: updated, error: updateError } = await db
    .from('newsletter_issues')
    .update(values)
    .eq('id', id)
    .in('status', REBUILDABLE_STATUSES)
    .select('id');
  if (updateError) throw new Error('newsletter_issues could not be updated');
  if (!updated || updated.length === 0) throw new HttpError(409, 'This issue has already been sent and cannot be rebuilt', 'already_sent');
  return { id, rebuilt: true };
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
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
    }
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const startedAt = Date.now();
  const now = new Date(startedAt);
  const today = now.toISOString().slice(0, 10);
  const issueDate = body.issueDate === undefined ? today : body.issueDate;
  if (typeof issueDate !== 'string') return json({ error: 'issueDate must be YYYY-MM-DD' }, 400);
  const period = dailyIssuePeriod(issueDate);
  if (!period) return json({ error: 'issueDate must be YYYY-MM-DD' }, 400);
  // The day the issue covers must be over: an issue for a later date would be built from a partial day.
  if (issueDate > today) return json({ error: 'issueDate cannot be in the future' }, 400);
  const force = body.force === true;
  const dryRun = body.dryRun === true;

  const db = createClient(supabaseUrl, serviceKey);
  let recordsFound = 0;
  try {
    const [recent, stillUnconfirmed, statusChanges] = await Promise.all([
      loadRecent(db, period.periodStart, period.periodEnd),
      loadStillUnconfirmed(db, period.periodEnd),
      loadStatusChanges(db, period.periodStart, period.periodEnd),
    ]);
    recordsFound = recent.length + stillUnconfirmed.length + statusChanges.length;
    const content = buildDailyBriefContent({ issueDate, ...period, recent, stillUnconfirmed, statusChanges });
    const counts = summarize(content);

    if (dryRun) return json({ success: true, dryRun: true, issueDate, ...counts });

    const saved = await saveIssue(db, content, force, now);
    const metadata = { issue_date: issueDate, issue_id: saved.id, ...counts, ...('skipped' in saved ? { skipped: saved.skipped } : { rebuilt: saved.rebuilt }) };
    await recordIngestionRun(db, {
      pipeline: 'newsletter-build',
      attempted_at: now.toISOString(),
      completed_at: new Date().toISOString(),
      success: true,
      records_found: recordsFound,
      records_inserted: 'skipped' in saved || saved.rebuilt ? 0 : 1,
      records_updated: 'skipped' in saved ? 0 : saved.rebuilt ? 1 : 0,
      duration_ms: Date.now() - startedAt,
      metadata: { kind: 'daily', ...metadata },
    });
    return json({ success: true, issueDate, issueId: saved.id, ...counts, ...('skipped' in saved ? { skipped: saved.skipped } : { rebuilt: saved.rebuilt }) });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[build-daily-newsletter]', message);
    if (!dryRun) {
      await recordIngestionRun(db, {
        pipeline: 'newsletter-build',
        attempted_at: now.toISOString(),
        completed_at: new Date().toISOString(),
        // Refusing to rebuild a sent issue is the guard working, not a pipeline failure.
        success: status === 409,
        records_found: recordsFound,
        duration_ms: Date.now() - startedAt,
        ...(status === 409 ? {} : { error_summary: message }),
        metadata: { kind: 'daily', issue_date: issueDate, ...(error instanceof HttpError && error.reason ? { refused: error.reason } : {}) },
      });
    }
    return json({ success: false, error: status === 409 ? message : 'Daily brief build failed' }, status);
  }
});
