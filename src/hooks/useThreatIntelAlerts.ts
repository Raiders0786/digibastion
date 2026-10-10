import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { NewsArticle } from '@/types/news';
import { mapPublishableNewsArticleRows } from '@/lib/threatIntel/articleRow';
import {
  ALERTS_PAGE_SIZE,
  buildAlertQueryParams,
  parseThreatIntelStats,
  type ThreatIntelFilterParams,
  type ThreatIntelFilterInput,
} from '@/lib/threatIntel/query';

interface UseThreatIntelAlertsOptions {
  /** The same scope and filters as the feed; severity is narrowed to critical/high. */
  filters: ThreatIntelFilterInput;
  page: number;
  /** Only query while the Alerts tab is open. */
  enabled: boolean;
}

export interface UseThreatIntelAlertsResult {
  alerts: NewsArticle[];
  totalCount: number;
  criticalCount: number;
  highCount: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY_COUNTS = { total: 0, critical: 0, high: 0 };
const LOAD_ERROR = 'Active alerts could not be loaded.';

export function useThreatIntelAlerts({ filters, page, enabled }: UseThreatIntelAlertsOptions): UseThreatIntelAlertsResult {
  const [alerts, setAlerts] = useState<NewsArticle[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  // Callers rebuild the filters object on every render; key on its contents.
  const filtersKey = JSON.stringify(filters);
  const stableFilters = useMemo(() => JSON.parse(filtersKey) as ThreatIntelFilterInput, [filtersKey]);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    const requestId = ++latestRequest.current;
    const isCurrent = () => requestId === latestRequest.current;

    const query = buildAlertQueryParams(stableFilters, page);
    if (!query) {
      setAlerts([]);
      setCounts(EMPTY_COUNTS);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [listResult, statsResult] = await Promise.all([
        supabase.rpc('search_news_articles', query.search),
        (supabase.rpc as unknown as (
          name: 'threat_intel_stats', args: ThreatIntelFilterParams
        ) => ReturnType<typeof supabase.rpc>)('threat_intel_stats', query.filter),
      ]);
      if (!isCurrent()) return;

      if (listResult.error) {
        console.error('Failed to fetch active alerts:', listResult.error);
        setAlerts([]);
        setCounts(EMPTY_COUNTS);
        setError(LOAD_ERROR);
        return;
      }

      const rows = Array.isArray(listResult.data) ? listResult.data : [];
      const pageAlerts = mapPublishableNewsArticleRows(rows);
      const stats = statsResult.error ? null : parseThreatIntelStats(statsResult.data);
      setAlerts(pageAlerts);
      setCounts(stats
        ? { total: stats.total, critical: stats.critical, high: stats.high }
        : {
          total: query.search.result_offset + rows.length + (rows.length === ALERTS_PAGE_SIZE ? 1 : 0),
          critical: pageAlerts.filter((alert) => alert.severity === 'critical').length,
          high: pageAlerts.filter((alert) => alert.severity === 'high').length,
        });
    } catch (alertsError) {
      if (!isCurrent()) return;
      console.error('Failed to fetch active alerts:', alertsError);
      setAlerts([]);
      setCounts(EMPTY_COUNTS);
      setError(LOAD_ERROR);
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [enabled, stableFilters, page]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    alerts,
    totalCount: counts.total,
    criticalCount: counts.critical,
    highCount: counts.high,
    totalPages: Math.max(1, Math.ceil(counts.total / ALERTS_PAGE_SIZE)),
    isLoading,
    error,
    refetch,
  };
}
