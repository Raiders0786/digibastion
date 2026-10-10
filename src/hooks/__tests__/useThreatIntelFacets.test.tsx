// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThreatIntelFacets } from '@/hooks/useThreatIntelFacets';

const db = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: db.rpc } }));

describe('useThreatIntelFacets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.rpc.mockResolvedValue({
      data: {
        chains: [{ value: 'ethereum', label: 'Ethereum', count: 42 }],
        attack_types: [{ value: 'phishing', label: 'Phishing', count: 9 }],
      },
      error: null,
    });
  });

  afterEach(cleanup);

  it('loads chain and attack-type options for the Web3 incidents view', async () => {
    const { result } = renderHook(() => useThreatIntelFacets('web3-incidents'));

    await waitFor(() => expect(result.current.chains).toHaveLength(1));
    expect(db.rpc).toHaveBeenCalledWith('threat_intel_facets', { p_scope: 'web3-incidents' });
    expect(result.current).toEqual({
      chains: [{ value: 'ethereum', label: 'Ethereum', count: 42 }],
      attackTypes: [{ value: 'phishing', label: 'Phishing', count: 9 }],
    });
  });

  it('does not query in the all-news view', () => {
    const { result } = renderHook(() => useThreatIntelFacets('all'));

    expect(db.rpc).not.toHaveBeenCalled();
    expect(result.current).toEqual({ chains: [], attackTypes: [] });
  });

  it('returns no options when the RPC fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    db.rpc.mockResolvedValue({ data: null, error: { message: 'function threat_intel_facets does not exist' } });

    const { result } = renderHook(() => useThreatIntelFacets('web3-incidents'));

    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(result.current).toEqual({ chains: [], attackTypes: [] });
    warn.mockRestore();
  });
});
