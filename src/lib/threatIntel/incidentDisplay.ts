import type { NewsArticle } from '@/types/news';
import { getNewsSourceLinks } from '@/utils/newsSources';
import {
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
  isSlowMistArticle,
  isWeb3Incident,
  SLOWMIST_ATTRIBUTION_URL,
} from '@/utils/newsIncident';
import { safeExternalUrl } from '@/utils/safeUrl';
import { readIncidentFields, type IncidentFields } from '../../../supabase/functions/_shared/incident-fields';
import { isLegacyAmountMetadata } from '../../../supabase/functions/_shared/legacy-amounts';
import { formatCompactUsd } from '../../../supabase/functions/_shared/usd-amount';
import { QUILLMONITOR_DATABASE_URL, WEB3_IS_GOING_GREAT_URL } from './officialLinks';

export type VerificationDisplay = 'confirmed' | 'unconfirmed';
export type SummaryLabel = 'AI summary' | 'Excerpt' | 'Provider summary';

export interface IncidentSourceLink {
  label: string;
  /** Null only when a record names its source but carries no safe link. */
  url: string | null;
}

export interface IncidentDisplay {
  verification: VerificationDisplay | null;
  /** Tooltip text for the verification badge. Empty when there is no status. */
  verificationHelp: string;
  /** "Exploited Sep 30, 2026", or null when the source gave no usable date. */
  incidentDateLabel: string | null;
  /** "Added Oct 9": when Digibastion stored the record. */
  addedDateLabel: string;
  /** "$3.8M" when confirmed, "~$3.8M reported" otherwise, null with no amount. */
  lossLabel: string | null;
  fundsReturned: boolean;
  /** At least one entry whenever the record names a provider or publisher. */
  sources: IncidentSourceLink[];
  summaryLabel: SummaryLabel | null;
}

export interface IncidentDisplayOptions {
  /** Reference time for deciding whether to print the year. Defaults to now. */
  now?: Date;
  /** IANA zone for the "Added" date. Defaults to the viewer's zone. */
  timeZone?: string;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const PENDING_SUMMARY = /^summary pending\.?$/i;

export const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const formatDay = (date: Date, timeZone: string | undefined, withYear: boolean): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
    timeZone,
  }).format(date);

const yearOf = (date: Date, timeZone: string | undefined): string =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone }).format(date);

/** Name of the tracker or publisher that supplied the record. */
export function getProviderLabel(article: NewsArticle): string | null {
  if (isQuillMonitorArticle(article)) return 'QuillMonitor';
  if (isSlowMistArticle(article)) return 'SlowMist Hacked';
  const provider = article.metadata?.provider;
  if (provider === 'web3-incidents' || provider === 'web3') {
    return article.metadata?.data_source === 'feed-2' ? 'QuillAudits hacks list' : 'Web3 Is Going Just Great';
  }
  return article.sourceName?.trim() || null;
}

export function resolveVerification(article: NewsArticle, fields: IncidentFields): VerificationDisplay | null {
  const status = fields.verification
    ?? (isPreliminaryQuillMonitorArticle(article) ? 'unverified' : article.metadata?.verification_status ?? null);
  if (status === 'verified') return 'confirmed';
  if (status === 'unverified') return 'unconfirmed';
  return null;
}

function getVerificationHelp(verification: VerificationDisplay | null, providerLabel: string | null): string {
  const source = providerLabel ?? 'The source';
  if (verification === 'confirmed') {
    return `${source} lists this incident as verified. Digibastion shows the source's status and does not verify incidents itself.`;
  }
  if (verification === 'unconfirmed') {
    return `${source} has not verified this report yet. Details and the loss figure may change.`;
  }
  return '';
}

