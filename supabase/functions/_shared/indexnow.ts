// IndexNow (Bing, Yandex, Seznam, Naver, Yep). Google does not take part, and
// Google has no ping API for ordinary pages; it reads the sitemaps instead.
// Pure module: no Deno or URL imports. The key is public by design: it is
// served at keyLocation() from public/<key>.txt.
import { canonicalIncidentUrl, canonicalizeUrl, canonicalWeeklyUrl, SITE_HOST, SITE_URL } from './site-urls.ts';

export const INDEXNOW_KEY = '5d9d2e41356f5953eedc2e72bca99b7b';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
export const INDEXNOW_MAX_URLS_PER_RUN = 1_000;
export const INDEXNOW_MAX_URLS_PER_POST = 10_000;
const FIRST_RUN_WINDOW_MS = 2 * 3_600_000;
const MAX_LOOKBACK_MS = 7 * 86_400_000;
const WEEK = /^\d{4}-\d{2}-\d{2}$/;

export type IndexNowOutcome = 'ok' | 'bad_request' | 'key_invalid' | 'unprocessable' | 'rate_limited' | 'server_error' | 'unexpected';

export const isIndexNowKey = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);

export const keyLocation = (key: string = INDEXNOW_KEY): string => `${SITE_URL}/${key}.txt`;

/** Canonical https URLs on www.digibastion.com, once each, in input order. */
export function filterSubmittableUrls(urls: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const url of urls) {
    if (!url.startsWith(`https://${SITE_HOST}`)) continue;
    const canonical = canonicalizeUrl(url);
    if (canonical) seen.add(canonical);
  }
  return [...seen];
}

export function buildIndexNowBody(urls: readonly string[], key: string = INDEXNOW_KEY) {
  return { host: SITE_HOST, key, keyLocation: keyLocation(key), urlList: [...urls] };
}

export function chunkUrls(urls: readonly string[], size = INDEXNOW_MAX_URLS_PER_POST): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < urls.length; i += size) out.push(urls.slice(i, i + size));
  return out;
}

export function classifyIndexNowResponse(status: number): IndexNowOutcome {
  if (status === 200 || status === 202) return 'ok';
  if (status === 400) return 'bad_request';
  if (status === 403) return 'key_invalid';
  if (status === 422) return 'unprocessable';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'unexpected';
}

const TRANSIENT_OUTCOMES = new Set(['rate_limited', 'server_error', 'timeout', 'network_error']);

/**
 * HTTP status for a ping-indexnow response. Upstream throttling and outages
 * answer 200 (with success: false in the body): the run is already recorded
 * as failed, the next run retries the same URLs, and a non-2xx answer would
 * count as a failed cron run and page the admins. A bad key or request needs
 * a person, so it stays 502.
 */
export function indexNowResponseStatus(outcomes: readonly string[]): 200 | 502 {
  return outcomes.every((outcome) => outcome === 'ok' || TRANSIENT_OUTCOMES.has(outcome)) ? 200 : 502;
}

/** A candidate row: an incident id, when it was stored or changed, and whether it may be pinged. */
export interface IndexNowRow { id: string; at: string; indexable: boolean }

export interface IndexNowRunInput {
  /** End of this run's window (ISO). */
  until: string;
  weeklyStarts: readonly string[];
  /** New incidents, oldest first, exactly as the query returned them. */
  fresh: readonly IndexNowRow[];
  /** The fresh query's row limit; a full page means rows were left unread. */
  freshLimit: number;
  /** Status-change events, oldest first, one row per event. */
  statusChanges: readonly IndexNowRow[];
  statusLimit: number;
}

export interface IndexNowRunPlan {
  urls: string[];
  /** Something in the window was left for the next run. */
  truncated: boolean;
  /** Where the next run starts. */
  cursor: string;
}

const HUB_URLS = 2;

/**
 * Weekly issues first, then new incidents and status changes in time order,
 * then the hub pages that list them. At most INDEXNOW_MAX_URLS_PER_RUN URLs;
 * nothing at all when there is nothing new.
 *
 * The cursor never passes a row that was not submitted. A complete run ends
 * at `until`. Otherwise the next run resumes 1 ms before the earliest row
 * left out (a row that did not fit, or the last row of a full query page),
 * so rows sharing that timestamp are sent again rather than skipped; sending
 * a URL twice is harmless. If nothing read this run is older than that row,
 * the cursor steps 1 ms past it instead, so the pinger cannot loop on the
 * same page.
 */
export function planIndexNowRun(input: IndexNowRunInput): IndexNowRunPlan {
  const weekly = filterSubmittableUrls(input.weeklyStarts.filter((week) => WEEK.test(week)).map((week) => canonicalWeeklyUrl(week)));
  const budget = Math.max(0, INDEXNOW_MAX_URLS_PER_RUN - HUB_URLS - weekly.length);
  const time = (row: IndexNowRow) => Date.parse(row.at);
  const candidates = [...input.fresh, ...input.statusChanges]
    .filter((row) => !Number.isNaN(time(row)))
    .sort((left, right) => time(left) - time(right));

  const incidents: string[] = [];
  const seen = new Set<string>();
  let droppedAt: number | null = null;
  for (const row of candidates) {
    if (!row.indexable) continue;
    const [url] = filterSubmittableUrls([canonicalIncidentUrl(row.id)]);
    if (!url || seen.has(url)) continue;
    if (incidents.length >= budget) {
      droppedAt = time(row);
      break;
    }
    seen.add(url);
    incidents.push(url);
  }

  const lastOfFullPage = (rows: readonly IndexNowRow[], limit: number): number | null => {
    if (rows.length < limit || rows.length === 0) return null;
    const last = time(rows[rows.length - 1]);
    return Number.isNaN(last) ? null : last;
  };
  const boundaries = [droppedAt, lastOfFullPage(input.fresh, input.freshLimit), lastOfFullPage(input.statusChanges, input.statusLimit)]
    .filter((value): value is number => value !== null);

  const hubs = [
    ...(incidents.length > 0 ? [`${SITE_URL}/threat-intel`] : []),
    ...(weekly.length > 0 ? [`${SITE_URL}/threat-intel/weekly`] : []),
  ];
  const urls = weekly.length + incidents.length === 0 ? [] : [...weekly, ...incidents, ...hubs];
  if (boundaries.length === 0) return { urls, truncated: false, cursor: new Date(input.until).toISOString() };

  const boundary = Math.min(...boundaries);
  const earliestRead = candidates.length > 0 ? time(candidates[0]) : boundary;
  const cursor = earliestRead < boundary ? boundary - 1 : boundary + 1;
  return { urls, truncated: true, cursor: new Date(cursor).toISOString() };
}

/**
 * Start of this run's window: the last successful run's cursor (or its start
 * time), never more than 7 days back and never in the future. The first run
 * looks back two hours.
 */
export function resolveSince(lastSuccess: { attempted_at: string; metadata: unknown } | null, now: Date): string {
  const floor = now.getTime() - MAX_LOOKBACK_MS;
  if (!lastSuccess) return new Date(now.getTime() - FIRST_RUN_WINDOW_MS).toISOString();
  const meta = lastSuccess.metadata && typeof lastSuccess.metadata === 'object' ? lastSuccess.metadata as Record<string, unknown> : {};
  const cursor = typeof meta.cursor === 'string' ? Date.parse(meta.cursor) : Date.parse(lastSuccess.attempted_at);
  const start = Number.isNaN(cursor) ? floor : Math.min(Math.max(cursor, floor), now.getTime());
  return new Date(start).toISOString();
}
