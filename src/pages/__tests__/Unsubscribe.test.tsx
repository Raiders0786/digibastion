// @vitest-environment jsdom

import { StrictMode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Unsubscribe from '@/pages/Unsubscribe';

const invoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));
vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/MetaTags', () => ({ MetaTags: () => null }));

const EMAIL = 'reader@example.com';
const TOKEN = '11111111-2222-3333-4444-555555555555';

const renderAt = (path: string) => render(
  <StrictMode>
    <MemoryRouter initialEntries={[path]}>
      <Unsubscribe />
    </MemoryRouter>
  </StrictMode>,
);

beforeEach(() => {
  invoke.mockReset();
  invoke.mockResolvedValue({ data: { success: true }, error: null });
});
afterEach(cleanup);

describe('Unsubscribe page', () => {
  it('unsubscribes exactly once with the email and token', async () => {
    renderAt(`/unsubscribe?email=${encodeURIComponent(EMAIL)}&token=${TOKEN}`);

    expect(await screen.findByText("You're unsubscribed from all Digibastion emails.")).not.toBeNull();
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('unsubscribe', { body: { email: EMAIL, token: TOKEN } });
  });

  it('links to the management page and offers to resubscribe', async () => {
    renderAt(`/unsubscribe?email=${encodeURIComponent(EMAIL)}&token=${TOKEN}`);

    const manage = await screen.findByRole('link', { name: 'Manage preferences' });
    const expected = `/manage-subscription?email=${encodeURIComponent(EMAIL)}&token=${TOKEN}`;
    expect(manage.getAttribute('href')).toBe(expected);
    expect(screen.getByRole('link', { name: /Resubscribe/ }).getAttribute('href')).toBe(expected);
  });

  it('shows an error and the management link when the request fails', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('network') });
    renderAt(`/unsubscribe?email=${encodeURIComponent(EMAIL)}&token=${TOKEN}`);

    expect(await screen.findByText(/could not unsubscribe you/i)).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Manage preferences' })).not.toBeNull();
  });

  it('makes no call without a token and links to the management page', () => {
    renderAt(`/unsubscribe?email=${encodeURIComponent(EMAIL)}`);

    expect(invoke).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /manage/i }).getAttribute('href')).toBe('/manage-subscription');
  });
});
