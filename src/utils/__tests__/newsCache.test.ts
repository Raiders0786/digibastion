import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildFilterKey,
  buildStatsFilterKey,
  saveToCache,
  loadFromCache,
  saveStatsToCache,
  loadStatsFromCache,
} from '../newsCache';
import type { ThreatIntelStats } from '@/lib/threatIntel/query';

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
    },
    writable: true,
  });
});

const stats: ThreatIntelStats = {
  total: 100, critical: 5, high: 20, medium: 30, low: 25, info: 20, supplyChain: 3, unconfirmed: 2,
};

describe('buildFilterKey', () => {
  it('produces stable keys for same inputs', () => {
    const key1 = buildFilterKey({ scope: 'all', categories: ['web3-security'], page: 1 });
    const key2 = buildFilterKey({ scope: 'all', categories: ['web3-security'], page: 1 });
    expect(key1).toBe(key2);
  });

  it('sorts categories for determinism', () => {
    const key1 = buildFilterKey({ scope: 'all', categories: ['a', 'b'] });
    const key2 = buildFilterKey({ scope: 'all', categories: ['b', 'a'] });
    expect(key1).toBe(key2);
  });

  it('does not mutate filter arrays while building a key', () => {
    const categories = ['web3-security', 'operational-security'];
    const severities = ['medium', 'critical'];
    buildFilterKey({ scope: 'all', categories, severities });
    expect(categories).toEqual(['web3-security', 'operational-security']);
    expect(severities).toEqual(['medium', 'critical']);
  });

  it('produces different keys for different filters', () => {
    const key1 = buildFilterKey({ scope: 'all', categories: ['web3-security'] });
    const key2 = buildFilterKey({ scope: 'all', categories: ['operational-security'] });
    expect(key1).not.toBe(key2);
  });

  it('produces different keys for different pages', () => {
    expect(buildFilterKey({ scope: 'all', page: 1 })).not.toBe(buildFilterKey({ scope: 'all', page: 2 }));
  });

  it('produces different keys for the Web3 and all-news scopes', () => {
    expect(buildFilterKey({ scope: 'web3-incidents' })).not.toBe(buildFilterKey({ scope: 'all' }));
  });

  it('defaults missing fields', () => {
    const key = buildFilterKey({ scope: 'all' });
    expect(key).toContain('"q":""');
    expect(key).toContain('"p":1');
    expect(key).toContain('"sc":"all"');
  });
});

describe('buildStatsFilterKey', () => {
  it('ignores page and sort because stats cover the whole result', () => {
    expect(buildStatsFilterKey({ scope: 'all', page: 3, sortBy: 'severity' }))
      .toBe(buildStatsFilterKey({ scope: 'all', page: 1, sortBy: 'date' }));
  });
});

describe('saveToCache / loadFromCache', () => {
  it('round-trips articles correctly', () => {
    const articles = [
      { id: '1', title: 'Test', publishedAt: new Date('2025-01-01') } as any,
    ];
    const filterKey = buildFilterKey({ scope: 'all' });
    saveToCache(articles, 1, filterKey);

    const result = loadFromCache(filterKey);
    expect(result).not.toBeNull();
    expect(result!.articles).toHaveLength(1);
    expect(result!.totalCount).toBe(1);
    expect(result!.articles[0].title).toBe('Test');
    expect(result!.cachedAt).toBeInstanceOf(Date);
    expect(result!.isStale).toBe(false);
  });

  it('returns null for mismatched filter key', () => {
    const articles = [{ id: '1', title: 'Test', publishedAt: new Date() } as any];
    saveToCache(articles, 1, 'key-a');
    expect(loadFromCache('key-b')).toBeNull();
  });

  it('returns null when nothing cached', () => {
    expect(loadFromCache('any-key')).toBeNull();
  });
});

describe('saveStatsToCache / loadStatsFromCache', () => {
  it('round-trips stats for the same filter set', () => {
    const key = buildStatsFilterKey({ scope: 'all' });
    saveStatsToCache(stats, key);
    expect(loadStatsFromCache(key)).toEqual(stats);
  });

  it('returns null when nothing cached', () => {
    expect(loadStatsFromCache(buildStatsFilterKey({ scope: 'all' }))).toBeNull();
  });

  it('does not leak Web3 view stats into the all-news view', () => {
    saveStatsToCache(stats, buildStatsFilterKey({ scope: 'web3-incidents' }));
    expect(loadStatsFromCache(buildStatsFilterKey({ scope: 'all' }))).toBeNull();
  });

  it('drops the legacy global v2 entries', () => {
    store.digibastion_news_stats_v2 = '{"total":9}';
    store.digibastion_news_cache_v2 = '{}';
    saveStatsToCache(stats, buildStatsFilterKey({ scope: 'all' }));
    expect(store.digibastion_news_stats_v2).toBeUndefined();
    expect(store.digibastion_news_cache_v2).toBeUndefined();
  });
});
