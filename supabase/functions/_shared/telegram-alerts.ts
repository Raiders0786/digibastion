export const TELEGRAM_MESSAGE_LIMIT = 4096;

export type TelegramSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface TelegramAlertArticle {
  id: string;
  uid: string;
  title: string;
  summary: string | null;
  severity: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface TelegramPostedState {
  posted_text: string | null;
  posted_verification: string | null;
  project_name?: string | null;
}

export type TelegramPostPlan =
  | { action: 'none' }
  | { action: 'edit' | 'retract'; text: string; baseText: string; verification: string };

const SEVERITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
const SEVERITY_ICON: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '⚪', info: '⚪' };
const PROVIDER_LABELS: Record<string, string> = { quillmonitor: 'QuillMonitor' };

// Only QuillMonitor is posted until cross-provider dedup ships: its records have
// stable IDs and a verification status, while the other incident importers can
// describe the same incident under different titles and amounts.
const TELEGRAM_PROVIDERS = new Set(Object.keys(PROVIDER_LABELS));

const MAX_INGEST_AGE_MS = 24 * 60 * 60 * 1000;
// A provider backfill inserts old incidents with a fresh created_at, so the
// incident's own date must be recent too.
const MAX_INCIDENT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SUMMARY_CHARS = 400;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function meta(article: TelegramAlertArticle | null): Record<string, unknown> {
  return article?.metadata && typeof article.metadata === 'object' ? article.metadata : {};
}

export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildIncidentUrl(siteUrl: string, articleId: string): string {
  return `${siteUrl.replace(/\/+$/, '')}/threat-intel/${encodeURIComponent(articleId)}` +
    '?utm_source=telegram&utm_medium=social&utm_campaign=incident_alerts';
}

function isWithdrawn(article: TelegramAlertArticle | null): boolean {
  const metadata = meta(article);
  return !article || Boolean(metadata.duplicate_of_uid) || metadata.classification_relevant === false;
}

export function isEligibleForTelegram(
  article: TelegramAlertArticle,
  now: Date,
  options: { minSeverity: TelegramSeverity },
): boolean {
  const metadata = meta(article);
  if (!TELEGRAM_PROVIDERS.has(text(metadata.provider))) return false;
  if (metadata.is_web3_incident !== true || isWithdrawn(article)) return false;
  if ((SEVERITY_RANK[article.severity] ?? -1) < SEVERITY_RANK[options.minSeverity]) return false;

  const ingestedAt = Date.parse(article.created_at);
  if (Number.isNaN(ingestedAt) || now.getTime() - ingestedAt > MAX_INGEST_AGE_MS) return false;

  const incidentDate = text(metadata.incident_date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(incidentDate)) return false;
  const incidentAt = Date.parse(`${incidentDate}T00:00:00.000Z`);
  return !Number.isNaN(incidentAt) && now.getTime() - incidentAt <= MAX_INCIDENT_AGE_MS;
}

// Works on code points, so an emoji at the cut is never split into a lone
// surrogate, which Telegram rejects.
function truncateAtWord(value: string, limit: number): string {
  const chars = Array.from(value);
  if (chars.length <= limit) return value;
  const cut = chars.slice(0, limit).join('');
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function formatUtcTime(now: Date): string {
  return now.toISOString().slice(11, 16);
}

export function buildTelegramIncidentMessage(
  article: TelegramAlertArticle,
  siteUrl: string,
  note?: string,
  now: Date = new Date(),
): string {
  const metadata = meta(article);
  const verified = metadata.verification_status === 'verified';
  const project = text(metadata.project_name) || article.title;
  const attack = text(metadata.attack_type) || 'Security incident';
  const chain = text(metadata.chain);
  const amount = text(metadata.amount_display);
  const incidentDate = text(metadata.incident_date);
  const source = PROVIDER_LABELS[text(metadata.provider)] || 'Incident tracker';
  const summary = text(article.summary);
  const showSummary = summary && !/^summary pending$/i.test(summary);

  const header = `${SEVERITY_ICON[article.severity] ?? '⚪'} <b>${verified ? 'CONFIRMED' : 'UNCONFIRMED'}</b> · ` +
    `${escapeTelegramHtml(attack)}${chain ? ` · ${escapeTelegramHtml(chain)}` : ''}`;
  const loss = amount
    ? `<b>${escapeTelegramHtml(project)}</b>: ~${escapeTelegramHtml(amount)} ${verified ? 'lost' : 'reported lost'}`
    : `<b>${escapeTelegramHtml(project)}</b>: loss not disclosed yet`;
  const details = [
    incidentDate ? `Incident date: ${escapeTelegramHtml(incidentDate)}` : '',
    `Source: ${escapeTelegramHtml(source)}`,
    verified ? '' : '<i>Unconfirmed report. Details may change.</i>',
  ].filter(Boolean);
  const footer = [
    `<a href="${escapeTelegramHtml(buildIncidentUrl(siteUrl, article.id))}">Full details on DigiBastion</a>`,
    'Check your token approvals: <a href="https://revoke.cash">revoke.cash</a>',
    note ? `<i>Updated ${formatUtcTime(now)} UTC: ${escapeTelegramHtml(note)}.</i>` : '',
  ].filter(Boolean);

  const withSummary = (body: string) => [header, loss, ...(body ? ['', body, ''] : ['']), ...details, '', ...footer].join('\n');
  const message = withSummary(showSummary ? escapeTelegramHtml(truncateAtWord(summary, MAX_SUMMARY_CHARS)) : '');
  return message.length <= TELEGRAM_MESSAGE_LIMIT ? message : withSummary('');
}

export function buildRetractionMessage(project: string, siteUrl: string): string {
  const latest = `${siteUrl.replace(/\/+$/, '')}/threat-intel?scope=web3-incidents`;
  return [
    `⚪ <b>RETRACTED</b> · ${escapeTelegramHtml(project)}`,
    'The source withdrew this report or merged it into another one.',
    '',
    `<a href="${escapeTelegramHtml(latest)}">Latest incidents on DigiBastion</a>`,
  ].join('\n');
}

/**
 * Decides how an already-posted message should change. `baseText` (the message
 * without a dated update note) is what gets stored and compared, so a note
 * added on one run does not trigger another edit on the next.
 */
export function planTelegramPostUpdate(
  posted: TelegramPostedState,
  article: TelegramAlertArticle | null,
  siteUrl: string,
  now: Date,
): TelegramPostPlan {
  if (posted.posted_verification === 'retracted') return { action: 'none' };

  if (isWithdrawn(article)) {
    const project = text(meta(article).project_name) || text(posted.project_name) || 'This incident';
    const retraction = buildRetractionMessage(project, siteUrl);
    return { action: 'retract', text: retraction, baseText: retraction, verification: 'retracted' };
  }

  const current = article as TelegramAlertArticle;
  const verification = text(meta(current).verification_status) || 'unverified';
  const baseText = buildTelegramIncidentMessage(current, siteUrl);
  if (baseText === posted.posted_text) return { action: 'none' };

  const newlyConfirmed = posted.posted_verification !== 'verified' && verification === 'verified';
  const note = newlyConfirmed
    ? `confirmed by ${PROVIDER_LABELS[text(meta(current).provider)] || 'the source'}`
    : undefined;
  return {
    action: 'edit',
    text: note ? buildTelegramIncidentMessage(current, siteUrl, note, now) : baseText,
    baseText,
    verification,
  };
}
