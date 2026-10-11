import { NewsArticle } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Clock, AlertTriangle, Bookmark, Home, Newspaper, ChevronRight, Loader2, RadioTower, LifeBuoy, History, BellRing, Send, Undo2 } from 'lucide-react';
import { getCategoryConfig, getSeverityStyle } from '@/lib/threatIntel/taxonomy';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useRelatedArticles } from '@/hooks/useRelatedArticles';
import quillMonitorAsset from '@/assets/powered-by-quillmonitor.svg.asset.json';
import { openExternalUrl, safeExternalUrl } from '@/utils/safeUrl';
import {
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
  isSlowMistArticle,
  isWeb3Incident,
  isWeb3SecurityDomain,
  SLOWMIST_ATTRIBUTION_URL,
} from '@/utils/newsIncident';
import { getNewsSourceLinks } from '@/utils/newsSources';
import { getIncidentDisplay, getProviderLabel, getStatusHistory } from '@/lib/threatIntel/incidentDisplay';
import {
  buildSubscribeHref,
  CHAINABUSE_URL,
  CISA_KEV_URL,
  nvdCveUrl,
  REVOKE_CASH_URL,
  SEAL_911_URL,
  TELEGRAM_CHANNEL_URL,
} from '@/lib/threatIntel/officialLinks';
import { VerificationBadge } from '@/components/news/VerificationBadge';
import { TELEGRAM_CHANNEL_SUMMARY } from '@/lib/threatIntel/channelCopy';
import { buildIncidentAnswer } from '../../../supabase/functions/_shared/incident-answer';
import { sourceLabelFor } from '../../../supabase/functions/_shared/attribution';
import { shareTextForIncident, SHARE_TEXT_LIMIT } from '../../../supabase/functions/_shared/share-links';
import { canonicalIncidentUrl } from '../../../supabase/functions/_shared/site-urls';
import { truncateAtWord } from '../../../supabase/functions/_shared/summary-text';
import { incidentSeoInputFromArticle } from '@/seo/incidentMeta';
import { ShareBar } from '@/components/share/ShareBar';

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
  const categoryInfo = getCategoryConfig(article.category);
  const severityStyle = getSeverityStyle(article.severity);
  const SeverityIcon = severityStyle.icon;
  const isQuillMonitor = isQuillMonitorArticle(article);
  const isSlowMist = isSlowMistArticle(article);
  const web3Incident = isWeb3Incident(article);
  const display = getIncidentDisplay(article);
  const statusHistory = getStatusHistory(article);
  const isUnconfirmed = display.verification === 'unconfirmed';
  const providerLabel = getProviderLabel(article) ?? 'The source';
  const slowMistAttributionUrl = isSlowMist
    ? safeExternalUrl(article.metadata?.attribution_url) || SLOWMIST_ATTRIBUTION_URL
    : null;
  const originalSources = getNewsSourceLinks(article, slowMistAttributionUrl);
  const duplicateProviderAuthor = isSlowMist && article.author?.toLowerCase().includes('slowmist');
  const showWeb3Actions = web3Incident || isWeb3SecurityDomain(article);
  // The same answer-first sentence the meta description and prerender use.
  const seoInput = incidentSeoInputFromArticle(article);
  const incidentAnswer = web3Incident ? buildIncidentAnswer(seoInput) : null;
  const shareUrl = canonicalIncidentUrl(article.id);
  const shareSource = `Source: ${sourceLabelFor(seoInput)}.`;
  const shareText = web3Incident
    ? shareTextForIncident(seoInput)
    : `${truncateAtWord(article.title, SHARE_TEXT_LIMIT - shareSource.length - 1)} ${shareSource}`;
  const showVulnerabilityActions = Boolean(article.cveId) || article.category === 'vulnerability-disclosure';
  const subscribeHref = buildSubscribeHref({
    categories: [article.category],
    scope: web3Incident ? 'web3-incidents' : 'all',
  });
  const { toast } = useToast();
  
  const { relatedArticles, isLoading: isLoadingRelated } = useRelatedArticles({
    currentArticleId: article.id,
    category: article.category,
    tags: article.tags,
    limit: 4
  });
  
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
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <ShareBar compact url={shareUrl} title={article.title} text={shareText} campaign="share_incident" />
          <Button variant="outline" size="sm" onClick={handleBookmark}>
            <Bookmark className="w-4 h-4 mr-1" />
            Bookmark
          </Button>
        </div>
      </div>

      {/* Main Article Card */}
      <Card className={`${severityStyle.cardClass} glow`}>
        <CardHeader className="pb-4">
          {/* Category and Severity Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge variant="outline" className={categoryInfo.color}>
              {categoryInfo.name}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <SeverityIcon className={`w-5 h-5 ${severityStyle.iconClass}`} aria-hidden="true" />
              <span>{severityStyle.label}</span>
            </Badge>
            {web3Incident && (
              <Badge variant="secondary" className="gap-1">
                <RadioTower className="h-3 w-3" aria-hidden="true" />
                Web3 Incident
              </Badge>
            )}
            {display.verification && (
              <VerificationBadge verification={display.verification} help={display.verificationHelp} />
            )}
            {display.fundsReturned && (
              <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                <Undo2 className="h-3 w-3" aria-hidden="true" />
                Funds returned
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
          {incidentAnswer && (
            <p data-testid="incident-answer" className="mb-4 text-base leading-relaxed text-foreground/90">
              {incidentAnswer}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {web3Incident ? (
              <>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>{display.incidentDateLabel ?? 'Incident date unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span aria-hidden="true">•</span>
                  <span>{display.addedDateLabel}</span>
                </div>
              </>
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
            {article.author && !duplicateProviderAuthor && (
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
            <h2 id="what-happened" className="font-semibold mb-2">{display.summaryLabel ?? 'Summary'}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {article.summary}
            </p>
          </div>

          {/* Affected Technologies */}
          {web3Incident && (article.metadata?.project_name || article.metadata?.chain || article.metadata?.attack_type || display.lossLabel) && (
            <div className="border-y py-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {article.metadata?.project_name && <div><div className="text-xs text-muted-foreground">Affected project</div><div className="font-medium">{article.metadata.project_name}</div></div>}
                {article.metadata?.chain && <div><div className="text-xs text-muted-foreground">Chain</div><div className="font-medium">{article.metadata.chain}</div></div>}
                {article.metadata?.attack_type && <div><div className="text-xs text-muted-foreground">Attack method</div><div className="font-medium">{article.metadata.attack_type}</div></div>}
                {display.lossLabel && <div><div className="text-xs text-muted-foreground">Loss</div><div className="font-medium">{display.lossLabel}</div></div>}
              </div>
            </div>
          )}

          {isQuillMonitor && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground">Incident data provided by</span>
              <a
                href={safeExternalUrl(article.metadata?.attribution_url) || 'https://www.quillaudits.com/web3-hacks-database'}
                target="_blank"
                rel="noopener"
                aria-label="Powered by QuillMonitor; view this incident in the QuillMonitor database"
                className="inline-flex rounded bg-card p-2 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <img src={quillMonitorAsset.url} width="244" height="44" alt="Powered by QuillMonitor" className="h-8 w-auto" />
              </a>
            </div>
          )}

          {isSlowMist && slowMistAttributionUrl && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground">Threat intelligence provided by</span>
              <a
                href={slowMistAttributionUrl}
                target="_blank"
                rel="noopener"
                className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Badge variant="outline" className="border-sky-500/30 bg-sky-500/5 text-sky-300">
                  SlowMist Hacked
                </Badge>
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
            <h2 id="details" className="font-semibold mb-3">Full Report</h2>
            <div className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {article.content}
            </div>
          </div>

          {/* Verification notice */}
          {isUnconfirmed && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Unconfirmed report
              </h3>
              <p className="text-sm text-foreground/80">
                {providerLabel} has not verified this incident yet. The details, incident date and loss figure may change, and some reports are withdrawn. Check the linked source before acting.
              </p>
            </div>
          )}

          {/* Next steps */}
          {(showWeb3Actions || showVulnerabilityActions) && (
            <section aria-labelledby="what-should-i-do" className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 id="what-should-i-do" className="mb-3 flex items-center gap-2 font-semibold">
                <LifeBuoy className="h-4 w-4 text-primary" aria-hidden="true" />
                What should I do?
              </h3>
              {showWeb3Actions && (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground/80">
                  <li>
                    Review your token approvals and revoke the ones you no longer use on{' '}
                    <a href={REVOKE_CASH_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Revoke.cash</a>.
                  </li>
                  <li>
                    Check an address before you send funds to it, or report a scam address, on{' '}
                    <a href={CHAINABUSE_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Chainabuse</a>.
                  </li>
                  <li>
                    If your team is under active attack, contact{' '}
                    <a href={SEAL_911_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">SEAL 911</a>.
                  </li>
                </ul>
              )}
              {showVulnerabilityActions && (
                <p className={`text-sm text-foreground/80 ${showWeb3Actions ? 'mt-3' : ''}`}>
                  For a software vulnerability, read the vendor&apos;s advisory first, then check the record on{' '}
                  <a href={nvdCveUrl(article.cveId)} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">NVD</a>{' '}
                  and whether it is listed in the{' '}
                  <a href={CISA_KEV_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">CISA Known Exploited Vulnerabilities catalog</a>.
                </p>
              )}
            </section>
          )}

          {/* Status history */}
          {statusHistory.length > 0 && (
            <section aria-labelledby="status-history">
              <h3 id="status-history" className="mb-3 flex items-center gap-2 font-semibold">
                <History className="h-4 w-4 text-primary" aria-hidden="true" />
                Status history
              </h3>
              <ol className="space-y-2 border-l border-border pl-4 text-sm">
                {statusHistory.map((entry) => (
                  <li key={entry.label}>
                    <span className="font-medium text-foreground">{entry.label}</span>
                    <span className="text-muted-foreground"> · {entry.detail}</span>
                  </li>
                ))}
              </ol>
            </section>
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

          {/* Source Links - use article.link as the primary source */}
          {originalSources.length > 0 && (
            <div className="pt-4 border-t">
              <h3 id="source" className="font-semibold mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                Original {originalSources.length === 1 ? 'Source' : 'Sources'}
              </h3>
              <div className="flex flex-col gap-2">
                {originalSources.map((source) => (
                  <Button
                    key={source.url}
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 text-left"
                    onClick={() => openExternalUrl(source.url)}
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{source.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Share this {web3Incident ? 'incident' : 'report'}</h3>
            <ShareBar url={shareUrl} title={article.title} text={shareText} campaign="share_incident" />
          </div>
        </CardContent>
      </Card>

      {/* Alerts like this */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" aria-hidden="true" />
            Get alerts like this
          </CardTitle>
          <CardDescription>
            Email alerts for {categoryInfo.name} {web3Incident ? 'incidents' : 'items'} that match the filters you pick.
            {web3Incident && ` ${TELEGRAM_CHANNEL_SUMMARY}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link to={subscribeHref}>
              <BellRing className="w-4 h-4 mr-2" aria-hidden="true" />
              Get email alerts
            </Link>
          </Button>
          {web3Incident && (
            <Button asChild variant="outline">
              <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                <Send className="w-4 h-4 mr-2" aria-hidden="true" />
                Join @digibastion on Telegram
              </a>
            </Button>
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
                const relatedCategoryInfo = getCategoryConfig(related.category);
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
                            className={`text-xs ${getSeverityStyle(related.severity).outlineClass}`}
                          >
                            {related.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {relatedCategoryInfo.name}
                          </Badge>
                          {isPreliminaryQuillMonitorArticle(related) && (
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                              Unconfirmed
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
                          {isSlowMistArticle(related) && (
                            <a
                              href={safeExternalUrl(related.metadata?.attribution_url) || SLOWMIST_ATTRIBUTION_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Source: SlowMist Hacked"
                              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <Badge variant="outline" className="border-sky-500/30 bg-sky-500/5 text-sky-300">
                                Source · SlowMist Hacked
                              </Badge>
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
