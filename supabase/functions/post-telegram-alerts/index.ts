import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { z } from 'npm:zod@3.23.8';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
import {
  buildTelegramIncidentMessage,
  buildWeeklyLinkMessage,
  buildWeeklyPostUrl,
  incidentLinkPreview,
  isEligibleForTelegram,
  isIncidentPostUid,
  NO_LINK_PREVIEW,
  planTelegramPostUpdate,
  WEEKLY_POST_UID_PREFIX,
  type TelegramAlertArticle,
  type TelegramLinkPreview,
  type TelegramSeverity,
} from '../_shared/telegram-alerts.ts';
import { SITE_URL } from '../_shared/site-urls.ts';
import { isWeeklyPublicContent, toPublicWeekly } from '../_shared/weekly-render.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const RequestSchema = z.object({
  mode: z.enum(['run', 'seed', 'check', 'weekly']).optional().default('run'),
  dryRun: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(10).optional().default(10),
}).strict();

const ARTICLE_COLUMNS = 'id,uid,title,summary,severity,created_at,metadata,link';
const SEND_INTERVAL_MS = 3_000;
const MAX_RETRY_AFTER_SECONDS = 30;
const MAX_SEND_ATTEMPTS = 3;
const EDIT_WINDOW_DAYS = 14;
const SEVERITIES: TelegramSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
// The weekly post runs Monday 01:00 UTC for the issue whose week started the
// Monday before; eight days leaves room for a late rebuild without ever
// reaching back to the week before that.
const WEEKLY_LOOKBACK_DAYS = 8;

type TelegramResult = {
  ok: boolean;
  result?: Record<string, unknown>;
  description?: string;
  error_code?: number;
  parameters?: { retry_after?: number };
};

type PostTarget = { uid: string; articleId: string | null; projectName: string | null };

type DeliveryOutcome = 'sent' | 'failed' | 'unknown';

type PostRow = {
  id: string;
  article_uid: string;
  message_id: number | null;
  status: string;
  attempts: number;
  posted_text: string | null;
  posted_verification: string | null;
  project_name: string | null;
};

class TelegramRateLimitError extends Error {}

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The bot token is part of the request URL, so errors are reduced to Telegram's
// own description and never include the URL or the thrown network error.
async function callTelegram(token: string, method: string, payload: Record<string, unknown>): Promise<TelegramResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try {
      response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return { ok: false, description: `Telegram ${method} request failed` };
    }
    const body = await response.json().catch(() => null) as TelegramResult | null;
    if (!body) return { ok: false, description: `Telegram ${method} returned HTTP ${response.status}` };
    const retryAfter = body.parameters?.retry_after;
    if (body.error_code === 429 && attempt === 0 && retryAfter && retryAfter <= MAX_RETRY_AFTER_SECONDS) {
      await sleep(retryAfter * 1000);
      continue;
    }
    if (body.error_code === 429) throw new TelegramRateLimitError('Telegram rate limit exceeded');
    return body;
  }
  throw new TelegramRateLimitError('Telegram rate limit exceeded');
}

function sanitizeError(result: TelegramResult): string {
  return (result.description || 'Unknown Telegram error').slice(0, 300);
}

// Telegram answered with a client error, so the message was definitely not
// posted or edited. 429 is handled separately as a rate limit.
function isRejected(result: TelegramResult): boolean {
  return !result.ok && typeof result.error_code === 'number' &&
    result.error_code >= 400 && result.error_code < 500 && result.error_code !== 429;
}

function isNotModified(result: TelegramResult): boolean {
  return !result.ok && /message is not modified/i.test(result.description || '');
}

// Defaults to `low`: QuillMonitor rates incidents with an undisclosed loss as
// low, and those are often the earliest reports of a breach.
function resolveSeverity(value: string | undefined): TelegramSeverity {
  return SEVERITIES.includes(value as TelegramSeverity) ? value as TelegramSeverity : 'low';
}

