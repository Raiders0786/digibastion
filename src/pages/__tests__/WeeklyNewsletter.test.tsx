// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WeeklyNewsletter from '@/pages/WeeklyNewsletter';
import { weeklyPublicContent } from '../../../supabase/functions/_shared/weekly-test-fixtures';

const rpc = vi.fn();
const metaTags = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));
vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/MetaTags', () => ({
  MetaTags: (props: Record<string, unknown>) => {
    metaTags(props);
    return null;
  },
}));

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/threat-intel/weekly/:weekStart" element={<WeeklyNewsletter />} />
    </Routes>
  </MemoryRouter>,
);

const payload = (overrides: Record<string, unknown> = {}) => ({
  content: weeklyPublicContent(),
  generated_at: '2026-10-12T00:10:00Z',
  previous_week_start: '2026-09-28',
  next_week_start: null,
  ...overrides,
});

beforeEach(() => {
  rpc.mockReset();
  metaTags.mockReset();
  rpc.mockResolvedValue({ data: payload(), error: null });
});
afterEach(cleanup);

describe('WeeklyNewsletter page', () => {
  it('fetches the issue for the week in the URL', async () => {
    renderAt('/threat-intel/weekly/2026-10-05');

    expect(await screen.findByRole('heading', { level: 1, name: 'Web3 security week of Oct 5, 2026' })).not.toBeNull();
    expect(rpc).toHaveBeenCalledWith('get_weekly_newsletter', { p_week_start: '2026-10-05' });
  });

  it('renders the totals formatted in code', async () => {
    renderAt('/threat-intel/weekly/2026-10-05');

    const totals = await screen.findByRole('region', { name: 'This week in numbers' });
    expect(within(totals).getByText('~$12.3M reported')).not.toBeNull();
    expect(within(totals).getByText('9')).not.toBeNull();
    expect(within(totals).getByText(/Previous week: ~\$8M reported/)).not.toBeNull();
    expect(within(totals).getByText(/~\$3M reported/)).not.toBeNull();
    expect(within(totals).getByText(/Bridge Exploit: 4 incidents, ~\$9M reported/)).not.toBeNull();
  });

  it('renders five top items, each naming and linking its source', async () => {
    renderAt('/threat-intel/weekly/2026-10-05');

    const top = await screen.findByRole('region', { name: 'Top incidents' });
    const items = within(top).getAllByRole('article');
    expect(items).toHaveLength(5);
    const sources = ['QuillMonitor', 'SlowMist', 'QuillMonitor', 'Web3 Is Going Great', 'SlowMist'];
    items.forEach((item, index) => {
      const source = within(item).getByRole('link', { name: sources[index] });
      expect(source.getAttribute('href')).toBe(`https://source.example/${index + 1}`);
      expect(within(item).getByRole('link', { name: /Details on Digibastion/ })).not.toBeNull();
    });
    expect(within(items[2]).getByText('Unconfirmed')).not.toBeNull();
    expect(within(items[0]).getByText('Confirmed')).not.toBeNull();
    expect(within(items[0]).getByText('~$5M reported')).not.toBeNull();
  });

  it('shows the AI note only on AI-written paragraphs', async () => {
    renderAt('/threat-intel/weekly/2026-10-05');

    await screen.findByRole('region', { name: 'Top incidents' });
    expect(screen.getAllByText('Written by AI from the data above')).toHaveLength(2);
    const [first, , third] = screen.getAllByRole('article');
    expect(within(first).queryByText('Written by AI from the data above')).not.toBeNull();
    expect(within(third).queryByText('Written by AI from the data above')).toBeNull();
  });

  it('renders trends, vulnerabilities, the opsec tip, sources, week links and the subscribe CTA', async () => {
    renderAt('/threat-intel/weekly/2026-10-05');

    expect(await screen.findByText('Bridge exploits led the week.')).not.toBeNull();
    expect(screen.getByText('CVE-2026-1234 in OpenSSL')).not.toBeNull();
    expect(screen.getByText('Review your token approvals.')).not.toBeNull();
    expect(within(screen.getByRole('region', { name: 'Sources' })).getByText('The Hacker News')).not.toBeNull();
    expect(screen.getByRole('link', { name: /Previous week/ }).getAttribute('href')).toBe('/threat-intel/weekly/2026-09-28');
    expect(screen.queryByRole('link', { name: /Next week/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Get the weekly deep-dive/ }).getAttribute('href'))
      .toBe('/threat-intel?tab=subscribe&scope=web3-incidents&weekly=1');
    expect(metaTags).toHaveBeenLastCalledWith(expect.objectContaining({
      title: 'Web3 hacks, week of Oct 5, 2026: ~$12.3M across 9 incidents',
      canonical: 'https://www.digibastion.com/threat-intel/weekly/2026-10-05',
      robots: 'index',
    }));
  });

  it('never claims Digibastion verified anything', async () => {
    const { container } = renderAt('/threat-intel/weekly/2026-10-05');

    await screen.findByRole('region', { name: 'Top incidents' });
    expect(container.textContent).not.toMatch(/verified by digibastion/i);
  });

  it('shows the not-found state when the RPC returns null', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    renderAt('/threat-intel/weekly/2026-10-05');

    expect(await screen.findByRole('heading', { level: 1, name: 'Weekly issue not found' })).not.toBeNull();
    expect(metaTags).toHaveBeenLastCalledWith(expect.objectContaining({ robots: 'noindex,follow' }));
  });

  it('shows the not-found state for invalid content', async () => {
    rpc.mockResolvedValue({ data: payload({ content: { version: 2 } }), error: null });
    renderAt('/threat-intel/weekly/2026-10-05');

    expect(await screen.findByRole('heading', { level: 1, name: 'Weekly issue not found' })).not.toBeNull();
  });

  it('shows the not-found state for a date that is not a Monday without calling the RPC', async () => {
    renderAt('/threat-intel/weekly/2026-10-06');

    expect(await screen.findByRole('heading', { level: 1, name: 'Weekly issue not found' })).not.toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('shows an error state when the request fails', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('network') });
    renderAt('/threat-intel/weekly/2026-10-05');

    expect(await screen.findByText(/could not load this weekly issue/i)).not.toBeNull();
    // A transient error must not deindex the page.
    expect(metaTags).toHaveBeenLastCalledWith(expect.objectContaining({ robots: 'index' }));
  });
});
