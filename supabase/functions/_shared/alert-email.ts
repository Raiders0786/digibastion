// Real-time alert emails: factual subjects, the alert and follow-up bodies,
// and the follow-up rule. Copy follows spec section 9: name the source, use
// the source's status words, "~$4.2M reported", no hype and no emoji.
// Pure module: no Deno or URL imports, so vitest can import it.
import {
  renderComplianceFooterHtml,
  renderComplianceFooterText,
  renderEmailDocument,
  type UnsubscribeLinks,
} from './email-compliance.ts';
import { QUILLMONITOR_DATABASE_URL } from './attribution.ts';
import { readIncidentFields } from './incident-fields.ts';
import { compareItems, formatLossReported, type NewsletterItem } from './newsletter-content.ts';
import { sourceCredit, trackEmailLink, type UtmCampaign } from './share-links.ts';
import { SITE_URL } from './site-urls.ts';
import { escapeHtml } from './subscription-delivery.ts';
import { truncateAtWord } from './summary-text.ts';

export const ALERT_SUBJECT_MAX_LENGTH = 120;
const NON_INCIDENT_TITLE_MAX_LENGTH = 90;
const ALERT_REASON = 'You get this email because you turned on real-time alerts at Digibastion.';

// Alarm words the copy rules forbid. Source titles sometimes carry them.
const HYPE = /\b(immediate action required|urgent|massive|devastating)\b/gi;
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