async function resolveChat(token: string, chatRef: string): Promise<{ id: string; title: string } | null> {
  const chat = await callTelegram(token, 'getChat', { chat_id: chatRef });
  if (!chat.ok || !chat.result) return null;
  return { id: String(chat.result.id), title: String(chat.result.title || chat.result.username || '') };
}

async function checkSetup(token: string, chatRefs: Record<string, string | undefined>) {
  const me = await callTelegram(token, 'getMe', {});
  if (!me.ok || !me.result) return { ok: false, error: sanitizeError(me) };
  const botId = me.result.id;
  const chats: Record<string, unknown> = {};
  for (const [label, chatRef] of Object.entries(chatRefs)) {
    if (!chatRef) {
      chats[label] = { configured: false };
      continue;
    }
    const chat = await callTelegram(token, 'getChat', { chat_id: chatRef });
    if (!chat.ok || !chat.result) {
      chats[label] = { configured: true, reachable: false, error: sanitizeError(chat) };
      continue;
    }
    const member = await callTelegram(token, 'getChatMember', { chat_id: chat.result.id, user_id: botId });
    const rights = member.result || {};
    chats[label] = {
      configured: true,
      reachable: true,
      chat_id: String(chat.result.id),
      type: chat.result.type,
      title: chat.result.title,
      bot_status: rights.status,
      can_post_messages: rights.status === 'creator' || rights.can_post_messages === true,
      can_edit_messages: rights.status === 'creator' || rights.can_edit_messages === true,
      can_delete_messages: rights.status === 'creator' || rights.can_delete_messages === true,
    };
  }
  return { ok: true, bot_username: me.result.username, chats };
}

async function loadCandidates(db: SupabaseClient, now: Date): Promise<TelegramAlertArticle[]> {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const incidentSince = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // Recency and incident filters run in the query, newest first, so a bulk
  // import of older rows cannot push genuinely new incidents past the limit.
  const { data, error } = await db
    .from('news_articles')
    .select(ARTICLE_COLUMNS)
    .eq('metadata->>provider', 'quillmonitor')
    .eq('metadata->>is_web3_incident', 'true')
    .gte('metadata->>incident_date', incidentSince)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error('Candidate incidents could not be read');
  // Post oldest first so the channel reads in the order incidents arrived.
  return ((data || []) as TelegramAlertArticle[]).filter((article) => isIncidentPostUid(article.uid)).reverse();
}

async function syncPostedMessages(
  db: SupabaseClient,
  token: string,
  chatId: string,
  siteUrl: string,
  now: Date,
  limit: number,
): Promise<{ edited: number; retracted: number; failed: number }> {
  const since = new Date(now.getTime() - EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: posts, error } = await db
    .from('telegram_posts')
    .select('id,article_uid,message_id,status,attempts,posted_text,posted_verification,project_name')
    .eq('chat_id', chatId)
    .eq('status', 'sent')
    .not('article_uid', 'like', `${WEEKLY_POST_UID_PREFIX}%`)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error('Posted messages could not be read');
  // Weekly link posts have no article; without this filter the edit pass would
  // find none and edit them to RETRACTED.
  const rows = ((posts || []) as PostRow[]).filter((row) => isIncidentPostUid(row.article_uid));
  if (rows.length === 0) return { edited: 0, retracted: 0, failed: 0 };

  const { data: articles, error: articleError } = await db
    .from('news_articles')
    .select(ARTICLE_COLUMNS)
    .in('uid', rows.map((row) => row.article_uid));
  if (articleError) throw new Error('Posted incidents could not be read');
  const articlesByUid = new Map(((articles || []) as TelegramAlertArticle[]).map((article) => [article.uid, article]));

  let edited = 0;
  let retracted = 0;
  let failed = 0;
  for (const row of rows) {
    // Failures count toward the limit so a run of failing edits cannot use up
    // the time budget that new posts need.
    if (edited + retracted + failed >= limit) break;
    const plan = planTelegramPostUpdate(row, articlesByUid.get(row.article_uid) ?? null, siteUrl, now);
    if (plan.action === 'none' || !row.message_id) continue;

    if (edited + retracted + failed > 0) await sleep(SEND_INTERVAL_MS);
    const result = await callTelegram(token, 'editMessageText', {
      chat_id: chatId,
      message_id: row.message_id,
      text: plan.text,
      parse_mode: 'HTML',
      // A retraction drops the card; a status edit keeps it.
      link_preview_options: plan.action === 'edit' ? incidentLinkPreview(articlesByUid.get(row.article_uid)?.id) : NO_LINK_PREVIEW,
    });
    if (!result.ok && !isNotModified(result)) {
      failed++;
      // A rejected edit (message deleted by an admin, bad markup) will never
      // succeed, so it stops being retried. Unclear failures retry next run;
      // editing twice is harmless.
      await db.from('telegram_posts').update({
        status: isRejected(result) ? 'edit_failed' : 'sent',
        last_error: sanitizeError(result),
      }).eq('id', row.id);
      continue;
    }
    await db.from('telegram_posts').update({
      posted_text: plan.baseText,
      posted_verification: plan.verification,
      status: plan.action === 'retract' ? 'retracted' : 'sent',
      last_error: null,
      edited_at: now.toISOString(),
    }).eq('id', row.id);
    if (plan.action === 'retract') retracted++;
    else edited++;
  }
  return { edited, retracted, failed };
}

