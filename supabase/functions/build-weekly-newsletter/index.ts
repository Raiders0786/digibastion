import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { readIncidentFields } from '../_shared/incident-fields.ts';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
import { toNewsletterItem, type NewsletterItem, type NewsletterSourceRow, type WeeklyIssueContent } from '../_shared/newsletter-content.ts';
import {
  buildWeeklyGroundedInput,
  buildWeeklyPrompt,
  parseWeeklyModelOutput,
  requestWeeklyCompletion,
  resolveWeeklyModel,
} from '../_shared/weekly-ai.ts';
import { assembleWeeklyContent, selectWeeklyUpdates } from '../_shared/weekly-content.ts';
import {
  computeWeeklyTotals,
  selectTopIncidents,
  selectWeeklyVulnerabilities,
  weeklyCountedIncidents,
  weeklyPeriod,
} from '../_shared/weekly-stats.ts';
import { SITE_URL } from '../_shared/site-urls.ts';

// Builds the shared weekly deep-dive (cron Monday 00:10 UTC) for the previous
// Monday to Sunday into newsletter_issues. Figures come from code; the model
// (only when WEEKLY_AI_ENABLED is "true") writes placeholder prose that the
// validator accepts or replaces with templates. The input, prompt, raw output
// and every validation decision are archived in content.archive. An issue that
// has already gone out to anyone is never rebuilt.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const INCIDENT_LIMIT = 1000;
const VULNERABILITY_QUERY_LIMIT = 500;
const WEEK_RECORDS_LIMIT = 1000;
const KNOWN_PROJECTS_LIMIT = 5000;
const KNOWN_PROJECTS_LOOKBACK_MS = 365 * DAY_MS;
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

function metadataOf(row: { metadata: unknown }): Record<string, unknown> {
  return row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : {};
}

/** Not a merged duplicate and not flagged irrelevant by the classifier. */
function isDeliverableRow(row: NewsletterSourceRow): boolean {
  const metadata = metadataOf(row);
  return metadata.classification_relevant !== false && !readIncidentFields(metadata).duplicateOfUid;
}

const toItems = (rows: NewsletterSourceRow[]) => rows.filter(isDeliverableRow).map((row) => toNewsletterItem(row, SITE_URL));

/** The Monday before the current UTC week's Monday. */
function defaultWeekStart(now: Date): string {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const currentMonday = today - ((now.getUTCDay() + 6) % 7) * DAY_MS;
  return new Date(currentMonday - WEEK_MS).toISOString().slice(0, 10);
}

async function loadIncidents(db: Db, start: string, end: string): Promise<NewsletterItem[]> {
  const { data, error } = await db
    .from('news_articles')
    .select(ARTICLE_COLUMNS)
    .eq('metadata->>is_web3_incident', 'true')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })
    .limit(INCIDENT_LIMIT);
  if (error) throw new Error('Weekly incidents could not be read');
  return toItems((data ?? []) as NewsletterSourceRow[]).filter((entry) => entry.isWeb3Incident);
}

async function loadVulnerabilities(db: Db, start: string, end: string): Promise<NewsletterItem[]> {
  const { data, error } = await db
    .from('news_articles')
    .select(ARTICLE_COLUMNS)
    .in('severity', ['critical', 'high'])
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })
    .limit(VULNERABILITY_QUERY_LIMIT);
  if (error) throw new Error('Weekly vulnerabilities could not be read');
  return selectWeeklyVulnerabilities(toItems((data ?? []) as NewsletterSourceRow[]));
}

/** Every deliverable record of the week, for each subscriber's "More this week". */
async function loadWeekRecords(db: Db, start: string, end: string): Promise<NewsletterItem[]> {
  const { data, error } = await db
    .from('news_articles')
    .select(ARTICLE_COLUMNS)
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })
    .limit(WEEK_RECORDS_LIMIT);
  if (error) throw new Error('Weekly records could not be read');
  return toItems((data ?? []) as NewsletterSourceRow[]);
}

