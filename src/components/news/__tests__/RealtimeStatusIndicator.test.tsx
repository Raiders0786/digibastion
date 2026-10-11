// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RealtimeStatusIndicator } from '@/components/news/RealtimeStatusIndicator';
import { TooltipProvider } from '@/components/ui/tooltip';

let statusCallback: ((status: string) => void) | null = null;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: () => ({
      subscribe: (callback: (status: string) => void) => {
        statusCallback = callback;
        return {};
      },
    }),
    removeChannel: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  statusCallback = null;
});

describe('RealtimeStatusIndicator', () => {
  it('says the page updates itself, not that alerts are instant', async () => {
    render(<TooltipProvider><RealtimeStatusIndicator /></TooltipProvider>);
    act(() => statusCallback?.('SUBSCRIBED'));

    const badge = screen.getByText('Auto-updating');
    fireEvent.focus(badge.closest('div') as HTMLElement);
    expect((await screen.findAllByText('This page updates on its own when new records arrive.')).length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/Live Feed Active|instantly|Real-time alerts are active/);
  });
});