async function claimPost(
  db: SupabaseClient,
  chatId: string,
  target: PostTarget,
  previous: { id: string; status: string; attempts: number } | undefined,
): Promise<{ id: string; attempts: number } | null> {
  if (!previous) {
    // The unique (article_uid, chat_id) insert is the claim: when the cron run
    // and the QuillMonitor trigger overlap, only one of them wins.
    const { data, error } = await db.from('telegram_posts').insert({
      article_uid: target.uid,
      article_id: target.articleId,
      chat_id: chatId,
      status: 'claimed',
      project_name: target.projectName ? target.projectName.slice(0, 200) : null,
    }).select('id').single();
    return error || !data ? null : { id: data.id, attempts: 0 };
  }
  if (previous.status !== 'failed' || previous.attempts >= MAX_SEND_ATTEMPTS) return null;
  // Retries are claimed with a conditional update for the same reason.
  const { data, error } = await db.from('telegram_posts')
    .update({ status: 'claimed' })
    .eq('id', previous.id)
    .eq('status', 'failed')
    .eq('attempts', previous.attempts)
    .select('id');
  return error || !data?.length ? null : { id: previous.id, attempts: previous.attempts };
}

function articleTarget(article: TelegramAlertArticle): PostTarget {
  const projectName = article.metadata?.project_name;
  return { uid: article.uid, articleId: article.id, projectName: typeof projectName === 'string' ? projectName : null };
}

/**
 * Sends one claimed post and records the outcome on its row. Throws
 * TelegramRateLimitError after releasing the claim when rate limited.
 */
async function deliverClaimedPost(
  db: SupabaseClient,
  token: string,
  chatId: string,
  claim: { id: string; attempts: number },
  text: string,
  sentFields: { posted_verification: string | null; posted_severity: string | null },
  linkPreview: TelegramLinkPreview = NO_LINK_PREVIEW,
): Promise<DeliveryOutcome> {
  let result: TelegramResult;
  try {
    result = await callTelegram(token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      link_preview_options: linkPreview,
    });
  } catch (error) {
    // Rate limited: nothing was delivered, so release the claim without
    // spending an attempt and stop the run.
    await db.from('telegram_posts').update({ status: 'failed', last_error: 'Telegram rate limit exceeded' }).eq('id', claim.id);
    throw error;
  }

  const messageId = Number(result.result?.message_id);
  if (result.ok && Number.isFinite(messageId)) {
    const { error: saveError } = await db.from('telegram_posts').update({
      status: 'sent',
      message_id: messageId,
      attempts: claim.attempts + 1,
      posted_text: text,
      ...sentFields,
      last_error: null,
      sent_at: new Date().toISOString(),
    }).eq('id', claim.id);
    // The row stays `claimed`, which is never retried, so this cannot repost.
    if (saveError) console.warn('[post-telegram-alerts] Sent message could not be recorded');
    return 'sent';
  }

  // Only an explicit rejection from Telegram proves nothing was posted. A
  // timeout or 5xx may have been delivered, so it is parked as `unknown`
  // for manual review instead of being retried into a duplicate.
  const rejected = isRejected(result);
  await db.from('telegram_posts').update({
    status: rejected ? 'failed' : 'unknown',
    attempts: claim.attempts + 1,
    last_error: sanitizeError(result),
  }).eq('id', claim.id);
  return rejected ? 'failed' : 'unknown';
}