async function loadKnownProjectNames(db: Db, now: Date): Promise<string[]> {
  const { data, error } = await db
    .from('news_articles')
    .select('project_name:metadata->>project_name')
    .not('metadata->>project_name', 'is', null)
    .gt('created_at', new Date(now.getTime() - KNOWN_PROJECTS_LOOKBACK_MS).toISOString())
    .order('created_at', { ascending: false })
    .limit(KNOWN_PROJECTS_LIMIT);
  if (error) throw new Error('Known project names could not be read');
  const names = new Set<string>();
  for (const row of (data ?? []) as { project_name: unknown }[]) {
    if (typeof row.project_name === 'string' && row.project_name.trim()) names.add(row.project_name.trim().slice(0, 200));
  }
  return [...names];
}

async function countSends(db: Db, issueId: string): Promise<number> {
  const { count, error } = await db
    .from('email_sends')
    .select('id', { count: 'exact', head: true })
    .eq('issue_id', issueId);
  if (error) throw new Error('email_sends could not be counted');
  return count ?? 0;
}

type Existing = { id: string; status: string } | null;

/** The stored issue for the week; refuses (409) when it has gone out to anyone. */
async function loadExisting(db: Db, periodStart: string): Promise<Existing> {
  const { data, error } = await db
    .from('newsletter_issues')
    .select('id, status')
    .eq('kind', 'weekly')
    .eq('period_start', periodStart)
    .maybeSingle();
  if (error) throw new Error('newsletter_issues could not be read');
  if (!data) return null;
  const existing = { id: String(data.id), status: String(data.status) };
  if (existing.status === 'sent' || await countSends(db, existing.id) > 0) {
    throw new HttpError(409, 'This issue has already been sent and cannot be rebuilt', 'already_sent');
  }
  return existing;
}

