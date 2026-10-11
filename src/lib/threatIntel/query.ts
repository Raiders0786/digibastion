import type { NewsArticle, NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';
import { DEFAULT_SCOPE, NEWS_CATEGORIES, SEVERITY_LEVELS, parseListParam, parseScope } from '@/lib/threatIntel/taxonomy';

export const DATE_FILTERS = ['all', '7d', '30d', '90d'] as const;
export type DateFilter = (typeof DATE_FILTERS)[number];

export const SORT_OPTIONS = ['date', 'severity'] as const;
export type SortBy = (typeof SORT_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const ALERTS_PAGE_SIZE = 20;
/** search_news_articles clamps result_limit to 100. */
export const MAX_PAGE_SIZE = 100;
export const ALERT_SEVERITIES: readonly SeverityLevel[] = ['critical', 'high'];

/** ?status= values. The words are the ones the methodology page and badges use. */
export const VERIFICATION_FILTERS = ['all', 'confirmed', 'unconfirmed'] as const;
export type VerificationFilter = (typeof VERIFICATION_FILTERS)[number];

/** ?source= values: one per ingestion provider, plus 'rss' for publisher feeds. */
export const SOURCE_FILTERS = ['quillmonitor', 'web3-incidents', 'slowmist', 'rss'] as const;
export type SourceFilter = (typeof SOURCE_FILTERS)[number];

/** Publisher RSS items are never Web3 incidents, so the Web3 view does not offer them. */
const WEB3_SCOPE_SOURCES: readonly SourceFilter[] = ['quillmonitor', 'web3-incidents', 'slowmist'];

/** metadata.verification_status written by the QuillMonitor importer. */
const VERIFICATION_STATUS: Record<Exclude<VerificationFilter, 'all'>, 'verified' | 'unverified'> = {
  confirmed: 'verified',
  unconfirmed: 'unverified',
};

/** Longest chain or attack-type value accepted from the URL or the facets RPC. */
export const MAX_FACET_VALUE_LENGTH = 64;
/** Most values of one free-text filter (?chain=, ?attack=) that the URL may carry. */
export const MAX_FACET_SELECTIONS = 10;
/** threat_intel_facets returns at most this many values per facet. */
export const MAX_FACET_OPTIONS = 15;

// Letters, digits, spaces and . & ( ) + ' / -. Excluding , % _ * " and \ keeps
// the PostgREST fallback filter (an exact ILIKE match) free of wildcards and
// quoting problems. threat_intel_facets applies the same rule in SQL.
const FACET_VALUE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .&()+'/-]*$/u;

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
  /** ?status=. Only the Web3 incidents view offers it; 'all' elsewhere. */
  verification: VerificationFilter;
  /** ?chain= (repeatable), lower-cased. Web3 incidents view only. */
  chains: string[];
  /** ?attack= (repeatable), lower-cased. Web3 incidents view only. */
  attackTypes: string[];
  /** ?source= (repeatable). */
  sources: SourceFilter[];
}

/** The filters that decide which rows match (no paging or ordering). */
export type ThreatIntelFilterInput = Pick<
  ThreatIntelFilters,
  | 'scope'
  | 'categories'
  | 'severities'
  | 'searchQuery'
  | 'dateFilter'
  | 'verification'
  | 'chains'
  | 'attackTypes'
  | 'sources'
>;

/** Arguments of count_news_articles and threat_intel_stats. */
export interface ThreatIntelFilterParams {
  search_query: string | null;
  category_filter: NewsCategory[] | null;
  severity_filter: SeverityLevel[] | null;
  date_from: string | null;
  source_filter: string | null;
  web3_incidents_only: boolean;
  // The four incident filters below are sent only when set. Leaving the keys
  // out keeps every request valid against the previous RPC signatures, so the
  // page keeps working if the frontend ships before migration 20261012090000.
  /** 'verified' or 'unverified' (metadata.verification_status). */
  verification_filter?: 'verified' | 'unverified';
  /** Lower-cased metadata.chain values. */
  chain_filter?: string[];
  /** Lower-cased metadata.attack_type values. */
  attack_type_filter?: string[];
  provider_filter?: SourceFilter[];
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

/** Trim and lower-case a chain or attack-type value; null when it is not acceptable. */
export function normalizeFacetValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === '' || normalized.length > MAX_FACET_VALUE_LENGTH) return null;
  return FACET_VALUE_PATTERN.test(normalized) ? normalized : null;
}

