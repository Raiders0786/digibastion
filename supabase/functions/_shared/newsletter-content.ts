// The newsletter content contract. Builders write these shapes into
// newsletter_issues.content once per period; the sender, the weekly page and
// the Telegram link post read them. Changing a field here changes the
// contract for W3, W4, W5 and W6.
// Pure module: no Deno or URL imports, so vitest can import it.
import { readIncidentFields } from './incident-fields.ts';
import { isLegacyAmountMetadata } from './legacy-amounts.ts';
import { truncateAtWord } from './summary-text.ts';
import { formatCompactUsd } from './usd-amount.ts';
import {
  isWeb3IncidentArticle,
  severityRank,
  stripHtml,
  type DeliverableArticle,
} from './subscription-delivery.ts';

export const NEWSLETTER_CONTENT_VERSION = 1;
/** Same rule as src/lib/threatIntel/incidentDisplay.ts: anything above is a parsing error. */
export const MAX_PLAUSIBLE_LOSS_USD = 100_000_000_000;

export type NewsletterSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
/** null = the source has no verification flow; show the source name only. */
export type ItemStatus = 'confirmed' | 'unconfirmed' | null;

export interface NewsletterItem {
  uid: string;
  articleId: string | null;
  title: string;
  incidentUrl: string;
  sourceName: string | null;
  sourceUrl: string | null;
  providers: string[];
  severity: NewsletterSeverity;
  category: string;
  isWeb3Incident: boolean;
  status: ItemStatus;
  projectName: string | null;
  chain: string | null;
  attackType: string | null;
  amountUsd: number | null;
  amountDisplay: string | null;
  fundsReturned: boolean | null;
  incidentDate: string | null;
  cveId: string | null;
  tags: string[];
  technologies: string[];
  summary: string;
  createdAt: string;
  /** metadata.security_domain ('web3', ...) when the source set it; matches the legacy digest's category rule. */
  securityDomain?: string | null;
}

export interface StatusChange {
  change: 'confirmed' | 'revised' | 'retracted';
  at: string;
  item: NewsletterItem;
  previousAmountUsd: number | null;
  amountUsd: number | null;
}

export interface SecurityAction { id: string; text: string; url: string; guideTitle: string }

export interface DailyBriefContent {
  version: 1;
  kind: 'daily';
  issueDate: string;
  periodStart: string;
  periodEnd: string;
  incidents: NewsletterItem[];
  unconfirmed: NewsletterItem[];
  statusChanges: StatusChange[];
  vulnerabilities: NewsletterItem[];
  /**
   * Every other deliverable record of the day, so a subscriber's brief covers
   * at least what the legacy digest would have sent. Missing on issues built
   * before 2026-10-15.
   */
  updates?: NewsletterItem[];
  action: SecurityAction;
  /** Set by the sender, never stored: nothing matched this subscriber's filters. */
  quiet?: QuietBrief;
}

export interface QuietBrief {
  /** "high severity and above in DeFi exploits and Web3 security" */
  filterSummary: string;
  /** The top other records of the day, any severity or category. */
  highlights: NewsletterItem[];
}

export interface WeeklyParagraph { id: string; text: string; origin: 'ai' | 'template' }
export interface WeeklyBreakdown { key: string; label: string; count: number; lossUsd: number }
export interface WeeklyTotals {
  lossUsd: number;
  previousLossUsd: number;
  unconfirmedLossUsd: number;
  incidentCount: number;
  unconfirmedCount: number;
  fundsReturnedCount: number;
  lateReportCount: number;
  byAttackType: WeeklyBreakdown[];
  byChain: WeeklyBreakdown[];
}

export interface WeeklyPublicContent {
  version: 1;
  kind: 'weekly';
  weekStart: string;
  weekEnd: string; // Sunday
  issueDate: string; // send Monday
  totals: WeeklyTotals;
  top: { item: NewsletterItem; what: WeeklyParagraph; action: WeeklyParagraph }[];
  trends: WeeklyParagraph;
  vulnerabilities: { items: NewsletterItem[]; summary: WeeklyParagraph };
  opsecTip: SecurityAction;
  sources: string[];
}

