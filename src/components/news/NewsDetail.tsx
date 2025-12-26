import { NewsArticle } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Clock, AlertTriangle, Info, Zap, Share, Bookmark, Home, Newspaper } from 'lucide-react';
import { newsCategoryConfig } from '@/data/newsData';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface NewsDetailProps {
  article: NewsArticle;
  onBack: () => void;
}

export const NewsDetail = ({ article, onBack }: NewsDetailProps) => {
  const categoryInfo = newsCategoryConfig[article.category];
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <Zap className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'severity-critical';
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return 'glass-card';
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Article link copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard",
      });
    }
  };

  const handleBookmark = () => {
    // Store in localStorage for now
    const bookmarks = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
    const isBookmarked = bookmarks.some((b: any) => b.id === article.id);
    
    if (isBookmarked) {
      const updated = bookmarks.filter((b: any) => b.id !== article.id);
      localStorage.setItem('newsBookmarks', JSON.stringify(updated));
      toast({
        title: "Bookmark removed",
        description: "Article removed from bookmarks",
      });
    } else {
      bookmarks.push({ id: article.id, title: article.title, timestamp: new Date().toISOString() });
      localStorage.setItem('newsBookmarks', JSON.stringify(bookmarks));
      toast({
        title: "Bookmarked!",
        description: "Article saved to bookmarks",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="h-auto p-1 hover:text-foreground"
        >
          <Home className="w-4 h-4" />
        </Button>
        <span>/</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/news')}
          className="h-auto p-1 hover:text-foreground"
        >
          Threat Intel
        </Button>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
      </nav>

      {/* Header with Back Button */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to News Feed
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="w-4 h-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleBookmark}>
            <Bookmark className="w-4 h-4 mr-1" />
            Bookmark
          </Button>
        </div>
      </div>

      {/* Main Article Card */}
      <Card className={`${getSeverityClass(article.severity)} glow`}>
        <CardHeader className="pb-4">
          {/* Category and Severity Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge variant="outline" className={categoryInfo.color}>
              {categoryInfo.name}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {getSeverityIcon(article.severity)}
              <span className="capitalize">{article.severity}</span>
            </Badge>
            {article.cveId && (
              <Badge variant="destructive">
                {article.cveId}
              </Badge>
            )}
          </div>

          {/* Title */}
          <CardTitle className="text-2xl md:text-3xl leading-tight mb-4">
            {article.title}
          </CardTitle>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Published {formatDistanceToNow(article.publishedAt, { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>{format(article.publishedAt, 'PPP')}</span>
            </div>
            {article.author && (
              <>
                <span>•</span>
                <span>by {article.author}</span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-foreground/80 leading-relaxed">
              {article.summary}
            </p>
          </div>

          {/* Affected Technologies */}
          {article.affectedTechnologies && article.affectedTechnologies.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Affected Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.affectedTechnologies.map((tech) => (
                  <Badge key={tech} variant="secondary" className="px-3 py-1">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Full Content */}
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <h3 className="font-semibold mb-3">Full Report</h3>
            <div className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {article.content}
            </div>
          </div>

          {/* Action Items */}
          {article.severity === 'critical' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h3 className="font-semibold mb-2 text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Immediate Action Required
              </h3>
              <ul className="text-sm text-foreground/80 space-y-1 ml-4">
                <li>• Update affected software immediately</li>
                <li>• Review your systems for potential compromise</li>
                <li>• Monitor for unusual activity</li>
                <li>• Consider temporary isolation of affected systems</li>
              </ul>
            </div>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="px-2 py-1 text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* External Source */}
          {article.sourceUrl && (
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(article.sourceUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Read Original Source
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Articles Section (placeholder) */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Related Security News</CardTitle>
          <CardDescription>
            Similar articles you might be interested in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Related articles will appear here once the news aggregation system is implemented.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};