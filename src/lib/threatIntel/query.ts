import type { NewsArticle, NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';
import { NEWS_CATEGORIES, SEVERITY_LEVELS, parseListParam, parseScope } from '@/lib/threatIntel/taxonomy';

export const DATE_FILTERS = ['all', '7d', '30d', '90d'] as const;
export type DateFilter = (typeof DATE_FILTERS)[number];

export const SORT_OPTIONS = ['date', 'severity'] as const;
export type SortBy = (typeof SORT_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const ALERTS_PAGE_SIZE = 20;
/** search_news_articles clamps result_limit to 100. */
export const MAX_PAGE_SIZE = 100;
export const ALERT_SEVERITIES: readonly SeverityLevel[] = ['critical', 'high'];

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_FILTER_DAYS: Record<Exclude<DateFilter, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };

/** Everything the Threat Intel URL can express. */
export interface ThreatIntelFilters {
  scope: ThreatIntelScope;
  categories: NewsCategory[];
  severities: SeverityLevel[];
  searchQuery: string;
  dateFilter: DateFilter;
  sortBy: SortBy;
  page: number;
  pageSize: number;
}

/** The filters that decide which rows match (no paging or ordering). */
export type ThreatIntelFilterInput = Pick<
  ThreatIntelFilters,
  'scope' | 'categories' | 'severities' | 'searchQuery' | 'dateFilter'
>;

/** Arguments of count_news_articles and threat_intel_stats. */
export interface ThreatIntelFilterParams {
  search_query: string | null;
  category_filter: NewsCategory[] | null;
  severity_filter: SeverityLevel[] | null;
  date_from: string | null;
  source_filter: string | null;
  web3_incidents_only: boolean;
}

/** Arguments of search_news_articles. */
export interface ThreatIntelSearchParams extends ThreatIntelFilterParams {
  result_limit: number;
  result_offset: number;
  /** Sent only for 'severity'; omitted for 'date' so date browsing works against the pre-migration function. */
  sort_by?: 'severity';
}

export interface ThreatIntelAlertQuery {
  search: ThreatIntelSearchParams;
  filter: ThreatIntelFilterParams;
}

/** Counts for the whole filtered result (threat_intel_stats), camelCased. */
export interface ThreatIntelStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  supplyChain: number;
  unconfirmed: number;
}

export const EMPTY_THREAT_INTEL_STATS: ThreatIntelStats = Object.freeze({
  total: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  info: 0,
  supplyChain: 0,
  unconfirmed: 0,
});

function positiveInteger(value: number, fallback: number): number {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function parseThreatIntelFilters(
  params: URLSearchParams,
  pageSize: number = DEFAULT_PAGE_SIZE,
): ThreatIntelFilters {
  const date = params.get('date') || '';
  const page = Number.parseInt(params.get('page') || '1', 10);
  return {
    scope: parseScope(params.get('scope')),
    categories: parseListParam(params.get('categories') || params.get('category'), NEWS_CATEGORIES),
    severities: parseListParam(params.get('severities') || params.get('severity'), SEVERITY_LEVELS),
    searchQuery: params.get('q') || '',
    dateFilter: (DATE_FILTERS as readonly string[]).includes(date) ? (date as DateFilter) : 'all',
    sortBy: params.get('sort') === 'severity' ? 'severity' : 'date',
    page: positiveInteger(page, 1),
    pageSize,
  };
}

export function dateFilterToIso(dateFilter: DateFilter, now: Date = new Date()): string | null {
  if (dateFilter === 'all') return null;
  return new Date(now.getTime() - DATE_FILTER_DAYS[dateFilter] * DAY_MS).toISOString();
}

export function buildThreatIntelFilterParams(
  filters: ThreatIntelFilterInput,
  now: Date = new Date(),
): ThreatIntelFilterParams {
  const searchQuery = filters.searchQuery.trim();
  return {
    search_query: searchQuery || null,
    category_filter: filters.categories.length > 0 ? [...filters.categories] : null,
    severity_filter: filters.severities.length > 0 ? [...filters.severities] : null,
    date_from: dateFilterToIso(filters.dateFilter, now),
    source_filter: null,
    web3_incidents_only: filters.scope === 'web3-incidents',
  };
}

export function buildThreatIntelQueryParams(
  filters: ThreatIntelFilters,
  now: Date = new Date(),
): ThreatIntelSearchParams {
  const pageSize = Math.min(positiveInteger(filters.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const page = positiveInteger(filters.page, 1);
  return {
    ...buildThreatIntelFilterParams(filters, now),
    result_limit: pageSize,
    result_offset: (page - 1) * pageSize,
    ...(filters.sortBy === 'severity' ? { sort_by: 'severity' as const } : {}),
  };
}

/**
 * Plain newest-first browsing of all news stays on the indexed direct table
 * query. Search, the Web3 scope, the Web3 umbrella category and severity sort
 * need the RPC (ranking, metadata predicates, server-side ORDER BY).
 */
export function requiresThreatIntelRpc(
  filters: Pick<ThreatIntelFilters, 'scope' | 'categories' | 'searchQuery' | 'sortBy'>,
): boolean {
  return filters.scope === 'web3-incidents'
    || filters.categories.includes('web3-security')
    || filters.searchQuery.trim() !== ''
    || filters.sortBy === 'severity';
}

/** Alerts are critical/high; a severity filter can narrow that but not widen it. */
export function resolveAlertSeverities(selected: readonly SeverityLevel[]): SeverityLevel[] {
  if (selected.length === 0) return [...ALERT_SEVERITIES];
  return ALERT_SEVERITIES.filter((severity) => selected.includes(severity));
}

/** Null when the active severity filter leaves no alert severity to show. */
export function buildAlertQueryParams(
  filters: ThreatIntelFilterInput,
  page: number,
  now: Date = new Date(),
): ThreatIntelAlertQuery | null {
  const severities = resolveAlertSeverities(filters.severities);
  if (severities.length === 0) return null;
  const alertFilters: ThreatIntelFilterInput = { ...filters, severities };
  return {
    search: buildThreatIntelQueryParams({
      ...alertFilters,
      sortBy: 'date',
      page,
      pageSize: ALERTS_PAGE_SIZE,
    }, now),
    filter: buildThreatIntelFilterParams(alertFilters, now),
  };
}

function toCount(value: unknown): number | null {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
}

/** Validate the jsonb returned by threat_intel_stats. */
export function parseThreatIntelStats(value: unknown): ThreatIntelStats | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const total = toCount(record.total);
  if (total === null) return null;
  const read = (key: string) => toCount(record[key]) ?? 0;
  return {
    total,
    critical: read('critical'),
    high: read('high'),
    medium: read('medium'),
    low: read('low'),
    info: read('info'),
    supplyChain: read('supply_chain'),
    unconfirmed: read('unconfirmed'),
  };
}

/** Fallback when threat_intel_stats is unavailable: counts for the loaded page only. */
export function computePageStats(articles: readonly NewsArticle[], total: number): ThreatIntelStats {
  const count = (predicate: (article: NewsArticle) => boolean) => articles.filter(predicate).length;
  return {
    total,
    critical: count((article) => article.severity === 'critical'),
    high: count((article) => article.severity === 'high'),
    medium: count((article) => article.severity === 'medium'),
    low: count((article) => article.severity === 'low'),
    info: count((article) => !['critical', 'high', 'medium', 'low'].includes(article.severity)),
    supplyChain: count((article) => article.category === 'supply-chain'),
    unconfirmed: count((article) => article.metadata?.verification_status === 'unverified'),
  };
}