function parseFacetValues(values: readonly string[]): string[] {
  const result: string[] = [];
  for (const raw of values) {
    const value = normalizeFacetValue(raw);
    if (value && !result.includes(value)) result.push(value);
    if (result.length === MAX_FACET_SELECTIONS) break;
  }
  return result;
}

/** The ?source= values the given view offers. */
export function sourceFiltersForScope(scope: ThreatIntelScope): readonly SourceFilter[] {
  return scope === 'web3-incidents' ? WEB3_SCOPE_SOURCES : SOURCE_FILTERS;
}

/**
 * SlowMist ingestion is built but has no cron job until SlowMist approves
 * redistribution, so its chip would always return an empty feed. Flip this in
 * the same change that schedules fetch-slowmist-incidents.
 */
export const SLOWMIST_LIVE = false;

/**
 * Source chips to show. A source that is not live yet stays hidden unless the
 * URL already selects it, so a shared link can still be cleared.
 */
export function offeredSourceFilters(
  scope: ThreatIntelScope,
  selected: readonly SourceFilter[] = [],
  slowMistLive: boolean = SLOWMIST_LIVE,
): SourceFilter[] {
  return sourceFiltersForScope(scope)
    .filter((source) => source !== 'slowmist' || slowMistLive || selected.includes(source));
}

function parseSources(values: readonly string[], scope: ThreatIntelScope): SourceFilter[] {
  const allowed: readonly string[] = sourceFiltersForScope(scope);
  const result: SourceFilter[] = [];
  // ?source=a&source=b is canonical; ?source=a,b is accepted for hand-written links.
  for (const raw of values.flatMap((value) => value.split(','))) {
    const value = raw.trim();
    if (allowed.includes(value) && !result.includes(value as SourceFilter)) result.push(value as SourceFilter);
  }
  return result;
}

export function parseThreatIntelFilters(
  params: URLSearchParams,
  pageSize: number = DEFAULT_PAGE_SIZE,
): ThreatIntelFilters {
  const date = params.get('date') || '';
  const page = Number.parseInt(params.get('page') || '1', 10);
  const scope = parseScope(params.get('scope'));
  // Status, chain and attack type are only shown in the Web3 incidents view.
  // Dropping them elsewhere means a URL can never apply a filter the page hides.
  const incidentView = scope === 'web3-incidents';
  const status = params.get('status') || '';
  return {
    scope,
    categories: parseListParam(params.get('categories') || params.get('category'), NEWS_CATEGORIES),
    severities: parseListParam(params.get('severities') || params.get('severity'), SEVERITY_LEVELS),
    searchQuery: params.get('q') || '',
    dateFilter: (DATE_FILTERS as readonly string[]).includes(date) ? (date as DateFilter) : 'all',
    sortBy: params.get('sort') === 'severity' ? 'severity' : 'date',
    page: positiveInteger(page, 1),
    pageSize,
    verification: incidentView && (VERIFICATION_FILTERS as readonly string[]).includes(status)
      ? (status as VerificationFilter)
      : 'all',
    chains: incidentView ? parseFacetValues(params.getAll('chain')) : [],
    attackTypes: incidentView ? parseFacetValues(params.getAll('attack')) : [],
    sources: parseSources(params.getAll('source'), scope),
  };
}

/** The URL keys of the repeatable incident filters. */
export type IncidentListParam = 'chain' | 'attack' | 'source';

/** A copy of `current` with `key` set to `values` (one entry each) and paging reset. */
export function withListParam(
  current: URLSearchParams,
  key: IncidentListParam,
  values: readonly string[],
): URLSearchParams {
  const next = new URLSearchParams(current);
  next.delete(key);
  next.delete('page');
  for (const value of values) next.append(key, value);
  return next;
}

/**
 * A copy of `current` showing `scope`. Leaving the Web3 incidents view drops
 * the filters only that view shows; entering it drops ?source=rss.
 */
