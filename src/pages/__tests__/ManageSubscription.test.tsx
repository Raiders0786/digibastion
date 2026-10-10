// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import ManageSubscription from '@/pages/ManageSubscription';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

// A stable toast, as in the app: loadSubscription depends on it.
const toast = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));

vi.mock('@/hooks/useThreatIntelFacets', () => ({
  useThreatIntelFacets: () => ({ chains: [], attackTypes: [] }),
}));

vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));

beforeAll(() => {
  // jsdom has no ResizeObserver; the Radix select, switch and checkbox need one.
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

const TOKEN = '11111111-2222-4333-8444-555555555555';

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    email: 'reader@example.com',
    name: 'Reader',
    categories: ['defi-exploits'],
    technologies: [],
    frequency: 'daily',
    severity_threshold: 'high',
    content_scope: 'all',
    preferred_hour: 9,
    timezone_offset: 0,
    preferred_day: 1,
    wants_realtime: false,
    wants_daily: true,
    wants_weekly: false,
    include_preliminary: true,
    chains: [],
    timezone: 'Europe/Berlin',
    is_active: true,
    is_verified: true,
    unsubscribed_at: null,
    ...overrides,
  };
}

function mockInvoke(row: Record<string, unknown>) {
  vi.mocked(supabase.functions.invoke).mockImplementation((async (name: string, options: { body: Record<string, unknown> }) => {
    if (name === 'get-subscription') return { data: { success: true, subscription: row }, error: null };
    if (name === 'update-subscription' && options.body.action === 'resubscribe') {
      return { data: { success: true, message: 'Check your inbox to confirm' }, error: null };
    }
    if (name === 'update-subscription') {
      return { data: { success: true, subscription: { ...row } }, error: null };
    }
    return { data: null, error: new Error('unexpected') };
  }) as never);
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/manage-subscription?email=reader%40example.com&token=${TOKEN}`]}>
      <ManageSubscription />
    </MemoryRouter>,
  );
}

const updateCalls = () => vi.mocked(supabase.functions.invoke).mock.calls.filter(([name]) => name === 'update-subscription');

describe('ManageSubscription', () => {
  it('shows the unsubscribed notice and a Resubscribe button for an inactive subscription', async () => {
    mockInvoke(subscription({ is_active: false, unsubscribed_at: '2026-10-01T00:00:00Z' }));
    renderPage();

    expect(await screen.findByText("You're unsubscribed. Saving keeps your preferences without sending emails.")).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Resubscribe' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /Reactivate/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Unsubscribe from security alerts/ })).toBeNull();
  });

  it('loads the channel columns into the form', async () => {
    mockInvoke(subscription({ wants_realtime: true, wants_daily: false, wants_weekly: true, include_preliminary: false }));
    renderPage();

    await screen.findByRole('button', { name: 'Save Preferences' });
    expect(document.getElementById('manage-realtime')?.getAttribute('aria-checked')).toBe('true');
    expect(document.getElementById('manage-daily')?.getAttribute('aria-checked')).toBe('false');
    expect(document.getElementById('manage-weekly')?.getAttribute('aria-checked')).toBe('true');
    expect(document.getElementById('manage-preliminary')?.getAttribute('aria-checked')).toBe('false');
  });

  it('saves the new preference fields and never sends is_active', async () => {
    mockInvoke(subscription({ is_active: false }));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Save Preferences' }));

    await waitFor(() => expect(updateCalls()).toHaveLength(1));
    const body = (updateCalls()[0][1] as { body: Record<string, unknown> }).body;
    expect(body).toMatchObject({
      email: 'reader@example.com',
      token: TOKEN,
      wants_realtime: false,
      wants_daily: true,
      wants_weekly: false,
      include_preliminary: true,
      timezone: 'Europe/Berlin',
    });
    expect(body).not.toHaveProperty('is_active');
    expect(body).not.toHaveProperty('frequency');
    expect(body).not.toHaveProperty('action');
    // Still unsubscribed after saving.
    expect(screen.getByRole('button', { name: 'Resubscribe' })).not.toBeNull();
  });

  it('"Resubscribe" calls the resubscribe action and asks the reader to confirm by email', async () => {
    mockInvoke(subscription({ is_active: false }));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Resubscribe' }));

    await waitFor(() => expect(updateCalls()).toHaveLength(1));
    expect((updateCalls()[0][1] as { body: Record<string, unknown> }).body).toEqual({
      action: 'resubscribe',
      email: 'reader@example.com',
      token: TOKEN,
    });
    expect(await screen.findByText(/Check your inbox to confirm/)).not.toBeNull();
  });
});
