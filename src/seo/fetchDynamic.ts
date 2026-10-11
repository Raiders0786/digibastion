// Incident and weekly data for the build-time prerender. Every request has a
// timeout and any failure is logged once and swallowed: a build must pass
// with Supabase down, offline or hanging.
// Outside the module boundary rule: only the prerender (through Vite's
// ssrLoadModule) and tests load it, so '@/' imports resolve.
import type { NewsArticle } from '@/types/news';
import { mapPublishableNewsArticleRows, NEWS_ARTICLE_COLUMNS } from '@/lib/threatIntel/articleRow';
import {
  parseWeeklyArchiveResponse,
  parseWeeklyNewsletterResponse,
  type WeeklyNewsletterPage,
} from '@/lib/threatIntel/weekly';
import {
  INDEXABLE_INCIDENT_POSTGREST_FILTER,
  isIndexableIncidentMetadata,
  SAFE_ARTICLE_ID,
  WEEK_START,
} from '../../supabase/functions/_shared/publishable';

export interface DynamicLogger {
  warn: (message: string) => void;
  info: (message: string) => void;
}

export interface FetchDynamicOptions {
  baseUrl: string;
  anonKey: string;
  incidentLimit: number;
  weeklyLimit: number;
  /** Per request, including reading the body. */
  timeoutMs: number;
  fetchImpl: typeof fetch;
  log: DynamicLogger;
  /** Wait before retrying a 5xx answer; the nth retry waits n times this. Default 1500. */
  retryDelayMs?: number;
}

export interface DynamicData {
  incidents: NewsArticle[];
  weekly: WeeklyNewsletterPage[];
}

const WEEKLY_CONCURRENCY = 4;
/** Supabase sometimes answers the first query after an idle spell with a 500. */
const SERVER_ERROR_RETRIES = 2;

class NotFoundError extends Error {}
class ServerError extends Error {}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Rejects after `ms` even when the fetch implementation ignores its abort signal. */
function withDeadline<T>(work: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`timed out after ${ms} ms`));
    }, ms);
  });
  return Promise.race([work(controller.signal), deadline]).finally(() => clearTimeout(timer));
}

export async function fetchDynamic(options: FetchDynamicOptions): Promise<DynamicData> {
  const { anonKey, fetchImpl, log, timeoutMs } = options;
  const base = options.baseUrl.replace(/\/+$/, '');
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/json' };
  const result: DynamicData = { incidents: [], weekly: [] };

  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 1_500);

  const attempt = (url: string, init: RequestInit): Promise<unknown> => withDeadline(async (signal) => {
    const response = await fetchImpl(url, { ...init, headers: { ...headers, ...(init.headers as Record<string, string> | undefined) }, signal });
    const path = new URL(url).pathname;
    if (response.status === 404) throw new NotFoundError(`404 from ${path}`);
    if (response.status >= 500) throw new ServerError(`HTTP ${response.status} from ${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${path}`);
    return response.json();
  }, timeoutMs);

  // Only 5xx answers are retried. Timeouts and network errors are not, so a
  // hanging or offline Supabase still costs one timeout per request.
  const request = async (url: string, init: RequestInit = {}): Promise<unknown> => {
    for (let retry = 0; ; retry += 1) {
      try {
        return await attempt(url, init);
      } catch (error) {
        if (!(error instanceof ServerError) || retry >= SERVER_ERROR_RETRIES) throw error;
        await sleep(retryDelayMs * (retry + 1));
      }
    }
  };

  const rpc = (name: string, body: Record<string, unknown>) => request(`${base}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  try {
    const query = [
      `select=${encodeURIComponent(NEWS_ARTICLE_COLUMNS)}`,
      `or=${encodeURIComponent(`(${INDEXABLE_INCIDENT_POSTGREST_FILTER})`)}`,
      'order=created_at.desc',
      `limit=${Math.max(0, Math.floor(options.incidentLimit))}`,
    ].join('&');
    const rows = await request(`${base}/rest/v1/news_articles?${query}`);
    // Second guard: the same rule in code, in case the filter or the server ever drifts.
    result.incidents = mapPublishableNewsArticleRows(rows)
      .filter((article) => SAFE_ARTICLE_ID.test(article.id) && isIndexableIncidentMetadata(article.metadata));

    let weeks: string[] = [];
    try {
      weeks = parseWeeklyArchiveResponse(await rpc('list_weekly_newsletters', { p_limit: options.weeklyLimit }))
        .map((entry) => entry.weekStart)
        .filter((week) => WEEK_START.test(week))
        .slice(0, options.weeklyLimit);
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
      log.info('[seo] list_weekly_newsletters is not deployed yet; no weekly pages');
    }

    for (let index = 0; index < weeks.length; index += WEEKLY_CONCURRENCY) {
      const batch = weeks.slice(index, index + WEEKLY_CONCURRENCY);
      const pages = await Promise.all(batch.map(async (week) =>
        parseWeeklyNewsletterResponse(await rpc('get_weekly_newsletter', { p_week_start: week }))));
      result.weekly.push(...pages.filter((page): page is WeeklyNewsletterPage =>
        page !== null && WEEK_START.test(page.content.weekStart)));
    }
  } catch (error) {
    log.warn(`[seo] dynamic pages skipped: ${error instanceof Error ? error.message : String(error)}`);
  }
  return result;
}
