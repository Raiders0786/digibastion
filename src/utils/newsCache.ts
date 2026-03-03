import { NewsArticle } from '@/types/news';

const CACHE_KEY = 'digibastion_news_cache';
const STATS_KEY = 'digibastion_news_stats';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes – after this we still show cache but mark stale

interface CachedData {
  articles: NewsArticle[];
  totalCount: number;
  timestamp: number;
  /** A fingerprint of the filters used so we don't serve wrong-filter cache */
  filterKey: string;
}

/** Build a stable key from filter options so cache only matches same query. */
export function buildFilterKey(opts: {
  categories?: string[];
  severities?: string[];
  searchQuery?: string;
  dateFilter?: string;
  sortBy?: string;
  page?: number;
}): string {
  return JSON.stringify({
    c: opts.categories?.sort() ?? [],
    s: opts.severities?.sort() ?? [],
    q: opts.searchQuery ?? '',
    d: opts.dateFilter ?? 'all',
    sb: opts.sortBy ?? 'date',
    p: opts.page ?? 1,
  });
}

export function saveToCache(
  articles: NewsArticle[],
  totalCount: number,
  filterKey: string,
): void {
  try {
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

    return { articles, totalCount: data.totalCount, isStale };
  } catch {
    return null;
  }
}

/** Save stats separately so the hero banner always has numbers. */
export function saveStatsToCache(stats: {
  total: number;
  critical: number;
  high: number;
  supplyChain: number;
  aiSummarized: number;
  web3Incidents: number;
}): void {
  try {
    localStorage.setItem(
      STATS_KEY,
      JSON.stringify({ ...stats, timestamp: Date.now() }),
    );
  } catch {
    // ignore
  }
}

export function loadStatsFromCache(): {
  total: number;
  critical: number;
  high: number;
  supplyChain: number;
  aiSummarized: number;
  web3Incidents: number;
} | null {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      total: data.total ?? 0,
      critical: data.critical ?? 0,
      high: data.high ?? 0,
      supplyChain: data.supplyChain ?? 0,
      aiSummarized: data.aiSummarized ?? 0,
      web3Incidents: data.web3Incidents ?? 0,
    };
  } catch {
    return null;
  }
}
