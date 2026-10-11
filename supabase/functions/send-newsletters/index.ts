import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { dailyBriefItemCount, filterDailyBriefForSubscriber, isDailyBriefContent, quietDailyBrief } from '../_shared/daily-brief.ts';
import {
  buildUnsubscribeLinks,
  emailHash,
  listUnsubscribeHeaders,
  normalizeEmail,
  readPostalAddress,
} from '../_shared/email-compliance.ts';
import {
  claimEmailSend,
  finishEmailSend,
  planEmailClaim,
  type ExistingSend,
  type LedgerDb,
} from '../_shared/email-ledger.ts';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
import { renderNewsletterEmail, type RenderContext } from '../_shared/newsletter-render.ts';
import { createThrottle, RESEND_MIN_INTERVAL_MS, sendResendEmail, type ResendOutcome } from '../_shared/resend-client.ts';
import {
  dailyIssueDateFor,
  isNewsletterDue,
  localClock,
  recentlyNotified,
  resolveZone,
  weeklyDayOf,
  weeklyIssueDateFor,
  type Zone,
} from '../_shared/send-window.ts';
import type { DeliveryPreferences } from '../_shared/subscription-delivery.ts';
import { isWeeklyPublicContent, personalizeWeekly } from '../_shared/weekly-render.ts';
import type { WeeklyIssueContent } from '../_shared/newsletter-content.ts';
import { SITE_URL } from '../_shared/site-urls.ts';

// Daily briefs and weekly deep-dives, sent at each subscriber's local hour.
// Cron calls this four times an hour (:00, :15, :30, :45). Nothing goes to
// subscribers until NEWSLETTER_POSTAL_ADDRESS is set; setting it is also what
// makes the legacy send-digest-emails stand down.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM = 'Digibastion Threat Intel <alerts@digibastion.com>';
const REPLY_TO = 'support@digibastion.com';
const DAY_MS = 86_400_000;
const WEEKLY_LOOKBACK_MS = 8 * DAY_MS;
const WALL_BUDGET_MS = 100_000;
const MAX_SENDS_PER_RUN = 150;
const PAGE_SIZE = 1_000;
const CHUNK = 100;
const DEFAULT_PREFERRED_HOUR = 9;
// Any well-formed token works in a test email's links: it matches no row.
const PLACEHOLDER_TOKEN = '00000000-0000-0000-0000-000000000000';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUBSCRIPTION_COLUMNS = 'id, email, verification_token, categories, technologies, severity_threshold, content_scope, include_preliminary, chains, wants_daily, wants_weekly, timezone, timezone_offset, preferred_hour, preferred_day, last_notified_at';
const ISSUE_COLUMNS = 'id, kind, period_start, period_end, status, content, generated_at';
const EVENT_TYPES: Record<Kind, string> = { daily: 'daily_brief', weekly: 'weekly_deep_dive' };

type Db = SupabaseClient;
type Kind = 'daily' | 'weekly';
type Principal = { kind: 'cron' | 'service' } | { kind: 'admin'; email: string | null };

interface Subscriber extends DeliveryPreferences {
  id: string;
  email: string;
  verification_token: string;
  wants_daily: boolean;
  wants_weekly: boolean;
  timezone: string | null;
  timezone_offset: number | string | null;
  preferred_hour: number | null;
  preferred_day: number | null;
  last_notified_at: string | null;
}

interface Issue {
  id: string;
  kind: Kind;
  period_start: string;
  period_end: string;
  status: string;
  content: unknown;
  generated_at: string;
}

interface Task { sub: Subscriber; kind: Kind; issue: Issue }

interface KindCounters {
  due: number;
  sent: number;
  /** Daily briefs where nothing matched: sent as a quiet-day brief. */
  quiet: number;
  suppressed: number;
  failed: number;
  unknown: number;
  unrenderable: number;
  deferred: number;
}

const emptyCounters = (): KindCounters => ({ due: 0, sent: 0, quiet: 0, suppressed: 0, failed: 0, unknown: 0, unrenderable: 0, deferred: 0 });

const isQuietBrief = (content: unknown): boolean =>
  Boolean(content && typeof content === 'object' && (content as { quiet?: unknown }).quiet);

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

const utcDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const dayStart = (ms: number) => Date.parse(`${utcDate(ms)}T00:00:00.000Z`);

function linksFor(email: string, token: string, supabaseUrl: string) {
  return buildUnsubscribeLinks({ siteUrl: SITE_URL, functionsBaseUrl: `${supabaseUrl}/functions/v1`, email, token });
}

function zoneOf(sub: Subscriber): Zone {
  const offset = sub.timezone_offset === null || sub.timezone_offset === undefined ? null : Number(sub.timezone_offset);
  return resolveZone(sub.timezone, offset);
}

function preferredHourOf(sub: Subscriber): number {
  const hour = Number(sub.preferred_hour);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULT_PREFERRED_HOUR;
}

/**
 * Issues a subscriber can be due for right now, keyed by kind and period_end
 * date. Sent issues stay eligible: "sent" means it reached its first reader,
 * and later time zones still need it.
 */
async function loadIssues(db: Db, now: Date): Promise<Map<string, Issue>> {
  const today = dayStart(now.getTime());
  const [daily, weekly] = await Promise.all([
    db.from('newsletter_issues')
      .select(ISSUE_COLUMNS)
      .eq('kind', 'daily')
      .in('status', ['ready', 'sent'])
      .gte('period_end', new Date(today - DAY_MS).toISOString())
      .lte('period_end', new Date(today + DAY_MS).toISOString())
      .not('generated_at', 'is', null),
    db.from('newsletter_issues')
      .select(ISSUE_COLUMNS)
      .eq('kind', 'weekly')
      .in('status', ['ready', 'sent'])
      .gte('period_end', new Date(now.getTime() - WEEKLY_LOOKBACK_MS).toISOString())
      .lte('period_end', new Date(today + DAY_MS).toISOString())
      .not('generated_at', 'is', null),
  ]);
  if (daily.error || weekly.error) throw new Error('newsletter_issues could not be read');
  const issues = new Map<string, Issue>();
  for (const issue of [...(daily.data ?? []), ...(weekly.data ?? [])] as Issue[]) {
    issues.set(`${issue.kind}/${utcDate(Date.parse(issue.period_end))}`, issue);
  }
  return issues;
}

/** Monday of the newest published weekly issue, for the daily brief's weekly link; null when none or on error. */
async function loadLatestWeekStart(db: Db): Promise<string | null> {
  const { data, error } = await db
    .from('newsletter_issues')
    .select('period_start')
    .eq('kind', 'weekly')
    .in('status', ['ready', 'sent'])
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const start = new Date(String(data.period_start));
  return Number.isNaN(start.getTime()) ? null : start.toISOString().slice(0, 10);
}