export interface WeeklyArchive {
  aiEnabled: boolean;
  model: string | null;
  input: unknown;
  prompt: { system: string; user: string } | null;
  rawOutput: string | null;
  validation: { paragraphId: string; accepted: boolean; reasons: string[] }[];
  error: string | null;
}

export interface WeeklyIssueContent extends WeeklyPublicContent { archive: WeeklyArchive }

export const DAILY_CAPS = { incidents: 15, unconfirmed: 10, statusChanges: 15, vulnerabilities: 10, updates: 200 } as const;

export interface NewsletterSourceRow {
  id: string;
  uid: string;
  title: string;
  summary: string | null;
  severity: string;
  category: string;
  link: string | null;
  source_name: string | null;
  cve_id: string | null;
  tags: string[] | null;
  affected_technologies: string[] | null;
  created_at: string;
  metadata: unknown;
}

const SUMMARY_LIMIT = 280;
const MAX_FIELD_LENGTH = 200;
const SEVERITIES: readonly NewsletterSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
// "$3.8M", "$1,200", "$1.2B": the only display strings the importers write.
const DISPLAY_AMOUNT = /^\$([\d.,]+)([KMB])?$/;
const DISPLAY_MULTIPLIERS: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown, max = MAX_FIELD_LENGTH): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = stripHtml(value).slice(0, max).trim();
  return trimmed || null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function httpUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function plausibleAmount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MAX_PLAUSIBLE_LOSS_USD ? value : null;
}

function trustedDisplayAmount(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const display = value.trim().replace(/^~\s*/, '');
  const match = DISPLAY_AMOUNT.exec(display);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, '')) * (match[2] ? DISPLAY_MULTIPLIERS[match[2]] : 1);
  return plausibleAmount(amount) === null ? null : display;
}

function incidentUrlFor(siteUrl: string, articleId: string | null): string {
  const site = siteUrl.replace(/\/+$/, '');
  return articleId ? `${site}/threat-intel/${encodeURIComponent(articleId)}` : `${site}/threat-intel`;
}

function itemFromParts(row: Omit<NewsletterSourceRow, 'id'> & { id: string | null }, siteUrl: string): NewsletterItem {
  const metadata = record(row.metadata);
  const fields = readIncidentFields(metadata);
  const incidentUrl = incidentUrlFor(siteUrl, row.id);
  const severity = SEVERITIES.includes(row.severity as NewsletterSeverity) ? row.severity as NewsletterSeverity : 'info';
  const legacyAmount = isLegacyAmountMetadata(metadata);
  const amountUsd = legacyAmount ? null : plausibleAmount(metadata.amount_lost_usd);
  const rawAmount = metadata.amount_lost_usd;
  const implausible = typeof rawAmount === 'number' && rawAmount > MAX_PLAUSIBLE_LOSS_USD;
  const amountDisplay = legacyAmount || implausible
    ? null
    : trustedDisplayAmount(metadata.amount_display) ?? (amountUsd !== null ? formatCompactUsd(amountUsd) : null);
  const providers = [...new Set(fields.sources.map((source) => source.provider))];
  const provider = text(metadata.provider, 60)?.toLowerCase();
  if (providers.length === 0 && provider) providers.push(provider);
  const deliverable: DeliverableArticle = {
    id: row.id ?? row.uid,
    title: row.title,
    severity,
    category: row.category,
    source_name: row.source_name,
    metadata,
  };

  return {
    uid: row.uid,
    articleId: row.id,
    title: text(row.title, 300) ?? 'Untitled incident',
    incidentUrl,
    sourceName: text(row.source_name, 120),
    sourceUrl: httpUrl(row.link) ?? incidentUrl,
    providers,
    severity,
    category: typeof row.category === 'string' ? row.category : '',
    isWeb3Incident: isWeb3IncidentArticle(deliverable),
    status: fields.verification === 'verified' ? 'confirmed' : fields.verification === 'unverified' ? 'unconfirmed' : null,
    projectName: text(metadata.project_name),
    chain: text(metadata.chain, 64),
    attackType: text(metadata.attack_type),
    amountUsd,
    amountDisplay,
    fundsReturned: fields.fundsReturned,
    incidentDate: fields.incidentDate,
    cveId: text(row.cve_id, 40),
    tags: stringList(row.tags),
    technologies: stringList(row.affected_technologies),
    summary: truncateAtWord(stripHtml(row.summary), SUMMARY_LIMIT),
    createdAt: row.created_at,
    securityDomain: text(metadata.security_domain, 40)?.toLowerCase() ?? null,
  };
}