async function saveIssue(db: Db, existing: Existing, content: WeeklyIssueContent, period: { periodStart: string; periodEnd: string }, now: Date) {
  const values = {
    period_end: period.periodEnd,
    status: 'ready',
    content,
    error: null,
    generated_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
  if (!existing) {
    const { data, error } = await db
      .from('newsletter_issues')
      .insert({ kind: 'weekly', period_start: period.periodStart, ...values })
      .select('id')
      .single();
    if (error || !data) throw new HttpError(409, 'The issue was created by another run', 'concurrent_build');
    return { id: String(data.id), rebuilt: false };
  }
  // Guarded by status: the sender marks the issue sent after its first send.
  const { data, error } = await db
    .from('newsletter_issues')
    .update(values)
    .eq('id', existing.id)
    .in('status', REBUILDABLE_STATUSES)
    .select('id');
  if (error) throw new Error('newsletter_issues could not be updated');
  if (!data || data.length === 0) throw new HttpError(409, 'This issue has already been sent and cannot be rebuilt', 'already_sent');
  return { id: existing.id, rebuilt: true };
}

function paragraphCounts(content: WeeklyIssueContent) {
  const paragraphs = [...content.top.flatMap((entry) => [entry.what, entry.action]), content.trends, content.vulnerabilities.summary];
  const ai = paragraphs.filter((paragraph) => paragraph.origin === 'ai').length;
  return { paragraphs_ai: ai, paragraphs_template: paragraphs.length - ai };
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
  const weekStart = body.weekStart === undefined ? defaultWeekStart(now) : body.weekStart;
  if (typeof weekStart !== 'string') return json({ error: 'weekStart must be a Monday (YYYY-MM-DD)' }, 400);
  const period = weeklyPeriod(weekStart);
  if (!period) return json({ error: 'weekStart must be a Monday (YYYY-MM-DD)' }, 400);
  // The week must be over: an issue built mid-week would miss incidents.
  if (Date.parse(period.periodEnd) > now.getTime()) return json({ error: 'The week has not ended yet' }, 400);
  const force = body.force === true;
  const dryRun = body.dryRun === true;

  const db = createClient(supabaseUrl, serviceKey);
  let recordsFound = 0;
  try {
    const existing = dryRun ? null : await loadExisting(db, period.periodStart);
    // Skip before any model call: a ready issue is rebuilt only on request.
    if (existing && existing.status === 'ready' && !force) {
      await recordIngestionRun(db, {
        pipeline: 'newsletter-build',
        attempted_at: now.toISOString(),
        completed_at: new Date().toISOString(),
        success: true,
        duration_ms: Date.now() - startedAt,
        metadata: { kind: 'weekly', week_start: weekStart, issue_id: existing.id, skipped: 'already_built' },
      });
      return json({ success: true, weekStart, issueId: existing.id, skipped: 'already_built' });
    }

    const previousStart = new Date(Date.parse(period.periodStart) - WEEK_MS).toISOString();
    const [thisWeek, previousWeek, vulnerabilities, knownProjectNames, weekRecords] = await Promise.all([
      loadIncidents(db, period.periodStart, period.periodEnd),
      loadIncidents(db, previousStart, period.periodStart),
      loadVulnerabilities(db, period.periodStart, period.periodEnd),
      loadKnownProjectNames(db, now),
      loadWeekRecords(db, period.periodStart, period.periodEnd),
    ]);
    recordsFound = thisWeek.length + previousWeek.length + vulnerabilities.length;

    const totals = computeWeeklyTotals({ weekStart, thisWeek, previousWeek });
    const top = selectTopIncidents(weeklyCountedIncidents(weekStart, thisWeek));
    const prompt = buildWeeklyPrompt(buildWeeklyGroundedInput({ weekStart, totals, top, vulnerabilities }));

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiEnabled = Deno.env.get('WEEKLY_AI_ENABLED') === 'true' && Boolean(apiKey);
    const model = aiEnabled ? resolveWeeklyModel(Deno.env.get('WEEKLY_AI_MODEL')) : null;
    let rawOutput: string | null = null;
    let aiError: string | null = null;
    let modelOutput = null;
    if (aiEnabled && model && apiKey) {
      if (top.length === 0 && vulnerabilities.length === 0) {
        aiError = 'no_input';
      } else {
        const completion = await requestWeeklyCompletion({ fetchImpl: fetch, apiKey, model, prompt });
        if (completion.ok) {
          rawOutput = completion.raw;
          modelOutput = parseWeeklyModelOutput(completion.raw, top.map((entry) => entry.uid));
          if (!modelOutput) aiError = 'ai_unparseable_output';
        } else {
          aiError = completion.error;
        }
      }
    }

    const content = assembleWeeklyContent({
      weekStart,
      totals,
      top,
      vulnerabilities,
      modelOutput,
      aiEnabled,
      model,
      prompt: aiEnabled ? prompt : null,
      rawOutput,
      error: aiError,
      knownProjectNames,
    });
    content.archive.updates = selectWeeklyUpdates(weekRecords, content);
    const counts = paragraphCounts(content);
    const summary = {
      week_start: weekStart,
      incidents: totals.incidentCount,
      unconfirmed: totals.unconfirmedCount,
      top: content.top.length,
      vulnerabilities: vulnerabilities.length,
      updates: content.archive.updates.length,
      ai_used: rawOutput !== null,
      ...counts,
      ...(model ? { model } : {}),
      ...(aiError ? { ai_error: aiError } : {}),
    };

    if (dryRun) return json({ success: true, dryRun: true, ...summary, content });

    const saved = await saveIssue(db, existing, content, period, now);
    await recordIngestionRun(db, {
      pipeline: 'newsletter-build',
      attempted_at: now.toISOString(),
      completed_at: new Date().toISOString(),
      success: true,
      records_found: recordsFound,
      records_inserted: saved.rebuilt ? 0 : 1,
      records_updated: saved.rebuilt ? 1 : 0,
      duration_ms: Date.now() - startedAt,
      metadata: { kind: 'weekly', issue_id: saved.id, rebuilt: saved.rebuilt, ...summary },
    });
    return json({ success: true, weekStart, issueId: saved.id, status: 'ready', rebuilt: saved.rebuilt, ...summary, archive: { aiEnabled: content.archive.aiEnabled, error: content.archive.error } });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[build-weekly-newsletter]', message);
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
        metadata: { kind: 'weekly', week_start: weekStart, ...(error instanceof HttpError && error.reason ? { refused: error.reason } : {}) },
      });
    }
    return json({ success: false, error: status === 409 ? message : 'Weekly deep-dive build failed' }, status);
  }
});
