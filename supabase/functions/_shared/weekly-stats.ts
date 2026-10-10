// Weekly deep-dive figures. Every number in the weekly issue comes from here,
// never from the model: totals for this week against last week, unconfirmed
// losses kept apart, funds returned, and breakdowns by attack type and chain.
// Pure module: no Deno or URL imports, so vitest can import it.
import {
  compareItems,
  MAX_PLAUSIBLE_LOSS_USD,
  type NewsletterItem,
  type WeeklyBreakdown,
  type WeeklyTotals,
} from './newsletter-content.ts';

export interface WeeklyStatsInput { weekStart: string; thisWeek: NewsletterItem[]; previousWeek: NewsletterItem[] }
export interface WeeklyPeriod { weekStart: string; weekEnd: string; issueDate: string; periodStart: string; periodEnd: string }

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
/** An incident that happened more than this long before the week is a late report, not this week's loss. */
const LATE_REPORT_DAYS = 30;
const BREAKDOWN_SIZE = 5;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const VULNERABILITY_CATEGORIES = new Set(['vulnerability-disclosure', 'supply-chain']);
const VULNERABILITY_SEVERITIES = new Set(['critical', 'high']);
export const WEEKLY_VULNERABILITY_CAP = 10;

function utcDay(value: string): number | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(time).toISOString().slice(0, 10) === value ? time : null;
}

const isoDate = (time: number) => new Date(time).toISOString().slice(0, 10);

/** The week starting Monday weekStart: [Mon 00:00Z, next Mon 00:00Z), sent on the next Monday. null if not a Monday. */
export function weeklyPeriod(weekStart: string): WeeklyPeriod | null {
  const start = utcDay(weekStart);
  if (start === null || new Date(start).getUTCDay() !== 1) return null;
  return {
    weekStart,
    weekEnd: isoDate(start + 6 * DAY_MS),
    issueDate: isoDate(start + WEEK_MS),
    periodStart: new Date(start).toISOString(),
    periodEnd: new Date(start + WEEK_MS).toISOString(),
  };
}

function plausible(amount: number | null): number | null {
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 && amount <= MAX_PLAUSIBLE_LOSS_USD ? amount : null;
}

function dedupeByUid(items: NewsletterItem[]): NewsletterItem[] {
  const seen = new Map<string, NewsletterItem>();
  for (const entry of items) if (!seen.has(entry.uid)) seen.set(entry.uid, entry);
  return [...seen.values()];
}

function inWeek(entry: NewsletterItem, start: number): boolean {
  const created = Date.parse(entry.createdAt);
  return Number.isFinite(created) && created >= start && created < start + WEEK_MS;
}

function isLateReport(entry: NewsletterItem, start: number): boolean {
  if (!entry.incidentDate) return false;
  const happened = utcDay(entry.incidentDate.slice(0, 10));
  return happened !== null && happened < start - LATE_REPORT_DAYS * DAY_MS;
}

/** Web3 incidents ingested in the week, minus late reports. Includes unconfirmed ones. */
export function weeklyCountedIncidents(weekStart: string, items: NewsletterItem[]): NewsletterItem[] {
  const start = utcDay(weekStart);
  if (start === null) return [];
  return dedupeByUid(items).filter((entry) => entry.isWeb3Incident && inWeek(entry, start) && !isLateReport(entry, start));
}

function lateReports(weekStart: string, items: NewsletterItem[]): number {
  const start = utcDay(weekStart);
  if (start === null) return 0;
  return dedupeByUid(items).filter((entry) => entry.isWeb3Incident && inWeek(entry, start) && isLateReport(entry, start)).length;
}

const sumLoss = (items: NewsletterItem[]) => items.reduce((sum, entry) => sum + (plausible(entry.amountUsd) ?? 0), 0);
const isUnconfirmed = (entry: NewsletterItem) => entry.status === 'unconfirmed';

