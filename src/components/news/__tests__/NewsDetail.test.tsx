// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewsDetail } from '@/components/news/NewsDetail';
import type { NewsArticle } from '@/types/news';

vi.mock('@/hooks/useRelatedArticles', () => ({
  useRelatedArticles: () => ({ relatedArticles: [], isLoading: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const slowMistArticle: NewsArticle = {
  id: 'slowmist:1',
  title: 'Example protocol incident',
  summary: 'SlowMist incident summary',
  content: 'SlowMist incident details',
  category: 'web3-security',
  tags: ['slowmist'],
  severity: 'high',
  publishedAt: new Date('2026-09-29T00:00:00Z'),
  sourceName: 'SlowMist Hacked',
  author: 'SlowMist',
  link: 'https://example.com/reference',
  sourceUrl: JSON.stringify([
    { url: 'https://example.com/reference', label: 'Incident reference' },
    { url: 'https://hacked.slowmist.io/en/', label: 'SlowMist Hacked database' },
  ]),
  metadata: {
    provider: 'slowmist',
    is_web3_incident: true,
    attribution_url: 'https://hacked.slowmist.io/en/',
  },
};

const quillArticle: NewsArticle = {
  id: 'quillmonitor:near-intents',
  title: 'NEAR Intents: Bridge exploit ($3.8M loss)',
  summary: 'Summary pending',
  content: 'Affected project: NEAR Intents',
  category: 'defi-exploits',
  tags: ['quillmonitor'],
  severity: 'critical',
  publishedAt: new Date('2026-09-30T00:00:00.000Z'),
  createdAt: new Date('2026-10-09T14:05:00.000Z'),
  sourceName: 'QuillMonitor',
  author: 'QuillAudits',
  link: 'https://x.com/peckshield/status/1975000000000000001',
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    verification_status: 'unverified',
    incident_date: '2026-09-30',
    amount_lost_usd: 3_800_000,
    amount_display: '$3.8M',
    reference_url: 'https://x.com/peckshield/status/1975000000000000001',
    attribution_url: 'https://www.quillaudits.com/web3-hacks-database',
    summary_origin: 'provider',
  },
};

const vulnerabilityArticle: NewsArticle = {
  id: 'rss-1',
  title: 'Vendor patches actively exploited VPN flaw',
  summary: 'The vendor released fixes for a remote code execution flaw that attackers are already using.',
  content: 'Details',
  category: 'vulnerability-disclosure',
  tags: [],
  severity: 'critical',
  publishedAt: new Date('2026-10-08T10:00:00.000Z'),
  sourceName: 'BleepingComputer',
  link: 'https://www.bleepingcomputer.com/news/security/vendor-patches-vpn-flaw/',
  cveId: 'CVE-2026-12345',
};

const renderDetail = (article: NewsArticle) => render(
  <MemoryRouter>
    <NewsDetail article={article} onBack={vi.fn()} />
  </MemoryRouter>,
);

afterEach(cleanup);

describe('NewsDetail SlowMist attribution', () => {
  it('separates provider attribution from de-duplicated original sources', () => {
    renderDetail(slowMistArticle);

    expect(screen.getByText('Threat intelligence provided by')).not.toBeNull();
    const provider = screen.getByRole('link', { name: 'SlowMist Hacked' });
    expect(provider.getAttribute('href')).toBe('https://hacked.slowmist.io/en/');
    expect(screen.queryByText('by SlowMist')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Original Source' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Incident reference' })).not.toBeNull();
    expect(screen.getAllByText('SlowMist Hacked')).toHaveLength(1);
  });

  it('renders a record whose category is no longer configured', () => {
    renderDetail({ ...slowMistArticle, category: 'retired-category' as unknown as NewsArticle['category'] });
    expect(screen.getByRole('heading', { level: 1, name: slowMistArticle.title })).not.toBeNull();
  });
});

describe('NewsDetail next steps', () => {
  it('gives specific next steps for a Web3 incident instead of a generic action list', () => {
    renderDetail(quillArticle);

    expect(screen.queryByText('Immediate Action Required')).toBeNull();
    expect(screen.getByRole('heading', { name: 'What should I do?' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Revoke.cash' }).getAttribute('href')).toBe('https://revoke.cash');
    expect(screen.getByRole('link', { name: 'Chainabuse' }).getAttribute('href')).toBe('https://www.chainabuse.com');
    expect(screen.getByRole('link', { name: 'SEAL 911' }).getAttribute('href')).toBe('https://securityalliance.org/seal-911');
    expect(screen.getByRole('heading', { name: 'Unconfirmed report' })).not.toBeNull();
    expect(screen.getByRole('button', { name: /^Unconfirmed/ })).not.toBeNull();
    expect(screen.getByText('~$3.8M reported')).not.toBeNull();
    expect(screen.getByText('Exploited Sep 30, 2026')).not.toBeNull();
  });

  it('points vulnerability items to the vendor advisory, NVD and CISA KEV', () => {
    renderDetail(vulnerabilityArticle);

    expect(screen.queryByText('Immediate Action Required')).toBeNull();
    expect(screen.getByRole('link', { name: 'NVD' }).getAttribute('href'))
      .toBe('https://nvd.nist.gov/vuln/detail/CVE-2026-12345');
    expect(screen.getByRole('link', { name: 'CISA Known Exploited Vulnerabilities catalog' }).getAttribute('href'))
      .toBe('https://www.cisa.gov/known-exploited-vulnerabilities-catalog');
    expect(screen.queryByRole('link', { name: 'Revoke.cash' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Status history' })).toBeNull();
  });
});

describe('NewsDetail status and alerts', () => {
  it('shows a status history for a verified incident', () => {
    renderDetail({
      ...quillArticle,
      metadata: { ...quillArticle.metadata, verification_status: 'verified', provider_updated_at: '2026-10-01T08:30:00.000Z' },
    });

    expect(screen.getByRole('heading', { name: 'Status history' })).not.toBeNull();
    expect(screen.getByText('Incident date')).not.toBeNull();
    expect(screen.getByText('First reported on Digibastion')).not.toBeNull();
    expect(screen.getByText('Verified by QuillMonitor')).not.toBeNull();
    expect(screen.queryByRole('heading', { name: 'Unconfirmed report' })).toBeNull();
  });

  it('links to pre-filled email alerts and the Telegram channel', () => {
    renderDetail(quillArticle);

    expect(screen.getByRole('heading', { name: 'Get alerts like this' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Get email alerts' }).getAttribute('href'))
      .toBe('/threat-intel?tab=subscribe&categories=defi-exploits&scope=web3-incidents');
    expect(screen.getByRole('link', { name: 'Join @digibastion on Telegram' }).getAttribute('href'))
      .toBe('https://t.me/digibastion');
    expect(screen.getByText(/Telegram \(@digibastion\) posts new Web3 incidents from QuillMonitor/)).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/high and critical/i);
  });

  it('does not offer Telegram on news items, which never reach the channel', () => {
    renderDetail(vulnerabilityArticle);

    expect(screen.getByRole('heading', { name: 'Get alerts like this' })).not.toBeNull();
    expect(screen.queryByText(/Telegram \(@digibastion\) posts/)).toBeNull();
    expect(screen.queryByRole('link', { name: 'Join @digibastion on Telegram' })).toBeNull();
  });
});

describe('NewsDetail answer line and headings', () => {
  it('opens a Web3 incident with the answer sentence', () => {
    renderDetail({ ...quillArticle, metadata: { ...quillArticle.metadata, project_name: 'NEAR Intents' } });
    const answer = screen.getByTestId('incident-answer');
    expect(answer.textContent).toBe(
      'NEAR Intents lost about $3.8M on 30 Sep 2026, according to QuillMonitor (unconfirmed).',
    );
    // It sits directly under the title.
    expect(answer.previousElementSibling?.tagName).toBe('H1');
  });

  it('does not add an answer sentence to a news item', () => {
    renderDetail(vulnerabilityArticle);
    expect(screen.queryByTestId('incident-answer')).toBeNull();
  });

  it('uses stable h2 headings for the summary, details and source', () => {
    renderDetail(vulnerabilityArticle);
    expect(document.getElementById('what-happened')?.tagName).toBe('H2');
    expect(document.getElementById('details')?.tagName).toBe('H2');
    expect(document.getElementById('source')).not.toBeNull();
  });
});
