import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewsArticle, NewsCategory, SeverityLevel } from '@/types/news';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const { 
    categories, 
    severities, 
    searchQuery, 
    dateFilter = 'all', 
    sortBy = 'date', 
    page = 1, 
    pageSize = 20 
  } = options;

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
        
        setArticles(transformedArticles);
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

      setArticles(transformedArticles);
    } catch (err) {
      console.error('Error fetching news articles:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch articles'));
    } finally {
      setIsLoading(false);
    }
  }, [categories, severities, searchQuery, dateFilter, sortBy, page, pageSize]);

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
