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

export interface IndexNowCandidates { incidentIds: string[]; statusChangedIds: string[]; weeklyStarts: string[] }

/**
 * Weekly issues first, then new incidents, then status changes, then the hub
 * pages that list them. At most INDEXNOW_MAX_URLS_PER_RUN URLs; nothing at all
 * when there is nothing new.
 */
export function planIndexNowUrls(c: IndexNowCandidates): string[] {
  const weekly = c.weeklyStarts.filter((week) => WEEK.test(week)).map((week) => canonicalWeeklyUrl(week));
  const incidents = [...c.incidentIds, ...c.statusChangedIds].map((id) => canonicalIncidentUrl(id));
  const hubs = [
    ...(incidents.length > 0 ? [`${SITE_URL}/threat-intel`] : []),
    ...(weekly.length > 0 ? [`${SITE_URL}/threat-intel/weekly`] : []),
  ];
  const unique = filterSubmittableUrls([...weekly, ...incidents]).slice(0, INDEXNOW_MAX_URLS_PER_RUN - hubs.length);
  return unique.length === 0 ? [] : [...unique, ...hubs];
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

/**
 * Where the next run starts. A complete run ends at `until`. A truncated run
 * (the incident query hit its limit) resumes 1 ms before its last row, so
 * rows that share that timestamp are sent again rather than skipped; sending
 * a URL twice is harmless. If every row in the page shares one timestamp the
 * cursor steps past it, so the pinger can never loop on the same page.
 */
export function nextCursor(o: {
  until: string;
  truncated: boolean;
  firstIncludedCreatedAt: string | null;
  lastIncludedCreatedAt: string | null;
}): string {
  const last = o.lastIncludedCreatedAt ? Date.parse(o.lastIncludedCreatedAt) : Number.NaN;
  if (!o.truncated || Number.isNaN(last)) return new Date(o.until).toISOString();
  const first = o.firstIncludedCreatedAt ? Date.parse(o.firstIncludedCreatedAt) : Number.NaN;
  return new Date(first === last ? last + 1 : last - 1).toISOString();
}
