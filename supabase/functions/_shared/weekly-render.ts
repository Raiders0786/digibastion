// The weekly deep-dive email (HTML and text) inside the shared compliance
// shell. Every figure is formatted here from WeeklyTotals; the paragraphs are
// the validated model text or the templates. Copy follows spec section 9:
// name the source, use the source's status words, "~$4.2M reported", no hype.
// Pure module: no Deno or URL imports, so vitest can import it.
import { shortIssueDate } from './daily-brief.ts';
import { renderComplianceFooterHtml, renderComplianceFooterText, renderEmailDocument } from './email-compliance.ts';
import {
  formatLossReported,
  type NewsletterItem,
  type WeeklyBreakdown,
  type WeeklyIssueContent,
  type WeeklyParagraph,
  type WeeklyPublicContent,
} from './newsletter-content.ts';
import type { RenderContext, RenderedEmail } from './newsletter-render.ts';
import { escapeHtml } from './subscription-delivery.ts';

const WEEKLY_REASON = 'You get this email because you subscribed to the Digibastion weekly deep-dive.';
export const AI_NOTE = 'Written by AI from the data above';
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
const BODY = 'color:#d1d5db;font-size:14px;line-height:21px;';

function clean(value: string | null | undefined): string {
  return (value ?? '').replace(EMOJI, '').replace(HYPE, '').replace(/\s+/g, ' ').replace(/\s+([,:])/g, '$1').trim();
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export function toPublicWeekly(c: WeeklyIssueContent | WeeklyPublicContent): WeeklyPublicContent {
  const copy: Partial<WeeklyIssueContent> = { ...c };
  delete copy.archive;
  return copy as WeeklyPublicContent;
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isParagraph = (value: unknown) => isRecord(value) && typeof value.text === 'string' && (value.origin === 'ai' || value.origin === 'template');

/** Shape check for newsletter_issues.content read back from the database. */
export function isWeeklyPublicContent(value: unknown): value is WeeklyPublicContent {
  if (!isRecord(value) || value.version !== 1 || value.kind !== 'weekly') return false;
  if (typeof value.weekStart !== 'string' || typeof value.weekEnd !== 'string' || typeof value.issueDate !== 'string') return false;
  const totals = value.totals;
  if (!isRecord(totals) || typeof totals.lossUsd !== 'number' || typeof totals.incidentCount !== 'number' ||
    !Array.isArray(totals.byAttackType) || !Array.isArray(totals.byChain)) return false;
  if (!Array.isArray(value.top) || !value.top.every((entry) =>
    isRecord(entry) && isRecord(entry.item) && typeof entry.item.uid === 'string' && isParagraph(entry.what) && isParagraph(entry.action))) return false;
  const vulnerabilities = value.vulnerabilities;
  if (!isParagraph(value.trends) || !isRecord(vulnerabilities) || !Array.isArray(vulnerabilities.items) || !isParagraph(vulnerabilities.summary)) return false;
  const tip = value.opsecTip;
  return isRecord(tip) && typeof tip.text === 'string' && typeof tip.url === 'string' && Array.isArray(value.sources);
}

/** "Weekly deep-dive, week of Oct 5: ~$12.3M reported across 9 incidents"; parts with nothing to say are left out. */
export function buildWeeklySubject(c: WeeklyPublicContent): string {
  const base = `Weekly deep-dive, week of ${shortIssueDate(c.weekStart)}`;
  const t = c.totals;
  const loss = t.lossUsd > 0 ? formatLossReported(t.lossUsd) : null;
  if (t.incidentCount > 0) return `${base}: ${loss ? `${loss} across ` : ''}${plural(t.incidentCount, 'incident', 'incidents')}`;
  if (t.unconfirmedCount > 0) return `${base}: ${plural(t.unconfirmedCount, 'unconfirmed report', 'unconfirmed reports')}`;
  return base;
}

function periodLine(c: WeeklyPublicContent): string {
  return `Web3 incidents added ${shortIssueDate(c.weekStart)} to ${shortIssueDate(c.weekEnd)} (UTC). Figures are computed from the source data, and each item names its source.`;
}

interface TotalsRow { label: string; value: string }

function totalsRows(c: WeeklyPublicContent): TotalsRow[] {
  const t = c.totals;
  const rows: TotalsRow[] = [];
  const loss = t.lossUsd > 0 ? formatLossReported(t.lossUsd) : null;
  rows.push({
    label: 'This week',
    value: t.incidentCount === 0
      ? 'No incidents recorded'
      : `${loss ?? 'No loss amounts reported'} across ${plural(t.incidentCount, 'incident', 'incidents')}`,
  });
  rows.push({ label: 'Previous week', value: (t.previousLossUsd > 0 ? formatLossReported(t.previousLossUsd) : null) ?? 'No loss amounts reported' });
  if (t.unconfirmedCount > 0) {
    const unconfirmedLoss = t.unconfirmedLossUsd > 0 ? formatLossReported(t.unconfirmedLossUsd) : null;
    rows.push({
      label: 'Unconfirmed',
      value: `${plural(t.unconfirmedCount, 'report', 'reports')}${unconfirmedLoss ? `, ${unconfirmedLoss}` : ''}, not included above`,
    });
  }
  if (t.fundsReturnedCount > 0) rows.push({ label: 'Funds returned', value: plural(t.fundsReturnedCount, 'incident', 'incidents') });
  if (t.lateReportCount > 0) {
    rows.push({ label: 'Late reports', value: `${plural(t.lateReportCount, 'older incident', 'older incidents')} first reported this week, not included above` });
  }
  return rows;
}

function breakdownLine(entry: WeeklyBreakdown): string {
  const loss = entry.lossUsd > 0 ? formatLossReported(entry.lossUsd) : null;
  return `${clean(entry.label)}: ${plural(entry.count, 'incident', 'incidents')}${loss ? `, ${loss}` : ''}`;
}

function statusWord(entry: NewsletterItem): string | null {
  if (entry.status === 'unconfirmed') return 'Unconfirmed';
  if (entry.status === 'confirmed') return 'Confirmed';
  return null;
}

function factParts(entry: NewsletterItem): string[] {
  const parts = [entry.severity.toUpperCase()];
  const status = statusWord(entry);
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

const titleOf = (entry: NewsletterItem) => clean(entry.title) || 'Security report';
const sourceOf = (entry: NewsletterItem) => clean(entry.sourceName) || null;

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

const row = (inner: string, padding = '6px 28px') => `<tr><td class="email-pad" style="padding:${padding};">${inner}</td></tr>`;

function sectionTitleHtml(title: string): string {
  return row(`<h2 style="margin:0;color:#f3f4f6;font-size:17px;line-height:22px;">${escapeHtml(title)}</h2>`, '22px 28px 6px');
}

function paragraphHtml(p: WeeklyParagraph): string {
  return `<p style="margin:6px 0 0;${BODY}">${escapeHtml(p.text)}</p>` +
    (p.origin === 'ai' ? `<p style="margin:2px 0 0;${MUTED}font-style:italic;">${AI_NOTE}</p>` : '');
}

function factsHtml(entry: NewsletterItem): string {
  const color = SEVERITY_COLORS[entry.severity] ?? SEVERITY_COLORS.info;
  const [severity, ...rest] = factParts(entry);
  return [`<b style="color:${color};">${escapeHtml(severity)}</b>`, ...rest.map((part) =>
    part === 'Unconfirmed' ? `<b style="color:#fbbf24;">${part}</b>` : escapeHtml(part))].join(' · ');
}

function linksHtml(entry: NewsletterItem): string {
  const source = sourceOf(entry);
  const sourceLink = source
    ? `Source: ${entry.sourceUrl ? `<a href="${escapeHtml(entry.sourceUrl)}" style="${LINK}">${escapeHtml(source)}</a>` : escapeHtml(source)} · `
    : '';
  return `<p style="margin:6px 0 0;${MUTED}">${sourceLink}<a href="${escapeHtml(entry.incidentUrl)}" style="${LINK}">Details on Digibastion</a></p>`;
}

function itemHeadHtml(entry: NewsletterItem): string {
  return `<p style="margin:0;${MUTED}">${factsHtml(entry)}</p>` +
    `<p style="margin:4px 0 0;font-size:15px;line-height:21px;font-weight:700;"><a href="${escapeHtml(entry.incidentUrl)}" style="color:#f3f4f6;text-decoration:none;">${escapeHtml(titleOf(entry))}</a></p>`;
}

function totalsHtml(c: WeeklyPublicContent): string {
  const rows = totalsRows(c).map((entry) =>
    `<tr><td style="padding:3px 12px 3px 0;${MUTED}white-space:nowrap;vertical-align:top;">${escapeHtml(entry.label)}</td>` +
    `<td style="padding:3px 0;color:#f3f4f6;font-size:14px;line-height:20px;">${escapeHtml(entry.value)}</td></tr>`).join('');
  const breakdown = (title: string, entries: WeeklyBreakdown[]) => entries.length === 0
    ? ''
    : `<p style="margin:12px 0 0;color:#f3f4f6;font-size:13px;font-weight:700;">${escapeHtml(title)}</p>` +
      entries.map((entry) => `<p style="margin:2px 0 0;${MUTED}">${escapeHtml(breakdownLine(entry))}</p>`).join('');
  return sectionTitleHtml('This week in numbers') +
    row(`<table role="presentation" cellpadding="0" cellspacing="0">${rows}</table>` +
      breakdown('By attack type', c.totals.byAttackType) +
      breakdown('By chain', c.totals.byChain), '6px 28px 12px');
}

function topHtml(c: WeeklyPublicContent): string {
  if (c.top.length === 0) return '';
  return sectionTitleHtml('Top incidents') + c.top.map((entry) =>
    row(itemHeadHtml(entry.item) + paragraphHtml(entry.what) + paragraphHtml(entry.action) + linksHtml(entry.item),
      '12px 28px;border-bottom:1px solid #374151')).join('');
}

function vulnerabilitiesHtml(c: WeeklyPublicContent): string {
  const items = c.vulnerabilities.items.map((entry) => `<div style="margin:10px 0 0;">${itemHeadHtml(entry)}${linksHtml(entry)}</div>`).join('');
  return sectionTitleHtml('Vulnerabilities and supply-chain') + row(paragraphHtml(c.vulnerabilities.summary) + items, '0 28px 12px');
}

function headerHtml(c: WeeklyPublicContent): string {
  return row(
    `<p style="margin:0;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Digibastion Threat Intel</p>` +
    `<h1 style="margin:6px 0 0;color:#f3f4f6;font-size:22px;line-height:28px;">Weekly deep-dive, week of ${escapeHtml(shortIssueDate(c.weekStart))}</h1>` +
    `<p style="margin:6px 0 0;color:#a8b3c7;font-size:14px;line-height:20px;">${escapeHtml(periodLine(c))}</p>`,
    '24px 28px;background-color:#111827;border-bottom:1px solid #374151',
  );
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

function sectionText(title: string, body: string): string {
  return `${title}\n${'-'.repeat(title.length)}\n\n${body}`;
}

function paragraphText(p: WeeklyParagraph): string {
  return p.origin === 'ai' ? `${p.text}\n(${AI_NOTE})` : p.text;
}

function itemText(entry: NewsletterItem, paragraphs: WeeklyParagraph[] = []): string {
  const lines = [`[${factParts(entry).join(' · ')}] ${titleOf(entry)}`, ...paragraphs.map(paragraphText)];
  const source = sourceOf(entry);
  if (source) lines.push(`Source: ${source}${entry.sourceUrl ? ` ${entry.sourceUrl}` : ''}`);
  lines.push(`Details on Digibastion: ${entry.incidentUrl}`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export function renderWeeklyEmail(c: WeeklyPublicContent, ctx: RenderContext): RenderedEmail {
  const subject = buildWeeklySubject(c);
  const footer = { links: ctx.links, postalAddress: ctx.postalAddress, reason: WEEKLY_REASON, testWarning: ctx.testWarning };
  const sources = c.sources.map(clean).filter(Boolean);

  const html = renderEmailDocument({
    title: subject,
    preheader: periodLine(c),
    bodyHtml: [
      headerHtml(c),
      totalsHtml(c),
      topHtml(c),
      sectionTitleHtml('Trends') + row(paragraphHtml(c.trends), '0 28px 12px'),
      vulnerabilitiesHtml(c),
      sectionTitleHtml('Opsec tip') + row(
        `<p style="margin:0;${BODY}">${escapeHtml(c.opsecTip.text)}</p>` +
        `<p style="margin:6px 0 0;${MUTED}"><a href="${escapeHtml(c.opsecTip.url)}" style="${LINK}">${escapeHtml(c.opsecTip.guideTitle)}</a></p>`,
        '6px 28px 12px',
      ),
      sources.length > 0
        ? sectionTitleHtml('Sources this week') + row(`<p style="margin:0;${MUTED}">${escapeHtml(sources.join(', '))}</p>`, '6px 28px 20px')
        : '',
    ].join('\n'),
    footerHtml: renderComplianceFooterHtml(footer),
  });

  const t = c.totals;
  const totalsText = [
    ...totalsRows(c).map((entry) => `${entry.label}: ${entry.value}`),
    ...(t.byAttackType.length > 0 ? ['', 'By attack type', ...t.byAttackType.map(breakdownLine)] : []),
    ...(t.byChain.length > 0 ? ['', 'By chain', ...t.byChain.map(breakdownLine)] : []),
  ].join('\n');

  const text = [
    `Digibastion weekly deep-dive, week of ${shortIssueDate(c.weekStart)}`,
    periodLine(c),
    '',
    sectionText('This week in numbers', totalsText),
    '',
    ...(c.top.length > 0
      ? [sectionText('Top incidents', c.top.map((entry) => itemText(entry.item, [entry.what, entry.action])).join('\n\n')), '']
      : []),
    sectionText('Trends', paragraphText(c.trends)),
    '',
    sectionText('Vulnerabilities and supply-chain', [paragraphText(c.vulnerabilities.summary), ...c.vulnerabilities.items.map((entry) => itemText(entry))].join('\n\n')),
    '',
    sectionText('Opsec tip', `${c.opsecTip.text}\n${c.opsecTip.guideTitle}: ${c.opsecTip.url}`),
    '',
    ...(sources.length > 0 ? [sectionText('Sources this week', sources.join(', ')), ''] : []),
    renderComplianceFooterText(footer),
  ].join('\n');

  return { subject, html, text };
}
