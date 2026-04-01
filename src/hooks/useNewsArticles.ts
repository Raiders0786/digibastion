import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewsArticle, NewsCategory, SeverityLevel } from '@/types/news';
import { useToast } from '@/hooks/use-toast';
import { mockNewsArticles } from '@/data/newsData';
import {
  buildFilterKey,
  saveToCache,
  loadFromCache,
  saveStatsToCache,
  loadStatsFromCache,
} from '@/utils/newsCache';

/** Client-side safety net: strip any residual HTML from DB text fields */
function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  let s = text;
  let prev = '';
  // Loop decode → strip until stable (handles double-encoded entities)
  while (s !== prev) {
    prev = s;
    s = s
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&(amp|lt|gt|quot|apos|nbsp|mdash|ndash|hellip|rsquo|lsquo|rdquo|ldquo);/gi, (_, name) => {
        const map: Record<string, string> = {
          amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
          mdash: '—', ndash: '–', hellip: '…', rsquo: '\u2019', lsquo: '\u2018',
          rdquo: '\u201D', ldquo: '\u201C',
        };
        return map[name.toLowerCase()] ?? '';
      });
    s = s.replace(/<[^>]*>/g, '');
  }
  return s.replace(/\s+/g, ' ').trim();
}

interface UseNewsArticlesOptions {
  categories?: NewsCategory[];
  severities?: SeverityLevel[];
  searchQuery?: string;
  dateFilter?: 'all' | '7d' | '30d' | '90d';
  sortBy?: 'date' | 'severity';
  page?: number;
  pageSize?: number;
}

interface UseNewsArticlesResult {
  articles: NewsArticle[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  refreshFromRSS: () => Promise<void>;
  refreshFromWeb3: () => Promise<void>;
  summarizeArticles: () => Promise<void>;
  isRefreshing: boolean;
  isRefreshingWeb3: boolean;
  isSummarizing: boolean;
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

export function useNewsArticles(options: UseNewsArticlesOptions = {}): UseNewsArticlesResult {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingWeb3, setIsRefreshingWeb3] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isCachedData, setIsCachedData] = useState(false);
  const { toast } = useToast();
  const cacheInitialised = useRef(false);
  const hasShownFallbackNotice = useRef(false);

  const { 
    categories, 
    severities, 
    searchQuery, 
    dateFilter = 'all', 
    sortBy = 'date', 
    page = 1, 
    pageSize = 20 
  } = options;

  const currentFilterKey = buildFilterKey({
    categories: categories as string[] | undefined,
    severities: severities as string[] | undefined,
    searchQuery,
    dateFilter,
    sortBy,
    page,
  });

