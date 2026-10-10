import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { NewsArticle, NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';
import { useToast } from '@/hooks/use-toast';
import {
  buildFilterKey,
  buildStatsFilterKey,
  loadFromCache,
  loadStatsFromCache,
  saveStatsToCache,
  saveToCache,
  type CacheFilterInput,
} from '@/utils/newsCache';
import { summarizeFeedFreshness } from '@/utils/feedFreshness';
import {
  buildCategoryPostgrestFilter,
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  WEB3_INCIDENT_POSTGREST_FILTER,
} from '@/utils/newsIncident';
import {
  isPublishable,
  mapPublishableNewsArticleRows,
  NEWS_ARTICLE_COLUMNS,
} from '@/lib/threatIntel/articleRow';
import { DEFAULT_SCOPE } from '@/lib/threatIntel/taxonomy';
import {
  buildIncidentPostgrestFilters,
  buildThreatIntelFilterParams,
  buildThreatIntelQueryParams,
  computePageStats,
  DEFAULT_PAGE_SIZE,
  EMPTY_THREAT_INTEL_STATS,
  parseThreatIntelStats,
  requiresThreatIntelRpc,
  type DateFilter,
  type SortBy,
  type SourceFilter,
  type ThreatIntelFilterParams,
  type ThreatIntelFilters,
  type ThreatIntelStats,
  type VerificationFilter,
} from '@/lib/threatIntel/query';

interface UseNewsArticlesOptions {
  categories?: NewsCategory[];
  severities?: SeverityLevel[];
  searchQuery?: string;
  dateFilter?: DateFilter;
  sortBy?: SortBy;
  view?: ThreatIntelScope;
  page?: number;
  pageSize?: number;
  verification?: VerificationFilter;
  chains?: string[];
  attackTypes?: string[];
  sources?: SourceFilter[];
}

/**
 * 'server': stats cover the whole filtered result (threat_intel_stats).
 * 'page': the stats RPC failed and counts describe only the loaded page.
 */
export type StatsSource = 'server' | 'page';

interface FeedStatus {
  source: 'loading' | 'live' | 'cache';
  isStale: boolean;
  checkedAt: Date | null;
  activeFeedCount: number;
  checkedFeedCount: number;
  pipelineCheckedAt: Date | null;
  pipelineIsStale: boolean;
  newestPublishedAt: Date | null;
}

interface UseNewsArticlesResult {
  articles: NewsArticle[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  refreshFromRSS: () => Promise<void>;
  refreshWeb3Incidents: () => Promise<void>;
  summarizeArticles: () => Promise<void>;
  isRefreshing: boolean;
  isRefreshingWeb3: boolean;
  isSummarizing: boolean;
  feedStatus: FeedStatus;
  stats: ThreatIntelStats;
  statsSource: StatsSource;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const sanitizePostgrestSearchTerm = (value: string): string => value
  .replace(/[,%_*()"'\\]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const emptyFeedFreshness = {
  activeFeedCount: 0,
  checkedFeedCount: 0,
  pipelineCheckedAt: null as Date | null,
  pipelineIsStale: true,
  newestPublishedAt: null as Date | null,
};

async function fetchFeedFreshness() {
  try {
    const [feedsResult, latestArticleResult] = await Promise.all([
      supabase
        .from('rss_feeds')
        .select('last_fetched_at')
        .eq('is_active', true),
      supabase
        .from('news_articles')
        .select('published_at')
        .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (feedsResult.error) throw feedsResult.error;
    if (latestArticleResult.error) throw latestArticleResult.error;

    const feedSummary = summarizeFeedFreshness(feedsResult.data || []);
    const newestPublishedAt = latestArticleResult.data?.published_at
      ? new Date(latestArticleResult.data.published_at)
      : null;

    return { ...feedSummary, newestPublishedAt };
  } catch (freshnessError) {
    console.warn('Unable to load threat-feed freshness metadata:', freshnessError);
    return emptyFeedFreshness;
  }
}

async function fetchThreatIntelStats(params: ThreatIntelFilterParams): Promise<ThreatIntelStats | null> {
  try {
    const { data, error } = await supabase.rpc('threat_intel_stats', params);
    if (error) {
      console.warn('Unable to load threat-intel stats; falling back to page counts:', error);
      return null;
    }
    return parseThreatIntelStats(data);
  } catch (statsError) {
    console.warn('Unable to load threat-intel stats; falling back to page counts:', statsError);
    return null;
  }
}

function toCacheInput(filters: ThreatIntelFilters): CacheFilterInput {
  return {
    scope: filters.scope,
    categories: filters.categories,
    severities: filters.severities,
    searchQuery: filters.searchQuery,
    dateFilter: filters.dateFilter,
    sortBy: filters.sortBy,
    page: filters.page,
    // The incident filters are part of both the feed key and the stats key
    // (buildStatsFilterKey derives from buildFilterKey), so a filtered view
    // never reuses another view's rows or counts.
    verification: filters.verification,
    chains: filters.chains,
    attackTypes: filters.attackTypes,
    sources: filters.sources,
  };
}

/** Lower bound for the result count when only one page is known. */
function countFloor(offset: number, rowCount: number, pageSize: number): number {
  return offset + rowCount + (rowCount === pageSize ? 1 : 0);
}

export function useNewsArticles(options: UseNewsArticlesOptions = {}): UseNewsArticlesResult {
  const {
    categories,
    severities,
    searchQuery = '',
    dateFilter = 'all',
    sortBy = 'date',
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    view = DEFAULT_SCOPE,
    verification = 'all',
    chains,
    attackTypes,
    sources,
  } = options;

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingWeb3, setIsRefreshingWeb3] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<ThreatIntelStats>(EMPTY_THREAT_INTEL_STATS);
  const [statsSource, setStatsSource] = useState<StatsSource>('page');
  const [feedStatus, setFeedStatus] = useState<FeedStatus>({
    source: 'loading',
    isStale: false,
    checkedAt: null,
    ...emptyFeedFreshness,
  });
  const { toast } = useToast();
  const cacheInitialised = useRef(false);
  const latestRequest = useRef(0);
  const latestStatsKey = useRef<string | null>(null);
  const requestedStatsKey = useRef<string | null>(null);
  const serverStats = useRef<{ key: string; stats: ThreatIntelStats } | null>(null);
  // Provisional total used until server stats arrive (may be a planner estimate).
  const pageFloor = useRef(0);
  // Rows actually returned so far for this view: the only floor applied to a
  // server total, which is exact.
  const seenRowsFloor = useRef(0);
  const pageArticlesRef = useRef<NewsArticle[]>([]);

  // Callers rebuild their filter arrays on every URL change, including tab
  // switches. Key the query on the array contents so identical filters do not
  // refetch, and so `refetch` keeps a stable identity.
  const categoriesKey = (categories ?? []).join(',');
  const severitiesKey = (severities ?? []).join(',');
  // Chain and attack-type values may contain spaces, so key them as JSON.
  const incidentKey = JSON.stringify([chains ?? [], attackTypes ?? [], sources ?? []]);
  const filters = useMemo<ThreatIntelFilters>(() => {
    const [chainList, attackList, sourceList] = JSON.parse(incidentKey) as [string[], string[], SourceFilter[]];
    return {
      scope: view,
      categories: categoriesKey ? (categoriesKey.split(',') as NewsCategory[]) : [],
      severities: severitiesKey ? (severitiesKey.split(',') as SeverityLevel[]) : [],
      searchQuery,
      dateFilter,
      sortBy,
      page,
      pageSize,
      verification,
      chains: chainList,
      attackTypes: attackList,
      sources: sourceList,
    };
  }, [view, categoriesKey, severitiesKey, searchQuery, dateFilter, sortBy, page, pageSize, verification, incidentKey]);

  // Hydrate from cache on first mount so the page is never blank.
  useEffect(() => {
    if (cacheInitialised.current) return;
    cacheInitialised.current = true;
    const cacheInput = toCacheInput(filters);

    const cached = loadFromCache(buildFilterKey(cacheInput));
    if (cached) {
      setArticles(cached.articles.filter((article) => isPublishable(article.metadata)));
      setTotalCount(cached.totalCount);
      setFeedStatus({
        source: 'cache',
        isStale: cached.isStale,
        checkedAt: cached.cachedAt,
        ...emptyFeedFreshness,
      });
    }

    const cachedStats = loadStatsFromCache(buildStatsFilterKey(cacheInput));
    if (cachedStats) {
      setStats(cachedStats);
      setStatsSource('server');
      serverStats.current = { key: buildStatsFilterKey(cacheInput), stats: cachedStats };
      if (!cached) setTotalCount(cachedStats.total);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadArticles = useCallback(async (forceStats: boolean) => {
    const requestId = ++latestRequest.current;
    // A slower response for an older filter set must not overwrite a newer one.
    const isCurrent = () => requestId === latestRequest.current;

    const now = new Date();
    const filterParams = buildThreatIntelFilterParams(filters, now);
    const queryParams = buildThreatIntelQueryParams(filters, now);
    const cacheInput = toCacheInput(filters);
    const filterKey = buildFilterKey(cacheInput);
    const statsKey = buildStatsFilterKey(cacheInput);
    const offset = queryParams.result_offset;
    const limit = queryParams.result_limit;
    const useRpc = requiresThreatIntelRpc(filters);
    const categoryOrFilter = filterParams.category_filter
      ? buildCategoryPostgrestFilter(filterParams.category_filter)
      : null;

    latestStatsKey.current = statsKey;
    if (serverStats.current?.key !== statsKey) {
      // Never show the previous view's counts under this view's caption.
      serverStats.current = null;
      pageFloor.current = 0;
      seenRowsFloor.current = 0;
      setStats(EMPTY_THREAT_INTEL_STATS);
      setStatsSource('page');
    }

    const feedFreshnessPromise = fetchFeedFreshness();

    // Stats cover the whole filtered result, so page and sort changes reuse
    // them. They load in the background and never block the list.
    if (forceStats || requestedStatsKey.current !== statsKey) {
      requestedStatsKey.current = statsKey;
      void fetchThreatIntelStats(filterParams).then(async (resolvedStats) => {
        if (latestStatsKey.current !== statsKey) return;
        if (resolvedStats) {
          const total = Math.max(resolvedStats.total, seenRowsFloor.current);
          const resolved = { ...resolvedStats, total };
          serverStats.current = { key: statsKey, stats: resolved };
          setStats(resolved);
          setStatsSource('server');
          setTotalCount(total);
          saveStatsToCache(resolved, statsKey);
          return;
        }
        // Stats unavailable (for example before the migration is applied):
        // fall back to page counts and keep pagination correct via the count RPC.
        requestedStatsKey.current = null;
        let total = pageFloor.current;
        if (useRpc) {
          const { data: countData, error: countError } = await supabase.rpc('count_news_articles', filterParams);
          if (latestStatsKey.current !== statsKey) return;
          if (countError) console.warn('Unable to load the complete threat-intel count:', countError);
          else total = Math.max(Number(countData) || 0, total);
        }
        pageFloor.current = total;
        setTotalCount(total);
        setStats(computePageStats(pageArticlesRef.current, total));
        setStatsSource('page');
      });
    }

    // Commit the list and a provisional total right away; stats arrive later.
    const commitPage = (nextArticles: NewsArticle[], provisionalTotal: number, rawRowCount: number): number => {
      pageArticlesRef.current = nextArticles;
      pageFloor.current = Math.max(provisionalTotal, countFloor(offset, rawRowCount, limit));
      seenRowsFloor.current = offset + rawRowCount;
      const known = serverStats.current?.key === statsKey ? serverStats.current.stats : null;
      const total = known ? Math.max(known.total, seenRowsFloor.current) : pageFloor.current;
      if (known) {
        const resolved = { ...known, total };
        serverStats.current = { key: statsKey, stats: resolved };
        setStats(resolved);
      } else {
        setStats(computePageStats(nextArticles, total));
        setStatsSource('page');
      }
      setTotalCount(total);
      setArticles(nextArticles);
      return total;
    };

    try {
      setIsLoading(true);
      setError(null);

      let rows: unknown[] | null = null;
      let fetchError: { message?: string } | null = null;
      let queryCount: number | null = null;

      if (!useRpc) {
        // Plain newest-first browsing stays on the indexed table query. The
        // estimated count is exact for small results and planner-based for
        // large ones; threat_intel_stats supplies the exact total.
        let query = supabase
          .from('news_articles')
          .select(NEWS_ARTICLE_COLUMNS, { count: 'estimated' })
          .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
          .order('published_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (categoryOrFilter) query = query.or(categoryOrFilter);
        else if (filterParams.category_filter) query = query.in('category', filterParams.category_filter);
        if (filterParams.severity_filter) query = query.in('severity', filterParams.severity_filter);
        if (filterParams.date_from) query = query.gte('published_at', filterParams.date_from);
        const directResult = await query;
        rows = directResult.data;
        fetchError = directResult.error;
        queryCount = directResult.count;
      } else {
        // Search ranking, metadata predicates and severity ordering all run in
        // the database so ordering is correct across pages.
        const rpcResult = await supabase.rpc('search_news_articles', queryParams);
        rows = rpcResult.data;
        fetchError = rpcResult.error;
      }
      if (!isCurrent()) return;

      if (fetchError) {
        console.error('Primary threat-feed query failed, retrying without a count:', fetchError);
        // Narrow direct query with public card/detail columns only. Ordering
        // falls back to newest first.
        let query = supabase
          .from('news_articles')
          .select(NEWS_ARTICLE_COLUMNS)
          .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
          .order('published_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (categoryOrFilter) query = query.or(categoryOrFilter);
        else if (filterParams.category_filter) query = query.in('category', filterParams.category_filter);
        if (filterParams.severity_filter) query = query.in('severity', filterParams.severity_filter);
        if (filterParams.date_from) query = query.gte('published_at', filterParams.date_from);
        if (filterParams.web3_incidents_only) query = query.or(WEB3_INCIDENT_POSTGREST_FILTER);
        // The primary direct query never sees the incident filters:
        // requiresThreatIntelRpc sends every filtered request to the RPC.
        for (const incidentFilter of buildIncidentPostgrestFilters(filterParams)) {
          query = query.or(incidentFilter);
        }
        if (filterParams.search_query) {
          const safeSearchTerm = sanitizePostgrestSearchTerm(filterParams.search_query);
          if (safeSearchTerm) {
            query = query.or(`title.ilike.%${safeSearchTerm}%,summary.ilike.%${safeSearchTerm}%`);
          }
        }

        const { data: fallbackData, error: fallbackError } = await query;
        if (fallbackError) throw fallbackError;
        const fallbackRows = fallbackData ?? [];
        const fallbackArticles = mapPublishableNewsArticleRows(fallbackRows);
        const resolvedCount = commitPage(
          fallbackArticles,
          countFloor(offset, fallbackRows.length, limit),
          fallbackRows.length,
        );
        const freshness = await feedFreshnessPromise;
        if (!isCurrent()) return;
        setFeedStatus({ source: 'live', isStale: false, checkedAt: new Date(), ...freshness });
        saveToCache(fallbackArticles, resolvedCount, filterKey);
        return;
      }

      const pageRows = rows ?? [];
      const pageArticles = mapPublishableNewsArticleRows(pageRows);
      const resolvedCount = commitPage(
        pageArticles,
        queryCount ?? countFloor(offset, pageRows.length, limit),
        pageRows.length,
      );
      const freshness = await feedFreshnessPromise;
      if (!isCurrent()) return;
      setFeedStatus({ source: 'live', isStale: false, checkedAt: new Date(), ...freshness });

      // Persist to cache for offline / error fallback
      saveToCache(pageArticles, resolvedCount, filterKey);
    } catch (err) {
      console.error('Error fetching news articles:', err);
      const freshness = await feedFreshnessPromise;
      if (!isCurrent()) return;

      // Attempt to serve cached data instead of showing an empty page
      const cached = loadFromCache(filterKey);
      if (cached && cached.articles.length > 0) {
        const cachedArticles = cached.articles.filter((article) => isPublishable(article.metadata));
        setArticles(cachedArticles);
        setTotalCount(cached.totalCount);
        const cachedStats = loadStatsFromCache(statsKey);
        if (cachedStats) {
          setStats(cachedStats);
          setStatsSource('server');
          serverStats.current = { key: statsKey, stats: cachedStats };
        } else {
          setStats(computePageStats(cachedArticles, cached.totalCount));
          setStatsSource('page');
        }
        setFeedStatus({
          source: 'cache',
          isStale: cached.isStale,
          checkedAt: cached.cachedAt,
          ...freshness,
        });
        setError(err instanceof Error ? err : new Error('Failed to refresh articles'));
        console.info('Serving cached news data due to fetch error');
      } else {
        setArticles([]);
        setTotalCount(0);
        setStats(EMPTY_THREAT_INTEL_STATS);
        setStatsSource('page');
        setFeedStatus({ source: 'live', isStale: false, checkedAt: null, ...freshness });
        setError(err instanceof Error ? err : new Error('Failed to fetch articles'));
      }
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [filters]);

  const fetchArticles = useCallback(() => loadArticles(true), [loadArticles]);

  const refreshFromRSS = useCallback(async () => {
    try {
      setIsRefreshing(true);

      const { data, error: fetchError } = await supabase.functions.invoke('fetch-rss-news');

      if (fetchError) {
        throw fetchError;
      }

      if (data?.success) {
        toast({
          title: data.partial ? 'News updated with warnings' : 'News updated',
          description: `Found ${data.articlesFound} articles, ${data.articlesInserted} new.${data.partial ? ' Review ingestion health for provider or write errors.' : ''}`,
        });
        await fetchArticles();
      } else {
        throw new Error(data?.error || 'Failed to refresh news');
      }
    } catch (err) {
      console.error('Error refreshing from RSS:', err);
      toast({
        title: 'Refresh Failed',
        description: err instanceof Error ? err.message : 'Failed to refresh news feed',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchArticles, toast]);

  const refreshWeb3Incidents = useCallback(async () => {
    try {
      setIsRefreshingWeb3(true);

      const [collector, partner] = await Promise.allSettled([
        supabase.functions.invoke('fetch-web3-incidents'),
        supabase.functions.invoke('fetch-quillmonitor-incidents'),
      ]);
      const outcomes = [collector, partner].map((result) => result.status === 'fulfilled' && !result.value.error && result.value.data?.success);
      if (!outcomes.some(Boolean)) throw new Error('Both Web3 incident sources failed');
      toast({ title: 'Web3 Incidents Updated', description: outcomes.every(Boolean) ? 'All incident sources refreshed.' : 'One source refreshed; one needs attention in Admin Health.' });
      await fetchArticles();
    } catch (err) {
      console.error('Error fetching Web3 incidents:', err);
      toast({
        title: 'Web3 Fetch Failed',
        description: err instanceof Error ? err.message : 'Failed to fetch Web3 incidents',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshingWeb3(false);
    }
  }, [fetchArticles, toast]);

  const summarizeArticles = useCallback(async () => {
    try {
      setIsSummarizing(true);

      const { data, error: summarizeError } = await supabase.functions.invoke('summarize-article', {
        body: { limit: 10 }
      });

      if (summarizeError) {
        throw summarizeError;
      }

      if (data?.success) {
        toast({
          title: 'AI Summarization Complete',
          description: `Processed ${data.processed} articles${data.failed > 0 ? `, ${data.failed} failed` : ''}.`,
        });
        await fetchArticles();
      } else {
        throw new Error(data?.error || 'Failed to summarize articles');
      }
    } catch (err) {
      console.error('Error summarizing articles:', err);
      toast({
        title: 'Summarization Failed',
        description: err instanceof Error ? err.message : 'Failed to generate AI summaries',
        variant: 'destructive',
      });
    } finally {
      setIsSummarizing(false);
    }
  }, [fetchArticles, toast]);

  useEffect(() => {
    void loadArticles(false);
  }, [loadArticles]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const pagination = {
    currentPage: page,
    totalPages,
    totalCount,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return {
    articles,
    isLoading,
    error,
    refetch: fetchArticles,
    refreshFromRSS,
    refreshWeb3Incidents,
    summarizeArticles,
    isRefreshing,
    isRefreshingWeb3,
    isSummarizing,
    feedStatus,
    stats,
    statsSource,
    pagination,
  };
}