async function loadSubscribers(db: Db): Promise<Subscriber[]> {
  const rows: Subscriber[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await db
      .from('subscriptions')
      .select(SUBSCRIPTION_COLUMNS)
      .eq('is_active', true)
      .eq('is_verified', true)
      .or('wants_daily.eq.true,wants_weekly.eq.true')
      .not('verification_token', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error('Subscriptions could not be read');
    rows.push(...((data ?? []) as Subscriber[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

/** Ledger rows for these issues, keyed `${subscription}/${kind}/${issue}`. */
async function loadExistingSends(db: Db, issueIds: string[]): Promise<Map<string, ExistingSend>> {
  const existing = new Map<string, ExistingSend>();
  if (issueIds.length === 0) return existing;
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await db
      .from('email_sends')
      .select('id, subscription_id, kind, item_key, status, attempts, created_at')
      .in('kind', ['daily', 'weekly'])
      .in('item_key', issueIds)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error('email_sends could not be read');
    for (const row of data ?? []) {
      existing.set(`${row.subscription_id}/${row.kind}/${row.item_key}`, {
        status: String(row.status),
        attempts: Number(row.attempts) || 0,
        created_at: String(row.created_at),
      });
    }
    if (!data || data.length < PAGE_SIZE) break;
  }
  return existing;
}

/** Ids of subscriptions whose address is on the suppression list. */
async function loadSuppressed(db: Db, subscribers: Subscriber[]): Promise<Set<string>> {
  const hashes = new Map<string, string>();
  for (const sub of subscribers) hashes.set(sub.id, await emailHash(sub.email));
  const suppressedHashes = new Set<string>();
  for (const batch of chunks([...new Set(hashes.values())])) {
    const { data, error } = await db.from('email_suppressions').select('email_hash').in('email_hash', batch);
    if (error) throw new Error('Suppression list could not be read');
    for (const row of data ?? []) suppressedHashes.add(String(row.email_hash));
  }
  return new Set(subscribers.filter((sub) => suppressedHashes.has(hashes.get(sub.id) ?? '')).map((sub) => sub.id));
}

/** Every (subscriber, kind) whose issue is due now and not already settled in the ledger. */
function planTasks(subscribers: Subscriber[], issues: Map<string, Issue>, existing: Map<string, ExistingSend>, now: Date): Task[] {
  const tasks: Task[] = [];
  for (const sub of subscribers) {
    const zone = zoneOf(sub);
    const preferredHour = preferredHourOf(sub);
    const localDate = localClock(now, zone).date;
    const wanted: { kind: Kind; issueDate: string | null }[] = [];
    // Someone who got a digest in the last 12 hours (the legacy one, on cut-over day) waits for tomorrow.
    if (sub.wants_daily && !recentlyNotified(sub.last_notified_at, now)) wanted.push({ kind: 'daily', issueDate: dailyIssueDateFor(now, zone) });
    // The weekly goes out on the subscriber's weekly day (Monday when unset).
    if (sub.wants_weekly) wanted.push({ kind: 'weekly', issueDate: weeklyIssueDateFor(now, zone, weeklyDayOf(sub.preferred_day)) });
    for (const { kind, issueDate } of wanted) {
      if (!issueDate) continue;
      const issue = issues.get(`${kind}/${issueDate}`);
      if (!issue) continue;
      if (!isNewsletterDue({ now, zone, preferredHour, issueDate, sendDate: localDate, issueReadyAt: new Date(issue.generated_at) })) continue;
      const send = existing.get(`${sub.id}/${kind}/${issue.id}`) ?? null;
      if (send && planEmailClaim(send, kind, now) === 'skip') continue;
      tasks.push({ sub, kind, issue });
    }
  }
  return tasks;
}

/** What this subscriber should get from the issue: the filtered daily (a quiet-day brief when nothing matches) or the shared weekly. */
function contentFor(task: Task): unknown {
  return personalContent(task.kind, task.issue.content, task.sub);
}

/** The shared weekly plus this subscriber's "More this week", or their filtered daily; undefined when unrenderable. */
function personalContent(kind: Kind, content: unknown, prefs: DeliveryPreferences): unknown {
  if (kind === 'weekly') return isWeeklyPublicContent(content) ? personalizeWeekly(content as WeeklyIssueContent, prefs) : undefined;
  if (!isDailyBriefContent(content)) return undefined;
  return filterDailyBriefForSubscriber(content, prefs);
}

const hasWeeklyUpdates = (content: unknown): boolean =>
  isWeeklyPublicContent(content) && Array.isArray((content as WeeklyIssueContent).archive?.updates);

interface RunContext {
  db: Db;
  ledger: LedgerDb;
  apiKey: string;
  supabaseUrl: string;
  postalAddress: string;
  throttle: () => Promise<void>;
  now: Date;
  markedSent: Set<string>;
  latestWeekStart: string | null;
}

function tally(counters: KindCounters, outcome: ResendOutcome): void {
  if (outcome.status === 'sent') counters.sent++;
  else if (outcome.status === 'failed') counters.failed++;
  else counters.unknown++;
}

/** Returns true when a Resend request was made. */
async function runTask(ctx: RunContext, task: Task, suppressed: boolean, counters: KindCounters): Promise<boolean> {
  const { sub, kind, issue } = task;
  const claimRow = {
    subscription_id: sub.id,
    kind,
    item_key: issue.id,
    issue_id: issue.id,
    snapshot: { period_end: issue.period_end },
  };

  const content = contentFor(task);

  const links = linksFor(sub.email, sub.verification_token, ctx.supabaseUrl);
  const renderContext: RenderContext = { links, postalAddress: ctx.postalAddress, siteUrl: SITE_URL, latestWeekStart: ctx.latestWeekStart };
  const rendered = content === undefined ? null : renderNewsletterEmail(kind, content, renderContext);
  if (!rendered) {
    // No ledger row: once the renderer handles this content, a later slot sends it.
    counters.unrenderable++;
    return false;
  }

  const claim = await claimEmailSend(ctx.ledger, claimRow, ctx.now);
  if (!claim) return false;
  if (suppressed) {
    await finishEmailSend(ctx.ledger, claim.id, { status: 'suppressed' });
    counters.suppressed++;
    return false;
  }
  if (isQuietBrief(content)) counters.quiet++;

  await ctx.throttle();
  const outcome = await sendResendEmail({
    fetchImpl: fetch,
    apiKey: ctx.apiKey,
    idempotencyKey: claim.idempotencyKey,
    email: {
      from: FROM,
      to: [sub.email],
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      reply_to: REPLY_TO,
      headers: listUnsubscribeHeaders(links),
      tags: [{ name: 'kind', value: kind }],
    },
  });
  await finishEmailSend(ctx.ledger, claim.id, outcome);
  tally(counters, outcome);
  if (outcome.status !== 'sent') return true;

  // Admin analytics count sends from email_events.
  const { error: eventError } = await ctx.db.from('email_events').insert({
    subscription_id: sub.id,
    tracking_id: crypto.randomUUID(),
    email_type: EVENT_TYPES[kind],
    event_type: 'sent',
  });
  if (eventError) console.warn('[send-newsletters] email_events write failed');
  await ctx.db.from('subscriptions').update({ last_notified_at: new Date().toISOString() }).eq('id', sub.id);
  if (!ctx.markedSent.has(issue.id)) {
    ctx.markedSent.add(issue.id);
    const { error } = await ctx.db
      .from('newsletter_issues')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', issue.id)
      .eq('status', 'ready');
    if (error) console.warn('[send-newsletters] issue status update failed');
  }
  return true;
}

type TestView = 'edition' | 'subscriber' | 'quiet';

/**
 * Sends one issue to the signed-in admin. view 'edition' (default) is the
 * whole issue, unfiltered; 'subscriber' is what the admin's own subscription
 * would get (daily filtered or quiet, weekly with "More this week"); 'quiet'
 * previews the daily quiet-day brief.
 */
async function sendTest(db: Db, apiKey: string, supabaseUrl: string, adminEmail: string, kind: Kind, issueId: string | null, view: TestView): Promise<Response> {
  let query = db.from('newsletter_issues').select(ISSUE_COLUMNS).eq('kind', kind).in('status', ['ready', 'sent']);
  if (issueId) query = query.eq('id', issueId);
  const { data: issue, error } = await query.order('period_end', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('newsletter_issues could not be read');
  if (!issue) return json({ success: false, error: `No ready ${kind} issue` }, 404);

  const { data: own } = await db
    .from('subscriptions')
    .select(SUBSCRIPTION_COLUMNS)
    .eq('email', normalizeEmail(adminEmail))
    .maybeSingle();
  if (view !== 'edition' && !own) return json({ success: false, error: 'The admin address has no subscription to preview' }, 404);
  const prefs = (own ?? {}) as DeliveryPreferences;
  const content = (issue as Issue).content;
  let body: unknown = content;
  if (view === 'subscriber') body = personalContent(kind, content, prefs);
  if (view === 'quiet') {
    if (kind !== 'daily' || !isDailyBriefContent(content)) return json({ success: false, error: 'quiet previews the daily brief only' }, 400);
    body = quietDailyBrief(content, prefs);
  }
  const token = typeof own?.verification_token === 'string' ? own.verification_token : PLACEHOLDER_TOKEN;
  const links = linksFor(adminEmail, token, supabaseUrl);
  const postalAddress = readPostalAddress(Deno.env.get('NEWSLETTER_POSTAL_ADDRESS'));
  const rendered = renderNewsletterEmail(kind, body, {
    links,
    postalAddress,
    testWarning: postalAddress === null,
    siteUrl: SITE_URL,
    latestWeekStart: kind === 'daily' ? await loadLatestWeekStart(db) : null,
  });
  if (!rendered) return json({ success: false, error: `This ${kind} issue cannot be rendered yet` }, 409);

  const outcome = await sendResendEmail({
    fetchImpl: fetch,
    apiKey,
    idempotencyKey: `test/${kind}/${crypto.randomUUID()}`,
    email: {
      from: FROM,
      to: [adminEmail],
      subject: `[Test${view === 'edition' ? '' : `, ${view}`}] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
      reply_to: REPLY_TO,
      headers: listUnsubscribeHeaders(links),
      tags: [{ name: 'kind', value: `${kind}_test` }],
    },
  });
  return json(
    { success: outcome.status === 'sent', test: true, kind, view, issueId: (issue as Issue).id, outcome: outcome.status },
    outcome.status === 'sent' ? 200 : 502,
  );
}

interface ParityRow {
  id: string;
  frequency: string;
  status: 'would_send' | 'blocked';
  reasons: string[];
  local_time: string;
  weekly_day?: number;
  daily?: { matched: number; quiet: boolean };
}

/**
 * The cut-over gate, read-only: for every subscriber the legacy digest serves
 * (active, verified, frequency daily or weekly), would send-newsletters send
 * them the newest issue? Works before NEWSLETTER_POSTAL_ADDRESS is set. Ids
 * are shortened and no email address leaves the function.
 */
async function parityReport(db: Db, supabaseUrl: string): Promise<Response> {
  const { data, error } = await db
    .from('subscriptions')
    .select(`${SUBSCRIPTION_COLUMNS}, frequency`)
    .eq('is_active', true)
    .eq('is_verified', true)
    .in('frequency', ['daily', 'weekly'])
    .order('id', { ascending: true });
  if (error) throw new Error('Subscriptions could not be read');
  const subscribers = (data ?? []) as (Subscriber & { frequency: string; verification_token: string | null })[];

  const latest = async (kind: Kind) => {
    const { data: issue, error: issueError } = await db
      .from('newsletter_issues')
      .select(ISSUE_COLUMNS)
      .eq('kind', kind)
      .in('status', ['ready', 'sent'])
      .not('generated_at', 'is', null)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (issueError) throw new Error('newsletter_issues could not be read');
    return (issue ?? null) as Issue | null;
  };
  const [daily, weekly, suppressed] = await Promise.all([
    latest('daily'),
    latest('weekly'),
    loadSuppressed(db, subscribers.filter((sub) => typeof sub.email === 'string') as Subscriber[]),
  ]);
  const dailyContent = daily && isDailyBriefContent(daily.content) ? daily.content : null;
  const dailyHasUpdates = Boolean(dailyContent && Array.isArray(dailyContent.updates));

  const rows: ParityRow[] = subscribers.map((sub) => {
    const reasons: string[] = [];
    if (!sub.verification_token) reasons.push('no_management_token');
    if (sub.frequency === 'daily' && !sub.wants_daily) reasons.push('daily_channel_off');
    if (sub.frequency === 'weekly' && !sub.wants_weekly) reasons.push('weekly_channel_off');
    if (suppressed.has(sub.id)) reasons.push('suppressed');
    const row: ParityRow = {
      id: sub.id.slice(0, 8),
      frequency: sub.frequency,
      status: 'would_send',
      reasons,
      local_time: `${String(preferredHourOf(sub)).padStart(2, '0')}:00 ${sub.timezone ?? `UTC${Number(sub.timezone_offset ?? 0) >= 0 ? '+' : ''}${Number(sub.timezone_offset ?? 0)}`}`,
    };
    if (sub.wants_daily) {
      if (!dailyContent) reasons.push('no_daily_issue');
      else {
        // Issues built before the parity change have no `updates` and can miss general news.
        if (!dailyHasUpdates) reasons.push('daily_issue_built_before_parity');
        const view = filterDailyBriefForSubscriber(dailyContent, sub);
        row.daily = { matched: dailyBriefItemCount(view), quiet: Boolean(view.quiet) };
        const links = linksFor(sub.email, sub.verification_token ?? PLACEHOLDER_TOKEN, supabaseUrl);
        if (!renderNewsletterEmail('daily', view, { links, postalAddress: null, testWarning: true, siteUrl: SITE_URL })) {
          reasons.push('daily_unrenderable');
        }
      }
    }
    if (sub.wants_weekly) {
      row.weekly_day = weeklyDayOf(sub.preferred_day);
      if (!weekly) reasons.push('no_weekly_issue');
      else {
        // Issues built before the parity change have no archive.updates, so no "More this week".
        if (!hasWeeklyUpdates(weekly.content)) reasons.push('weekly_issue_built_before_parity');
        const links = linksFor(sub.email, sub.verification_token ?? PLACEHOLDER_TOKEN, supabaseUrl);
        if (!renderNewsletterEmail('weekly', personalContent('weekly', weekly.content, sub), { links, postalAddress: null, testWarning: true, siteUrl: SITE_URL })) {
          reasons.push('weekly_unrenderable');
        }
      }
    }
    row.status = reasons.length === 0 ? 'would_send' : 'blocked';
    return row;
  });

  const wouldSend = rows.filter((row) => row.status === 'would_send').length;
  return json({
    success: true,
    parity: true,
    ready_for_cutover: rows.length > 0 && wouldSend === rows.length,
    legacy_subscribers: rows.length,
    would_send: wouldSend,
    blocked: rows.length - wouldSend,
    daily_issue: daily ? { id: daily.id, period_end: daily.period_end, has_updates: dailyHasUpdates } : null,
    weekly_issue: weekly ? { id: weekly.id, period_end: weekly.period_end, has_updates: hasWeeklyUpdates(weekly.content) } : null,
    rows,
  });
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

  const db = createClient(supabaseUrl, serviceKey);
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const startedAt = Date.now();
  const now = new Date(startedAt);

  if (body.test_email !== undefined) {
    if (principal.kind !== 'admin' || !principal.email || typeof body.test_email !== 'string' ||
      normalizeEmail(body.test_email) !== normalizeEmail(principal.email)) {
      return json({ error: 'test_email must be the signed-in admin address' }, 403);
    }
    if (body.kind !== 'daily' && body.kind !== 'weekly') return json({ error: "kind must be 'daily' or 'weekly'" }, 400);
    if (body.issueId !== undefined && (typeof body.issueId !== 'string' || !UUID.test(body.issueId))) {
      return json({ error: 'issueId must be a uuid' }, 400);
    }
    if (body.view !== undefined && body.view !== 'edition' && body.view !== 'subscriber' && body.view !== 'quiet') {
      return json({ error: "view must be 'edition', 'subscriber' or 'quiet'" }, 400);
    }
    if (!apiKey) return json({ error: 'RESEND_API_KEY is not configured' }, 500);
    try {
      const view: TestView = body.view === 'subscriber' || body.view === 'quiet' ? body.view : 'edition';
      return await sendTest(db, apiKey, supabaseUrl, principal.email, body.kind, typeof body.issueId === 'string' ? body.issueId : null, view);
    } catch (error) {
      console.error('[send-newsletters] test send failed:', error instanceof Error ? error.message : 'unknown');
      return json({ success: false, error: 'Test send failed' }, 500);
    }
  }

  if (body.parity === true) {
    try {
      return await parityReport(db, supabaseUrl);
    } catch (error) {
      console.error('[send-newsletters] parity report failed:', error instanceof Error ? error.message : 'unknown');
      return json({ success: false, error: 'Parity report failed' }, 500);
    }
  }

  const dryRun = body.dryRun === true;
  const source = body.source === 'cron' ? 'cron' : 'manual';

  // Launch gate (CAN-SPAM): no postal address, no subscriber sends.
  const postalAddress = readPostalAddress(Deno.env.get('NEWSLETTER_POSTAL_ADDRESS'));
  if (!postalAddress) {
    if (!dryRun) {
      await recordIngestionRun(db, {
        pipeline: 'digest-emails',
        attempted_at: now.toISOString(),
        completed_at: new Date().toISOString(),
        success: true,
        duration_ms: Date.now() - startedAt,
        metadata: { function: 'send-newsletters', source, skipped: 'postal_address_missing' },
      });
    }
    return json({ success: true, skipped: 'postal_address_missing' });
  }

  const counters: Record<Kind, KindCounters> = { daily: emptyCounters(), weekly: emptyCounters() };
  let subscriberCount = 0;
  let issueCount = 0;
  try {
    const issues = await loadIssues(db, now);
    issueCount = issues.size;
    const subscribers = issues.size > 0 ? await loadSubscribers(db) : [];
    subscriberCount = subscribers.length;
    const existing = await loadExistingSends(db, [...new Set([...issues.values()].map((issue) => issue.id))]);
    const tasks = planTasks(subscribers, issues, existing, now);
    for (const task of tasks) counters[task.kind].due++;
    const suppressed = await loadSuppressed(db, [...new Map(tasks.map((task) => [task.sub.id, task.sub])).values()]);

    if (dryRun) {
      for (const task of tasks) {
        if (suppressed.has(task.sub.id)) counters[task.kind].suppressed++;
        else if (isQuietBrief(contentFor(task))) counters[task.kind].quiet++;
      }
      return json({ success: true, dryRun: true, issues: issueCount, subscriptions: subscriberCount, daily: counters.daily, weekly: counters.weekly });
    }

    if (!apiKey) {
      console.warn('[send-newsletters] RESEND_API_KEY not configured; nothing sent');
      await recordIngestionRun(db, {
        pipeline: 'digest-emails',
        attempted_at: now.toISOString(),
        completed_at: new Date().toISOString(),
        success: false,
        records_found: tasks.length,
        duration_ms: Date.now() - startedAt,
        error_summary: 'RESEND_API_KEY not configured',
        metadata: { function: 'send-newsletters', source, due: tasks.length },
      });
      return json({ success: false, error: 'RESEND_API_KEY not configured', due: tasks.length }, 500);
    }

    const ctx: RunContext = {
      db,
      ledger: db as unknown as LedgerDb,
      apiKey,
      supabaseUrl,
      postalAddress,
      throttle: createThrottle(RESEND_MIN_INTERVAL_MS),
      now,
      markedSent: new Set(),
      latestWeekStart: await loadLatestWeekStart(db),
    };
    let requests = 0;
    for (const task of tasks) {
      // Later quarter-hour slots inside the grace window pick up what is left.
      if (Date.now() - startedAt > WALL_BUDGET_MS || requests >= MAX_SENDS_PER_RUN) {
        counters[task.kind].deferred++;
        continue;
      }
      try {
        if (await runTask(ctx, task, suppressed.has(task.sub.id), counters[task.kind])) requests++;
      } catch (error) {
        counters[task.kind].failed++;
        console.error(`[send-newsletters] subscription ${task.sub.id} ${task.kind}:`, error instanceof Error ? error.message : 'unknown');
      }
    }

    const failed = counters.daily.failed + counters.weekly.failed;
    const sent = counters.daily.sent + counters.weekly.sent;
    const summary = { issues: issueCount, subscriptions: subscriberCount, daily: counters.daily, weekly: counters.weekly };
    await recordIngestionRun(db, {
      pipeline: 'digest-emails',
      attempted_at: now.toISOString(),
      completed_at: new Date().toISOString(),
      success: failed === 0,
      records_found: tasks.length,
      records_inserted: sent,
      records_invalid: failed,
      duration_ms: Date.now() - startedAt,
      ...(failed > 0 ? { error_summary: `${failed} send(s) failed` } : {}),
      metadata: { function: 'send-newsletters', source, ...summary },
    });
    return json({ success: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-newsletters] Fatal error:', message);
    if (!dryRun) {
      await recordIngestionRun(db, {
        pipeline: 'digest-emails',
        attempted_at: now.toISOString(),
        completed_at: new Date().toISOString(),
        success: false,
        duration_ms: Date.now() - startedAt,
        error_summary: message,
        metadata: { function: 'send-newsletters', source, issues: issueCount, subscriptions: subscriberCount, daily: counters.daily, weekly: counters.weekly },
      });
    }
    return json({ success: false, error: 'Newsletter run failed' }, 500);
  }
});