  // Hydrate from cache on first mount so the page is never blank
  useEffect(() => {
    if (cacheInitialised.current) return;
    cacheInitialised.current = true;

    const cached = loadFromCache(currentFilterKey);
    if (cached) {
      setArticles(cached.articles);
      setTotalCount(cached.totalCount);
      setIsCachedData(true);
    }

    // Also load cached stats so the hero banner has numbers instantly
    const cachedStats = loadStatsFromCache();
    if (cachedStats && !cached) {
      setTotalCount(cachedStats.total);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStaticFallback = useCallback(() => {
    const severityOrder: Record<SeverityLevel, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    };

    const normalizedSearch = searchQuery?.trim().toLowerCase() || '';

    let fallback = [...mockNewsArticles];

    if (categories && categories.length > 0) {
      fallback = fallback.filter((article) => categories.includes(article.category));
    }

    if (severities && severities.length > 0) {
      fallback = fallback.filter((article) => severities.includes(article.severity));
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const cutoff = new Date(now.getTime() - daysMap[dateFilter] * 24 * 60 * 60 * 1000);
      fallback = fallback.filter((article) => new Date(article.publishedAt).getTime() >= cutoff.getTime());
    }

    if (normalizedSearch) {
      fallback = fallback.filter((article) => {
        const searchableText = [
          article.title,
          article.summary,
          article.content,
          article.category,
          article.author || '',
          article.cveId || '',
          (article.tags || []).join(' '),
          (article.affectedTechnologies || []).join(' '),
        ]
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      });
    }

    fallback.sort((a, b) => {
      if (sortBy === 'severity') {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    const total = fallback.length;
    const offset = (page - 1) * pageSize;
    const paginated = fallback.slice(offset, offset + pageSize);

    return { articles: paginated, total };
  }, [categories, severities, searchQuery, dateFilter, sortBy, page, pageSize]);

  const fetchArticles = useCallback(async () => {
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
      const severityFilter = severities && severities.length > 0 ? severities : null;
      const searchTerm = searchQuery?.trim() || null;
      const offset = (page - 1) * pageSize;
      const filterKey = buildFilterKey({
        categories: categories as string[] | undefined,
        severities: severities as string[] | undefined,
        searchQuery,
        dateFilter,
        sortBy,
        page,
      });

      // Use the full-text search RPC function
      const { data, error: fetchError } = await supabase.rpc('search_news_articles', {
        search_query: searchTerm,
        category_filter: categoryFilter,
        severity_filter: severityFilter,
        date_from: dateFrom,
        result_limit: pageSize,
        result_offset: offset
      });

      if (fetchError) {
        console.error('RPC error, falling back to direct query:', fetchError);
        // Fallback to direct query if RPC fails
        let query = supabase
          .from('news_articles')
          .select('*', { count: 'exact' })
          .order('published_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (categoryFilter) query = query.in('category', categoryFilter);
        if (severityFilter) query = query.in('severity', severityFilter);
        if (dateFrom) query = query.gte('published_at', dateFrom);
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
        }

        const { data: fallbackData, error: fallbackError, count } = await query;
        if (fallbackError) throw fallbackError;
        
        setTotalCount(count || 0);

        const transformedArticles: NewsArticle[] = (fallbackData || []).map((row: any) => ({
          id: row.id,
          title: sanitizeText(row.title),
          content: sanitizeText(row.content || row.summary),
          summary: sanitizeText(row.summary),
          category: row.category as NewsCategory,
          tags: row.tags || [],
          severity: row.severity as SeverityLevel,
          sourceUrl: row.source_url || null,
          link: row.link || null,
          publishedAt: new Date(row.published_at),
          affectedTechnologies: row.affected_technologies || [],
          author: row.author || null,
          cveId: row.cve_id,
          isProcessed: row.is_processed || false,
          sourceName: row.source_name
        }));

        const isUnfilteredFirstPage = !searchTerm && !categoryFilter && !severityFilter && !dateFrom && page === 1;
        if (isUnfilteredFirstPage && transformedArticles.length === 0 && (count || 0) === 0) {
          const staticFallback = getStaticFallback();
          setArticles(staticFallback.articles);
          setTotalCount(staticFallback.total);
          setIsCachedData(true);
          setError(null);

          if (!hasShownFallbackNotice.current) {
            hasShownFallbackNotice.current = true;
            toast({
              title: 'Using backup threat feed',
              description: 'Live feed is temporarily unavailable. Showing built-in threat intelligence data.',
            });
          }

          saveToCache(staticFallback.articles, staticFallback.total, filterKey);
          return;
        }

        setArticles(transformedArticles);
        setIsCachedData(false);
        hasShownFallbackNotice.current = false;
        saveToCache(transformedArticles, count || 0, filterKey);
        return;
      }

      // Get total count for pagination
      const { data: countData } = await supabase.rpc('count_news_articles', {
        search_query: searchTerm,
        category_filter: categoryFilter,
        severity_filter: severityFilter,
        date_from: dateFrom
      });

      setTotalCount(countData || 0);

      // Transform RPC results to NewsArticle format
      let transformedArticles: NewsArticle[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content || row.summary || '',
        summary: row.summary || '',
        category: row.category as NewsCategory,
        tags: row.tags || [],
        severity: row.severity as SeverityLevel,
        sourceUrl: row.source_url || null,
        link: row.link || null,
        publishedAt: new Date(row.published_at),
        affectedTechnologies: row.affected_technologies || [],
        author: row.author || null,
        cveId: row.cve_id,
        isProcessed: row.is_processed || false,
        sourceName: row.source_name
      }));

      // Apply sorting (RPC already sorts by rank + date, but apply severity if needed)
      if (sortBy === 'severity') {
        const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        transformedArticles.sort((a, b) => {
          const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
          if (severityDiff !== 0) return severityDiff;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });
      }

      const isUnfilteredFirstPage = !searchTerm && !categoryFilter && !severityFilter && !dateFrom && page === 1;
      if (isUnfilteredFirstPage && transformedArticles.length === 0 && (countData || 0) === 0) {
        const staticFallback = getStaticFallback();
        setArticles(staticFallback.articles);
        setTotalCount(staticFallback.total);
        setIsCachedData(true);
        setError(null);

        if (!hasShownFallbackNotice.current) {
          hasShownFallbackNotice.current = true;
          toast({
            title: 'Using backup threat feed',
            description: 'Live feed is temporarily unavailable. Showing built-in threat intelligence data.',
          });
        }

        saveToCache(staticFallback.articles, staticFallback.total, filterKey);
        return;
      }

      setArticles(transformedArticles);
      setIsCachedData(false);
      hasShownFallbackNotice.current = false;

      // Persist to cache for offline / error fallback
      saveToCache(transformedArticles, countData || 0, filterKey);
    } catch (err) {
      console.error('Error fetching news articles:', err);

      // Attempt to serve cached data instead of showing empty page
      const filterKey = buildFilterKey({
        categories: categories as string[] | undefined,
        severities: severities as string[] | undefined,
        searchQuery,
        dateFilter,
        sortBy,
        page,
      });
      const cached = loadFromCache(filterKey);
      if (cached && cached.articles.length > 0) {
        setArticles(cached.articles);
        setTotalCount(cached.totalCount);
        setIsCachedData(true);
        console.info('Serving cached news data due to fetch error');
      } else {
        const staticFallback = getStaticFallback();
        if (staticFallback.total > 0) {
          setArticles(staticFallback.articles);
          setTotalCount(staticFallback.total);
          setIsCachedData(true);
          setError(null);

          if (!hasShownFallbackNotice.current) {
            hasShownFallbackNotice.current = true;
            toast({
              title: 'Using backup threat feed',
              description: 'Live feed is temporarily unavailable. Showing built-in threat intelligence data.',
            });
          }

          saveToCache(staticFallback.articles, staticFallback.total, filterKey);
        } else {
          setError(err instanceof Error ? err : new Error('Failed to fetch articles'));
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [categories, severities, searchQuery, dateFilter, sortBy, page, pageSize, getStaticFallback, toast]);

  const refreshFromRSS = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-rss-news');

      if (fetchError) {
        throw fetchError;
      }

      if (data?.success) {
        toast({
          title: 'News Updated',
          description: `Found ${data.articlesFound} articles, ${data.articlesInserted} new.`,
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

  const refreshFromWeb3 = useCallback(async () => {
    try {
      setIsRefreshingWeb3(true);
      
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-web3-incidents');

      if (fetchError) {
        throw fetchError;
      }

      if (data?.success) {
        toast({
          title: 'Web3 Incidents Updated',
          description: `Found ${data.incidentsFound} incidents, ${data.incidentsInserted} new.`,
        });
        await fetchArticles();
      } else {
        throw new Error(data?.error || 'Failed to fetch Web3 incidents');
      }
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
    web3Incidents: articles.filter(a => a.category === 'web3-security' || a.category === 'defi-exploits').length,
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
    refreshFromWeb3,
    summarizeArticles,
    isRefreshing,
    isRefreshingWeb3,
    isSummarizing,
    stats,
    pagination,
  };
}
