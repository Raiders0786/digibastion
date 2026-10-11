// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { SubscriptionForm } from '@/components/news/SubscriptionForm';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock('@/hooks/useSubscriberCount', () => ({
  useSubscriberCount: () => ({ data: null, isLoading: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useThreatIntelFacets', () => ({
  useThreatIntelFacets: (scope: string) => (scope === 'web3-incidents'
    ? { chains: [{ value: 'ethereum', label: 'Ethereum', count: 4 }, { value: 'base', label: 'Base', count: 2 }], attackTypes: [] }
    : { chains: [], attackTypes: [] }),
}));

beforeAll(() => {
  // jsdom has no ResizeObserver; the Radix select and checkbox primitives need one.
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

const checked = (id: string) => document.getElementById(id)?.getAttribute('aria-checked');

function fillEmail() {
  fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'reader@example.com' } });
}

describe('SubscriptionForm pre-fill', () => {
  it('starts with the categories and scope it was opened with', () => {
    render(<SubscriptionForm initialCategories={['defi-exploits']} initialScope="web3-incidents" />);

    expect(checked('category-defi-exploits')).toBe('true');
    expect(checked('category-supply-chain')).toBe('false');
    expect(screen.getByRole('button', { name: 'Web3 Incidents' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the old defaults when opened without a view', () => {
    render(<SubscriptionForm />);

    expect(checked('category-defi-exploits')).toBe('false');
    expect(screen.getByRole('button', { name: 'All Intelligence' }).getAttribute('aria-pressed')).toBe('true');
    expect(checked('subscription-daily')).toBe('true');
    expect(checked('subscription-realtime')).toBe('false');
    expect(checked('subscription-preliminary')).toBe('true');
    expect(screen.queryByLabelText('Day')).toBeNull();
  });

  it('pre-fills "Subscribe to this view": chains, confirmed-only and the weekly box', () => {
    render(
      <SubscriptionForm
        initialScope="web3-incidents"
        initialChains={['ethereum']}
        initialVerification="confirmed"
        initialWeekly
      />,
    );

    expect(screen.getByRole('button', { name: 'Ethereum' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Base' }).getAttribute('aria-pressed')).toBe('false');
    expect(checked('subscription-preliminary')).toBe('false');
    expect(checked('subscription-weekly')).toBe('true');
    expect(checked('subscription-daily')).toBe('false');
  });
});

describe('SubscriptionForm channels and submit', () => {
  it('links the Telegram button to the channel in a new tab', () => {
    render(<SubscriptionForm />);

    const link = screen.getByRole('link', { name: 'Join on Telegram' });
    expect(link.getAttribute('href')).toContain('t.me/digibastion');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('describes each channel without promising more than the code sends', () => {
    render(<SubscriptionForm />);

    expect(screen.getByText(
      'Telegram (@digibastion) posts new Web3 incidents from QuillMonitor, plus a link to the weekly report every Monday. Email alerts follow the filters you pick.',
    )).not.toBeNull();
    expect(screen.getByText('Critical and high incidents, checked every 30 minutes')).not.toBeNull();
    expect(screen.getByText('Daily brief')).not.toBeNull();
    expect(screen.getByText('Weekly deep-dive (Mondays)')).not.toBeNull();
    expect(screen.getByText('Get Threat Intel alerts')).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/starting soon|start soon|once the newsletter launches/i);
    expect(document.body.textContent).not.toMatch(/high and critical|as they are reported|same alerts post to Telegram/i);
  });

  it('shows an inline error and invokes nothing when no email type is checked', async () => {
    render(<SubscriptionForm initialCategories={['defi-exploits']} />);

    fireEvent.click(document.getElementById('subscription-daily')!);
    fillEmail();
    fireEvent.click(screen.getByRole('button', { name: /Subscribe to Security Alerts/ }));

    expect((await screen.findByRole('alert')).textContent).toBe('Choose at least one email type');
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('sends the three booleans, the timezone, the chains and include_preliminary', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true, isNewSubscription: true }, error: null } as never);
    render(<SubscriptionForm initialCategories={['defi-exploits']} initialScope="web3-incidents" />);

    fireEvent.click(document.getElementById('subscription-realtime')!);
    fireEvent.click(document.getElementById('subscription-weekly')!);
    fireEvent.click(document.getElementById('subscription-preliminary')!);
    fireEvent.click(screen.getByRole('button', { name: 'Base' }));
    fillEmail();
    fireEvent.click(screen.getByRole('button', { name: /Subscribe to Security Alerts/ }));

    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalledTimes(1));
    const [name, options] = vi.mocked(supabase.functions.invoke).mock.calls[0];
    expect(name).toBe('submit-form');
    const body = (options as { body: { type: string; data: Record<string, unknown> } }).body;
    expect(body.type).toBe('subscription');
    expect(body.data).toMatchObject({
      email: 'reader@example.com',
      consent_source: 'threat-intel-form',
      content_scope: 'web3-incidents',
      wants_realtime: true,
      wants_daily: true,
      wants_weekly: true,
      include_preliminary: false,
      chains: ['base'],
    });
    expect(body.data).toHaveProperty('timezone');
    expect(body.data).toHaveProperty('timezone_offset');
    expect(body.data).not.toHaveProperty('frequency');
    expect(body.data).not.toHaveProperty('preferred_day');
  });
});
