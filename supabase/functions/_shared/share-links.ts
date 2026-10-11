// Links we hand out (Telegram, emails, share buttons) and the text that goes
// with them. Only our own pages get UTM tags; source and partner links are
// returned untouched. Query strings are built by hand with
// encodeURIComponent, so Deno, Node and browsers produce identical bytes.
// Pure module: no Deno or URL imports.
import { isQuillMonitorOnly, sourceLabelFor, sourceLinkFor } from './attribution.ts';
import type { AnswerInput } from './incident-answer.ts';
import type { WeeklyPublicContent } from './newsletter-content.ts';
import { FUNCTIONS_BASE_URL, SITE_URL, trimTrailingSlashes } from './site-urls.ts';
import { truncateAtWord } from './summary-text.ts';
import { formatCompactUsd } from './usd-amount.ts';

export type UtmSource = 'telegram' | 'email' | 'x' | 'linkedin' | 'reddit' | 'bluesky' | 'share';
export type UtmMedium = 'social' | 'email' | 'share';
export type UtmCampaign = 'incident_alerts' | 'weekly_deep_dive' | 'realtime_alert' | 'alert_followup' | 'daily_brief'
  | 'digest_daily' | 'digest_weekly' | 'subscribe_confirm' | 'share_incident' | 'share_weekly';

/**
 * Campaign tags. Values are fixed words: never put an email address,
 * subscription id, token or incident id in any of them.
 */
export interface Tracking { source: UtmSource; medium: UtmMedium; campaign: UtmCampaign; content?: string }

