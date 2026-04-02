import { describe, it, expect, beforeEach } from 'vitest';
import { buildFilterKey, saveToCache, loadFromCache, saveStatsToCache, loadStatsFromCache } from '../newsCache';

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

describe('buildFilterKey', () => {
  it('produces stable keys for same inputs', () => {
    const key1 = buildFilterKey({ categories: ['web3-security'], page: 1 });
    const key2 = buildFilterKey({ categories: ['web3-security'], page: 1 });
    expect(key1).toBe(key2);
  });

  it('sorts categories for determinism', () => {
    const key1 = buildFilterKey({ categories: ['a', 'b'] });
    const key2 = buildFilterKey({ categories: ['b', 'a'] });
    expect(key1).toBe(key2);
  });

  it('produces different keys for different filters', () => {
    const key1 = buildFilterKey({ categories: ['web3-security'] });
    const key2 = buildFilterKey({ categories: ['operational-security'] });
    expect(key1).not.toBe(key2);
  });

  it('produces different keys for different pages', () => {
    const key1 = buildFilterKey({ page: 1 });
    const key2 = buildFilterKey({ page: 2 });
    expect(key1).not.toBe(key2);
  });

  it('defaults missing fields', () => {
    const key = buildFilterKey({});
    expect(key).toContain('"q":""');
    expect(key).toContain('"p":1');
  });
});

describe('saveToCache / loadFromCache', () => {
  it('round-trips articles correctly', () => {
    const articles = [
      { id: '1', title: 'Test', publishedAt: new Date('2025-01-01') } as any,
    ];
    const filterKey = buildFilterKey({});
    saveToCache(articles, 1, filterKey);

    const result = loadFromCache(filterKey);
    expect(result).not.toBeNull();
    expect(result!.articles).toHaveLength(1);
    expect(result!.totalCount).toBe(1);
    expect(result!.articles[0].title).toBe('Test');
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
  it('round-trips stats correctly', () => {
    const stats = { total: 100, critical: 5, high: 20, supplyChain: 3, aiSummarized: 10, web3Incidents: 8 };
    saveStatsToCache(stats);
    const result = loadStatsFromCache();
    expect(result).toEqual(stats);
  });

  it('returns null when nothing cached', () => {
    expect(loadStatsFromCache()).toBeNull();
  });
});