function breakdownKey(value: string | null): { key: string; label: string } {
  const label = (value ?? '').replace(/\s+/g, ' ').trim();
  return label ? { key: label.toLowerCase(), label } : { key: 'unknown', label: 'Unknown' };
}

function breakdown(items: NewsletterItem[], pick: (entry: NewsletterItem) => string | null): WeeklyBreakdown[] {
  const buckets = new Map<string, WeeklyBreakdown>();
  for (const entry of items) {
    const { key, label } = breakdownKey(pick(entry));
    const bucket = buckets.get(key) ?? { key, label, count: 0, lossUsd: 0 };
    bucket.count += 1;
    bucket.lossUsd += plausible(entry.amountUsd) ?? 0;
    buckets.set(key, bucket);
  }
  const ranked = [...buckets.values()].sort((a, b) =>
    b.lossUsd - a.lossUsd || b.count - a.count || a.label.localeCompare(b.label));
  if (ranked.length <= BREAKDOWN_SIZE) return ranked;
  const rest = ranked.slice(BREAKDOWN_SIZE);
  return [
    ...ranked.slice(0, BREAKDOWN_SIZE),
    {
      key: 'other',
      label: 'Other',
      count: rest.reduce((sum, entry) => sum + entry.count, 0),
      lossUsd: rest.reduce((sum, entry) => sum + entry.lossUsd, 0),
    },
  ];
}

/**
 * Losses, counts and breakdowns cover confirmed and no-status incidents;
 * unconfirmed ones only feed unconfirmedCount and unconfirmedLossUsd. So the
 * breakdown counts add up to incidentCount.
 */
export function computeWeeklyTotals(i: WeeklyStatsInput): WeeklyTotals {
  const counted = weeklyCountedIncidents(i.weekStart, i.thisWeek);
  const settled = counted.filter((entry) => !isUnconfirmed(entry));
  const unconfirmed = counted.filter(isUnconfirmed);
  const start = utcDay(i.weekStart);
  const previousStart = start === null ? null : isoDate(start - WEEK_MS);
  const previous = previousStart ? weeklyCountedIncidents(previousStart, i.previousWeek).filter((entry) => !isUnconfirmed(entry)) : [];

  return {
    lossUsd: sumLoss(settled),
    previousLossUsd: sumLoss(previous),
    unconfirmedLossUsd: sumLoss(unconfirmed),
    incidentCount: settled.length,
    unconfirmedCount: unconfirmed.length,
    fundsReturnedCount: counted.filter((entry) => entry.fundsReturned === true).length,
    lateReportCount: lateReports(i.weekStart, i.thisWeek),
    byAttackType: breakdown(settled, (entry) => entry.attackType),
    byChain: breakdown(settled, (entry) => entry.chain),
  };
}

/** Largest reported amount first (missing or implausible amounts last), then severity and recency. */
export function selectTopIncidents(items: NewsletterItem[], n = 5): NewsletterItem[] {
  return dedupeByUid(items)
    .sort((a, b) => {
      const amountA = plausible(a.amountUsd);
      const amountB = plausible(b.amountUsd);
      if (amountA !== amountB) {
        if (amountA === null) return 1;
        if (amountB === null) return -1;
        return amountB - amountA;
      }
      return compareItems(a, b);
    })
    .slice(0, n);
}

/** Critical or high non-incident items in the vulnerability or supply-chain categories, or with a CVE. */
export function selectWeeklyVulnerabilities(items: NewsletterItem[], cap = WEEKLY_VULNERABILITY_CAP): NewsletterItem[] {
  return dedupeByUid(items)
    .filter((entry) => !entry.isWeb3Incident &&
      VULNERABILITY_SEVERITIES.has(entry.severity) &&
      (VULNERABILITY_CATEGORIES.has(entry.category) || Boolean(entry.cveId)))
    .sort(compareItems)
    .slice(0, cap);
}
