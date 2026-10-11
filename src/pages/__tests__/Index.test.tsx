// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Index from '@/pages/Index';
import { articlesMeta } from '@/data/articlesData';
import { initialSecurityData } from '@/data/securityData';
import { SITE_DEFINITION } from '@/seo/siteFacts';

const rows = vi.hoisted(() => ({
  data: [
    {
      id: 'quillmonitor:abc',
      title: 'Bridge drained',
      severity: 'critical',
      published_at: '2026-10-10T00:00:00Z',
      source_name: 'QuillMonitor',
      metadata: { provider: 'quillmonitor', is_web3_incident: true },
    },
    {
      id: 'web3-incidents:def',
      title: 'Wallet drainer kit',
      severity: 'high',
      published_at: '2026-10-09T00:00:00Z',
      source_name: 'Web3 Is Going Great',
      metadata: { provider: 'web3-incidents', is_web3_incident: true },
    },
    {
      id: 'rss-1',
      title: 'VPN flaw exploited',
      severity: 'high',
      published_at: '2026-10-08T00:00:00Z',
      source_name: 'BleepingComputer',
      metadata: null,
    },
  ] as Record<string, unknown>[],
  select: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => {
  const query = {
    select: (columns: string) => {
      rows.select(columns);
      return query;
    },
    or: () => query,
    in: () => query,
    order: () => query,
    limit: () => Promise.resolve({ data: rows.data, error: null }),
  };
  return { supabase: { from: () => query } };
});

vi.mock('@/hooks/useSecurityState', () => ({
  useSecurityState: () => ({
    categories: initialSecurityData,
    getOverallScore: () => 0,
    getStats: () => ({}),
    threatLevel: 'basic',
    isLoading: false,
    changeCount: 0,
  }),
}));
vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/MetaTags', () => ({ MetaTags: () => null }));
vi.mock('@/components/newsletter/QuickSubscribeCard', () => ({ QuickSubscribeCard: () => null }));
vi.mock('@/components/SecurityCard', () => ({ SecurityCard: () => null }));
vi.mock('@/components/SecurityPresets', () => ({ SecurityPresets: () => null }));
vi.mock('@/components/SecurityScore', () => ({ SecurityScore: () => null }));
vi.mock('@/components/ThreatLevelSelector', () => ({ ThreatLevelSelector: () => null }));

afterEach(cleanup);

const renderHome = () => render(<MemoryRouter><Index /></MemoryRouter>);

describe('home page', () => {
  it('opens with the plain definition of Digibastion', () => {
    renderHome();

    expect(screen.getByText(SITE_DEFINITION)).not.toBeNull();
    expect(screen.getByText(/Source code on GitHub\./)).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/Publicly inspectable|We curate/);
  });

  it('names the source of every latest alert', async () => {
    renderHome();

    const quill = (await screen.findByText('Bridge drained')).closest('a') as HTMLElement;
    expect(within(quill).getByText('Powered by QuillMonitor')).not.toBeNull();
    const web3 = screen.getByText('Wallet drainer kit').closest('a') as HTMLElement;
    expect(within(web3).getByText('Source: Web3 Is Going Just Great')).not.toBeNull();
    const news = screen.getByText('VPN flaw exploited').closest('a') as HTMLElement;
    expect(within(news).getByText('Source: BleepingComputer')).not.toBeNull();
    expect(rows.select).toHaveBeenCalledWith(expect.stringContaining('source_name'));
    expect(rows.select).toHaveBeenCalledWith(expect.stringContaining('metadata'));
  });

  it('lists what is live with counts that match the data', () => {
    renderHome();

    for (const item of [
      'Threat Intel feed with email alerts',
      'Telegram channel @digibastion',
      'Weekly report every Monday',
      `${initialSecurityData.length} security checklists`,
      'OpSec self-check',
      `${articlesMeta.length} security guides`,
      'Vantage (beta)',
    ]) {
      expect(screen.getAllByText(item).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('Daily brief email')).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/Live now|Shipped/);
  });

  it('renders the path cards as links', () => {
    renderHome();

    expect(screen.getByRole('link', { name: /Find your security gaps/ }).getAttribute('href')).toBe('/quiz');
    expect(screen.getByRole('link', { name: /Harden wallets and accounts/ }).getAttribute('href')).toBe('/#checklists');
    expect(screen.getByRole('link', { name: /Work through the risk with us/ }).getAttribute('href')).toBe('/services');
  });
});