function clean(value: string): string {
  return value.replace(EMOJI, '').replace(HYPE, '').replace(/\s+/g, ' ').replace(/\s+([,:])/g, '$1').trim();
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

// "Bridge Exploit" -> "bridge exploit"; acronyms such as "DNS" stay.
function lowerAttackType(value: string): string {
  return value.split(' ').map((word) => (/^[A-Z][a-z]+$/.test(word) ? word.toLowerCase() : word)).join(' ');
}

function cutChars(value: string, max: number): string {
  return Array.from(value).length <= max ? value : truncateAtWord(value, max);
}

/** "Example Protocol bridge exploit" for an incident, the title otherwise. */
function headline(item: NewsletterItem): string {
  if (item.isWeb3Incident) {
    const project = clean(item.projectName ?? '');
    if (project) {
      const attack = clean(lowerAttackType(item.attackType ?? ''));
      return `${project} ${attack || 'incident'}`;
    }
  }
  return cutChars(clean(item.title) || 'Security report', NON_INCIDENT_TITLE_MAX_LENGTH);
}

function withLoss(text: string, item: NewsletterItem): string {
  const loss = item.isWeb3Incident ? formatLossReported(item.amountUsd) : null;
  return loss ? `${text}, ${loss}` : text;
}

function itemSubject(item: NewsletterItem): string {
  const prefix = item.status === 'unconfirmed' ? '[Unconfirmed] ' : '';
  return `${prefix}${capitalize(item.severity)}: ${withLoss(headline(item), item)}`;
}

function fitSubject(base: string, suffix = ''): string {
  const room = ALERT_SUBJECT_MAX_LENGTH - Array.from(suffix).length;
  return `${cutChars(base, room)}${suffix}`;
}

export function buildAlertSubject(items: NewsletterItem[]): string {
  if (items.length === 0) return 'Digibastion security alert';
  const [first] = [...items].sort(compareItems);
  const suffix = items.length > 1 ? ` (+${items.length - 1} more)` : '';
  return fitSubject(itemSubject(first), suffix);
}

export type FollowUpKind = 'retracted' | 'upgraded_critical';

/** The source's name for status words and subjects; null when the source is unknown. */
function sourceLabel(item: NewsletterItem): string | null {
  const label = sourceCredit(item).label;
  return label === 'Source not given' ? null : clean(label) || null;
}

export function buildFollowUpSubject(kind: FollowUpKind, item: NewsletterItem): string {
  if (kind === 'retracted') {
    const subject = item.isWeb3Incident && item.projectName ? `${clean(item.projectName)} incident` : headline(item);
    const source = sourceLabel(item);
    return fitSubject(`Retracted: ${subject} report withdrawn${source ? ` by ${source}` : ''}`);
  }
  return fitSubject(`Now critical: ${withLoss(headline(item), item)}`);
}

// 64-bit FNV-1a over UTF-8 bytes, the same hash email-ledger uses for long keys.
function fnv1a64Hex(value: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
}

/** Item key for the Resend Idempotency-Key of one alert email: `g<fnv of the sorted uids>`. */
export function alertBatchKey(uids: string[]): string {
  return `g${fnv1a64Hex([...uids].sort().join('\n'))}`;
}

export type FollowUpPlan = { kind: FollowUpKind } | null;

/**
 * What to tell a subscriber about an alert already sent. A deleted or
 * not-relevant record is retracted; a merged duplicate is not (its canonical
 * record carries on); an upgrade to critical is announced. Verification
 * changes are left to the daily brief.
 */
export function planAlertFollowUp(
  sent: { sent_severity?: string; sent_verification?: string },
  current: { severity: string; metadata: unknown } | null,
): FollowUpPlan {
  if (!current) return { kind: 'retracted' };
  const metadata = current.metadata && typeof current.metadata === 'object' ? current.metadata as Record<string, unknown> : {};
  if (readIncidentFields(metadata).duplicateOfUid) return null;
  if (metadata.classification_relevant === false) return { kind: 'retracted' };
  if (current.severity === 'critical' && typeof sent.sent_severity === 'string' && sent.sent_severity !== 'critical') {
    return { kind: 'upgraded_critical' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#2563eb',
  info: '#4b5563',
};

function statusLabel(item: NewsletterItem): string | null {
  const source = sourceLabel(item);
  if (item.status === 'unconfirmed') return source ? `Unconfirmed, per ${source}` : 'Unconfirmed';
  if (item.status === 'confirmed') return source ? `Confirmed by ${source}` : 'Confirmed';
  return null;
}

function facts(item: NewsletterItem): string[] {
  if (!item.isWeb3Incident) return item.cveId ? [clean(item.cveId)] : [];
  return [item.projectName, item.chain, item.attackType, formatLossReported(item.amountUsd)]
    .map((value) => clean(value ?? ''))
    .filter(Boolean);
}

interface ItemLinks {
  /** Where the title points: our incident page, or the feed for a retraction. */
  title: string;
  /** The visible "Details on Digibastion" link; null for a retraction. */
  details: string | null;
}

function itemLinks(item: NewsletterItem, campaign: UtmCampaign, siteUrl: string, retracted = false): ItemLinks {
  if (retracted) return { title: trackEmailLink('/threat-intel', campaign, 'feed', siteUrl), details: null };
  return {
    title: trackEmailLink(item.incidentUrl, campaign, 'title', siteUrl),
    details: trackEmailLink(item.incidentUrl, campaign, 'details', siteUrl),
  };
}

function itemHtml(item: NewsletterItem, links: ItemLinks): string {
  const color = SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.info;
  const status = statusLabel(item);
  const credit = sourceCredit(item);
  const label = clean(credit.label) || 'Source not given';
  const factLine = facts(item);
  const creditParts = [
    `Source: ${credit.url
      ? `<a href="${escapeHtml(credit.url)}" style="color:#93c5fd;text-decoration:underline;">${escapeHtml(label)}</a>`
      : escapeHtml(label)}`,
    credit.poweredByQuillMonitor
      ? `Powered by <a href="${QUILLMONITOR_DATABASE_URL}" style="color:#93c5fd;text-decoration:underline;">QuillMonitor</a>`
      : '',
  ].filter(Boolean);
  const sourceLine = `<p style="margin:8px 0 0;color:#a8b3c7;font-size:12px;line-height:18px;">${creditParts.join(' · ')}</p>`;
  const detailsLine = links.details
    ? `<p style="margin:6px 0 0;font-size:13px;line-height:19px;"><a href="${escapeHtml(links.details)}" style="color:#93c5fd;text-decoration:underline;">Details on Digibastion</a></p>`
    : '';
  return `<tr>
  <td class="email-pad" style="padding:18px 28px;border-bottom:1px solid #374151;">
    <p style="margin:0 0 8px;">
      <span style="background:${color};color:#ffffff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;">${escapeHtml(item.severity)}</span>
      ${status ? `<span style="margin-left:8px;color:${item.status === 'unconfirmed' ? '#fbbf24' : '#86efac'};font-size:12px;font-weight:700;">${escapeHtml(status)}</span>` : ''}
    </p>
    <p style="margin:0;font-size:16px;line-height:22px;font-weight:700;">
      <a href="${escapeHtml(links.title)}" style="color:#f3f4f6;text-decoration:none;">${escapeHtml(clean(item.title) || 'Security report')}</a>
    </p>
    ${factLine.length > 0 ? `<p style="margin:6px 0 0;color:#d1d5db;font-size:13px;line-height:19px;">${factLine.map(escapeHtml).join(' · ')}</p>` : ''}
    ${item.summary ? `<p style="margin:8px 0 0;color:#9ca3af;font-size:14px;line-height:21px;">${escapeHtml(item.summary)}</p>` : ''}
    ${sourceLine}
    ${detailsLine}
  </td>
</tr>`;
}

function itemText(item: NewsletterItem, links: ItemLinks): string {
  const status = statusLabel(item);
  const credit = sourceCredit(item);
  const label = clean(credit.label) || 'Source not given';
  const lines = [
    `[${item.severity.toUpperCase()}${status ? ` · ${status}` : ''}] ${clean(item.title) || 'Security report'}`,
  ];
  const factLine = facts(item);
  if (factLine.length > 0) lines.push(factLine.join(' · '));
  if (item.summary) lines.push(item.summary);
  lines.push(`Source: ${label}${credit.url ? ` ${credit.url}` : ''}`);
  if (credit.poweredByQuillMonitor) lines.push(`Powered by QuillMonitor: ${QUILLMONITOR_DATABASE_URL}`);
  if (links.details) lines.push(`Details on Digibastion: ${links.details}`);
  return lines.join('\n');
}

function headerHtml(title: string, subtitle: string): string {
  return `<tr>
  <td class="email-pad" style="padding:24px 28px;background-color:#111827;border-bottom:1px solid #374151;">
    <p style="margin:0;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Digibastion Threat Intel</p>
    <h1 style="margin:6px 0 0;color:#f3f4f6;font-size:22px;line-height:28px;">${escapeHtml(title)}</h1>
    <p style="margin:6px 0 0;color:#a8b3c7;font-size:14px;line-height:20px;">${escapeHtml(subtitle)}</p>
  </td>
</tr>`;
}

function feedUrl(campaign: UtmCampaign, siteUrl: string): string {
  return trackEmailLink('/threat-intel', campaign, 'feed', siteUrl);
}

function feedLinkHtml(url: string): string {
  return `<tr>
  <td class="email-pad" style="padding:20px 28px;text-align:center;">
    <a href="${escapeHtml(url)}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Open the Threat Intel feed</a>
  </td>
</tr>`;
}

export function renderAlertEmail(o: { items: NewsletterItem[]; links: UnsubscribeLinks; postalAddress: string | null; siteUrl?: string }): { html: string; text: string } {
  const siteUrl = o.siteUrl ?? SITE_URL;
  const items = [...o.items].sort(compareItems);
  const count = items.length;
  const subtitle = `${count} new ${count === 1 ? 'report matches' : 'reports match'} your alert settings.`;
  const footer = { links: o.links, postalAddress: o.postalAddress, reason: ALERT_REASON };
  const feed = feedUrl('realtime_alert', siteUrl);
  const html = renderEmailDocument({
    title: buildAlertSubject(items),
    preheader: subtitle,
    bodyHtml: [
      headerHtml('Security alert', subtitle),
      ...items.map((item) => itemHtml(item, itemLinks(item, 'realtime_alert', siteUrl))),
      feedLinkHtml(feed),
    ].join('\n'),
    footerHtml: renderComplianceFooterHtml(footer),
  });
  const text = [
    'Digibastion security alert',
    subtitle,
    '',
    items.map((item) => itemText(item, itemLinks(item, 'realtime_alert', siteUrl))).join('\n\n'),
    '',
    `Threat Intel feed: ${feed}`,
    '',
    renderComplianceFooterText(footer),
  ].join('\n');
  return { html, text };
}

function followUpExplanation(kind: FollowUpKind, item: NewsletterItem): string {
  const source = sourceLabel(item);
  if (kind === 'retracted') {
    return `We sent you an alert about this report. It has since been retracted: ${source ? `${source} withdrew it` : 'the source withdrew it'} or it was removed from the Digibastion feed after review.`;
  }
  return `We sent you an alert about this report. It is now rated critical${formatLossReported(item.amountUsd) && item.isWeb3Incident ? ` (${formatLossReported(item.amountUsd)})` : ''}.`;
}

export function renderFollowUpEmail(o: { kind: FollowUpKind; item: NewsletterItem; links: UnsubscribeLinks; postalAddress: string | null; siteUrl?: string }): { html: string; text: string } {
  const siteUrl = o.siteUrl ?? SITE_URL;
  const title = o.kind === 'retracted' ? 'Retracted' : 'Now critical';
  const explanation = followUpExplanation(o.kind, o.item);
  const footer = { links: o.links, postalAddress: o.postalAddress, reason: ALERT_REASON };
  // A retracted record may be gone, so its links point at the feed instead.
  const links = itemLinks(o.item, 'alert_followup', siteUrl, o.kind === 'retracted');
  const feed = feedUrl('alert_followup', siteUrl);
  const html = renderEmailDocument({
    title: buildFollowUpSubject(o.kind, o.item),
    preheader: explanation,
    bodyHtml: [headerHtml(title, explanation), itemHtml(o.item, links), feedLinkHtml(feed)].join('\n'),
    footerHtml: renderComplianceFooterHtml(footer),
  });
  const text = [
    `${title}: ${explanation}`,
    '',
    itemText(o.item, links),
    '',
    `Threat Intel feed: ${feed}`,
    '',
    renderComplianceFooterText(footer),
  ].join('\n');
  return { html, text };
}
