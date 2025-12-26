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
  limit?: number;
}

interface UseNewsArticlesResult {
  articles: NewsArticle[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  refreshFromRSS: () => Promise<void>;
  isRefreshing: boolean;
  stats: {
    total: number;
    critical: number;
    high: number;
    supplyChain: number;
  };
}

export function useNewsArticles(options: UseNewsArticlesOptions = {}): UseNewsArticlesResult {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const { categories, severities, searchQuery, dateFilter = 'all', sortBy = 'date', limit = 100 } = options;

  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit);

      // Apply category filter
      if (categories && categories.length > 0) {
        query = query.in('category', categories);
      }

      // Apply severity filter
      if (severities && severities.length > 0) {
        query = query.in('severity', severities);
      }

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
        const cutoff = new Date(now.getTime() - daysMap[dateFilter] * 24 * 60 * 60 * 1000);
        query = query.gte('published_at', cutoff.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Transform database records to NewsArticle format
      let transformedArticles: NewsArticle[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content || row.summary || '',
        summary: row.summary || '',
        category: row.category as NewsCategory,
        tags: row.tags || [],
        severity: row.severity as SeverityLevel,
        sourceUrl: row.link,
        publishedAt: new Date(row.published_at),
        affectedTechnologies: row.affected_technologies || [],
        author: row.author || row.source_name,
        cveId: row.cve_id
      }));

      // Apply search filter (client-side for flexibility)
      if (searchQuery?.trim()) {
        const query = searchQuery.toLowerCase();
        transformedArticles = transformedArticles.filter(a =>
          a.title.toLowerCase().includes(query) ||
          a.summary.toLowerCase().includes(query) ||
          a.tags.some(t => t.toLowerCase().includes(query)) ||
          a.affectedTechnologies?.some(t => t.toLowerCase().includes(query))
        );
      }

      // Apply sorting
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
  }, [categories, severities, searchQuery, dateFilter, sortBy, limit]);

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

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Calculate stats
  const stats = {
    total: articles.length,
    critical: articles.filter(a => a.severity === 'critical').length,
    high: articles.filter(a => a.severity === 'high').length,
    supplyChain: articles.filter(a => a.category === 'supply-chain').length,
  };

  return {
    articles,
    isLoading,
    error,
    refetch: fetchArticles,
    refreshFromRSS,
    isRefreshing,
    stats,
  };
}
