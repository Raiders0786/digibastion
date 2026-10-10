import type { NewsArticle, ThreatIntelScope } from '@/types/news';
import type { ThreatIntelStats } from '@/lib/threatIntel/query';

// v3: every key carries an explicit scope, and stats are cached per filter
// set. The v2 stats entry was global, so a Web3-only visit seeded the counts
// shown on unrelated URLs (for example /threat-intel?tab=subscribe).
const CACHE_KEY = 'digibastion_news_cache_v3';
const STATS_KEY = 'digibastion_news_stats_v3';
const LEGACY_KEYS = ['digibastion_news_cache_v2', 'digibastion_news_stats_v2'] as const;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes: after this we still show cache but mark it stale

interface CachedData {
  articles: NewsArticle[];
  totalCount: number;
  timestamp: number;
  /** A fingerprint of the filters used so we don't serve wrong-filter cache */
  filterKey: string;
}

interface CachedStats {
  stats: ThreatIntelStats;
  timestamp: number;
  filterKey: string;
}

export interface CacheFilterInput {
  scope: ThreatIntelScope;
  categories?: readonly string[];
  severities?: readonly string[];
  searchQuery?: string;
  dateFilter?: string;
  sortBy?: string;
  source?: string;
  page?: number;
  verification?: string;
  chains?: readonly string[];
  attackTypes?: readonly string[];
  sources?: readonly string[];
}

/** Build a stable key from filter options so cache only matches the same query. */
export function buildFilterKey(opts: CacheFilterInput): string {
  return JSON.stringify({
    sc: opts.scope,
    c: opts.categories ? [...opts.categories].sort() : [],
    s: opts.severities ? [...opts.severities].sort() : [],
    q: opts.searchQuery ?? '',
    d: opts.dateFilter ?? 'all',
    sb: opts.sortBy ?? 'date',
    src: opts.source ?? 'all',
    p: opts.page ?? 1,
    v: opts.verification ?? 'all',
    ch: opts.chains ? [...opts.chains].sort() : [],
    at: opts.attackTypes ? [...opts.attackTypes].sort() : [],
    pr: opts.sources ? [...opts.sources].sort() : [],
  });
}

/** Stats describe the whole filtered result, so page and sort are not part of their key. */
export function buildStatsFilterKey(opts: CacheFilterInput): string {
  return buildFilterKey({ ...opts, sortBy: 'date', page: 1 });
}

function dropLegacyEntries(): void {
  for (const key of LEGACY_KEYS) localStorage.removeItem(key);
}

export function saveToCache(
  articles: NewsArticle[],
  totalCount: number,
  filterKey: string,
): void {
  try {
    dropLegacyEntries();
    const payload: CachedData = {
      articles,
      totalCount,
      timestamp: Date.now(),
      filterKey,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage might be full or unavailable – silently ignore
  }
}

export function loadFromCache(filterKey: string): {
  articles: NewsArticle[];
  totalCount: number;
  isStale: boolean;
  cachedAt: Date;
} | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data: CachedData = JSON.parse(raw);

    // Only return cache if filters match (prevents showing wrong data)
    if (data.filterKey !== filterKey) return null;

    // Re-hydrate Date objects
    const articles: NewsArticle[] = data.articles.map((a) => ({
      ...a,
      publishedAt: new Date(a.publishedAt),
    }));

    const isStale = Date.now() - data.timestamp > CACHE_TTL_MS;

    return { articles, totalCount: data.totalCount, isStale, cachedAt: new Date(data.timestamp) };
  } catch {
    return null;
  }
}

function readCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Save whole-result stats for one filter set (see buildStatsFilterKey). */
export function saveStatsToCache(stats: ThreatIntelStats, filterKey: string): void {
  try {
    dropLegacyEntries();
    const payload: CachedStats = { stats, filterKey, timestamp: Date.now() };
    localStorage.setItem(STATS_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function loadStatsFromCache(filterKey: string): ThreatIntelStats | null {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<CachedStats>;
    if (data.filterKey !== filterKey || typeof data.stats !== 'object' || data.stats === null) return null;
    const stats = data.stats as unknown as Record<string, unknown>;
    return {
      total: readCount(stats.total),
      critical: readCount(stats.critical),
      high: readCount(stats.high),
      medium: readCount(stats.medium),
      low: readCount(stats.low),
      info: readCount(stats.info),
      supplyChain: readCount(stats.supplyChain),
      unconfirmed: readCount(stats.unconfirmed),
    };
  } catch {
    return null;
  }
}
