import { NewsArticle } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Clock, AlertTriangle, Info, Zap, Share, Bookmark, Home, Newspaper, ChevronRight, Loader2, RadioTower } from 'lucide-react';
import { newsCategoryConfig } from '@/data/newsData';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useRelatedArticles } from '@/hooks/useRelatedArticles';
import quillMonitorAsset from '@/assets/powered-by-quillmonitor.svg.asset.json';
import { openExternalUrl, safeExternalUrl } from '@/utils/safeUrl';
import { isPreliminaryQuillMonitorArticle, isQuillMonitorArticle, isWeb3Incident } from '@/utils/newsIncident';

interface StoredBookmark {
  id: string;
  title: string;
  timestamp: string;
}

interface NewsDetailProps {
  article: NewsArticle;
  onBack: () => void;
  onArticleClick?: (article: NewsArticle) => void;
}

export const NewsDetail = ({ article, onBack, onArticleClick }: NewsDetailProps) => {
  const categoryInfo = newsCategoryConfig[article.category];
  const isQuillMonitor = isQuillMonitorArticle(article);
  const isPreliminary = isPreliminaryQuillMonitorArticle(article);
  const web3Incident = isWeb3Incident(article);
  const providerIncidentDate = isQuillMonitor && /^\d{4}-\d{2}-\d{2}$/.test(article.metadata?.incident_date || '')
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeZone: 'UTC' })
        .format(new Date(`${article.metadata?.incident_date}T00:00:00.000Z`))
    : null;
  const { toast } = useToast();
  
  const { relatedArticles, isLoading: isLoadingRelated } = useRelatedArticles({
    currentArticleId: article.id,
    category: article.category,
    tags: article.tags,
    limit: 4
  });
  
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
    const shareUrl = `https://www.digibastion.com/threat-intel/${encodeURIComponent(article.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: shareUrl,
        });
      } catch (err) {
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Article link copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard",
      });
    }
  };

  const handleBookmark = () => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
      const bookmarks: StoredBookmark[] = Array.isArray(parsed)
        ? parsed.filter((item): item is StoredBookmark =>
            typeof item === 'object' && item !== null && typeof item.id === 'string',
          )
        : [];
      const isBookmarked = bookmarks.some((bookmark) => bookmark.id === article.id);

      if (isBookmarked) {
        const updated = bookmarks.filter((bookmark) => bookmark.id !== article.id);
        localStorage.setItem('newsBookmarks', JSON.stringify(updated));
        toast({ title: 'Bookmark removed', description: 'Article removed from bookmarks' });
      } else {
        bookmarks.push({ id: article.id, title: article.title, timestamp: new Date().toISOString() });
        localStorage.setItem('newsBookmarks', JSON.stringify(bookmarks));
        toast({ title: 'Bookmarked!', description: 'Article saved to bookmarks' });
      }
    } catch {
      toast({
        title: 'Bookmark unavailable',
        description: 'Your browser did not allow this bookmark to be saved.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link to="/" aria-label="Home" className="inline-flex rounded p-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Home className="w-4 h-4" aria-hidden="true" />
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link to="/threat-intel" className="hover:text-foreground">Threat Intelligence</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="text-foreground truncate max-w-[200px]" aria-current="page">{article.title}</li>
        </ol>
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
            {web3Incident && (
              <Badge variant="secondary" className="gap-1">
                <RadioTower className="h-3 w-3" aria-hidden="true" />
                Web3 Incident
              </Badge>
            )}
            {isPreliminary && (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                Preliminary
              </Badge>
            )}
            {article.cveId && (
              <Badge variant="destructive">
                {article.cveId}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight mb-4">
            {article.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {providerIncidentDate ? (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Incident date {providerIncidentDate}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Published {formatDistanceToNow(article.publishedAt, { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>•</span>
                  <span>{format(article.publishedAt, 'PPP')}</span>
                </div>
              </>
            )}
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
          {web3Incident && (article.metadata?.project_name || article.metadata?.chain || article.metadata?.attack_type || article.metadata?.amount_display) && (
            <div className="border-y py-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {article.metadata?.project_name && <div><div className="text-xs text-muted-foreground">Affected project</div><div className="font-medium">{article.metadata.project_name}</div></div>}
                {article.metadata?.chain && <div><div className="text-xs text-muted-foreground">Chain</div><div className="font-medium">{article.metadata.chain}</div></div>}
                {article.metadata?.attack_type && <div><div className="text-xs text-muted-foreground">Attack method</div><div className="font-medium">{article.metadata.attack_type}</div></div>}
                {article.metadata?.amount_display && <div><div className="text-xs text-muted-foreground">Reported loss</div><div className="font-medium">{article.metadata.amount_display}</div></div>}
              </div>
            </div>
          )}

          {isQuillMonitor && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground">Incident data provided by</span>
              <a
                href={safeExternalUrl(article.metadata?.attribution_url) || 'https://www.quillaudits.com/web3-hacks-database'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Powered by QuillMonitor; view this incident in the QuillMonitor database"
                className="inline-flex rounded bg-card p-2 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <img src={quillMonitorAsset.url} width="244" height="44" alt="Powered by QuillMonitor" className="h-8 w-auto" />
              </a>
            </div>
          )}

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
          {isPreliminary ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                Preliminary report
              </h3>
              <p className="text-sm text-foreground/80">
                QuillMonitor verification is pending. Details, incident date, and reported loss may change; verify against the linked source before acting.
              </p>
            </div>
          ) : article.severity === 'critical' && !isQuillMonitor ? (
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
          ) : null}

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

          {/* Source Links - use article.link as the primary source */}
          {(article.link || article.sourceUrl) && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                Original Source
              </h3>
              {(() => {
                // First check if sourceUrl is a JSON array (for web3 incidents with multiple sources)
                let sources: { url: string; label: string }[] = [];
                
                if (article.sourceUrl) {
                  try {
                    const parsed = JSON.parse(article.sourceUrl);
                    if (Array.isArray(parsed)) {
                      sources = parsed.flatMap((source): { url: string; label: string }[] => {
                        if (typeof source !== 'object' || source === null) return [];
                        const candidate = source as Record<string, unknown>;
                        const url = safeExternalUrl(candidate.url);
                        if (!url) return [];
                        return [{
                          url,
                          label: typeof candidate.label === 'string' ? candidate.label : new URL(url).hostname,
                        }];
                      });
                    }
                  } catch {
                    // Not JSON - sourceUrl is just the RSS feed URL, use article.link instead
                  }
                }
                
                // If no JSON sources found, use the article's direct link
                const primaryLink = safeExternalUrl(article.link);
                if (sources.length === 0 && primaryLink) {
                  try {
                    const hostname = new URL(primaryLink).hostname.replace('www.', '');
                    sources = [{ url: primaryLink, label: article.sourceName || hostname }];
                  } catch {
                    // Invalid links are intentionally omitted.
                  }
                }
                
                return (
                  <div className="flex flex-col gap-2">
                    {sources.map((source, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 text-left"
                        onClick={() => openExternalUrl(source.url)}
                      >
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{source.label || (() => { try { return new URL(source.url).hostname; } catch { return 'Source'; } })()}</span>
                      </Button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Articles Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            Related Security News
          </CardTitle>
          <CardDescription>
            Similar articles based on category and tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRelated ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : relatedArticles.length > 0 ? (
            <div className="space-y-3">
              {relatedArticles.map((related) => {
                const relatedCategoryInfo = newsCategoryConfig[related.category];
                const openRelated = () => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onArticleClick?.(related);
                };
                return (
                  <div
                    key={related.id}
                    className="group p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-all"
                    onClick={openRelated}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge 
                            variant="outline"
                            className={`text-xs ${
                              related.severity === 'critical' ? 'border-red-500/50 text-red-400' :
                              related.severity === 'high' ? 'border-orange-500/50 text-orange-400' :
                              'border-muted'
                            }`}
                          >
                            {related.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {relatedCategoryInfo?.name || related.category}
                          </Badge>
                          {isPreliminaryQuillMonitorArticle(related) && (
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                              Preliminary
                            </Badge>
                          )}
                          {isQuillMonitorArticle(related) && (
                            <a
                              href={safeExternalUrl(related.metadata?.attribution_url) || 'https://www.quillaudits.com/web3-hacks-database'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline underline-offset-2"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              Powered by QuillMonitor
                            </a>
                          )}
                        </div>
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          <button
                            type="button"
                            className="text-left"
                            onClick={(event) => {
                              event.stopPropagation();
                              openRelated();
                            }}
                          >
                            {related.title}
                          </button>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {related.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDistanceToNow(related.publishedAt, { addSuffix: true })}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Newspaper className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No related articles found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