export function toNewsletterItem(row: NewsletterSourceRow, siteUrl: string): NewsletterItem {
  return itemFromParts(row, siteUrl);
}

/**
 * Item for an incident_status_events row. The snapshot holds the old row's
 * id, title, severity, category, link, source_name, tags,
 * affected_technologies and created_at, plus a `metadata` object with the
 * incident keys (see log_incident_status_change in migration 20261013100000).
 */
export function statusChangeItem(snapshot: unknown, uid: string, siteUrl: string): NewsletterItem {
  const row = record(snapshot);
  const id = typeof row.id === 'string' && row.id ? row.id : null;
  return itemFromParts({
    id,
    uid,
    title: typeof row.title === 'string' ? row.title : '',
    summary: null,
    severity: typeof row.severity === 'string' ? row.severity : 'info',
    category: typeof row.category === 'string' ? row.category : '',
    link: typeof row.link === 'string' ? row.link : null,
    source_name: typeof row.source_name === 'string' ? row.source_name : null,
    cve_id: null,
    tags: stringList(row.tags),
    affected_technologies: stringList(row.affected_technologies),
    created_at: typeof row.created_at === 'string' ? row.created_at : '',
    metadata: row.metadata,
  }, siteUrl);
}

/** The DeliverableArticle view of an item, for matchesDeliveryPreferences. */
export function newsletterItemToDeliverable(item: NewsletterItem): DeliverableArticle {
  const verification = item.status === 'confirmed' ? 'verified' : item.status === 'unconfirmed' ? 'unverified' : undefined;
  return {
    id: item.articleId ?? item.uid,
    title: item.title,
    summary: item.summary,
    severity: item.severity,
    category: item.category,
    link: item.sourceUrl,
    tags: item.tags,
    affected_technologies: item.technologies,
    source_name: item.sourceName,
    cve_id: item.cveId,
    metadata: {
      is_web3_incident: item.isWeb3Incident,
      ...(item.providers[0] ? { provider: item.providers[0] } : {}),
      ...(verification ? { verification_status: verification } : {}),
      ...(item.chain ? { chain: item.chain } : {}),
      ...(item.attackType ? { attack_type: item.attackType } : {}),
      ...(item.projectName ? { project_name: item.projectName } : {}),
      ...(item.amountDisplay ? { amount_display: item.amountDisplay } : {}),
      ...(item.securityDomain ? { security_domain: item.securityDomain } : {}),
    },
  };
}

/** "~$4.2M reported"; null when missing or implausible. */
export function formatLossReported(amountUsd: number | null): string | null {
  const amount = plausibleAmount(amountUsd);
  if (amount === null) return null;
  const label = formatCompactUsd(amount);
  return label ? `~${label} reported` : null;
}

/** Severity, then reported amount (largest first), then newest. */
export function compareItems(a: NewsletterItem, b: NewsletterItem): number {
  const severity = (severityRank[a.severity] ?? severityRank.info) - (severityRank[b.severity] ?? severityRank.info);
  if (severity !== 0) return severity;
  const amount = (b.amountUsd ?? -1) - (a.amountUsd ?? -1);
  if (amount !== 0) return amount;
  const aTime = Date.parse(a.createdAt) || 0;
  const bTime = Date.parse(b.createdAt) || 0;
  return bTime - aTime;
}
