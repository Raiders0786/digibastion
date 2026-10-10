import { describe, expect, it } from 'vitest';
import type { NewsArticle } from '@/types/news';
import {
  ALERTS_PAGE_SIZE,
  buildAlertQueryParams,
  buildIncidentPostgrestFilters,
  buildThreatIntelFilterParams,
  buildThreatIntelQueryParams,
  computePageStats,
  normalizeFacetValue,
  parseThreatIntelFacets,
  parseThreatIntelFilters,
  parseThreatIntelStats,
  requiresThreatIntelRpc,
  resolveAlertSeverities,
  sourceFiltersForScope,
  withListParam,
  withScopeParam,
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
  verification: 'all',
  chains: [],
  attackTypes: [],
  sources: [],
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
      verification: 'all',
      chains: [],
      attackTypes: [],
      sources: [],
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
      verification: 'all',
      chains: [],
      attackTypes: [],
      sources: [],
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


describe('incident filters', () => {
  it('reads status, chain, attack type and source in the Web3 view and drops unknown values', () => {
    const params = new URLSearchParams();
    params.set('status', 'confirmed');
    ['Ethereum', ' BSC ', 'ethereum', 'eth%', 'a_b', ''].forEach((value) => params.append('chain', value));
    params.append('attack', 'Flash Loan');
    ['slowmist', 'bogus', 'rss', 'quillmonitor'].forEach((value) => params.append('source', value));

    expect(parseThreatIntelFilters(params)).toEqual({
      ...baseFilters,
      verification: 'confirmed',
      chains: ['ethereum', 'bsc'],
      attackTypes: ['flash loan'],
      sources: ['slowmist', 'quillmonitor'],
    });
  });

  it('ignores status, chain and attack type outside the Web3 view but keeps source', () => {
    const filters = parseThreatIntelFilters(new URLSearchParams('scope=all&status=unconfirmed&chain=ethereum&attack=phishing&source=rss,quillmonitor'));
    expect(filters.verification).toBe('all');
    expect(filters.chains).toEqual([]);
    expect(filters.attackTypes).toEqual([]);
    expect(filters.sources).toEqual(['rss', 'quillmonitor']);
  });

  it('treats an unknown status as all and caps free-text selections at 10', () => {
    const params = new URLSearchParams('status=verified');
    for (let index = 0; index < 12; index += 1) params.append('chain', `chain ${index}`);
    const filters = parseThreatIntelFilters(params);
    expect(filters.verification).toBe('all');
    expect(filters.chains).toHaveLength(10);
  });

  it('normalizes chain and attack-type values', () => {
    expect(normalizeFacetValue('  Arbitrum One ')).toBe('arbitrum one');
    expect(normalizeFacetValue("Rug Pull / Exit Scam (Owner's key)")).toBe("rug pull / exit scam (owner's key)");
    expect(normalizeFacetValue('Sui')).toBe('sui');
    expect(normalizeFacetValue('a,b')).toBeNull();
    expect(normalizeFacetValue('50%')).toBeNull();
    expect(normalizeFacetValue('x'.repeat(65))).toBeNull();
    expect(normalizeFacetValue('-leading')).toBeNull();
    expect(normalizeFacetValue(42)).toBeNull();
  });

  it('offers publisher feeds only outside the Web3 view', () => {
    expect(sourceFiltersForScope('web3-incidents')).toEqual(['quillmonitor', 'web3-incidents', 'slowmist']);
    expect(sourceFiltersForScope('all')).toEqual(['quillmonitor', 'web3-incidents', 'slowmist', 'rss']);
  });

  it('maps the incident filters to RPC arguments', () => {
    expect(buildThreatIntelFilterParams({
      ...baseFilters,
      verification: 'unconfirmed',
      chains: ['ethereum'],
      attackTypes: ['flash loan', 'phishing'],
      sources: ['quillmonitor'],
    }, NOW)).toEqual({
      search_query: null,
      category_filter: null,
      severity_filter: null,
      date_from: null,
      source_filter: null,
      web3_incidents_only: true,
      verification_filter: 'unverified',
      chain_filter: ['ethereum'],
      attack_type_filter: ['flash loan', 'phishing'],
      provider_filter: ['quillmonitor'],
    });
    expect(buildThreatIntelFilterParams({ ...baseFilters, verification: 'confirmed' }, NOW).verification_filter).toBe('verified');
  });

  it('leaves unset incident filters out of the RPC arguments', () => {
    const params = buildThreatIntelFilterParams(baseFilters, NOW);
    expect(Object.keys(params)).not.toContain('verification_filter');
    expect(Object.keys(params)).not.toContain('chain_filter');
    expect(Object.keys(params)).not.toContain('attack_type_filter');
    expect(Object.keys(params)).not.toContain('provider_filter');
  });

  it.each([
    ['a status', { verification: 'confirmed' as const }],
    ['a chain', { chains: ['ethereum'] }],
    ['an attack type', { attackTypes: ['phishing'] }],
    ['a source', { sources: ['rss' as const] }],
  ])('uses the RPC for %s in the all-news view', (_label, overrides) => {
    expect(requiresThreatIntelRpc({ ...baseFilters, scope: 'all', ...overrides })).toBe(true);
  });

  it('carries the incident filters into alert queries', () => {
    const query = buildAlertQueryParams({ ...baseFilters, chains: ['ethereum'], verification: 'confirmed' }, 1, NOW);
    expect(query?.search.chain_filter).toEqual(['ethereum']);
    expect(query?.filter.verification_filter).toBe('verified');
  });

  it('writes repeatable URL params and resets paging', () => {
    const next = withListParam(new URLSearchParams('chain=bsc&page=3&scope=all'), 'chain', ['ethereum', 'arbitrum one']);
    expect(next.getAll('chain')).toEqual(['ethereum', 'arbitrum one']);
    expect(next.get('page')).toBeNull();
    expect(next.get('scope')).toBe('all');
    expect(withListParam(next, 'chain', []).has('chain')).toBe(false);
  });

  it('drops filters the new view does not show when the scope changes', () => {
    const toAll = withScopeParam(new URLSearchParams('status=confirmed&chain=ethereum&attack=phishing&source=slowmist&page=2'), 'all');
    expect(toAll.toString()).toBe('scope=all&source=slowmist');

    const toWeb3 = withScopeParam(new URLSearchParams('scope=all&source=rss&source=quillmonitor&categories=supply-chain'), 'web3-incidents');
    expect(toWeb3.get('scope')).toBeNull();
    expect(toWeb3.getAll('source')).toEqual(['quillmonitor']);
    expect(toWeb3.get('categories')).toBe('supply-chain');
  });

  it('builds PostgREST fallback filters that mirror the SQL predicate', () => {
    expect(buildIncidentPostgrestFilters({
      ...buildThreatIntelFilterParams(baseFilters, NOW),
      verification_filter: 'verified',
      chain_filter: ['ethereum', "owner's (chain)"],
      attack_type_filter: ['flash loan'],
      provider_filter: ['web3-incidents', 'rss'],
    })).toEqual([
      'metadata->>verification_status.eq.verified',
      'metadata->>chain.ilike."ethereum",metadata->>chain.ilike."owner\'s (chain)"',
      'metadata->>attack_type.ilike."flash loan"',
      'metadata->>provider.in.(web3-incidents,web3),metadata->>provider.eq.rss,and(metadata->>provider.is.null,or(metadata->>is_web3_incident.is.null,metadata->>is_web3_incident.neq.true))',
    ]);
    expect(buildIncidentPostgrestFilters(buildThreatIntelFilterParams(baseFilters, NOW))).toEqual([]);
  });
});

describe('facets', () => {
  it('parses the threat_intel_facets payload', () => {
    expect(parseThreatIntelFacets({
      chains: [
        { value: 'ethereum', label: 'Ethereum', count: 42 },
        { value: 'ETHEREUM', label: 'Ethereum', count: 1 },
        { value: 'bad,value', label: 'Bad', count: 3 },
        { value: 'bsc', label: '', count: '7' },
        { value: 'solana', label: 'Solana', count: -1 },
      ],
      attack_types: [{ value: 'phishing', label: 'Phishing', count: 5 }],
    })).toEqual({
      chains: [
        { value: 'ethereum', label: 'Ethereum', count: 42 },
        { value: 'bsc', label: 'bsc', count: 7 },
      ],
      attackTypes: [{ value: 'phishing', label: 'Phishing', count: 5 }],
    });
  });

  it('returns empty facets for anything else', () => {
    expect(parseThreatIntelFacets(null)).toEqual({ chains: [], attackTypes: [] });
    expect(parseThreatIntelFacets([])).toEqual({ chains: [], attackTypes: [] });
    expect(parseThreatIntelFacets({ chains: 'ethereum' })).toEqual({ chains: [], attackTypes: [] });
  });
});
