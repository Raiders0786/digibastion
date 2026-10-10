// Helpers for the public weekly deep-dive page (/threat-intel/weekly/:weekStart).
// The content comes from newsletter_issues.content through the
// get_weekly_newsletter RPC; it is checked here before anything renders it.
import type {
  NewsletterItem,
  WeeklyParagraph,
  WeeklyPublicContent,
} from '../../../supabase/functions/_shared/newsletter-content';
import { buildSubscribeHref } from './officialLinks';

export type { NewsletterItem, WeeklyParagraph, WeeklyPublicContent };

export interface WeeklyNewsletterPage {
  content: WeeklyPublicContent;
  generatedAt: string | null;
  previousWeekStart: string | null;
  nextWeekStart: string | null;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TOTAL_FIELDS = [
  'lossUsd',
  'previousLossUsd',
  'unconfirmedLossUsd',
  'incidentCount',
  'unconfirmedCount',
  'fundsReturnedCount',
  'lateReportCount',
] as const;
const COMPACT_USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isParagraph = (value: unknown): value is WeeklyParagraph =>
  isRecord(value) && typeof value.text === 'string' && (value.origin === 'ai' || value.origin === 'template');
const isItem = (value: unknown): value is NewsletterItem =>
  isRecord(value) && typeof value.uid === 'string' && typeof value.title === 'string' &&
  typeof value.incidentUrl === 'string';
const isBreakdown = (value: unknown) =>
  isRecord(value) && typeof value.label === 'string' && isFiniteNumber(value.count) && isFiniteNumber(value.lossUsd);

function utcDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value ? date : null;
}

/** A valid YYYY-MM-DD that falls on a Monday, else null. */
export function parseWeekStart(value: string | undefined | null): string | null {
  if (typeof value !== 'string') return null;
  const date = utcDate(value);
  return date && date.getUTCDay() === 1 ? value : null;
}

/** Runtime check for version 1 public weekly content, strict enough that every rendered field exists. */
export function isWeeklyPublicContent(value: unknown): value is WeeklyPublicContent {
  if (!isRecord(value) || value.version !== 1 || value.kind !== 'weekly') return false;
  if (typeof value.weekStart !== 'string' || typeof value.weekEnd !== 'string' || typeof value.issueDate !== 'string') return false;
  const totals = value.totals;
  if (!isRecord(totals) || !TOTAL_FIELDS.every((field) => isFiniteNumber(totals[field]))) return false;
  if (!Array.isArray(totals.byAttackType) || !totals.byAttackType.every(isBreakdown)) return false;
  if (!Array.isArray(totals.byChain) || !totals.byChain.every(isBreakdown)) return false;
  if (!Array.isArray(value.top) || !value.top.every((entry) =>
    isRecord(entry) && isItem(entry.item) && isParagraph(entry.what) && isParagraph(entry.action))) return false;
  if (!isParagraph(value.trends)) return false;
  const vulnerabilities = value.vulnerabilities;
  if (!isRecord(vulnerabilities) || !Array.isArray(vulnerabilities.items) || !vulnerabilities.items.every(isItem) ||
    !isParagraph(vulnerabilities.summary)) return false;
  const tip = value.opsecTip;
  if (!isRecord(tip) || typeof tip.text !== 'string' || typeof tip.url !== 'string') return false;
  return Array.isArray(value.sources) && value.sources.every((source) => typeof source === 'string');
}

/** The get_weekly_newsletter payload, or null when the issue is missing or malformed. */
export function parseWeeklyNewsletterResponse(value: unknown): WeeklyNewsletterPage | null {
  if (!isRecord(value) || !isWeeklyPublicContent(value.content)) return null;
  const neighbour = (raw: unknown) => (typeof raw === 'string' ? parseWeekStart(raw) : null);
  return {
    content: value.content,
    generatedAt: typeof value.generated_at === 'string' ? value.generated_at : null,
    previousWeekStart: neighbour(value.previous_week_start),
    nextWeekStart: neighbour(value.next_week_start),
  };
}

/** "Oct 5" or, with the year, "Oct 5, 2026". */
export function formatWeekDay(value: string, withYear = false): string {
  const match = ISO_DATE.exec(value);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  if (!match || !month) return value;
  return `${month} ${Number(match[3])}${withYear ? `, ${match[1]}` : ''}`;
}

/** "Web3 security week of Oct 5, 2026" */
export function weeklyPageTitle(c: WeeklyPublicContent): string {
  return `Web3 security week of ${formatWeekDay(c.weekStart, true)}`;
}

/** "$4.2M"; null for zero, negative or non-finite amounts. */
export function formatCompactUsd(amount: number): string | null {
  return isFiniteNumber(amount) && amount > 0 ? COMPACT_USD.format(amount) : null;
}

/** "~$4.2M reported"; null when there is nothing to report. */
export function formatReportedUsd(amount: number): string | null {
  const compact = formatCompactUsd(amount);
  return compact ? `~${compact} reported` : null;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Meta description: the week, the reported loss and the incident count. */
export function weeklyDescription(c: WeeklyPublicContent): string {
  const range = `${formatWeekDay(c.weekStart)} to ${formatWeekDay(c.weekEnd, true)}`;
  const loss = formatReportedUsd(c.totals.lossUsd);
  const count = plural(c.totals.incidentCount, 'incident', 'incidents');
  const summary = c.totals.incidentCount > 0 ? `${loss ? `${loss} across ` : ''}${count}` : 'no incidents recorded';
  return `Web3 incidents added ${range}: ${summary}. Each item names its source.`;
}

export function weeklyPagePath(weekStart: string): string {
  return `/threat-intel/weekly/${weekStart}`;
}

/** Subscribe form with the Web3 incidents scope and the weekly box pre-checked. */
export function weeklySubscribeHref(): string {
  return `${buildSubscribeHref({ scope: 'web3-incidents' })}&weekly=1`;
}

/** The URL when it is http(s), else null, so content can never inject a javascript: link. */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}
