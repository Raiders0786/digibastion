// The daily brief: one shared edition per UTC day, built from the previous 24
// hours of ingested records, the incidents still waiting on confirmation and
// the day's incident status changes. The sender filters it per subscriber.
//
// Parity with the legacy digest (send-digest-emails): every deliverable record
// of the day is in the issue, in a featured section or in `updates`, and the
// filter uses the same matchesDeliveryPreferences, so a subscriber never gets
// less than the legacy digest would have sent. When nothing matches, the
// subscriber still gets a quiet-day brief with the top other records.
// Pure module: no Deno or URL imports, so vitest can import it.
import { describeDigestFilters, QUIET_DAY_HIGHLIGHTS } from './digest-logic.ts';
import {
  compareItems,
  DAILY_CAPS,
  newsletterItemToDeliverable,
  type DailyBriefContent,
  type NewsletterItem,
  type QuietBrief,
  type StatusChange,
} from './newsletter-content.ts';
import { pickSecurityAction } from './security-actions.ts';
import { matchesDeliveryPreferences, type DeliveryPreferences } from './subscription-delivery.ts';

export interface DailyBriefInput {
  issueDate: string;
  periodStart: string;
  periodEnd: string;
  recent: NewsletterItem[];
  stillUnconfirmed: NewsletterItem[];
  statusChanges: StatusChange[];
}

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const VULNERABILITY_CATEGORIES = new Set(['vulnerability-disclosure', 'supply-chain']);
const VULNERABILITY_SEVERITIES = new Set(['critical', 'high']);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The issue for date D covers [D-1 00:00Z, D 00:00Z). null for a malformed or impossible date. */
export function dailyIssuePeriod(issueDate: string): { periodStart: string; periodEnd: string } | null {
  const match = ISO_DATE.exec(issueDate);
  if (!match) return null;
  const end = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (!Number.isFinite(end) || new Date(end).toISOString().slice(0, 10) !== issueDate) return null;
  return { periodStart: new Date(end - DAY_MS).toISOString(), periodEnd: new Date(end).toISOString() };
}

function sortAndCap(items: NewsletterItem[], cap: number): NewsletterItem[] {
  return [...items].sort(compareItems).slice(0, cap);
}

function dedupeByUid(items: NewsletterItem[]): NewsletterItem[] {
  const seen = new Map<string, NewsletterItem>();
  for (const entry of items) if (!seen.has(entry.uid)) seen.set(entry.uid, entry);
  return [...seen.values()];
}

const byTime = (a: StatusChange, b: StatusChange) => (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0);

/**
 * One entry per incident and change kind. A retraction replaces every other
 * change to the same incident; several revisions become one, from the first
 * previous amount to the last amount, and vanish when they cancel out. A
 * confirmed change shows the item as confirmed (the snapshot is the old row).
 */
function collapseStatusChanges(changes: StatusChange[]): StatusChange[] {
  const byUid = new Map<string, StatusChange[]>();
  for (const entry of [...changes].sort(byTime)) {
    const list = byUid.get(entry.item.uid) ?? [];
    list.push(entry);
    byUid.set(entry.item.uid, list);
  }

  const out: StatusChange[] = [];
  for (const list of byUid.values()) {
    const retractions = list.filter((entry) => entry.change === 'retracted');
    if (retractions.length > 0) {
      out.push(retractions[retractions.length - 1]);
      continue;
    }
    const confirmations = list.filter((entry) => entry.change === 'confirmed');
    if (confirmations.length > 0) {
      const latest = confirmations[confirmations.length - 1];
      out.push({ ...latest, item: { ...latest.item, status: 'confirmed' } });
    }
    const revisions = list.filter((entry) => entry.change === 'revised');
    if (revisions.length > 0) {
      const first = revisions[0];
      const last = revisions[revisions.length - 1];
      if (first.previousAmountUsd !== last.amountUsd) {
        out.push({ ...last, previousAmountUsd: first.previousAmountUsd });
      }
    }
  }
  return out;
}

function sortChanges(changes: StatusChange[]): StatusChange[] {
  return [...changes].sort((a, b) => compareItems(a.item, b.item) || byTime(b, a));
}

function isVulnerability(entry: NewsletterItem): boolean {
  return !entry.isWeb3Incident &&
    VULNERABILITY_SEVERITIES.has(entry.severity) &&
    (VULNERABILITY_CATEGORIES.has(entry.category) || Boolean(entry.cveId));
}

export function buildDailyBriefContent(input: DailyBriefInput): DailyBriefContent {
  const recent = dedupeByUid(input.recent);
  const incidents = sortAndCap(recent.filter((entry) => entry.isWeb3Incident && entry.status !== 'unconfirmed'), DAILY_CAPS.incidents);
  const unconfirmed = sortAndCap(
    dedupeByUid([...recent, ...input.stillUnconfirmed]).filter((entry) => entry.status === 'unconfirmed'),
    DAILY_CAPS.unconfirmed,
  );
  const vulnerabilities = sortAndCap(recent.filter(isVulnerability), DAILY_CAPS.vulnerabilities);
  // Everything else, including records the section caps left out.
  const featuredUids = new Set([...incidents, ...unconfirmed, ...vulnerabilities].map((entry) => entry.uid));
  const updates = sortAndCap(recent.filter((entry) => !featuredUids.has(entry.uid)), DAILY_CAPS.updates);
  const statusChanges = sortChanges(collapseStatusChanges(input.statusChanges)).slice(0, DAILY_CAPS.statusChanges);

  const featured = [...incidents, ...unconfirmed];
  const action = pickSecurityAction({
    seed: input.issueDate,
    attackTypes: featured.map((entry) => entry.attackType).filter((value): value is string => Boolean(value)),
    categories: [...featured, ...vulnerabilities].map((entry) => entry.category).filter(Boolean),
  });

  return {
    version: 1,
    kind: 'daily',
    issueDate: input.issueDate,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    incidents,
    unconfirmed,
    statusChanges,
    vulnerabilities,
    updates,
    action,
  };
}

