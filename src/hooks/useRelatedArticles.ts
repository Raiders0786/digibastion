import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { NewsArticle, NewsCategory } from '@/types/news';
import { mapPublishableNewsArticleRows, NEWS_ARTICLE_COLUMNS } from '@/lib/threatIntel/articleRow';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';

interface UseRelatedArticlesOptions {
  currentArticleId: string;
  category: NewsCategory;
  tags: string[];
  limit?: number;
}

const TAG_SEPARATOR = '\u0000';

export function useRelatedArticles({
  currentArticleId,
  category,
  tags,
  limit = 4,
}: UseRelatedArticlesOptions) {
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Key on tag contents so a new array with the same tags does not refetch.
  const tagsKey = tags.map((tag) => tag.toLowerCase()).join(TAG_SEPARATOR);

  useEffect(() => {
    let cancelled = false;
    const wantedTags = tagsKey ? tagsKey.split(TAG_SEPARATOR) : [];

    const fetchRelatedArticles = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from('news_articles')
          .select(NEWS_ARTICLE_COLUMNS)
          .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
          .eq('category', category)
          .neq('id', currentArticleId)
          .order('published_at', { ascending: false })
          .limit(limit + 5); // Fetch extra to allow for scoring

        if (error) throw error;
        if (cancelled) return;

        const scored = mapPublishableNewsArticleRows(data).map((article) => ({
          article,
          score: wantedTags.filter((tag) => article.tags.some((articleTag) => articleTag.toLowerCase() === tag)).length,
        }));

        // Higher tag overlap first, then newest first.
        scored.sort((a, b) => (
          b.score - a.score || b.article.publishedAt.getTime() - a.article.publishedAt.getTime()
        ));

        setRelatedArticles(scored.slice(0, limit).map((entry) => entry.article));
      } catch (err) {
        console.error('Error fetching related articles:', err);
        if (!cancelled) setRelatedArticles([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    if (currentArticleId && category) {
      void fetchRelatedArticles();
    } else {
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [currentArticleId, category, tagsKey, limit]);

  return { relatedArticles, isLoading };
}