async function postNewIncidents(
  db: SupabaseClient,
  token: string,
  chatId: string,
  siteUrl: string,
  eligible: TelegramAlertArticle[],
  limit: number,
  pacingStarted: boolean,
): Promise<{ sent: number; failed: number; unknown: number }> {
  if (eligible.length === 0) return { sent: 0, failed: 0, unknown: 0 };
  const { data: existing, error } = await db
    .from('telegram_posts')
    .select('id,article_uid,status,attempts')
    .eq('chat_id', chatId)
    .in('article_uid', eligible.map((article) => article.uid));
  if (error) throw new Error('Existing posts could not be read');
  const existingByUid = new Map((existing || []).map((row) => [row.article_uid as string, row]));

  let sent = 0;
  let failed = 0;
  let unknown = 0;
  for (const article of eligible) {
    if (sent + failed + unknown >= limit) break;
    const claim = await claimPost(db, chatId, articleTarget(article), existingByUid.get(article.uid));
    if (!claim) continue;

    if (pacingStarted || sent + failed + unknown > 0) await sleep(SEND_INTERVAL_MS);
    const metadata = article.metadata || {};
    const outcome = await deliverClaimedPost(db, token, chatId, claim, buildTelegramIncidentMessage(article, siteUrl), {
      posted_verification: typeof metadata.verification_status === 'string' ? metadata.verification_status : null,
      posted_severity: article.severity,
    }, incidentLinkPreview(article.id));
    if (outcome === 'sent') sent++;
    else if (outcome === 'failed') failed++;
    else unknown++;
  }
  return { sent, failed, unknown };
}

type WeeklyPostResult =
  | { skipped: 'no_weekly_issue' | 'already_posted'; weekStart: string | null }
  | { outcome: DeliveryOutcome; weekStart: string };

/** Posts the link to the latest ready or sent weekly issue once per chat, keyed weekly:<weekStart>. */
async function postWeeklyLink(
  db: SupabaseClient,
  token: string,
  chatId: string,
  siteUrl: string,
  now: Date,
): Promise<WeeklyPostResult> {
  const since = new Date(now.getTime() - WEEKLY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: issue, error } = await db
    .from('newsletter_issues')
    .select('period_start,content')
    .eq('kind', 'weekly')
    .in('status', ['ready', 'sent'])
    .gte('period_start', since)
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Weekly issue could not be read');
  if (!issue) return { skipped: 'no_weekly_issue', weekStart: null };
  if (!isWeeklyPublicContent(issue.content)) throw new Error('Weekly issue content is invalid');

  const periodStart = new Date(String(issue.period_start));
  if (Number.isNaN(periodStart.getTime())) throw new Error('Weekly issue period is invalid');
  const weekStart = periodStart.toISOString().slice(0, 10);
  const uid = `${WEEKLY_POST_UID_PREFIX}${weekStart}`;

  const { data: existing, error: existingError } = await db
    .from('telegram_posts')
    .select('id,status,attempts')
    .eq('chat_id', chatId)
    .eq('article_uid', uid)
    .maybeSingle();
  if (existingError) throw new Error('Existing weekly post could not be read');
  const claim = await claimPost(db, chatId, { uid, articleId: null, projectName: null }, existing ?? undefined);
  if (!claim) return { skipped: 'already_posted', weekStart };

  const url = buildWeeklyPostUrl(siteUrl, weekStart);
  const text = buildWeeklyLinkMessage(toPublicWeekly(issue.content), url);
  const outcome = await deliverClaimedPost(db, token, chatId, claim, text, { posted_verification: null, posted_severity: null });
  return { outcome, weekStart };
}