const matches = (prefs: DeliveryPreferences) => (entry: NewsletterItem) =>
  matchesDeliveryPreferences(newsletterItemToDeliverable(entry), prefs);

/** Number of records in the featured sections and `updates`. */
export function dailyBriefItemCount(c: DailyBriefContent): number {
  return c.incidents.length + c.unconfirmed.length + c.statusChanges.length + c.vulnerabilities.length + (c.updates?.length ?? 0);
}

/**
 * The subscriber's view of the issue. When nothing matches, the view is a
 * quiet-day brief: empty sections plus `quiet`, whose highlights are the top
 * other records, keeping only the subscriber's scope, chain and preliminary
 * choices. Never null, so every due subscriber gets an email.
 */
export function filterDailyBriefForSubscriber(c: DailyBriefContent, prefs: DeliveryPreferences): DailyBriefContent {
  const keep = matches(prefs);
  const filtered: DailyBriefContent = {
    ...c,
    quiet: undefined,
    incidents: c.incidents.filter(keep),
    unconfirmed: c.unconfirmed.filter(keep),
    statusChanges: c.statusChanges.filter((entry) => keep(entry.item)),
    vulnerabilities: c.vulnerabilities.filter(keep),
    updates: (c.updates ?? []).filter(keep),
  };
  delete filtered.quiet;
  return dailyBriefItemCount(filtered) > 0 ? filtered : quietDailyBrief(c, prefs);
}

/**
 * The quiet-day view of an issue: no sections, plus the top other records
 * that fit the subscriber's scope, chain and preliminary choices. Admin test
 * sends use it to preview the quiet-day email.
 */
export function quietDailyBrief(c: DailyBriefContent, prefs: DeliveryPreferences): DailyBriefContent {
  const relaxed = matches({
    severity_threshold: 'info',
    content_scope: prefs.content_scope,
    chains: prefs.chains,
    include_preliminary: prefs.include_preliminary,
  });
  const everything = dedupeByUid([...c.incidents, ...c.unconfirmed, ...c.vulnerabilities, ...(c.updates ?? [])]);
  const quiet: QuietBrief = {
    filterSummary: describeDigestFilters(prefs),
    highlights: sortAndCap(everything.filter(relaxed), QUIET_DAY_HIGHLIGHTS),
  };
  return { ...c, incidents: [], unconfirmed: [], statusChanges: [], vulnerabilities: [], updates: [], quiet };
}

function countPart(count: number, singular: string, plural: string): string | null {
  if (count <= 0) return null;
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "Oct 11" from "2026-10-11". */
export function shortIssueDate(issueDate: string): string {
  const match = ISO_DATE.exec(issueDate);
  if (!match) return issueDate;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${Number(match[3])}` : issueDate;
}

/**
 * "Daily brief, Oct 11: 3 incidents, 1 unconfirmed, 2 status changes, 12 more
 * updates"; zero parts are left out. A quiet-day brief says so.
 */
export function buildDailySubject(c: DailyBriefContent): string {
  const base = `Daily brief, ${shortIssueDate(c.issueDate)}`;
  if (c.quiet) return `${base}: quiet day, nothing matched your filters`;
  const featured = c.incidents.length + c.unconfirmed.length + c.statusChanges.length + c.vulnerabilities.length;
  const updates = c.updates?.length ?? 0;
  const parts = [
    countPart(c.incidents.length, 'incident', 'incidents'),
    countPart(c.unconfirmed.length, 'unconfirmed', 'unconfirmed'),
    countPart(c.statusChanges.length, 'status change', 'status changes'),
    countPart(c.vulnerabilities.length, 'vulnerability', 'vulnerabilities'),
    featured > 0 ? countPart(updates, 'more update', 'more updates') : countPart(updates, 'update', 'updates'),
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? `${base}: ${parts.join(', ')}` : base;
}

/** Shape check for newsletter_issues.content read back from the database. */
export function isDailyBriefContent(value: unknown): value is DailyBriefContent {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  const action = c.action as Record<string, unknown> | null | undefined;
  return c.version === 1 && c.kind === 'daily' && typeof c.issueDate === 'string' &&
    Array.isArray(c.incidents) && Array.isArray(c.unconfirmed) &&
    Array.isArray(c.statusChanges) && Array.isArray(c.vulnerabilities) &&
    (c.updates === undefined || Array.isArray(c.updates)) &&
    Boolean(action) && typeof action?.text === 'string' && typeof action?.url === 'string';
}
