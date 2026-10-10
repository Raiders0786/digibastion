// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNewsArticles } from '@/hooks/useNewsArticles';

const db = vi.hoisted(() => {
  type Result = { data: unknown; error: unknown; count?: number | null };
  const makeChain = (result: Result) => {
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'neq', 'in', 'or', 'gte', 'order', 'range', 'limit', 'maybeSingle']) {
      chain[method] = vi.fn(() => chain);
    }
    chain.then = (resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject);
    return chain;
  };
  return { makeChain, from: vi.fn(), rpc: vi.fn() };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: db.from, rpc: db.rpc, functions: { invoke: vi.fn() } },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const row = (id: string, severity: string, metadata: Record<string, unknown> = {}) => ({
  id,
  title: `Incident ${id}`,
  summary: 'Summary',
  content: 'Body',
  category: 'web3-security',
  severity,
  tags: [],
  affected_technologies: [],
  link: null,
  source_url: null,
  source_name: 'QuillMonitor',
  author: null,
  cve_id: null,
  published_at: '2026-10-01T00:00:00Z',
  is_processed: false,
  metadata,
});

const serverStats = {
  total: 57, critical: 9, high: 14, medium: 20, low: 10, info: 4, supply_chain: 3, unconfirmed: 2,
};

describe('useNewsArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    db.from.mockImplementation(() => db.makeChain({ data: [], error: null, count: 0 }));
    db.rpc.mockImplementation(async (name: string) => {
      if (name === 'search_news_articles') {
        return { data: [row('a', 'critical'), row('b', 'high', { duplicate_of_uid: 'quillmonitor:1' })], error: null };
      }
      if (name === 'threat_intel_stats') return { data: serverStats, error: null };
      if (name === 'count_news_articles') return { data: 2, error: null };
      return { data: null, error: { message: `unexpected rpc ${name}` } };
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('sorts by severity on the server and reports whole-result stats', async () => {
    const { result } = renderHook(() => useNewsArticles({ view: 'all', sortBy: 'severity', page: 1, pageSize: 20 }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(db.rpc).toHaveBeenCalledWith('search_news_articles', expect.objectContaining({
      sort_by: 'severity',
      web3_incidents_only: false,
      result_limit: 20,
      result_offset: 0,
    }));
    expect(db.rpc).toHaveBeenCalledWith('threat_intel_stats', expect.objectContaining({ web3_incidents_only: false }));
    expect(result.current.articles.map((article) => article.id)).toEqual(['a']);
    expect(result.current.stats).toEqual({
      total: 57, critical: 9, high: 14, medium: 20, low: 10, info: 4, supplyChain: 3, unconfirmed: 2,
    });
    expect(result.current.statsSource).toBe('server');
    expect(result.current.pagination.totalCount).toBe(57);
  });

  it('falls back to page stats and the count RPC when the stats RPC fails', async () => {
    db.rpc.mockImplementation(async (name: string) => {
      if (name === 'search_news_articles') {
        return { data: [row('a', 'critical'), row('b', 'high', { duplicate_of_uid: 'quillmonitor:1' })], error: null };
      }
      if (name === 'count_news_articles') return { data: 2, error: null };
      return { data: null, error: { message: 'function threat_intel_stats does not exist' } };
    });

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useNewsArticles({ view: 'web3-incidents' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(result.current.statsSource).toBe('page');
    expect(result.current.stats.critical).toBe(1);
    expect(result.current.pagination.totalCount).toBe(2);
  });

  it('keeps plain newest-first browsing of all news on the direct table query', async () => {
    const { result } = renderHook(() => useNewsArticles({ view: 'all', sortBy: 'date' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(db.from).toHaveBeenCalledWith('news_articles');
    expect(db.rpc).not.toHaveBeenCalledWith('search_news_articles', expect.anything());
    expect(result.current.stats.total).toBe(57);
  });

  it('does not wait for stats: rows render first, stats apply when they resolve', async () => {
    let resolveStats: (value: unknown) => void = () => {};
    db.rpc.mockImplementation(async (name: string) => {
      if (name === 'search_news_articles') return { data: [row('a', 'critical')], error: null };
      if (name === 'threat_intel_stats') return new Promise((resolve) => { resolveStats = resolve; });
      return { data: null, error: { message: `unexpected rpc ${name}` } };
    });

    const { result } = renderHook(() => useNewsArticles({ view: 'web3-incidents' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.articles.map((article) => article.id)).toEqual(['a']);
    expect(result.current.statsSource).toBe('page');
    expect(result.current.pagination.totalCount).toBe(1);

    resolveStats({ data: serverStats, error: null });
    await waitFor(() => expect(result.current.statsSource).toBe('server'));
    expect(result.current.stats.total).toBe(57);
    expect(result.current.pagination.totalCount).toBe(57);
  });

  it('reuses stats when only the page changes', async () => {
    const { result, rerender } = renderHook(
      ({ page }) => useNewsArticles({ view: 'web3-incidents', page }),
      { initialProps: { page: 1 } },
    );
    await waitFor(() => expect(result.current.statsSource).toBe('server'));
    const statsCalls = () => db.rpc.mock.calls.filter(([name]) => name === 'threat_intel_stats').length;
    expect(statsCalls()).toBe(1);

    rerender({ page: 2 });
    await waitFor(() => expect(db.rpc.mock.calls.filter(([name]) => name === 'search_news_articles')).toHaveLength(2));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(statsCalls()).toBe(1);
    expect(result.current.statsSource).toBe('server');
    expect(result.current.stats.total).toBe(57);
  });

  it('clears the previous view stats while the new view stats load', async () => {
    const { result, rerender } = renderHook(
      ({ view }: { view: 'web3-incidents' | 'all' }) => useNewsArticles({ view }),
      { initialProps: { view: 'web3-incidents' as 'web3-incidents' | 'all' } },
    );
    await waitFor(() => expect(result.current.statsSource).toBe('server'));

    db.rpc.mockImplementation(async (name: string) => {
      if (name === 'search_news_articles') return { data: [row('a', 'critical')], error: null };
      return new Promise(() => {});
    });
    rerender({ view: 'all' });

    await waitFor(() => expect(result.current.statsSource).toBe('page'));
    expect(result.current.stats.total).not.toBe(57);
  });
});
