// Newsletter emails: the daily brief body (HTML and text) inside the shared
// compliance shell, and the kind dispatcher the sender calls. Copy follows
// spec section 9: name the source, use the source's status words, "~$4.2M
// reported", no hype, no tracking pixel.
// Pure module: no Deno or URL imports, so vitest can import it.
import { buildDailySubject, isDailyBriefContent, shortIssueDate } from './daily-brief.ts';
import {
  renderComplianceFooterHtml,
  renderComplianceFooterText,
  renderEmailDocument,
  type UnsubscribeLinks,
} from './email-compliance.ts';
import { QUILLMONITOR_DATABASE_URL } from './attribution.ts';
import { formatLossReported, type DailyBriefContent, type NewsletterItem, type StatusChange } from './newsletter-content.ts';
import { WEEK_START } from './publishable.ts';
import { sourceCredit, TELEGRAM_CHANNEL_HANDLE, TELEGRAM_CHANNEL_URL, trackEmailLink } from './share-links.ts';
import { weeklyPath } from './site-urls.ts';
import { escapeHtml } from './subscription-delivery.ts';
import { isWeeklyPublicContent, renderWeeklyEmail, toPublicWeekly } from './weekly-render.ts';

export interface RenderContext {
  links: UnsubscribeLinks;
  postalAddress: string | null;
  testWarning?: boolean;
  siteUrl: string;
  /** Monday of the latest published weekly issue; the daily brief links it, or the archive when absent. */
  latestWeekStart?: string | null;
}
export interface RenderedEmail { subject: string; html: string; text: string }

const DAILY_REASON = 'You get this email because you subscribed to the Digibastion daily brief.';
/** "More updates" shows up to this many; the rest are a link away, as in the legacy digest. */
export const DAILY_UPDATES_SHOWN = 20;
/** Items rendered in one email, all sections together: keeps it under Gmail's 102 KB clipping limit. */
export const DAILY_RENDERED_ITEMS = 50;
const HYPE = /\b(immediate action required|urgent|massive|devastating)\b/gi;
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#facc15',
  low: '#60a5fa',
  info: '#9ca3af',
};
const LINK = 'color:#93c5fd;text-decoration:underline;';
const MUTED = 'color:#a8b3c7;font-size:12px;line-height:18px;';

function clean(value: string | null | undefined): string {
  return (value ?? '').replace(EMOJI, '').replace(HYPE, '').replace(/\s+/g, ' ').replace(/\s+([,:])/g, '$1').trim();
}

const titleOf = (entry: NewsletterItem) => clean(entry.title) || 'Security report';
/** The source's name, or null when unknown (sourceCredit then says "Source not given"). */
function sourceOf(entry: NewsletterItem): string | null {
  const label = sourceCredit(entry).label;
  return label === 'Source not given' ? null : clean(label) || null;
}
const track = (url: string, content: string, ctx: RenderContext) => trackEmailLink(url, 'daily_brief', content, ctx.siteUrl);

function weeklyUrl(ctx: RenderContext): { url: string; label: string } {
  const week = ctx.latestWeekStart && WEEK_START.test(ctx.latestWeekStart) ? ctx.latestWeekStart : null;
  return week
    ? { url: track(weeklyPath(week), 'weekly', ctx), label: 'Read the latest weekly report' }
    : { url: track('/threat-intel/weekly', 'weekly', ctx), label: 'Read the weekly reports' };
}

function statusWord(entry: NewsletterItem): string | null {
  if (entry.status === 'unconfirmed') return 'Unconfirmed';
  if (entry.status === 'confirmed') return 'Confirmed';
  return null;
}

/** Severity, status word (only when the source has one), chain, attack type, loss. */
function factParts(entry: NewsletterItem, withStatus: boolean): string[] {
  const parts = [entry.severity.toUpperCase()];
  const status = withStatus ? statusWord(entry) : null;
  if (status) parts.push(status);
  if (entry.isWeb3Incident) {
    for (const value of [entry.chain, entry.attackType]) if (clean(value)) parts.push(clean(value));
    const loss = formatLossReported(entry.amountUsd);
    if (loss) parts.push(loss);
  } else if (entry.cveId) {
    parts.push(clean(entry.cveId));
  }
  return parts;
}

