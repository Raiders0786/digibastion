// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';

const db = vi.hoisted(() => {
  const handlers: Record<string, (payload: { new: unknown }) => void> = {};
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'or', 'in', 'gte']) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ count: 2, error: null }).then(resolve);
  const channel: Record<string, unknown> = {};
  channel.on = vi.fn((_type: string, config: { event: string }, callback: (payload: { new: unknown }) => void) => {
    handlers[config.event] = callback;
    return channel;
  });
  channel.subscribe = vi.fn(() => channel);
  return { handlers, query, channel, from: vi.fn(() => query) };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: db.from,
    channel: vi.fn(() => db.channel),
    removeChannel: vi.fn(),
  },
}));

describe('useMobileNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(cleanup);

  it('counts only publishable critical and high alerts', async () => {
    const { result } = renderHook(() => useMobileNotifications());

    await waitFor(() => expect(result.current.alertCount).toBe(2));
    expect(db.query.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
    expect(db.query.or).toHaveBeenCalledWith(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER);
  });

  it('ignores realtime inserts for merged duplicates', async () => {
    const { result } = renderHook(() => useMobileNotifications());
    await waitFor(() => expect(result.current.alertCount).toBe(2));

    act(() => {
      db.handlers.INSERT({ new: { severity: 'critical', metadata: { duplicate_of_uid: 'quillmonitor:1' } } });
    });
    expect(result.current.alertCount).toBe(2);

    act(() => {
      db.handlers.INSERT({ new: { severity: 'critical', metadata: { provider: 'quillmonitor' } } });
    });
    expect(result.current.alertCount).toBe(3);
  });
});
