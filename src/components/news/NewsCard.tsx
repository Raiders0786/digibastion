import { NewsArticle } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Clock, AlertTriangle, Info, Zap, Sparkles, RadioTower } from 'lucide-react';
import { newsCategoryConfig } from '@/data/newsData';
import { formatDistanceToNow } from 'date-fns';

interface NewsCardProps {
  article: NewsArticle;
  onClick?: () => void;
}

export const NewsCard = ({ article, onClick }: NewsCardProps) => {
  const categoryInfo = newsCategoryConfig[article.category];
  const isQuillMonitor = article.metadata?.provider === 'quillmonitor' || article.sourceName === 'QuillMonitor';
  const isWeb3Incident = isQuillMonitor || article.metadata?.is_web3_incident === true || ['web3-incidents', 'web3'].includes(article.metadata?.provider || '') || typeof article.metadata?.data_source === 'string';
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
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

  return (
    <Card 
      className={`news-card cursor-pointer group ${getSeverityClass(article.severity)}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={categoryInfo.color}>
              {categoryInfo.name}
            </Badge>
            <Badge variant="outline" className={getSeverityColor(article.severity)}>
              {getSeverityIcon(article.severity)}
              <span className="ml-1 capitalize">{article.severity}</span>
            </Badge>
            {isWeb3Incident && (
              <Badge variant="secondary" className="gap-1">
                <RadioTower className="w-3 h-3" />
                Web3 Incident
              </Badge>
            )}
            {isQuillMonitor && (
              <Badge variant="outline" className="gap-1 border-primary/40 bg-primary/10 text-primary">
                <RadioTower className="w-3 h-3" />
                QuillMonitor
              </Badge>
            )}
          </div>
          {article.sourceUrl && (
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
        
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
          {article.title}
        </CardTitle>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(article.publishedAt, { addSuffix: true })}
          </div>
          {article.author && (
            <span>by {article.author}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3">
          {article.isProcessed && article.summary && article.summary.length > 50 && (
            <Badge variant="outline" className="mb-2 text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Summary
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

        {isWeb3Incident && (article.metadata?.project_name || article.metadata?.chain || article.metadata?.attack_type || article.metadata?.amount_display) && (
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            {article.metadata?.project_name && <div><span className="text-muted-foreground">Project</span><div className="font-medium truncate">{article.metadata.project_name}</div></div>}
            {article.metadata?.chain && <div><span className="text-muted-foreground">Chain</span><div className="font-medium truncate">{article.metadata.chain}</div></div>}
            {article.metadata?.attack_type && <div><span className="text-muted-foreground">Attack</span><div className="font-medium truncate">{article.metadata.attack_type}</div></div>}
            {article.metadata?.amount_display && <div><span className="text-muted-foreground">Reported loss</span><div className="font-medium">{article.metadata.amount_display}</div></div>}
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