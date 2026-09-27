import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewsArticle, NewsCategory, SeverityLevel } from '@/types/news';
import { useToast } from '@/hooks/use-toast';
import {
  buildFilterKey,
  saveToCache,
  loadFromCache,
  saveStatsToCache,
  loadStatsFromCache,
} from '@/utils/newsCache';
import { sanitizeText } from '@/utils/sanitize';
import { summarizeFeedFreshness } from '@/utils/feedFreshness';
import {
  buildCategoryPostgrestFilter,
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  isClassificationRelevant,
  isWeb3Incident,
  WEB3_INCIDENT_POSTGREST_FILTER,
} from '@/utils/newsIncident';
import type { Database } from '@/integrations/supabase/types';

interface UseNewsArticlesOptions {
  categories?: NewsCategory[];
  severities?: SeverityLevel[];
  searchQuery?: string;
  dateFilter?: 'all' | '7d' | '30d' | '90d';
  sortBy?: 'date' | 'severity';
  view?: 'all' | 'web3-incidents';
  page?: number;
  pageSize?: number;
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
  feedStatus: {
    source: 'loading' | 'live' | 'cache';
    isStale: boolean;
    checkedAt: Date | null;
    activeFeedCount: number;
    checkedFeedCount: number;
    pipelineCheckedAt: Date | null;
    pipelineIsStale: boolean;
    newestPublishedAt: Date | null;
  };
  stats: {
    total: number;
    critical: number;
    high: number;
    supplyChain: number;
    aiSummarized: number;
    web3Incidents: number;
  };
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

const NEWS_ARTICLE_COLUMNS = [
  'id',
  'title',
  'summary',
  'content',
  'category',
  'severity',
  'tags',
  'affected_technologies',
  'link',
  'source_url',
  'source_name',
  'author',
  'cve_id',
  'published_at',
  'is_processed',
  'metadata',
].join(',');

type NewsArticleTableRow = Database['public']['Tables']['news_articles']['Row'];
type NewsArticleQueryRow = Pick<NewsArticleTableRow,
  | 'id'
  | 'title'
  | 'summary'
  | 'content'
  | 'category'
  | 'severity'
  | 'tags'
  | 'affected_technologies'
  | 'link'
  | 'source_url'
  | 'source_name'
  | 'author'
  | 'cve_id'
  | 'published_at'
  | 'is_processed'
  | 'metadata'
>;

const toNewsArticle = (row: NewsArticleQueryRow): NewsArticle => ({
  id: row.id,
  title: sanitizeText(row.title),
  content: sanitizeText(row.content || row.summary),
  summary: sanitizeText(row.summary),
  category: row.category as NewsCategory,
  tags: row.tags || [],
  severity: row.severity as SeverityLevel,
  sourceUrl: row.source_url || undefined,
  link: row.link || undefined,
  publishedAt: new Date(row.published_at),
  affectedTechnologies: row.affected_technologies || [],
  author: row.author || undefined,
  cveId: row.cve_id || undefined,
  isProcessed: row.is_processed || false,
  sourceName: row.source_name || undefined,
  metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
    ? row.metadata as NewsArticle['metadata']
    : undefined,
});

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

export function useNewsArticles(options: UseNewsArticlesOptions = {}): UseNewsArticlesResult {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingWeb3, setIsRefreshingWeb3] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isCachedData, setIsCachedData] = useState(false);
  const [feedStatus, setFeedStatus] = useState<UseNewsArticlesResult['feedStatus']>({
    source: 'loading',
    isStale: false,
    checkedAt: null,
    ...emptyFeedFreshness,
  });
  const { toast } = useToast();
  const cacheInitialised = useRef(false);

  const { 
    categories, 
    severities, 
    searchQuery, 
    dateFilter = 'all', 
    sortBy = 'date', 
    page = 1, 
    pageSize = 20,
    view = 'all',
  } = options;

  const currentFilterKey = buildFilterKey({
    categories: categories as string[] | undefined,
    severities: severities as string[] | undefined,
    searchQuery,
    dateFilter,
    sortBy,
    web3IncidentsOnly: view === 'web3-incidents',
    page,
  });

  // Hydrate from cache on first mount so the page is never blank
  useEffect(() => {
    if (cacheInitialised.current) return;
    cacheInitialised.current = true;

    const cached = loadFromCache(currentFilterKey);
    if (cached) {
      setArticles(cached.articles.filter(isClassificationRelevant));
      setTotalCount(cached.totalCount);
      setIsCachedData(true);
      setFeedStatus({
        source: 'cache',
        isStale: cached.isStale,
        checkedAt: cached.cachedAt,
        ...emptyFeedFreshness,
      });
    }

    // Also load cached stats so the hero banner has numbers instantly
    const cachedStats = loadStatsFromCache();
    if (cachedStats && !cached) {
      setTotalCount(cachedStats.total);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArticles = useCallback(async () => {
    const feedFreshnessPromise = fetchFeedFreshness();

    try {
      setIsLoading(true);
      setError(null);

      // Calculate date filter
      let dateFrom: string | null = null;
      if (dateFilter !== 'all') {
        const now = new Date();
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
        const cutoff = new Date(now.getTime() - daysMap[dateFilter] * 24 * 60 * 60 * 1000);
        dateFrom = cutoff.toISOString();
      }

      // Prepare filters for RPC call
      const categoryFilter = categories && categories.length > 0 ? categories : null;
      const categoryOrFilter = categoryFilter ? buildCategoryPostgrestFilter(categoryFilter) : null;
      const severityFilter = severities && severities.length > 0 ? severities : null;
      const searchTerm = searchQuery?.trim() || null;
      const offset = (page - 1) * pageSize;
      const filterKey = buildFilterKey({
        categories: categories as string[] | undefined,
        severities: severities as string[] | undefined,
        searchQuery,
        dateFilter,
        sortBy,
        web3IncidentsOnly: view === 'web3-incidents',
        page,
      });

      // The normal feed is an indexed date query. Sending it through the
      // full-text RPC forces PostgreSQL through the generic ranking plan even
      // when there is no search term, which has caused statement timeouts as
      // the article corpus has grown. Keep the RPC for ranked searches only.
      let data: NewsArticleQueryRow[] | null = null;
      let fetchError: { message?: string } | null = null;
      let queryCount: number | null = null;

      // The release migration teaches the RPC the same metadata-backed Web3
      // umbrella and incident-scope semantics used by the client helpers. Keep
      // ordinary unfiltered browsing on the indexed date query; use the RPC
      // whenever ranking or metadata predicates are required so PostgREST does
      // not build several expensive top-level OR filters.
      const requiresMetadataFilter = view === 'web3-incidents' || Boolean(categoryOrFilter);
      if (!searchTerm && !requiresMetadataFilter) {
        let query = supabase
          .from('news_articles')
          // Estimated count is exact for small result sets and planner-based
          // for large feeds, keeping pagination responsive without a second
          // request for the ordinary chronological feed.
          .select(NEWS_ARTICLE_COLUMNS, { count: 'estimated' })
          .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
          .order('published_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (categoryOrFilter) query = query.or(categoryOrFilter);
        else if (categoryFilter) query = query.in('category', categoryFilter);
        if (severityFilter) query = query.in('severity', severityFilter);
        if (dateFrom) query = query.gte('published_at', dateFrom);
        if (view === 'web3-incidents') query = query.or(WEB3_INCIDENT_POSTGREST_FILTER);
        if (searchTerm) {
          const safeSearchTerm = sanitizePostgrestSearchTerm(searchTerm);
          if (safeSearchTerm) query = query.or(`title.ilike.%${safeSearchTerm}%,summary.ilike.%${safeSearchTerm}%`);
        }

        const directResult = await query;
        data = directResult.data;
        fetchError = directResult.error;
        queryCount = directResult.count;
      } else {
        const rpcResult = await supabase.rpc('search_news_articles', {
          search_query: searchTerm,
          category_filter: categoryFilter,
          severity_filter: severityFilter,
          date_from: dateFrom,
          result_limit: pageSize,
          result_offset: offset,
          source_filter: null,
          web3_incidents_only: view === 'web3-incidents',
        });
        data = rpcResult.data;
        fetchError = rpcResult.error;
      }

      if (fetchError) {
        console.error('Primary threat-feed query failed, retrying without a count:', fetchError);
        // Fall back to a narrow direct query. Select only public card/detail
        // fields so large raw payloads and search vectors are never copied to
        // the browser as part of recovery.
        let query = supabase
          .from('news_articles')
          .select(NEWS_ARTICLE_COLUMNS)
          .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
          .order('published_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (categoryOrFilter) query = query.or(categoryOrFilter);
        else if (categoryFilter) query = query.in('category', categoryFilter);
        if (severityFilter) query = query.in('severity', severityFilter);
        if (dateFrom) query = query.gte('published_at', dateFrom);
        if (view === 'web3-incidents') query = query.or(WEB3_INCIDENT_POSTGREST_FILTER);
        if (searchTerm) {
          const safeSearchTerm = sanitizePostgrestSearchTerm(searchTerm);
          if (safeSearchTerm) {
            query = query.or(`title.ilike.%${safeSearchTerm}%,summary.ilike.%${safeSearchTerm}%`);
          }
        }

        const { data: fallbackData, error: fallbackError } = await query;
        if (fallbackError) throw fallbackError;

        const resultCountFloor = offset
          + (fallbackData || []).length
          + ((fallbackData || []).length === pageSize ? 1 : 0);
        const cachedStats = !categoryFilter
          && !severityFilter
          && !searchTerm
          && dateFilter === 'all'
          && view === 'all'
          ? loadStatsFromCache()
          : null;
        const fallbackTotal = Math.max(resultCountFloor, cachedStats?.total || 0);
        setTotalCount(fallbackTotal);

        const transformedArticles = (fallbackData || []).map(toNewsArticle).filter(isClassificationRelevant);

        setArticles(transformedArticles);
        setIsCachedData(false);
        const freshness = await feedFreshnessPromise;
        setFeedStatus({ source: 'live', isStale: false, checkedAt: new Date(), ...freshness });
        saveToCache(transformedArticles, fallbackTotal, filterKey);
        return;
      }

      // The direct feed query already carries its count, avoiding a second
      // full-table RPC on every page load. Ranked search still needs the count
      // RPC; failure is non-fatal and keeps forward pagination available.
      let resolvedCount = queryCount;
      if (searchTerm || requiresMetadataFilter) {
        const { data: countData, error: countError } = await supabase.rpc('count_news_articles', {
          search_query: searchTerm,
          category_filter: categoryFilter,
          severity_filter: severityFilter,
          date_from: dateFrom,
          source_filter: null,
          web3_incidents_only: view === 'web3-incidents',
        });

        if (countError) console.warn('Unable to load the complete threat-intel count:', countError);
        const resultCountFloor = offset
          + (data || []).length
          + ((data || []).length === pageSize ? 1 : 0);
        resolvedCount = countError
          ? resultCountFloor
          : Math.max(countData || 0, resultCountFloor);
      }
      resolvedCount ??= offset + (data || []).length;
      setTotalCount(resolvedCount);

      // Transform RPC results to NewsArticle format
      const transformedArticles = (data || []).map(toNewsArticle).filter(isClassificationRelevant);

      // Apply sorting (RPC already sorts by rank + date, but apply severity if needed)
      if (sortBy === 'severity') {
        const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        transformedArticles.sort((a, b) => {
          const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
          if (severityDiff !== 0) return severityDiff;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });
      }

      setArticles(transformedArticles);
      setIsCachedData(false);
      const freshness = await feedFreshnessPromise;
      setFeedStatus({ source: 'live', isStale: false, checkedAt: new Date(), ...freshness });

      // Persist to cache for offline / error fallback
      saveToCache(transformedArticles, resolvedCount, filterKey);
    } catch (err) {
      console.error('Error fetching news articles:', err);
      const freshness = await feedFreshnessPromise;

      // Attempt to serve cached data instead of showing empty page
      const filterKey = buildFilterKey({
        categories: categories as string[] | undefined,
        severities: severities as string[] | undefined,
        searchQuery,
        dateFilter,
        sortBy,
        web3IncidentsOnly: view === 'web3-incidents',
        page,
      });
      const cached = loadFromCache(filterKey);
      if (cached && cached.articles.length > 0) {
        setArticles(cached.articles.filter(isClassificationRelevant));
        setTotalCount(cached.totalCount);
        setIsCachedData(true);
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
        setIsCachedData(false);
        setFeedStatus({ source: 'live', isStale: false, checkedAt: null, ...freshness });
        setError(err instanceof Error ? err : new Error('Failed to fetch articles'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [categories, severities, searchQuery, dateFilter, sortBy, view, page, pageSize]);

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
        supabase.functions.invoke('fetch-quillmonitor-incidents', { body: { pages: 3, page_size: 100 } }),
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
    fetchArticles();
  }, [fetchArticles]);

  // Calculate stats from current page (for display purposes)
  const stats = {
    total: totalCount,
    critical: articles.filter(a => a.severity === 'critical').length,
    high: articles.filter(a => a.severity === 'high').length,
    supplyChain: articles.filter(a => a.category === 'supply-chain').length,
    aiSummarized: articles.filter(a => a.isProcessed).length,
    web3Incidents: articles.filter(isWeb3Incident).length,
  };

  // Persist stats to cache so hero banner is never blank
  useEffect(() => {
    if (stats.total > 0 && !isCachedData) {
      saveStatsToCache(stats);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.total, stats.critical, stats.high, isCachedData]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const pagination = {
    currentPage: page,
    totalPages,
    totalCount,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
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
    pagination,
  };
}