async function seedExisting(db: SupabaseClient, chatId: string, eligible: TelegramAlertArticle[]): Promise<number> {
  if (eligible.length === 0) return 0;
  const { data, error } = await db.from('telegram_posts').upsert(
    eligible.map((article) => ({
      article_uid: article.uid,
      article_id: article.id,
      chat_id: chatId,
      status: 'seeded',
      project_name: typeof article.metadata?.project_name === 'string' ? article.metadata.project_name.slice(0, 200) : null,
    })),
    { onConflict: 'article_uid,chat_id', ignoreDuplicates: true },
  ).select('id');
  if (error) throw new Error('Existing incidents could not be seeded');
  return data?.length ?? 0;
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
  if (!url || !anonKey || !serviceKey) {
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

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const channelRef = Deno.env.get('TELEGRAM_CHANNEL_ID');
  const testChannelRef = Deno.env.get('TELEGRAM_TEST_CHANNEL_ID');
  // `true` posts to the channel, `test` sends every run to the test channel,
  // and anything else (including unset) leaves scheduled runs as no-ops.
  const postingSetting = Deno.env.get('TELEGRAM_POSTING_ENABLED');
  const postingEnabled = postingSetting === 'true';
  const minSeverity = resolveSeverity(Deno.env.get('TELEGRAM_MIN_SEVERITY'));
  const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || SITE_URL;
  const db = createClient(url, serviceKey);
  const { mode, limit } = request.data;
  const dryRun = request.data.dryRun || postingSetting === 'test';

  if (!token) {
    await recordIngestionRun(db, {
      pipeline: 'telegram', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
      success: false, duration_ms: Date.now() - startedAt, error_summary: 'TELEGRAM_BOT_TOKEN is not configured',
    });
    return new Response(JSON.stringify({ error: 'Telegram is not configured' }), { status: 500, headers: jsonHeaders });
  }

  try {
    if (mode === 'check') {
      const report = await checkSetup(token, { channel: channelRef, test_channel: testChannelRef });
      return new Response(JSON.stringify({ ...report, posting_mode: postingEnabled ? 'live' : postingSetting === 'test' ? 'test' : 'off', min_severity: minSeverity }), {
        status: report.ok ? 200 : 502, headers: jsonHeaders,
      });
    }

    const targetRef = dryRun ? testChannelRef : channelRef;
    if (!targetRef) throw new Error(dryRun ? 'TELEGRAM_TEST_CHANNEL_ID is not configured' : 'TELEGRAM_CHANNEL_ID is not configured');
    if ((mode === 'run' || mode === 'weekly') && !dryRun && !postingEnabled) {
      await recordIngestionRun(db, {
        pipeline: 'telegram', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
        success: true, duration_ms: Date.now() - startedAt, metadata: { mode, skipped: 'posting_disabled' },
      });
      return new Response(JSON.stringify({ success: true, skipped: 'posting_disabled' }), { headers: jsonHeaders });
    }

    // Posts are keyed by the numeric chat ID, so switching the secret between
    // `@username` and `-100…` forms cannot cause reposts.
    const chat = await resolveChat(token, targetRef);
    if (!chat) throw new Error('Telegram chat could not be resolved; run mode "check"');

    const now = new Date();
    if (mode === 'weekly') {
      let result: WeeklyPostResult | null = null;
      let rateLimited = false;
      try {
        result = await postWeeklyLink(db, token, chat.id, siteUrl, now);
      } catch (error) {
        if (!(error instanceof TelegramRateLimitError)) throw error;
        rateLimited = true;
      }
      const outcome = result && 'outcome' in result ? result.outcome : null;
      const skipped = result && 'skipped' in result ? result.skipped : null;
      const success = !rateLimited && (outcome === null || outcome === 'sent');
      console.log(`[post-telegram-alerts] mode=weekly dry_run=${dryRun} week_start=${result?.weekStart ?? 'none'} outcome=${outcome ?? skipped ?? 'rate_limited'}`);
      await recordIngestionRun(db, {
        pipeline: 'telegram', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
        success, records_found: result?.weekStart ? 1 : 0, records_inserted: outcome === 'sent' ? 1 : 0,
        records_invalid: outcome === 'failed' || outcome === 'unknown' ? 1 : 0,
        duration_ms: Date.now() - startedAt,
        error_summary: rateLimited
          ? 'Telegram rate limit reached; run mode "weekly" again to post the link'
          : outcome === 'unknown'
            ? 'Weekly Telegram post has an unknown outcome; review telegram_posts rows with status unknown'
            : outcome === 'failed' ? 'Weekly Telegram post was rejected' : undefined,
        metadata: { mode, dry_run: dryRun, week_start: result?.weekStart ?? null, outcome, skipped },
      });
      return new Response(JSON.stringify({
        success,
        mode,
        dryRun,
        weekStart: result?.weekStart ?? null,
        outcome,
        skipped,
        rateLimited,
      }), { status: success ? 200 : 207, headers: jsonHeaders });
    }

    const candidates = await loadCandidates(db, now);
    const eligible = candidates.filter((article) => isEligibleForTelegram(article, now, { minSeverity }));

    if (mode === 'seed') {
      const seeded = await seedExisting(db, chat.id, eligible);
      await recordIngestionRun(db, {
        pipeline: 'telegram', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
        success: true, records_found: eligible.length, duration_ms: Date.now() - startedAt,
        metadata: { mode, dry_run: dryRun, seeded },
      });
      return new Response(JSON.stringify({ success: true, mode, eligible: eligible.length, seeded }), { headers: jsonHeaders });
    }

    let edits = { edited: 0, retracted: 0, failed: 0 };
    let posts = { sent: 0, failed: 0, unknown: 0 };
    let rateLimited = false;
    try {
      edits = await syncPostedMessages(db, token, chat.id, siteUrl, now, limit);
      posts = await postNewIncidents(db, token, chat.id, siteUrl, eligible, limit, edits.edited + edits.retracted + edits.failed > 0);
    } catch (error) {
      if (!(error instanceof TelegramRateLimitError)) throw error;
      rateLimited = true;
    }

    const failures = edits.failed + posts.failed + posts.unknown;
    const success = failures === 0 && !rateLimited;
    console.log(`[post-telegram-alerts] mode=${mode} dry_run=${dryRun} eligible=${eligible.length} sent=${posts.sent} edited=${edits.edited} retracted=${edits.retracted} failed=${failures} rate_limited=${rateLimited}`);
    await recordIngestionRun(db, {
      pipeline: 'telegram', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
      success, records_found: eligible.length, records_inserted: posts.sent,
      records_updated: edits.edited + edits.retracted, records_invalid: failures,
      duration_ms: Date.now() - startedAt,
      error_summary: rateLimited
        ? 'Telegram rate limit reached; remaining work deferred to the next run'
        : posts.unknown > 0
          ? `${posts.unknown} Telegram posts have an unknown outcome; review telegram_posts rows with status unknown`
          : failures > 0 ? `${failures} Telegram requests failed` : undefined,
      metadata: { mode, dry_run: dryRun, min_severity: minSeverity, retracted: edits.retracted, unknown_outcome: posts.unknown },
    });
    return new Response(JSON.stringify({
      success,
      dryRun,
      eligible: eligible.length,
      sent: posts.sent,
      edited: edits.edited,
      retracted: edits.retracted,
      failed: failures,
      unknownOutcome: posts.unknown,
      rateLimited,
    }), { status: success ? 200 : 207, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Telegram posting failed';
    console.error(`[post-telegram-alerts] ${message}`);
    await recordIngestionRun(db, {
      pipeline: 'telegram', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
      success: false, duration_ms: Date.now() - startedAt, error_summary: message,
    });
    return new Response(JSON.stringify({ success: false, error: message }), { status: 502, headers: jsonHeaders });
  }
});