export const SHARE_TEXT_LIMIT = 200;
export const TELEGRAM_CHANNEL_URL = 'https://t.me/digibastion' as const;
export const TELEGRAM_CHANNEL_HANDLE = '@digibastion' as const;
// Links that carry a token or open someone's subscription. Tags there would
// leak into analytics next to a secret, so they are never tagged.
const UNTAGGED_PATHS = ['/verify-email', '/manage-subscription', '/unsubscribe'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface UrlParts { base: string; query: string[]; hash: string }

function splitUrl(url: string): UrlParts {
  const hashAt = url.indexOf('#');
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  const beforeHash = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const queryAt = beforeHash.indexOf('?');
  const base = queryAt >= 0 ? beforeHash.slice(0, queryAt) : beforeHash;
  const query = queryAt >= 0 ? beforeHash.slice(queryAt + 1).split('&').filter(Boolean) : [];
  return { base, query, hash };
}

const isTrackingParam = (pair: string) => /^utm_[^=]*(=|$)/i.test(pair);

function joinUrl({ base, query, hash }: UrlParts): string {
  return `${base}${query.length > 0 ? `?${query.join('&')}` : ''}${hash}`;
}

/** Absolute URL on our site for a path, or null when the input points at another host. */
function ownAbsoluteUrl(pathOrUrl: string, site: string): string | null {
  if (pathOrUrl.startsWith('//')) return null;
  if (pathOrUrl.startsWith('/')) return `${site}${pathOrUrl}`;
  if (pathOrUrl === site) return `${site}/`;
  return ['/', '?', '#'].some((c) => pathOrUrl.startsWith(`${site}${c}`)) ? pathOrUrl : null;
}

/**
 * Our page with UTM tags in the order source, medium, campaign, content.
 * Other hosts come back unchanged; token and account links come back
 * absolute but untagged. Existing utm_* tags are replaced, other parameters
 * and the hash are kept.
 */
export function buildTrackedUrl(pathOrUrl: string, t?: Tracking, siteUrl: string = SITE_URL): string {
  const site = trimTrailingSlashes(siteUrl);
  const absolute = ownAbsoluteUrl(pathOrUrl, site);
  if (absolute === null || !t) return absolute ?? pathOrUrl;

  const parts = splitUrl(absolute);
  const path = parts.base.slice(site.length) || '/';
  const hasToken = parts.query.some((pair) => /^token(=|$)/i.test(pair));
  if (hasToken || UNTAGGED_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return absolute;

  const tags = [
    `utm_source=${encodeURIComponent(t.source)}`,
    `utm_medium=${encodeURIComponent(t.medium)}`,
    `utm_campaign=${encodeURIComponent(t.campaign)}`,
    ...(t.content ? [`utm_content=${encodeURIComponent(t.content)}`] : []),
  ];
  return joinUrl({ ...parts, query: [...parts.query.filter((pair) => !isTrackingParam(pair)), ...tags] });
}

/** Our page tagged for one email campaign; other hosts and token links stay untagged. */
export function trackEmailLink(pathOrUrl: string, campaign: UtmCampaign, content: string, siteUrl: string = SITE_URL): string {
  return buildTrackedUrl(pathOrUrl, { source: 'email', medium: 'email', campaign, content }, siteUrl);
}

export interface SourceCredit {
  /** The source's name, never Digibastion; "Source not given" when unknown. */
  label: string;
  /** The original report, or null when missing, unsafe or one of our own pages: print the name unlinked. */
  url: string | null;
  /** True when QuillMonitor is the only source, so "Powered by QuillMonitor" must show. */
  poweredByQuillMonitor: boolean;
}

/** How an email or post credits an item's source. */
export function sourceCredit(item: {
  providers: readonly string[];
  sourceName: string | null;
  sourceUrl: string | null;
  incidentUrl: string;
}): SourceCredit {
  return { label: sourceLabelFor(item), url: sourceLinkFor(item), poweredByQuillMonitor: isQuillMonitorOnly(item.providers) };
}

/** Drops utm_* parameters and keeps everything else. */
export function stripTracking(url: string): string {
  const parts = splitUrl(url);
  return joinUrl({ ...parts, query: parts.query.filter((pair) => !isTrackingParam(pair)) });
}

export interface ShareTargetInput { url: string; text: string; title?: string; via?: string | null }
export interface ShareTargets { x: string; telegram: string; linkedin: string; reddit: string; bluesky: string }

/** Share-intent URLs. `url` should already carry the platform's tags. */
export function shareTargets(i: ShareTargetInput): ShareTargets {
  const url = encodeURIComponent(i.url);
  const text = encodeURIComponent(i.text);
  const via = i.via ? `&via=${encodeURIComponent(i.via)}` : '';
  return {
    x: `https://x.com/intent/post?text=${text}&url=${url}${via}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    // LinkedIn ignores any text parameter; it reads the page's preview tags.
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    reddit: `https://www.reddit.com/submit?url=${url}&title=${encodeURIComponent(i.title ?? i.text)}`,
    bluesky: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${i.text} ${i.url}`)}`,
  };
}

// Same rule as incident-answer.ts: attack types that already name an event
// read wrong with "attack" after them.
const NAMES_AN_EVENT = /\b(attack|exploit|hack|compromise|scam|phishing|drain|theft|breach|leak|rug ?pull)$/i;

function attackPhrase(attackType: string | null): string | null {
  const words = attackType?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return null;
  const phrase = words.map((word) => (/^[A-Z0-9]{2,}$/.test(word) ? word : word.toLowerCase())).join(' ');
  return NAMES_AN_EVENT.test(phrase) ? phrase : `${phrase} attack`;
}

function lossLabel(input: Pick<AnswerInput, 'amountUsd' | 'amountDisplay'>): string | null {
  const display = input.amountDisplay?.trim().replace(/^~\s*/, '');
  if (display) return display;
  return input.amountUsd && input.amountUsd > 0 ? formatCompactUsd(input.amountUsd) : null;
}

const fit = (text: string) => (Array.from(text).length > SHARE_TEXT_LIMIT ? truncateAtWord(text, SHARE_TEXT_LIMIT) : text);

/**
 * Prefilled share text, at most 200 characters. It names the source, uses
 * the source's own status word and says "reported" for losses.
 */
export function shareTextForIncident(i: AnswerInput): string {
  const attack = attackPhrase(i.attackType);
  const subject = i.projectName?.trim()
    ? `${i.projectName.trim()}${attack ? ` ${attack}` : ''}`
    : i.title.trim() || 'Security incident';
  const chain = i.chain?.trim() ? ` on ${i.chain.trim()}` : '';
  const loss = lossLabel(i);
  const source = sourceLabelFor(i);

  const compose = (head: string) => {
    if (i.status === 'confirmed') return `${head}${loss ? `: ~${loss} reported lost` : ''}. Confirmed by ${source}.`;
    if (i.status === 'unconfirmed') return `Unconfirmed: ${head}${loss ? `, ~${loss} reported lost` : ''} (per ${source}).`;
    return `${head}${loss ? `: ~${loss} reported lost` : ''}. Source: ${source}.`;
  };

  const head = `${subject}${chain}`;
  const full = compose(head);
  const overflow = Array.from(full).length - SHARE_TEXT_LIMIT;
  if (overflow <= 0) return full;
  const room = Array.from(head).length - overflow;
  return fit(room >= 20 ? compose(truncateAtWord(head, room)) : full);
}

function weekLabel(weekStart: string): string {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(weekStart);
  const month = match ? MONTHS[Number(match[1]) - 1] : undefined;
  return match && month ? `${month} ${Number(match[2])}` : weekStart;
}

/** "Web3 security, week of Oct 5: ~$12.3M reported lost across 9 incidents. Every item names its source." */
export function shareTextForWeekly(c: Pick<WeeklyPublicContent, 'weekStart' | 'totals'>): string {
  const lead = `Web3 security, week of ${weekLabel(c.weekStart)}`;
  const count = c.totals.incidentCount;
  if (count <= 0) return `${lead}: no incidents recorded.`;
  const incidents = `${count} ${count === 1 ? 'incident' : 'incidents'}`;
  const loss = c.totals.lossUsd > 0 ? formatCompactUsd(c.totals.lossUsd) : null;
  return fit(`${lead}: ${loss ? `~${loss} reported lost across ${incidents}` : incidents}. Every item names its source.`);
}

/** Preview image for an incident page, rendered by the og-image function. */
export function incidentOgImageUrl(id: string): string {
  return `${FUNCTIONS_BASE_URL}/og-image?kind=incident&id=${encodeURIComponent(id)}`;
}

/** Preview image for a weekly page, rendered by the og-image function. */
export function weeklyOgImageUrl(weekStart: string): string {
  return `${FUNCTIONS_BASE_URL}/og-image?kind=weekly&week=${encodeURIComponent(weekStart)}`;
}