/** The calendar day the incident happened, as midnight UTC, or null when unknown. */
export function getIncidentDate(
  article: NewsArticle,
  fields: IncidentFields = readIncidentFields(article.metadata),
): Date | null {
  if (fields.incidentDateUnknown || article.metadata?.incident_date_unknown === true) return null;
  const raw = fields.incidentDate
    ?? (typeof article.metadata?.incident_date === 'string' ? article.metadata.incident_date : null);
  const day = raw?.trim().slice(0, 10) ?? '';
  if (!ISO_DAY.test(day)) return null;
  const date = new Date(`${day}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// The largest crypto theft on record is about $1.5B (Bybit, 2025). Anything
// above $100B is a parsing error from the old web3-incidents importer, so the
// card shows no figure rather than a wrong one.
const MAX_PLAUSIBLE_LOSS_USD = 100_000_000_000;
// "$3.8M", "$1,200", "$1.2B": the only display strings the importers write.
const DISPLAY_AMOUNT = /^\$([\d.,]+)([KMB])?$/;
const DISPLAY_MULTIPLIERS: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };

/** The stored display string when it is a plausible dollar figure, else null. */
function trustedDisplayAmount(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const display = value.trim().replace(/^~\s*/, '');
  const match = DISPLAY_AMOUNT.exec(display);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, '')) * (match[2] ? DISPLAY_MULTIPLIERS[match[2]] : 1);
  return Number.isFinite(amount) && amount > 0 && amount <= MAX_PLAUSIBLE_LOSS_USD ? display : null;
}

function getLossLabel(
  article: NewsArticle,
  fields: IncidentFields,
  verification: VerificationDisplay | null,
): string | null {
  const metadata = article.metadata;
  // Old importer rows read "$50,000" as $50,000M. They show no figure until
  // the dedupe-incidents repair re-parses them.
  if (isLegacyAmountMetadata(metadata)) return null;
  const rawAmount = metadata?.amount_lost_usd;
  if (typeof rawAmount === 'number' && rawAmount > MAX_PLAUSIBLE_LOSS_USD) return null;
  const amount = typeof rawAmount === 'number' && Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : null;
  const display = trustedDisplayAmount(metadata?.amount_display) ?? (amount !== null ? formatCompactUsd(amount) : null);
  if (!display) return null;
  if (fields.amountStatus === 'revised') return `${display} (revised)`;
  const confirmed = fields.amountStatus === 'confirmed'
    || (fields.amountStatus === null && verification === 'confirmed');
  return confirmed ? display : `~${display} reported`;
}

function getSources(article: NewsArticle, fields: IncidentFields, providerLabel: string | null): IncidentSourceLink[] {
  const metadata = article.metadata;
  const quillMonitor = isQuillMonitorArticle(article);
  const slowMist = isSlowMistArticle(article);
  // Generic provider pages (database home pages) are attribution, not evidence.
  const providerPage = quillMonitor
    ? safeExternalUrl(metadata?.attribution_url) ?? QUILLMONITOR_DATABASE_URL
    : slowMist
      ? safeExternalUrl(metadata?.attribution_url) ?? SLOWMIST_ATTRIBUTION_URL
      : null;

  const linked: IncidentSourceLink[] = [];
  const unlinked: string[] = [];
  const seenUrls = new Set<string>();
  const seenLabels = new Set<string>();
  const add = (label: unknown, url: unknown) => {
    const name = typeof label === 'string' ? label.trim() : '';
    if (!name) return;
    const safe = safeExternalUrl(url);
    if (!safe) {
      unlinked.push(name);
      return;
    }
    if (seenUrls.has(safe)) return;
    seenUrls.add(safe);
    seenLabels.add(name.toLowerCase());
    linked.push({ label: name, url: safe });
  };

  for (const source of fields.sources) add(source.label || source.provider, source.url);

  if (quillMonitor) {
    add('QuillMonitor', safeExternalUrl(metadata?.reference_url) ?? providerPage);
  } else if (slowMist) {
    add('SlowMist Hacked', providerPage);
  } else if (providerLabel === 'Web3 Is Going Just Great' && !seenLabels.has(providerLabel.toLowerCase())) {
    add(providerLabel, WEB3_IS_GOING_GREAT_URL);
  }

  for (const link of getNewsSourceLinks(article, providerPage)) add(link.label, link.url);

  const result = [...linked];
  for (const name of unlinked) {
    if (seenLabels.has(name.toLowerCase())) continue;
    seenLabels.add(name.toLowerCase());
    result.push({ label: name, url: null });
  }
  if (result.length === 0 && providerLabel) result.push({ label: providerLabel, url: null });
  return result;
}

function getSummaryLabel(article: NewsArticle, fields: IncidentFields): SummaryLabel | null {
  const summary = article.summary?.trim() ?? '';
  if (!summary || PENDING_SUMMARY.test(summary)) return null;
  const legacy = article.metadata?.summary_origin;
  const origin = fields.summaryOrigin
    ?? (legacy === 'ai' ? 'ai' : legacy === 'provider' || legacy === 'provider-template' ? 'provider' : null);
  if (origin === 'ai') return 'AI summary';
  if (origin === 'publisher') return 'Excerpt';
  if (origin === 'provider') return 'Provider summary';
  return null;
}

export function getIncidentDisplay(article: NewsArticle, options: IncidentDisplayOptions = {}): IncidentDisplay {
  const fields = readIncidentFields(article.metadata);
  const now = options.now ?? new Date();
  const providerLabel = getProviderLabel(article);
  const verification = resolveVerification(article, fields);
  const incidentDate = getIncidentDate(article, fields);
  const added = toDate(article.createdAt) ?? toDate(article.publishedAt) ?? now;
  const addedWithYear = yearOf(added, options.timeZone) !== yearOf(now, options.timeZone);

  return {
    verification,
    verificationHelp: getVerificationHelp(verification, providerLabel),
    incidentDateLabel: incidentDate ? `Exploited ${formatDay(incidentDate, 'UTC', true)}` : null,
    addedDateLabel: `Added ${formatDay(added, options.timeZone, addedWithYear)}`,
    lossLabel: getLossLabel(article, fields, verification),
    fundsReturned: fields.fundsReturned === true,
    sources: getSources(article, fields, providerLabel),
    summaryLabel: getSummaryLabel(article, fields),
  };
}

export interface StatusHistoryEntry {
  label: string;
  detail: string;
}

const formatDateTime = (date: Date, timeZone: string | undefined): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  })
    .format(date)
    // Newer ICU builds put a narrow no-break space before AM/PM.
    .replace(/\u202f/g, ' ');

/** Incident timeline for the incident page. Empty for ordinary news items. */
export function getStatusHistory(
  article: NewsArticle,
  options: Pick<IncidentDisplayOptions, 'timeZone'> = {},
): StatusHistoryEntry[] {
  const fields = readIncidentFields(article.metadata);
  const verification = resolveVerification(article, fields);
  if (!isWeb3Incident(article) && verification === null) return [];

  const provider = getProviderLabel(article) ?? 'The source';
  const entries: StatusHistoryEntry[] = [];

  const incidentDate = getIncidentDate(article, fields);
  entries.push({
    label: 'Incident date',
    detail: incidentDate ? formatDay(incidentDate, 'UTC', true) : 'Not given by the source',
  });

  const firstReported = toDate(article.createdAt) ?? toDate(article.publishedAt);
  if (firstReported) {
    entries.push({ label: 'First reported on Digibastion', detail: formatDateTime(firstReported, options.timeZone) });
  }

  if (verification === 'confirmed') {
    const updated = toDate(article.metadata?.provider_updated_at);
    entries.push({
      label: `Verified by ${provider}`,
      detail: updated ? `Status as of ${formatDateTime(updated, options.timeZone)}` : 'Date not provided',
    });
  } else if (verification === 'unconfirmed') {
    entries.push({ label: 'Awaiting verification', detail: `${provider} has not verified this report yet` });
  }

  return entries;
}