export function withScopeParam(current: URLSearchParams, scope: ThreatIntelScope): URLSearchParams {
  const next = new URLSearchParams(current);
  next.delete('page');
  if (scope === DEFAULT_SCOPE) next.delete('scope');
  else next.set('scope', scope);
  if (scope !== 'web3-incidents') {
    ['status', 'chain', 'attack'].forEach((key) => next.delete(key));
  }
  const sources = parseSources(current.getAll('source'), scope);
  next.delete('source');
  for (const source of sources) next.append('source', source);
  return next;
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
    ...(filters.verification !== 'all'
      ? { verification_filter: VERIFICATION_STATUS[filters.verification] }
      : {}),
    ...(filters.chains.length > 0 ? { chain_filter: [...filters.chains] } : {}),
    ...(filters.attackTypes.length > 0 ? { attack_type_filter: [...filters.attackTypes] } : {}),
    ...(filters.sources.length > 0 ? { provider_filter: [...filters.sources] } : {}),
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
 * query. Search, the Web3 scope, the Web3 umbrella category, severity sort and
 * the incident filters (status, chain, attack type, source) need the RPC
 * (ranking, metadata predicates, server-side ORDER BY).
 */
export function requiresThreatIntelRpc(
  filters: Pick<
    ThreatIntelFilters,
    'scope' | 'categories' | 'searchQuery' | 'sortBy' | 'verification' | 'chains' | 'attackTypes' | 'sources'
  >,
): boolean {
  return filters.scope === 'web3-incidents'
    || filters.categories.includes('web3-security')
    || filters.searchQuery.trim() !== ''
    || filters.sortBy === 'severity'
    || filters.verification !== 'all'
    || filters.chains.length > 0
    || filters.attackTypes.length > 0
    || filters.sources.length > 0;
}

// PostgREST quoted value: backslash-escape backslashes and double quotes.
function quotePostgrestValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

const PROVIDER_POSTGREST_CONDITIONS: Record<SourceFilter, string> = {
  quillmonitor: 'metadata->>provider.eq.quillmonitor',
  'web3-incidents': 'metadata->>provider.in.(web3-incidents,web3)',
  slowmist: 'metadata->>provider.eq.slowmist',
  rss: 'metadata->>provider.eq.rss,and(metadata->>provider.is.null,or(metadata->>is_web3_incident.is.null,metadata->>is_web3_incident.neq.true))',
};

/**
 * The incident filters as PostgREST `.or()` arguments, one per filter, for the
 * direct-table fallback when search_news_articles fails. Each mirrors the SQL
 * predicate in migration 20261012090000. Chain and attack type use ILIKE
 * without wildcards (normalizeFacetValue rejects % _ and *), which is an exact,
 * case-insensitive match.
 */
export function buildIncidentPostgrestFilters(params: ThreatIntelFilterParams): string[] {
  const filters: string[] = [];
  if (params.verification_filter) {
    filters.push(`metadata->>verification_status.eq.${params.verification_filter}`);
  }
  if (params.chain_filter?.length) {
    filters.push(params.chain_filter.map((value) => `metadata->>chain.ilike.${quotePostgrestValue(value)}`).join(','));
  }
  if (params.attack_type_filter?.length) {
    filters.push(params.attack_type_filter.map((value) => `metadata->>attack_type.ilike.${quotePostgrestValue(value)}`).join(','));
  }
  if (params.provider_filter?.length) {
    filters.push(params.provider_filter.map((source) => PROVIDER_POSTGREST_CONDITIONS[source]).join(','));
  }
  return filters;
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

export interface ThreatIntelFacet {
  /** Lower-cased value, as used in the URL and the RPC filters. */
  value: string;
  /** Display text as stored by the source. */
  label: string;
  /** Matching incidents in the last 90 days. */
  count: number;
}

export interface ThreatIntelFacets {
  chains: ThreatIntelFacet[];
  attackTypes: ThreatIntelFacet[];
}

export const EMPTY_THREAT_INTEL_FACETS: ThreatIntelFacets = Object.freeze({ chains: [], attackTypes: [] });

function parseFacetList(value: unknown): ThreatIntelFacet[] {
  if (!Array.isArray(value)) return [];
  const result: ThreatIntelFacet[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const facetValue = normalizeFacetValue(record.value);
    const count = toCount(record.count);
    if (!facetValue || count === null || result.some((facet) => facet.value === facetValue)) continue;
    const label = typeof record.label === 'string' && record.label.trim() !== ''
      ? record.label.trim().slice(0, MAX_FACET_VALUE_LENGTH)
      : facetValue;
    result.push({ value: facetValue, label, count });
    if (result.length === MAX_FACET_OPTIONS) break;
  }
  return result;
}

/** Validate the jsonb returned by threat_intel_facets. */
export function parseThreatIntelFacets(value: unknown): ThreatIntelFacets {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return EMPTY_THREAT_INTEL_FACETS;
  const record = value as Record<string, unknown>;
  return {
    chains: parseFacetList(record.chains),
    attackTypes: parseFacetList(record.attack_types),
  };
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
