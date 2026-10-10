// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThreatIntelAlerts } from '@/hooks/useThreatIntelAlerts';
import type { ThreatIntelFilterInput } from '@/lib/threatIntel/query';

const db = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: db.rpc } }));

const filters: ThreatIntelFilterInput = {
  scope: 'web3-incidents',
  categories: [],
  severities: [],
  searchQuery: '',
  dateFilter: 'all',
};

const alertRow = (id: string, severity: string, metadata: Record<string, unknown> = {}) => ({
  id,
  title: `Alert ${id}`,
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

describe('useThreatIntelAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.rpc.mockImplementation(async (name: string) => {
      if (name === 'search_news_articles') {
        return {
          data: [
            alertRow('c1', 'critical'),
            alertRow('h1', 'high'),
            alertRow('d1', 'critical', { duplicate_of_uid: 'quillmonitor:9' }),
          ],
          error: null,
        };
      }
      if (name === 'threat_intel_stats') {
        return {
          data: { total: 45, critical: 12, high: 33, medium: 0, low: 0, info: 0, supply_chain: 0, unconfirmed: 4 },
          error: null,
        };
      }
      return { data: null, error: { message: 'unexpected rpc' } };
    });
  });

  afterEach(cleanup);

  it('does not query until enabled', () => {
    renderHook(() => useThreatIntelAlerts({ filters, page: 1, enabled: false }));
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('loads one page of critical and high alerts for the current scope and filters', async () => {
    const { result } = renderHook(() => useThreatIntelAlerts({ filters, page: 2, enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(db.rpc).toHaveBeenCalledWith('search_news_articles', expect.objectContaining({
      severity_filter: ['critical', 'high'],
      web3_incidents_only: true,
      result_limit: 20,
      result_offset: 20,
    }));
    expect(db.rpc.mock.calls.find(([name]) => name === 'search_news_articles')?.[1]).not.toHaveProperty('sort_by');
    expect(db.rpc).toHaveBeenCalledWith('threat_intel_stats', expect.objectContaining({
      severity_filter: ['critical', 'high'],
      web3_incidents_only: true,
    }));
    expect(result.current.alerts.map((alert) => alert.id)).toEqual(['c1', 'h1']);
    expect(result.current.totalCount).toBe(45);
    expect(result.current.criticalCount).toBe(12);
    expect(result.current.highCount).toBe(33);
    expect(result.current.totalPages).toBe(3);
  });

  it('skips the query when the severity filter excludes critical and high', async () => {
    const { result } = renderHook(() => useThreatIntelAlerts({
      filters: { ...filters, severities: ['medium'] },
      page: 1,
      enabled: true,
    }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(db.rpc).not.toHaveBeenCalled();
    expect(result.current.alerts).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('reports an error when the alert query fails', async () => {
    db.rpc.mockImplementation(async (name: string) => (
      name === 'search_news_articles'
        ? { data: null, error: { message: 'boom' } }
        : { data: null, error: null }
    ));

    const { result } = renderHook(() => useThreatIntelAlerts({ filters, page: 1, enabled: true }));

    await waitFor(() => expect(result.current.error).toBe('Active alerts could not be loaded.'));
    expect(result.current.alerts).toEqual([]);
  });
});
