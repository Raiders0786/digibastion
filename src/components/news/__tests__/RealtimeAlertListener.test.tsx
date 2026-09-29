// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RealtimeAlertListener } from '@/components/news/RealtimeAlertListener';

const realtime = vi.hoisted(() => {
  const handlers: Record<string, (payload: { new: unknown }) => void> = {};
  const channel = {
    on: vi.fn((_type: string, config: { event: string }, callback: (payload: { new: unknown }) => void) => {
      handlers[config.event] = callback;
      return channel;
    }),
    subscribe: vi.fn(() => channel),
  };
  return { handlers, channel, toast: vi.fn(), removeChannel: vi.fn() };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => realtime.channel),
    removeChannel: realtime.removeChannel,
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: realtime.toast }),
}));

describe('RealtimeAlertListener provider refresh behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    for (const event of Object.keys(realtime.handlers)) delete realtime.handlers[event];
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('suppresses a SlowMist insert alert but still refreshes the feed', () => {
    const onNewArticle = vi.fn();
    render(<RealtimeAlertListener onNewArticle={onNewArticle} />);

    act(() => {
      realtime.handlers.INSERT({
        new: {
          id: 'slowmist:1',
          title: 'Historical incident',
          severity: 'critical',
          category: 'web3-security',
          summary: 'Summary',
          published_at: new Date().toISOString(),
          source_name: 'SlowMist Hacked',
          metadata: { provider: 'slowmist', suppress_realtime_alert: true },
        },
      });
      vi.advanceTimersByTime(1_500);
    });

    expect(realtime.toast).not.toHaveBeenCalled();
    expect(onNewArticle).toHaveBeenCalledTimes(1);
  });

  it('refreshes SlowMist updates without emitting a toast', () => {
    const onNewArticle = vi.fn();
    render(<RealtimeAlertListener onNewArticle={onNewArticle} />);

    act(() => {
      realtime.handlers.UPDATE({
        new: {
          id: 'slowmist:1',
          title: 'Corrected incident',
          severity: 'high',
          category: 'web3-security',
          summary: 'Updated summary',
          source_name: 'SlowMist Hacked',
          metadata: { provider: 'slowmist' },
        },
      });
      vi.advanceTimersByTime(1_500);
    });

    expect(realtime.toast).not.toHaveBeenCalled();
    expect(onNewArticle).toHaveBeenCalledTimes(1);
  });
});
