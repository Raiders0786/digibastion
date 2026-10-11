import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import {
  alertBatchKey,
  buildAlertSubject,
  buildFollowUpSubject,
  planAlertFollowUp,
  renderAlertEmail,
  renderFollowUpEmail,
  type FollowUpKind,
} from '../_shared/alert-email.ts';
import {
  buildUnsubscribeLinks,
  emailHash,
  listUnsubscribeHeaders,
  normalizeEmail,
  readPostalAddress,
} from '../_shared/email-compliance.ts';
import {
  claimEmailSend,
  emailIdempotencyKey,
  finishEmailSend,
  planEmailClaim,
  type LedgerDb,
} from '../_shared/email-ledger.ts';
import { readIncidentFields } from '../_shared/incident-fields.ts';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
import {
  compareItems,
  newsletterItemToDeliverable,
  statusChangeItem,
  toNewsletterItem,
  type NewsletterItem,
  type NewsletterSourceRow,
} from '../_shared/newsletter-content.ts';
import {
  createThrottle,
  RESEND_MIN_INTERVAL_MS,
  sendResendEmail,
  type ResendOutcome,
} from '../_shared/resend-client.ts';
import { matchesDeliveryPreferences, type DeliveryPreferences } from '../_shared/subscription-delivery.ts';
import { SITE_URL } from '../_shared/site-urls.ts';

// Real-time alerts. Every 30 minutes: critical and high records ingested in
// the last 6 hours go to subscribers with real-time alerts on, one email per
// subscriber per run, deduplicated through the email_sends ledger. Alerts
// already sent are followed up only when the record is retracted or upgraded
// to critical.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM = 'Digibastion Alerts <alerts@digibastion.com>';
const REPLY_TO = 'support@digibastion.com';
const LOOKBACK_MS = 6 * 3_600_000;
const LEGACY_GUARD_MS = 7 * 86_400_000;
const FOLLOW_UP_WINDOW_MS = 14 * 86_400_000;
const TEST_LOOKBACK_MS = 30 * 86_400_000;
const MAX_ITEMS_PER_EMAIL = 10;
const MAX_ARTICLES = 200;
const MAX_FOLLOW_UP_ROWS = 5_000;
const WALL_BUDGET_MS = 100_000;
const PAGE_SIZE = 1_000;
const CHUNK = 100;
// Any well-formed token works in a test email's links: it matches no row.
const PLACEHOLDER_TOKEN = '00000000-0000-0000-0000-000000000000';
const ARTICLE_COLUMNS = 'id, uid, title, summary, severity, category, link, source_name, cve_id, tags, affected_technologies, created_at, metadata';
const SUBSCRIPTION_COLUMNS = 'id, email, verification_token, categories, technologies, severity_threshold, content_scope, include_preliminary, chains';

type Db = SupabaseClient;

interface Subscriber extends DeliveryPreferences {
  id: string;
  email: string;
  verification_token: string;
}

type Principal = { kind: 'cron' | 'service' } | { kind: 'admin'; email: string | null };

