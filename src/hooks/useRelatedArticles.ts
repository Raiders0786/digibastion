import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewsArticle, NewsCategory, SeverityLevel } from '@/types/news';

interface UseRelatedArticlesOptions {
  currentArticleId: string;
  category: NewsCategory;
  tags: string[];
  limit?: number;
}

export function useRelatedArticles({
  currentArticleId,
  category,
  tags,
  limit = 4
}: UseRelatedArticlesOptions) {
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      try {
        setIsLoading(true);

        // Fetch articles from the same category, excluding the current one
        const { data, error } = await supabase
          .from('news_articles')
          .select('*')
          .eq('category', category)
          .neq('id', currentArticleId)
          .order('published_at', { ascending: false })
          .limit(limit + 5); // Fetch extra to allow for scoring

        if (error) throw error;

        if (!data || data.length === 0) {
          setRelatedArticles([]);
          return;
        }

        // Transform and score articles by tag overlap
        const scoredArticles = data.map((row: any) => {
          const articleTags = row.tags || [];
          const tagOverlap = tags.filter(t => 
            articleTags.some((at: string) => at.toLowerCase() === t.toLowerCase())
          ).length;

          return {
            article: {
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
              cveId: row.cve_id,
              isProcessed: row.is_processed || false,
              sourceName: row.source_name
            } as NewsArticle,
            score: tagOverlap
          };
        });

        // Sort by tag overlap score (higher is better), then by date
        scoredArticles.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime();
        });

        // Take the top N related articles
        setRelatedArticles(scoredArticles.slice(0, limit).map(s => s.article));
      } catch (err) {
        console.error('Error fetching related articles:', err);
        setRelatedArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentArticleId && category) {
      fetchRelatedArticles();
    }
  }, [currentArticleId, category, tags, limit]);

  return { relatedArticles, isLoading };
}
