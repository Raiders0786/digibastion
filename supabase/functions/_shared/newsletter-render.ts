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
import { formatLossReported, type DailyBriefContent, type NewsletterItem, type StatusChange } from './newsletter-content.ts';
import { escapeHtml } from './subscription-delivery.ts';

export interface RenderContext { links: UnsubscribeLinks; postalAddress: string | null; testWarning?: boolean; siteUrl: string }
export interface RenderedEmail { subject: string; html: string; text: string }

const DAILY_REASON = 'You get this email because you subscribed to the Digibastion daily brief.';
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
const sourceOf = (entry: NewsletterItem) => clean(entry.sourceName) || null;

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

function itemHtml(entry: NewsletterItem, lead: string | null = null): string {
  const color = SEVERITY_COLORS[entry.severity] ?? SEVERITY_COLORS.info;
  const [severity, ...rest] = factParts(entry, lead === null);
  const facts = [`<b style="color:${color};">${escapeHtml(severity)}</b>`, ...rest.map((part) =>
    part === 'Unconfirmed' ? `<b style="color:#fbbf24;">${part}</b>` : escapeHtml(part))].join(' · ');
  const source = sourceOf(entry);
  const sourceLink = source
    ? `Source: ${entry.sourceUrl ? `<a href="${escapeHtml(entry.sourceUrl)}" style="${LINK}">${escapeHtml(source)}</a>` : escapeHtml(source)} · `
    : '';
  return `<tr><td class="email-pad" style="padding:12px 28px;border-bottom:1px solid #374151;">` +
    (lead ? `<p style="margin:0 0 4px;color:#fbbf24;font-size:13px;font-weight:700;">${escapeHtml(lead)}</p>` : '') +
    `<p style="margin:0;${MUTED}">${facts}</p>` +
    `<p style="margin:4px 0 0;font-size:15px;line-height:21px;font-weight:700;"><a href="${escapeHtml(entry.incidentUrl)}" style="color:#f3f4f6;text-decoration:none;">${escapeHtml(titleOf(entry))}</a></p>` +
    (entry.summary ? `<p style="margin:4px 0 0;color:#9ca3af;font-size:13px;line-height:19px;">${escapeHtml(entry.summary)}</p>` : '') +
    `<p style="margin:4px 0 0;${MUTED}">${sourceLink}<a href="${escapeHtml(entry.incidentUrl)}" style="${LINK}">Details on Digibastion</a></p>` +
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

function actionHtml(c: DailyBriefContent): string {
  return sectionTitleHtml('One thing to do today') +
    `<tr><td class="email-pad" style="padding:6px 28px 20px;">` +
    `<p style="margin:0;color:#d1d5db;font-size:14px;line-height:21px;">${escapeHtml(c.action.text)}</p>` +
    `<p style="margin:6px 0 0;${MUTED}"><a href="${escapeHtml(c.action.url)}" style="${LINK}">${escapeHtml(c.action.guideTitle)}</a></p>` +
    `</td></tr>`;
}

function periodLine(c: DailyBriefContent): string {
  const start = shortIssueDate(c.periodStart.slice(0, 10));
  return `Reports added from ${start} 00:00 to ${shortIssueDate(c.issueDate)} 00:00 UTC. Each item names its source.`;
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

function itemText(entry: NewsletterItem, lead: string | null = null): string {
  const lines: string[] = [];
  if (lead) lines.push(lead);
  lines.push(`[${factParts(entry, lead === null).join(' · ')}] ${titleOf(entry)}`);
  if (entry.summary) lines.push(entry.summary);
  const source = sourceOf(entry);
  if (source) lines.push(`Source: ${source}${entry.sourceUrl ? ` ${entry.sourceUrl}` : ''}`);
  lines.push(`Details on Digibastion: ${entry.incidentUrl}`);
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

  const sections: { title: string; html: string[]; text: string[] }[] = [
    { title: 'Incidents', html: c.incidents.map((entry) => itemHtml(entry)), text: c.incidents.map((entry) => itemText(entry)) },
    { title: 'Still unconfirmed', html: c.unconfirmed.map((entry) => itemHtml(entry)), text: c.unconfirmed.map((entry) => itemText(entry)) },
    {
      title: 'Status changes',
      html: c.statusChanges.map((entry) => itemHtml(entry.item, changeLine(entry))),
      text: c.statusChanges.map((entry) => itemText(entry.item, changeLine(entry))),
    },
    { title: 'Vulnerabilities and supply-chain', html: c.vulnerabilities.map((entry) => itemHtml(entry)), text: c.vulnerabilities.map((entry) => itemText(entry)) },
  ].filter((section) => section.html.length > 0);

  const html = renderEmailDocument({
    title: subject,
    preheader: periodLine(c),
    bodyHtml: [
      headerHtml(c),
      ...sections.map((section) => sectionTitleHtml(section.title) + section.html.join('')),
      actionHtml(c),
    ].join('\n'),
    footerHtml: renderComplianceFooterHtml(footer),
  });

  const text = [
    `Digibastion daily brief, ${shortIssueDate(c.issueDate)}`,
    periodLine(c),
    '',
    ...sections.map((section) => `${sectionText(section.title, section.text)}\n`),
    sectionText('One thing to do today', [`${c.action.text}\n${c.action.guideTitle}: ${c.action.url}`]),
    '',
    renderComplianceFooterText(footer),
  ].join('\n');

  return { subject, html, text };
}

/**
 * Renders a stored issue for one subscriber. Daily content must already be
 * filtered. Returns null for content it cannot render; 'weekly' returns null
 * until the weekly renderer is wired in here.
 */
export function renderNewsletterEmail(kind: 'daily' | 'weekly', content: unknown, ctx: RenderContext): RenderedEmail | null {
  if (kind === 'daily') return isDailyBriefContent(content) ? renderDailyBriefEmail(content, ctx) : null;
  return null;
}