interface Counters {
  emailsSent: number;
  itemsSent: number;
  followUpsSent: number;
  failed: number;
  unknown: number;
  suppressed: number;
  deferred: number;
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

function isDeliverableRow(row: NewsletterSourceRow): boolean {
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {};
  return metadata.classification_relevant !== false && !readIncidentFields(metadata).duplicateOfUid;
}

// Selected by ingestion time: QuillMonitor and SlowMist stamp published_at
// at midnight UTC, so a published_at window misses their records.
async function loadRecentItems(db: Db, since: Date): Promise<NewsletterItem[]> {
  const { data, error } = await db
    .from('news_articles')
    .select(ARTICLE_COLUMNS)
    .in('severity', ['critical', 'high'])
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(MAX_ARTICLES);
  if (error) throw new Error('Recent articles could not be read');
  return ((data ?? []) as NewsletterSourceRow[]).filter(isDeliverableRow).map((row) => toNewsletterItem(row, SITE_URL));
}

async function loadSubscribers(db: Db): Promise<Subscriber[]> {
  const rows: Subscriber[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await db
      .from('subscriptions')
      .select(SUBSCRIPTION_COLUMNS)
      .eq('is_active', true)
      .eq('is_verified', true)
      .eq('wants_realtime', true)
      .not('verification_token', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error('Subscriptions could not be read');
    rows.push(...((data ?? []) as Subscriber[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
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

/** uids this subscriber must not get again: ledger rows that will not be retried, and legacy sends of the last 7 days. */
async function alreadySent(db: Db, sub: Subscriber, items: NewsletterItem[], now: Date): Promise<Set<string>> {
  const done = new Set<string>();
  const { data: sends, error } = await db
    .from('email_sends')
    .select('item_key, status, attempts, created_at')
    .eq('subscription_id', sub.id)
    .eq('kind', 'alert')
    .in('item_key', items.map((item) => item.uid));
  if (error) throw new Error('email_sends could not be read');
  for (const row of sends ?? []) {
    const existing = { status: String(row.status), attempts: Number(row.attempts) || 0, created_at: String(row.created_at) };
    if (planEmailClaim(existing, 'alert', now) === 'skip') done.add(String(row.item_key));
  }

  // Transition guard for sends made before the ledger existed; removed in a later phase.
  const articleIds = items.map((item) => item.articleId).filter((id): id is string => Boolean(id));
  if (articleIds.length > 0) {
    const { data: legacy, error: legacyError } = await db
      .from('notification_log')
      .select('article_id')
      .eq('subscription_id', sub.id)
      .eq('status', 'sent')
      .gte('sent_at', new Date(now.getTime() - LEGACY_GUARD_MS).toISOString())
      .in('article_id', articleIds);
    if (legacyError) throw new Error('notification_log could not be read');
    const legacyIds = new Set((legacy ?? []).map((row) => String(row.article_id)));
    for (const item of items) if (item.articleId && legacyIds.has(item.articleId)) done.add(item.uid);
  }
  return done;
}

function linksFor(email: string, token: string, supabaseUrl: string) {
  return buildUnsubscribeLinks({ siteUrl: SITE_URL, functionsBaseUrl: `${supabaseUrl}/functions/v1`, email, token });
}

function snapshotFor(item: NewsletterItem): Record<string, unknown> {
  return {
    sent_severity: item.severity,
    sent_verification: item.status === 'confirmed' ? 'verified' : item.status === 'unconfirmed' ? 'unverified' : null,
  };
}

interface SendContext {
  db: Db;
  ledger: LedgerDb;
  apiKey: string;
  supabaseUrl: string;
  postalAddress: string | null;
  throttle: () => Promise<void>;
  startedAt: number;
  now: Date;
  counters: Counters;
}

const outOfTime = (ctx: SendContext) => Date.now() - ctx.startedAt > WALL_BUDGET_MS;

function tally(counters: Counters, outcome: ResendOutcome): void {
  if (outcome.status === 'failed') counters.failed++;
  else if (outcome.status === 'unknown') counters.unknown++;
}

async function sendAlertTo(ctx: SendContext, sub: Subscriber, items: NewsletterItem[], suppressed: boolean): Promise<void> {
  const claimed: { item: NewsletterItem; id: string }[] = [];
  for (const item of items) {
    const claim = await claimEmailSend(ctx.ledger, {
      subscription_id: sub.id,
      kind: 'alert',
      item_key: item.uid,
      article_uid: item.uid,
      ...(item.articleId ? { article_id: item.articleId } : {}),
      snapshot: snapshotFor(item),
    }, ctx.now);
    if (claim) claimed.push({ item, id: claim.id });
  }
  if (claimed.length === 0) return;

  if (suppressed) {
    for (const row of claimed) await finishEmailSend(ctx.ledger, row.id, { status: 'suppressed' });
    ctx.counters.suppressed++;
    return;
  }

  const sendItems = claimed.map((row) => row.item);
  const links = linksFor(sub.email, sub.verification_token, ctx.supabaseUrl);
  const { html, text } = renderAlertEmail({ items: sendItems, links, postalAddress: ctx.postalAddress, siteUrl: SITE_URL });
  await ctx.throttle();
  const outcome = await sendResendEmail({
    fetchImpl: fetch,
    apiKey: ctx.apiKey,
    idempotencyKey: emailIdempotencyKey('alert', alertBatchKey(sendItems.map((item) => item.uid)), sub.id),
    email: {
      from: FROM,
      to: [sub.email],
      subject: buildAlertSubject(sendItems),
      html,
      text,
      reply_to: REPLY_TO,
      headers: listUnsubscribeHeaders(links),
      tags: [{ name: 'kind', value: 'alert' }],
    },
  });
  for (const row of claimed) await finishEmailSend(ctx.ledger, row.id, outcome);
  tally(ctx.counters, outcome);
  if (outcome.status !== 'sent') return;

  ctx.counters.emailsSent++;
  ctx.counters.itemsSent += sendItems.length;
  // Keep the legacy log current so a rollback to the previous function
  // version does not re-send these alerts.
  const legacyRows = sendItems.filter((item) => item.articleId).map((item) => ({
    subscription_id: sub.id,
    article_id: item.articleId,
    status: 'sent',
    error_message: null,
  }));
  if (legacyRows.length > 0) {
    const { error } = await ctx.db.from('notification_log').upsert(legacyRows, { onConflict: 'subscription_id,article_id' });
    if (error) console.warn('[send-critical-alerts] notification_log write failed');
  }
  await ctx.db.from('subscriptions').update({ last_notified_at: new Date().toISOString() }).eq('id', sub.id);
}

interface FollowUpCandidate { sub: Subscriber; uid: string; kind: FollowUpKind; item: NewsletterItem }

async function planFollowUps(db: Db, subscribers: Map<string, Subscriber>, now: Date): Promise<FollowUpCandidate[]> {
  const sent: { subscription_id: string; article_uid: string; snapshot: Record<string, unknown> }[] = [];
  const since = new Date(now.getTime() - FOLLOW_UP_WINDOW_MS).toISOString();
  for (let offset = 0; offset < MAX_FOLLOW_UP_ROWS; offset += PAGE_SIZE) {
    const { data, error } = await db
      .from('email_sends')
      .select('subscription_id, article_uid, snapshot')
      .eq('kind', 'alert')
      .eq('status', 'sent')
      .gt('sent_at', since)
      .not('article_uid', 'is', null)
      .order('sent_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error('Sent alerts could not be read');
    for (const row of data ?? []) {
      if (!subscribers.has(String(row.subscription_id))) continue;
      const snapshot = row.snapshot && typeof row.snapshot === 'object' ? row.snapshot as Record<string, unknown> : {};
      sent.push({ subscription_id: String(row.subscription_id), article_uid: String(row.article_uid), snapshot });
    }
    if (!data || data.length < PAGE_SIZE) break;
  }
  if (sent.length === 0) return [];

  const uids = [...new Set(sent.map((row) => row.article_uid))];
  const current = new Map<string, NewsletterSourceRow>();
  for (const batch of chunks(uids)) {
    const { data, error } = await db.from('news_articles').select(ARTICLE_COLUMNS).in('uid', batch);
    if (error) throw new Error('Alerted articles could not be read');
    for (const row of (data ?? []) as NewsletterSourceRow[]) current.set(row.uid, row);
  }

  // A deleted record counts as retracted only when the status trigger logged
  // it (Web3 incidents); other deletes are routine clean-up.
  const missing = uids.filter((uid) => !current.has(uid));
  const retractedItems = new Map<string, NewsletterItem>();
  for (const batch of chunks(missing)) {
    const { data, error } = await db
      .from('incident_status_events')
      .select('article_uid, snapshot')
      .eq('kind', 'retracted')
      .in('article_uid', batch)
      .order('created_at', { ascending: false });
    if (error) throw new Error('Incident status events could not be read');
    for (const row of data ?? []) {
      const uid = String(row.article_uid);
      if (!retractedItems.has(uid)) retractedItems.set(uid, statusChangeItem(row.snapshot, uid, SITE_URL));
    }
  }

  const candidates: FollowUpCandidate[] = [];
  const seen = new Set<string>();
  for (const row of sent) {
    const sub = subscribers.get(row.subscription_id);
    if (!sub) continue;
    const article = current.get(row.article_uid) ?? null;
    const plan = planAlertFollowUp(
      {
        sent_severity: typeof row.snapshot.sent_severity === 'string' ? row.snapshot.sent_severity : undefined,
        sent_verification: typeof row.snapshot.sent_verification === 'string' ? row.snapshot.sent_verification : undefined,
      },
      article ? { severity: article.severity, metadata: article.metadata } : null,
    );
    if (!plan) continue;
    const key = `${sub.id}/${row.article_uid}/${plan.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const item = article ? toNewsletterItem(article, SITE_URL) : retractedItems.get(row.article_uid);
    if (!item) continue;
    // Retractions are tracked for Web3 incidents only; a news story later
    // flagged not relevant is not a source retraction.
    if (plan.kind === 'retracted' && !item.isWeb3Incident) continue;
    if (plan.kind === 'upgraded_critical' && !matchesDeliveryPreferences(newsletterItemToDeliverable(item), sub)) continue;
    candidates.push({ sub, uid: row.article_uid, kind: plan.kind, item });
  }
  return candidates;
}

async function sendFollowUp(ctx: SendContext, candidate: FollowUpCandidate, suppressed: boolean): Promise<void> {
  const claim = await claimEmailSend(ctx.ledger, {
    subscription_id: candidate.sub.id,
    kind: 'alert_followup',
    item_key: `${candidate.uid}:${candidate.kind}`,
    article_uid: candidate.uid,
    ...(candidate.item.articleId ? { article_id: candidate.item.articleId } : {}),
    snapshot: { follow_up: candidate.kind, ...snapshotFor(candidate.item) },
  }, ctx.now);
  if (!claim) return;
  if (suppressed) {
    await finishEmailSend(ctx.ledger, claim.id, { status: 'suppressed' });
    ctx.counters.suppressed++;
    return;
  }

  const links = linksFor(candidate.sub.email, candidate.sub.verification_token, ctx.supabaseUrl);
  const { html, text } = renderFollowUpEmail({ kind: candidate.kind, item: candidate.item, links, postalAddress: ctx.postalAddress, siteUrl: SITE_URL });
  await ctx.throttle();
  const outcome = await sendResendEmail({
    fetchImpl: fetch,
    apiKey: ctx.apiKey,
    idempotencyKey: claim.idempotencyKey,
    email: {
      from: FROM,
      to: [candidate.sub.email],
      subject: buildFollowUpSubject(candidate.kind, candidate.item),
      html,
      text,
      reply_to: REPLY_TO,
      headers: listUnsubscribeHeaders(links),
      tags: [{ name: 'kind', value: 'alert_followup' }],
    },
  });
  await finishEmailSend(ctx.ledger, claim.id, outcome);
  tally(ctx.counters, outcome);
  if (outcome.status === 'sent') ctx.counters.followUpsSent++;
}

async function sendTestAlert(db: Db, apiKey: string, supabaseUrl: string, adminEmail: string, now: Date): Promise<Response> {
  const items = await loadRecentItems(db, new Date(now.getTime() - TEST_LOOKBACK_MS));
  const latest = items[0]; // newest first
  if (!latest) return json({ success: false, error: 'No critical or high record in the last 30 days' }, 404);

  const { data: own } = await db
    .from('subscriptions')
    .select('verification_token')
    .eq('email', normalizeEmail(adminEmail))
    .maybeSingle();
  const token = typeof own?.verification_token === 'string' ? own.verification_token : PLACEHOLDER_TOKEN;
  const links = linksFor(adminEmail, token, supabaseUrl);
  const postalAddress = readPostalAddress(Deno.env.get('NEWSLETTER_POSTAL_ADDRESS'));
  const { html, text } = renderAlertEmail({ items: [latest], links, postalAddress, siteUrl: SITE_URL });
  const outcome = await sendResendEmail({
    fetchImpl: fetch,
    apiKey,
    idempotencyKey: `test/alert/${crypto.randomUUID()}`,
    email: {
      from: FROM,
      to: [adminEmail],
      subject: buildAlertSubject([latest]),
      html,
      text,
      reply_to: REPLY_TO,
      headers: listUnsubscribeHeaders(links),
      tags: [{ name: 'kind', value: 'alert_test' }],
    },
  });
  return json({ success: outcome.status === 'sent', test: true, outcome: outcome.status }, outcome.status === 'sent' ? 200 : 502);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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
    if (!apiKey) return json({ error: 'RESEND_API_KEY is not configured' }, 500);
    try {
      return await sendTestAlert(db, apiKey, supabaseUrl, principal.email, now);
    } catch (error) {
      console.error('[send-critical-alerts] test send failed:', error instanceof Error ? error.message : 'unknown');
      return json({ success: false, error: 'Test send failed' }, 500);
    }
  }

  const counters: Counters = { emailsSent: 0, itemsSent: 0, followUpsSent: 0, failed: 0, unknown: 0, suppressed: 0, deferred: 0 };
  let itemsFound = 0;
  let subscriberCount = 0;
  try {
    const items = await loadRecentItems(db, new Date(now.getTime() - LOOKBACK_MS));
    itemsFound = items.length;
    const subscribers = await loadSubscribers(db);
    subscriberCount = subscribers.length;

    if (!apiKey) {
      const wouldSend = subscribers.filter((sub) =>
        items.some((item) => matchesDeliveryPreferences(newsletterItemToDeliverable(item), sub))).length;
      console.warn('[send-critical-alerts] RESEND_API_KEY not configured; nothing sent');
      await recordIngestionRun(db, {
        pipeline: 'critical-alerts',
        attempted_at: now.toISOString(),
        completed_at: new Date().toISOString(),
        success: false,
        records_found: itemsFound,
        duration_ms: Date.now() - startedAt,
        error_summary: 'RESEND_API_KEY not configured',
        metadata: { subscriptions: subscriberCount, would_send: wouldSend },
      });
      return json({ success: true, message: 'RESEND_API_KEY not configured - nothing sent', wouldSend, articles: itemsFound, subscriptions: subscriberCount });
    }

    const suppressed = await loadSuppressed(db, subscribers);
    const ctx: SendContext = {
      db,
      ledger: db as unknown as LedgerDb,
      apiKey,
      supabaseUrl,
      postalAddress: readPostalAddress(Deno.env.get('NEWSLETTER_POSTAL_ADDRESS')),
      throttle: createThrottle(RESEND_MIN_INTERVAL_MS),
      startedAt,
      now,
      counters,
    };

    for (const sub of items.length > 0 ? subscribers : []) {
      const matching = items.filter((item) => matchesDeliveryPreferences(newsletterItemToDeliverable(item), sub));
      if (matching.length === 0) continue;
      if (outOfTime(ctx)) {
        counters.deferred++;
        continue;
      }
      try {
        const done = await alreadySent(db, sub, matching, now);
        const fresh = matching.filter((item) => !done.has(item.uid)).sort(compareItems).slice(0, MAX_ITEMS_PER_EMAIL);
        if (fresh.length > 0) await sendAlertTo(ctx, sub, fresh, suppressed.has(sub.id));
      } catch (error) {
        counters.failed++;
        console.error(`[send-critical-alerts] subscription ${sub.id}:`, error instanceof Error ? error.message : 'unknown');
      }
    }

    if (outOfTime(ctx)) {
      counters.deferred++;
    } else {
      const followUps = await planFollowUps(db, new Map(subscribers.map((sub) => [sub.id, sub])), now);
      for (const candidate of followUps) {
        if (outOfTime(ctx)) {
          counters.deferred++;
          continue;
        }
        try {
          await sendFollowUp(ctx, candidate, suppressed.has(candidate.sub.id));
        } catch (error) {
          counters.failed++;
          console.error(`[send-critical-alerts] follow-up for ${candidate.sub.id}:`, error instanceof Error ? error.message : 'unknown');
        }
      }
    }

    const summary = {
      articles: itemsFound,
      subscriptions: subscriberCount,
      sent: counters.emailsSent,
      items_sent: counters.itemsSent,
      follow_ups_sent: counters.followUpsSent,
      failed: counters.failed,
      unknown: counters.unknown,
      suppressed: counters.suppressed,
      deferred: counters.deferred,
    };
    await recordIngestionRun(db, {
      pipeline: 'critical-alerts',
      attempted_at: now.toISOString(),
      completed_at: new Date().toISOString(),
      success: counters.failed === 0,
      records_found: itemsFound,
      records_inserted: counters.emailsSent + counters.followUpsSent,
      records_invalid: counters.failed,
      duration_ms: Date.now() - startedAt,
      ...(counters.failed > 0 ? { error_summary: `${counters.failed} send(s) failed` } : {}),
      metadata: summary,
    });
    return json({ success: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-critical-alerts] Fatal error:', message);
    await recordIngestionRun(db, {
      pipeline: 'critical-alerts',
      attempted_at: now.toISOString(),
      completed_at: new Date().toISOString(),
      success: false,
      records_found: itemsFound,
      duration_ms: Date.now() - startedAt,
      error_summary: message,
      metadata: { subscriptions: subscriberCount, sent: counters.emailsSent },
    });
    return json({ success: false, error: 'Alert run failed' }, 500);
  }
});
