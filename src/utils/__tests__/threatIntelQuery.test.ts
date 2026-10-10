import { describe, expect, it } from 'vitest';
import type { NewsArticle } from '@/types/news';
import {
  ALERTS_PAGE_SIZE,
  buildAlertQueryParams,
  buildThreatIntelFilterParams,
  buildThreatIntelQueryParams,
  computePageStats,
  parseThreatIntelFilters,
  parseThreatIntelStats,
  requiresThreatIntelRpc,
  resolveAlertSeverities,
  type ThreatIntelFilters,
} from '@/lib/threatIntel/query';

const NOW = new Date('2026-10-10T12:00:00.000Z');

const baseFilters: ThreatIntelFilters = {
  scope: 'web3-incidents',
  categories: [],
  severities: [],
  searchQuery: '',
  dateFilter: 'all',
  sortBy: 'date',
  page: 1,
  pageSize: 20,
};

describe('parseThreatIntelFilters', () => {
  it('reads every shareable filter from the URL', () => {
    const params = new URLSearchParams('scope=all&categories=web3-security,bogus&severities=critical&q=bridge&date=30d&sort=severity&page=3');
    expect(parseThreatIntelFilters(params)).toEqual({
      scope: 'all',
      categories: ['web3-security'],
      severities: ['critical'],
      searchQuery: 'bridge',
      dateFilter: '30d',
      sortBy: 'severity',
      page: 3,
      pageSize: 20,
    });
  });

  it('defaults to the Web3 incidents view and safe values', () => {
    expect(parseThreatIntelFilters(new URLSearchParams('date=1y&sort=random&page=-4'))).toEqual(baseFilters);
  });

  it('accepts the legacy singular category and severity params', () => {
    const filters = parseThreatIntelFilters(new URLSearchParams('category=supply-chain&severity=high'));
    expect(filters.categories).toEqual(['supply-chain']);
    expect(filters.severities).toEqual(['high']);
  });
});

describe('buildThreatIntelQueryParams', () => {
  it('maps the default view to Web3-only, newest-first RPC params', () => {
    expect(buildThreatIntelQueryParams(baseFilters, NOW)).toEqual({
      search_query: null,
      category_filter: null,
      severity_filter: null,
      date_from: null,
      source_filter: null,
      web3_incidents_only: true,
      result_limit: 20,
      result_offset: 0,
    });
  });

  it('maps filters, date window, severity sort and page offset', () => {
    expect(buildThreatIntelQueryParams({
      ...baseFilters,
      scope: 'all',
      categories: ['supply-chain'],
      severities: ['critical', 'high'],
      searchQuery: '  npm worm ',
      dateFilter: '7d',
      sortBy: 'severity',
      page: 3,
    }, NOW)).toEqual({
      search_query: 'npm worm',
      category_filter: ['supply-chain'],
      severity_filter: ['critical', 'high'],
      date_from: '2026-10-03T12:00:00.000Z',
      source_filter: null,
      web3_incidents_only: false,
      result_limit: 20,
      result_offset: 40,
      sort_by: 'severity',
    });
  });

  it('omits sort_by for date order so the old RPC signature keeps working', () => {
    expect(buildThreatIntelQueryParams(baseFilters, NOW)).not.toHaveProperty('sort_by');
  });

  it('clamps page size to the RPC maximum and page to 1', () => {
    const params = buildThreatIntelQueryParams({ ...baseFilters, page: 0, pageSize: 500 }, NOW);
    expect(params.result_limit).toBe(100);
    expect(params.result_offset).toBe(0);
  });

  it('does not share array references with the caller', () => {
    const categories: ThreatIntelFilters['categories'] = ['supply-chain'];
    const params = buildThreatIntelFilterParams({ ...baseFilters, categories }, NOW);
    expect(params.category_filter).toEqual(['supply-chain']);
    expect(params.category_filter).not.toBe(categories);
  });
});

describe('requiresThreatIntelRpc', () => {
  it('keeps plain chronological browsing of all news on the direct query', () => {
    expect(requiresThreatIntelRpc({ ...baseFilters, scope: 'all' })).toBe(false);
  });

  it.each([
    ['the Web3 scope', { scope: 'web3-incidents' as const }],
    ['the Web3 umbrella category', { scope: 'all' as const, categories: ['web3-security' as const] }],
    ['a search', { scope: 'all' as const, searchQuery: 'bridge' }],
    ['severity sort', { scope: 'all' as const, sortBy: 'severity' as const }],
  ])('uses the RPC for %s', (_label, overrides) => {
    expect(requiresThreatIntelRpc({ ...baseFilters, ...overrides })).toBe(true);
  });
});

describe('alert queries', () => {
  it('limits alerts to critical and high unless the user narrowed severity', () => {
    expect(resolveAlertSeverities([])).toEqual(['critical', 'high']);
    expect(resolveAlertSeverities(['critical', 'medium'])).toEqual(['critical']);
    expect(resolveAlertSeverities(['low'])).toEqual([]);
  });

  it('builds paginated alert params that follow scope and filters', () => {
    const query = buildAlertQueryParams({
      scope: 'all',
      categories: ['supply-chain'],
      severities: [],
      searchQuery: 'npm',
      dateFilter: '30d',
    }, 2, NOW);
    const filter = {
      search_query: 'npm',
      category_filter: ['supply-chain'],
      severity_filter: ['critical', 'high'],
      date_from: '2026-09-10T12:00:00.000Z',
      source_filter: null,
      web3_incidents_only: false,
    };
    expect(query?.filter).toEqual(filter);
    expect(query?.search).toEqual({
      ...filter,
      result_limit: ALERTS_PAGE_SIZE,
      result_offset: ALERTS_PAGE_SIZE,
    });
  });

  it('returns null when no alert severity is selected', () => {
    expect(buildAlertQueryParams({ ...baseFilters, severities: ['medium'] }, 1, NOW)).toBeNull();
  });
});

describe('stats', () => {
  it('parses the threat_intel_stats jsonb payload', () => {
    expect(parseThreatIntelStats({
      total: 57, critical: 9, high: '14', medium: 20, low: 10, info: 4, supply_chain: 3, unconfirmed: 2,
    })).toEqual({
      total: 57, critical: 9, high: 14, medium: 20, low: 10, info: 4, supplyChain: 3, unconfirmed: 2,
    });
  });

  it('rejects payloads without a valid total', () => {
    expect(parseThreatIntelStats(null)).toBeNull();
    expect(parseThreatIntelStats([])).toBeNull();
    expect(parseThreatIntelStats({ critical: 1 })).toBeNull();
    expect(parseThreatIntelStats({ total: -1 })).toBeNull();
  });

  it('treats missing buckets as zero', () => {
    expect(parseThreatIntelStats({ total: 3 })?.critical).toBe(0);
  });

  it('computes page-only fallback stats', () => {
    const article = (severity: NewsArticle['severity'], extra: Partial<NewsArticle> = {}): NewsArticle => ({
      id: `${severity}-${extra.category ?? 'x'}`,
      title: 'Title',
      summary: '',
      content: '',
      category: 'web3-security',
      tags: [],
      severity,
      publishedAt: NOW,
      ...extra,
    });
    expect(computePageStats([
      article('critical'),
      article('high', { category: 'supply-chain' }),
      article('info', { metadata: { verification_status: 'unverified' } }),
    ], 42)).toEqual({
      total: 42, critical: 1, high: 1, medium: 0, low: 0, info: 1, supplyChain: 1, unconfirmed: 1,
    });
  });
});