function changeLine(change: StatusChange): string {
  const source = sourceOf(change.item);
  if (change.change === 'confirmed') return `Confirmed by ${source ?? 'the source'}`;
  if (change.change === 'retracted') return 'Retracted by the source';
  const now = formatLossReported(change.amountUsd);
  const was = formatLossReported(change.previousAmountUsd)?.replace(/ reported$/, '');
  if (!now) return 'Revised by the source';
  return `Revised: loss now ${now}${was ? ` (was ${was})` : ''}`;
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

function creditHtml(entry: NewsletterItem): string {
  const credit = sourceCredit(entry);
  const label = escapeHtml(clean(credit.label) || 'Source not given');
  const source = `Source: ${credit.url ? `<a href="${escapeHtml(credit.url)}" style="${LINK}">${label}</a>` : label}`;
  return credit.poweredByQuillMonitor
    ? `${source} · Powered by <a href="${QUILLMONITOR_DATABASE_URL}" style="${LINK}">QuillMonitor</a>`
    : source;
}

function itemHtml(entry: NewsletterItem, ctx: RenderContext, lead: string | null = null): string {
  const color = SEVERITY_COLORS[entry.severity] ?? SEVERITY_COLORS.info;
  const [severity, ...rest] = factParts(entry, lead === null);
  const facts = [`<b style="color:${color};">${escapeHtml(severity)}</b>`, ...rest.map((part) =>
    part === 'Unconfirmed' ? `<b style="color:#fbbf24;">${part}</b>` : escapeHtml(part))].join(' · ');
  return `<tr><td class="email-pad" style="padding:12px 28px;border-bottom:1px solid #374151;">` +
    (lead ? `<p style="margin:0 0 4px;color:#fbbf24;font-size:13px;font-weight:700;">${escapeHtml(lead)}</p>` : '') +
    `<p style="margin:0;${MUTED}">${facts}</p>` +
    `<p style="margin:4px 0 0;font-size:15px;line-height:21px;font-weight:700;"><a href="${escapeHtml(track(entry.incidentUrl, 'title', ctx))}" style="color:#f3f4f6;text-decoration:none;">${escapeHtml(titleOf(entry))}</a></p>` +
    (entry.summary ? `<p style="margin:4px 0 0;color:#9ca3af;font-size:13px;line-height:19px;">${escapeHtml(entry.summary)}</p>` : '') +
    `<p style="margin:4px 0 0;${MUTED}">${creditHtml(entry)} · <a href="${escapeHtml(track(entry.incidentUrl, 'details', ctx))}" style="${LINK}">Details on Digibastion</a></p>` +
    `</td></tr>`;
}

function sectionTitleHtml(title: string): string {
  return `<tr><td class="email-pad" style="padding:22px 28px 6px;"><h2 style="margin:0;color:#f3f4f6;font-size:17px;line-height:22px;">${escapeHtml(title)}</h2></td></tr>`;
}

function headerHtml(c: DailyBriefContent): string {
  return `<tr><td class="email-pad" style="padding:24px 28px;background-color:#111827;border-bottom:1px solid #374151;">` +
    `<p style="margin:0;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Digibastion Threat Intel</p>` +
    `<h1 style="margin:6px 0 0;color:#f3f4f6;font-size:22px;line-height:28px;">Daily brief, ${escapeHtml(shortIssueDate(c.issueDate))}</h1>` +
    `<p style="margin:6px 0 0;color:#a8b3c7;font-size:14px;line-height:20px;">${escapeHtml(periodLine(c))}</p>` +
    `</td></tr>`;
}

function actionHtml(c: DailyBriefContent, ctx: RenderContext): string {
  return sectionTitleHtml('One thing to do today') +
    `<tr><td class="email-pad" style="padding:6px 28px 20px;">` +
    `<p style="margin:0;color:#d1d5db;font-size:14px;line-height:21px;">${escapeHtml(c.action.text)}</p>` +
    `<p style="margin:6px 0 0;${MUTED}"><a href="${escapeHtml(track(c.action.url, 'action', ctx))}" style="${LINK}">${escapeHtml(c.action.guideTitle)}</a></p>` +
    `</td></tr>`;
}

function moreHtml(ctx: RenderContext): string {
  const weekly = weeklyUrl(ctx);
  return `<tr><td class="email-pad" style="padding:0 28px 20px;">` +
    `<p style="margin:0;${MUTED}"><a href="${escapeHtml(weekly.url)}" style="${LINK}">${weekly.label}</a> · ` +
    `New incidents on Telegram: <a href="${TELEGRAM_CHANNEL_URL}" style="${LINK}">${TELEGRAM_CHANNEL_HANDLE}</a></p>` +
    `</td></tr>`;
}

function moreText(ctx: RenderContext): string {
  const weekly = weeklyUrl(ctx);
  return `${weekly.label}: ${weekly.url}\nNew incidents on Telegram: ${TELEGRAM_CHANNEL_URL}`;
}

function quietLine(c: DailyBriefContent): string | null {
  if (!c.quiet) return null;
  const nothing = `Nothing new matched your filters (${c.quiet.filterSummary}) today.`;
  const count = c.quiet.highlights.length;
  if (count === 0) return `${nothing} No other security updates came in either.`;
  return `${nothing} Here ${count === 1 ? 'is the top other update' : `are the top ${count} other updates`} from the same day.`;
}

function noteHtml(note: string): string {
  return `<tr><td class="email-pad" style="padding:18px 28px 0;"><p style="margin:0;color:#d1d5db;font-size:14px;line-height:21px;">${escapeHtml(note)}</p></td></tr>`;
}

function hiddenUpdatesLine(hidden: number, ctx: RenderContext): { html: string; text: string } | null {
  if (hidden <= 0) return null;
  const url = track('/threat-intel', 'more', ctx);
  const label = `${hidden} more update${hidden === 1 ? '' : 's'} on Digibastion`;
  return {
    html: `<tr><td class="email-pad" style="padding:12px 28px;"><p style="margin:0;${MUTED}"><a href="${escapeHtml(url)}" style="${LINK}">${escapeHtml(label)}</a></p></td></tr>`,
    text: `${label}: ${url}`,
  };
}

function periodLine(c: DailyBriefContent): string {
  const start = shortIssueDate(c.periodStart.slice(0, 10));
  return `Reports added from ${start} 00:00 to ${shortIssueDate(c.issueDate)} 00:00 UTC. Each item names its source.`;
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

function itemText(entry: NewsletterItem, ctx: RenderContext, lead: string | null = null): string {
  const lines: string[] = [];
  if (lead) lines.push(lead);
  lines.push(`[${factParts(entry, lead === null).join(' · ')}] ${titleOf(entry)}`);
  if (entry.summary) lines.push(entry.summary);
  const credit = sourceCredit(entry);
  lines.push(`Source: ${clean(credit.label) || 'Source not given'}${credit.url ? ` ${credit.url}` : ''}`);
  if (credit.poweredByQuillMonitor) lines.push(`Powered by QuillMonitor: ${QUILLMONITOR_DATABASE_URL}`);
  lines.push(`Details on Digibastion: ${track(entry.incidentUrl, 'details', ctx)}`);
  return lines.join('\n');
}

function sectionText(title: string, blocks: string[]): string {
  return `${title}\n${'-'.repeat(title.length)}\n\n${blocks.join('\n\n')}`;
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export function renderDailyBriefEmail(c: DailyBriefContent, ctx: RenderContext): RenderedEmail {
  const subject = buildDailySubject(c);
  const footer = { links: ctx.links, postalAddress: ctx.postalAddress, reason: DAILY_REASON, testWarning: ctx.testWarning };

  const updates = c.updates ?? [];
  const featured = c.incidents.length + c.unconfirmed.length + c.statusChanges.length + c.vulnerabilities.length;
  const shownUpdates = updates.slice(0, Math.min(DAILY_UPDATES_SHOWN, Math.max(0, DAILY_RENDERED_ITEMS - featured)));
  const hidden = hiddenUpdatesLine(updates.length - shownUpdates.length, ctx);
  const highlights = c.quiet?.highlights ?? [];
  const note = quietLine(c);

  const sections: { title: string; html: string[]; text: string[] }[] = [
    { title: 'Incidents', html: c.incidents.map((entry) => itemHtml(entry, ctx)), text: c.incidents.map((entry) => itemText(entry, ctx)) },
    { title: 'Still unconfirmed', html: c.unconfirmed.map((entry) => itemHtml(entry, ctx)), text: c.unconfirmed.map((entry) => itemText(entry, ctx)) },
    {
      title: 'Status changes',
      html: c.statusChanges.map((entry) => itemHtml(entry.item, ctx, changeLine(entry))),
      text: c.statusChanges.map((entry) => itemText(entry.item, ctx, changeLine(entry))),
    },
    {
      title: 'Vulnerabilities and supply-chain',
      html: c.vulnerabilities.map((entry) => itemHtml(entry, ctx)),
      text: c.vulnerabilities.map((entry) => itemText(entry, ctx)),
    },
    {
      title: 'More updates',
      html: [...shownUpdates.map((entry) => itemHtml(entry, ctx)), ...(hidden ? [hidden.html] : [])],
      text: [...shownUpdates.map((entry) => itemText(entry, ctx)), ...(hidden ? [hidden.text] : [])],
    },
    { title: 'Other updates', html: highlights.map((entry) => itemHtml(entry, ctx)), text: highlights.map((entry) => itemText(entry, ctx)) },
  ].filter((section) => section.html.length > 0);

  const html = renderEmailDocument({
    title: subject,
    preheader: note ?? periodLine(c),
    bodyHtml: [
      headerHtml(c),
      ...(note ? [noteHtml(note)] : []),
      ...sections.map((section) => sectionTitleHtml(section.title) + section.html.join('')),
      actionHtml(c, ctx),
      moreHtml(ctx),
    ].join('\n'),
    footerHtml: renderComplianceFooterHtml(footer),
  });

  const text = [
    `Digibastion daily brief, ${shortIssueDate(c.issueDate)}`,
    periodLine(c),
    '',
    ...(note ? [note, ''] : []),
    ...sections.map((section) => `${sectionText(section.title, section.text)}\n`),
    sectionText('One thing to do today', [`${c.action.text}\n${c.action.guideTitle}: ${track(c.action.url, 'action', ctx)}`]),
    '',
    moreText(ctx),
    '',
    renderComplianceFooterText(footer),
  ].join('\n');

  return { subject, html, text };
}

/**
 * Renders a stored issue for one subscriber. Daily content must already be
 * filtered; weekly is one shared edition and its archive is never rendered.
 * Returns null for content it cannot render.
 */
export function renderNewsletterEmail(kind: 'daily' | 'weekly', content: unknown, ctx: RenderContext): RenderedEmail | null {
  if (kind === 'daily') return isDailyBriefContent(content) ? renderDailyBriefEmail(content, ctx) : null;
  return isWeeklyPublicContent(content) ? renderWeeklyEmail(toPublicWeekly(content), ctx) : null;
}
