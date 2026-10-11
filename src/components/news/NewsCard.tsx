import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { NewsArticle } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ExternalLink, RadioTower, Sparkles, Undo2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VerificationBadge } from '@/components/news/VerificationBadge';
import { getIncidentDisplay, type IncidentSourceLink } from '@/lib/threatIntel/incidentDisplay';
import { getCategoryConfig, getSeverityStyle } from '@/lib/threatIntel/taxonomy';
import { isQuillMonitorArticle, isSlowMistArticle, isWeb3Incident } from '@/utils/newsIncident';

interface NewsCardProps {
  article: NewsArticle;
  /**
   * Opens the article inside the current page on a plain left click.
   * Modified clicks (new tab, new window) fall through to the browser.
   */
  onClick?: () => void;
  /** Defaults to the canonical incident URL. */
  href?: string;
}

const MAX_CARD_SOURCES = 3;

export const getArticleHref = (articleId: string) => `/threat-intel/${encodeURIComponent(articleId)}`;

const isPlainLeftClick = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const renderSourceLink = (source: IncidentSourceLink) => (
  <a
    key={source.url}
    href={source.url ?? undefined}
    target="_blank"
    rel="noopener"
    className="pointer-events-auto relative z-10 inline-flex items-center gap-1 rounded-sm underline decoration-primary/50 underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
    {source.label}
    <ExternalLink className="h-3 w-3" aria-hidden="true" />
  </a>
);

export const NewsCard = ({ article, onClick, href }: NewsCardProps) => {
  const categoryInfo = getCategoryConfig(article.category);
  const severityStyle = getSeverityStyle(article.severity);
  const SeverityIcon = severityStyle.icon;
  const web3Incident = isWeb3Incident(article);
  const display = getIncidentDisplay(article);
  const unconfirmed = display.verification === 'unconfirmed';
  const duplicateProviderAuthor = isSlowMistArticle(article) && article.author?.toLowerCase().includes('slowmist');
  // QuillMonitor records always lead with "Powered by QuillMonitor"; other
  // sources follow. Decided by provider, not by the source label text.
  const quillMonitor = isQuillMonitorArticle(article);
  const quillMonitorSource = quillMonitor
    ? display.sources.find((source) => source.label === 'QuillMonitor')
    : undefined;
  const remainingSources = display.sources.filter((source) => source !== quillMonitorSource);
  const otherSources = remainingSources.slice(0, MAX_CARD_SOURCES);
  const hiddenSourceCount = remainingSources.length - otherSources.length;
  const metadata = article.metadata;

  const handleTitleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onClick || !isPlainLeftClick(event)) return;
    event.preventDefault();
    onClick();
  };

  // Stretched link: the title link's ::after overlay covers the card, so the
  // whole card is clickable while the DOM holds one link to the incident page.
  // The verification badge and the source links are siblings of the title and
  // sit above the overlay (relative z-10), so they keep their own clicks.
  // Unconfirmed items drop the severity glow so they do not read as confirmed.
  return (
    <Card
      className={`news-card group relative ${
        unconfirmed ? 'glass-card border-dashed border-amber-500/40' : severityStyle.cardClass
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={categoryInfo.color}>
            {categoryInfo.name}
          </Badge>
          <Badge
            variant="outline"
            className={`${severityStyle.badgeClass} ${unconfirmed ? 'border-dashed' : ''}`}
          >
            <SeverityIcon className={`w-4 h-4 ${severityStyle.iconClass}`} aria-hidden="true" />
            <span className="ml-1">{severityStyle.label}</span>
          </Badge>
          {web3Incident && (
            <Badge variant="secondary" className="gap-1">
              <RadioTower className="w-3 h-3" aria-hidden="true" />
              Web3 Incident
            </Badge>
          )}
          {display.verification && (
            <VerificationBadge
              verification={display.verification}
              help={display.verificationHelp}
              className="pointer-events-auto relative z-10"
            />
          )}
          {display.fundsReturned && (
            <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
              <Undo2 className="h-3 w-3" aria-hidden="true" />
              Funds returned
            </Badge>
          )}
        </div>

        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
          <Link
            to={href ?? getArticleHref(article.id)}
            onClick={handleTitleClick}
            className="text-inherit after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary"
          >
            {article.title}
          </Link>
        </CardTitle>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {web3Incident
              ? (display.incidentDateLabel ?? 'Incident date unknown')
              : `Published ${formatDistanceToNow(article.publishedAt, { addSuffix: true })}`}
          </span>
          {web3Incident && <span>{display.addedDateLabel}</span>}
          {article.author && !duplicateProviderAuthor && (
            <span>by {article.author}</span>
          )}
        </div>

        {(quillMonitor || otherSources.length > 0) && (
          <div className="pointer-events-none flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {quillMonitor && (
              <>
                <span>Powered by</span>
                {quillMonitorSource?.url ? renderSourceLink(quillMonitorSource) : <span>QuillMonitor</span>}
              </>
            )}
            {otherSources.length > 0 && (
              <span>{quillMonitor ? 'Also reported by:' : otherSources.length > 1 ? 'Sources:' : 'Source:'}</span>
            )}
            {otherSources.map((source) => (source.url ? renderSourceLink(source) : (
              <span key={`label:${source.label}`}>{source.label}</span>
            )))}
            {hiddenSourceCount > 0 && <span>+{hiddenSourceCount} more</span>}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3">
          {display.summaryLabel && (
            <Badge
              variant="outline"
              className={`mb-2 text-xs ${
                display.summaryLabel === 'AI summary'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : 'bg-muted/40 text-muted-foreground'
              }`}
            >
              {display.summaryLabel === 'AI summary' && <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />}
              {display.summaryLabel}
            </Badge>
          )}
          <CardDescription className="text-sm text-foreground/70 leading-relaxed">
            {article.summary}
          </CardDescription>
        </div>

        {article.affectedTechnologies && article.affectedTechnologies.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">Affected Technologies:</div>
            <div className="flex flex-wrap gap-1">
              {article.affectedTechnologies.slice(0, 3).map((tech) => (
                <Badge key={tech} variant="secondary" className="text-xs px-2 py-1">
                  {tech}
                </Badge>
              ))}
              {article.affectedTechnologies.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  +{article.affectedTechnologies.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {web3Incident && (metadata?.project_name || metadata?.chain || metadata?.attack_type || display.lossLabel) && (
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            {metadata?.project_name && <div><span className="text-muted-foreground">Project</span><div className="font-medium truncate">{metadata.project_name}</div></div>}
            {metadata?.chain && <div><span className="text-muted-foreground">Chain</span><div className="font-medium truncate">{metadata.chain}</div></div>}
            {metadata?.attack_type && <div><span className="text-muted-foreground">Attack</span><div className="font-medium truncate">{metadata.attack_type}</div></div>}
            {display.lossLabel && <div><span className="text-muted-foreground">Loss</span><div className="font-medium">{display.lossLabel}</div></div>}
          </div>
        )}

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-2 py-1 bg-muted/50">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
