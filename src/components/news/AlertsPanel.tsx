import { useMemo } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Clock, Home, Loader2, RefreshCw, Shield } from 'lucide-react';
import { AlertListSkeleton } from '@/components/news/NewsCardSkeleton';
import { VerificationBadge } from '@/components/news/VerificationBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getIncidentDisplay } from '@/lib/threatIntel/incidentDisplay';
import { QUILLMONITOR_DATABASE_URL } from '@/lib/threatIntel/officialLinks';
import { SEVERITY_STYLES } from '@/lib/threatIntel/taxonomy';
import type { NewsArticle } from '@/types/news';
import { isQuillMonitorArticle } from '@/utils/newsIncident';
import { safeExternalUrl } from '@/utils/safeUrl';

export const AUTO_REFRESH_OPTIONS = [
  { value: '0', label: 'Off' },
  { value: '30', label: '30s' },
  { value: '60', label: '1m' },
  { value: '300', label: '5m' },
];

export interface AlertsPanelProps {
  alerts: NewsArticle[];
  /** Critical alerts across every page; defaults to the count on this page. */
  criticalCount?: number;
  /** High alerts across every page; defaults to the count on this page. */
  highCount?: number;
  loading: boolean;
  error: string | null;
  /** Seconds between automatic refreshes; 0 turns it off. */
  autoRefreshInterval: number;
  onAutoRefreshIntervalChange: (seconds: number) => void;
  onRefresh: () => void;
  onSelectAlert: (alert: NewsArticle) => void;
  onNavigateHome: () => void;
  onNavigateFeed: () => void;
}

interface AlertRowProps {
  alert: NewsArticle;
  severityLabel: 'CRITICAL' | 'HIGH';
  severityBadgeClass: string;
  rowClass: string;
  showCve: boolean;
  onSelect: (alert: NewsArticle) => void;
}

function AlertRow({ alert, severityLabel, severityBadgeClass, rowClass, showCve, onSelect }: AlertRowProps) {
  const display = getIncidentDisplay(alert);
  const quillMonitor = isQuillMonitorArticle(alert);
  // QuillMonitor rows carry their own attribution; every other row names its source.
  const source = quillMonitor ? null : display.sources[0] ?? null;

  return (
    <div
      className={`p-4 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer ${rowClass}`}
      onClick={() => onSelect(alert)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className={severityBadgeClass}>{severityLabel}</Badge>
            {quillMonitor && (
              <a
                href={safeExternalUrl(alert.metadata?.attribution_url) || QUILLMONITOR_DATABASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline underline-offset-2"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                Powered by QuillMonitor
              </a>
            )}
            {source && (source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                Source: {source.label}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">Source: {source.label}</span>
            ))}
            {display.verification && (
              // The row is clickable; keep badge clicks from opening the alert.
              <span
                className="inline-flex"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <VerificationBadge verification={display.verification} help={display.verificationHelp} />
              </span>
            )}
            {showCve && alert.cveId && (
              <Badge variant="secondary">{alert.cveId}</Badge>
            )}
          </div>
          <h3 className="font-medium mb-1">
            <button
              type="button"
              className="text-left"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(alert);
              }}
            >
              {alert.title}
            </button>
          </h3>
          <p className="text-sm text-muted-foreground mb-3">{alert.summary}</p>
          <div className="flex flex-wrap gap-1">
            {alert.affectedTechnologies?.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {display.incidentDateLabel ?? format(new Date(alert.publishedAt), 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlertsPanel({
  alerts,
  criticalCount,
  highCount,
  loading,
  error,
  autoRefreshInterval,
  onAutoRefreshIntervalChange,
  onRefresh,
  onSelectAlert,
  onNavigateHome,
  onNavigateFeed,
}: AlertsPanelProps) {
  const criticalAlerts = useMemo(() => alerts.filter((alert) => alert.severity === 'critical'), [alerts]);
  const highAlerts = useMemo(() => alerts.filter((alert) => alert.severity === 'high'), [alerts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateHome}
            className="h-auto p-1 hover:text-foreground"
            aria-label="Home"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
          </Button>
          <span aria-hidden="true">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateFeed}
            className="h-auto p-1 hover:text-foreground"
          >
            Threat Intel
          </Button>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">Active Alerts</span>
        </nav>
        <div className="flex items-center gap-2">
          <Select
            value={autoRefreshInterval.toString()}
            onValueChange={(value) => onAutoRefreshIntervalChange(Number.parseInt(value, 10))}
          >
            <SelectTrigger className="w-24 h-8 text-xs" aria-label="Auto-refresh interval">
              <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              {AUTO_REFRESH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {autoRefreshInterval > 0 && (
            <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
              Auto-refresh: {AUTO_REFRESH_OPTIONS.find((option) => option.value === autoRefreshInterval.toString())?.label}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {loading && alerts.length === 0 && (
        <div data-testid="alerts-loading" aria-busy="true">
          <AlertListSkeleton count={3} />
        </div>
      )}

      {alerts.length > 0 && (
        // A refresh keeps the current rows on screen, dimmed and marked busy.
        <div
          data-testid="alerts-list"
          aria-busy={loading}
          className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}
        >
          {criticalAlerts.length > 0 && (
            <Card className="glass-card border-red-500/30 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                  Critical Alerts ({criticalCount ?? criticalAlerts.length})
                </CardTitle>
                <CardDescription>
                  Incidents with a reported loss of $50M or more, and news the publisher rated critical
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {criticalAlerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    severityLabel="CRITICAL"
                    severityBadgeClass={SEVERITY_STYLES.critical.solidBadgeClass}
                    rowClass="border border-red-500/20 bg-background/50"
                    showCve
                    onSelect={onSelectAlert}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {highAlerts.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" aria-hidden="true" />
                  High Priority Alerts ({highCount ?? highAlerts.length})
                </CardTitle>
                <CardDescription>Incidents with a reported loss of $10M or more or an attack type such as a private-key compromise, and news the publisher rated high</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {highAlerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    severityLabel="HIGH"
                    severityBadgeClass={SEVERITY_STYLES.high.solidBadgeClass}
                    rowClass="border bg-card"
                    showCve={false}
                    onSelect={onSelectAlert}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium mb-2">No alerts available</h3>
            <p className="text-muted-foreground mb-4">{error || 'No critical or high priority alerts are active.'}</p>
            <Button onClick={onRefresh}>Try Again</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
