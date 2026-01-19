import { Link } from 'react-router-dom';
import { articlesMeta, ArticleMeta } from '@/data/articlesData';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RelatedArticlesProps {
  currentSlug: string;
  category: string;
  tags: string[];
  limit?: number;
}

// Get related articles based on category and tag overlap
export const getRelatedArticles = (
  currentSlug: string,
  category: string,
  tags: string[],
  limit: number = 4
): ArticleMeta[] => {
  // Score articles by relevance
  const scoredArticles = articlesMeta
    .filter(article => article.slug !== currentSlug)
    .map(article => {
      let score = 0;
      
      // Same category = high score
      if (article.category === category) {
        score += 10;
      }
      
      // Tag overlap scoring
      const tagOverlap = tags.filter(tag => 
        article.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      ).length;
      score += tagOverlap * 3;
      
      // Bonus for featured articles
      if (article.featured) {
        score += 2;
      }
      
      return { article, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.article);

  // If not enough related articles, fill with same category
  if (scoredArticles.length < limit) {
    const additional = articlesMeta
      .filter(a => 
        a.slug !== currentSlug && 
        a.category === category &&
        !scoredArticles.find(s => s.slug === a.slug)
      )
      .slice(0, limit - scoredArticles.length);
    scoredArticles.push(...additional);
  }

  return scoredArticles;
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'intermediate':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'advanced':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const RelatedArticles = ({ currentSlug, category, tags, limit = 4 }: RelatedArticlesProps) => {
  const relatedArticles = getRelatedArticles(currentSlug, category, tags, limit);

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-8 border-t border-border/50" aria-labelledby="related-articles">
      <h2 id="related-articles" className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        Related Security Guides
      </h2>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {relatedArticles.map((article) => (
          <Link 
            key={article.slug}
            to={`/articles/${article.slug}`}
            className="block group"
          >
            <article className="h-full bg-card rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {article.category}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getDifficultyColor(article.difficulty)}`}>
                  {article.difficulty}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 text-sm">
                {article.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {article.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readTime}
                </div>
                <span className="text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
};
