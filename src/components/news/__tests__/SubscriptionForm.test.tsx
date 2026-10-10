// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { SubscriptionForm } from '@/components/news/SubscriptionForm';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock('@/hooks/useSubscriberCount', () => ({
  useSubscriberCount: () => ({ data: null, isLoading: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

beforeAll(() => {
  // jsdom has no ResizeObserver; the Radix select and checkbox primitives need one.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(cleanup);

describe('SubscriptionForm pre-fill', () => {
  it('starts with the categories and scope it was opened with', () => {
    render(<SubscriptionForm initialCategories={['defi-exploits']} initialScope="web3-incidents" />);

    expect(document.getElementById('category-defi-exploits')?.getAttribute('aria-checked')).toBe('true');
    expect(document.getElementById('category-supply-chain')?.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('button', { name: 'Web3 Incidents' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the old defaults when opened without a view', () => {
    render(<SubscriptionForm />);

    expect(document.getElementById('category-defi-exploits')?.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('button', { name: 'All Intelligence' }).getAttribute('aria-pressed')).toBe('true');
  });
});
