// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { QuickSubscribeCard } from '@/components/newsletter/QuickSubscribeCard';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    rpc: vi.fn().mockResolvedValue({ data: { count: 10, label: '10+ security professionals' }, error: null }),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

beforeAll(() => {
  // jsdom has no ResizeObserver; the Radix checkbox needs one.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  vi.mocked(supabase.functions.invoke).mockReset();
});

const renderCard = () => render(<MemoryRouter><QuickSubscribeCard /></MemoryRouter>);

describe('QuickSubscribeCard', () => {
  it('offers a sample email instead of a subscriber count', async () => {
    renderCard();

    expect(screen.queryByText(/security professionals/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'See a sample email' }));
    expect(await screen.findByRole('dialog', { name: 'Email Preview' })).not.toBeNull();
  });

  it('sends consent_source, the Web3 scope, the channel booleans and the timezone', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true, isNewSubscription: true }, error: null } as never);
    renderCard();

    expect(document.getElementById('quick-realtime')?.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(document.getElementById('quick-weekly')!);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe to security alerts' }));

    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalledTimes(1));
    const [name, options] = vi.mocked(supabase.functions.invoke).mock.calls[0];
    expect(name).toBe('submit-form');
    const data = (options as { body: { data: Record<string, unknown> } }).body.data;
    expect(data).toMatchObject({
      email: 'reader@example.com',
      consent_source: 'quick-subscribe',
      content_scope: 'web3-incidents',
      categories: ['web3-security', 'defi-exploits', 'vulnerability-disclosure'],
      wants_realtime: true,
      wants_daily: false,
      wants_weekly: true,
      include_preliminary: true,
    });
    expect(data).toHaveProperty('timezone');
    expect(data).not.toHaveProperty('frequency');
  });

  it('marks the newsletters as starting soon while they are gated', () => {
    renderCard();

    expect(screen.getByText('Real-time alerts')).not.toBeNull();
    expect(screen.getByText('Daily brief (starting soon)')).not.toBeNull();
    expect(screen.getByText('Weekly deep-dive (starting soon)')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Get alerts' })).not.toBeNull();
  });

  it('says the daily brief waits for launch and real-time alerts start now', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true, isNewSubscription: true }, error: null } as never);
    renderCard();

    fireEvent.click(document.getElementById('quick-daily')!);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe to security alerts' }));

    const line = await screen.findByTestId('quick-delivery-line');
    expect(line.textContent).toMatch(
      /^Your daily brief will arrive at .+ once the newsletter launches\. Real-time alerts start with the next matching incident\.$/,
    );
  });

  it('asks for an email type before sending anything', async () => {
    renderCard();

    fireEvent.click(document.getElementById('quick-realtime')!);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe to security alerts' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Choose at least one email type');
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });
});
