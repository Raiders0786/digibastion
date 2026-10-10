// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewsCard } from '@/components/news/NewsCard';
import type { NewsArticle } from '@/types/news';

const QM_DATABASE = 'https://www.quillaudits.com/web3-hacks-database';

const preliminaryArticle: NewsArticle = {
  id: 'quill-1',
  title: 'Example Bridge incident',
  summary: 'Summary pending',
  content: 'Incident details',
  category: 'defi-exploits',
  tags: ['quillmonitor'],
  severity: 'high',
  publishedAt: new Date('2026-09-29T00:00:00.000Z'),
  sourceName: 'QuillMonitor',
  isProcessed: true,
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    verification_status: 'unverified',
    summary_origin: 'provider',
    attribution_url: QM_DATABASE,
  },
};

const renderCard = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

afterEach(cleanup);

describe('NewsCard navigation', () => {
  it('renders the title as a crawlable link and opens it in place on a plain click', () => {
    const onClick = vi.fn();
    renderCard(<NewsCard article={preliminaryArticle} onClick={onClick} />);

    const title = screen.getByRole('link', { name: preliminaryArticle.title });
    expect(title.getAttribute('href')).toBe('/threat-intel/quill-1');

    fireEvent.click(title);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.click(title, { ctrlKey: true });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps source links outside the card link', () => {
    const onClick = vi.fn();
    renderCard(<NewsCard article={preliminaryArticle} onClick={onClick} />);

    const source = screen.getByRole('link', { name: 'QuillMonitor' });
    expect(source.getAttribute('href')).toBe(QM_DATABASE);
    expect(source.getAttribute('target')).toBe('_blank');
    expect(source.closest('a[href="/threat-intel/quill-1"]')).toBeNull();

    fireEvent.click(source);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('NewsCard incident presentation', () => {
  it('labels unconfirmed records and keeps pending summaries unlabelled', () => {
    renderCard(<NewsCard article={preliminaryArticle} />);

    expect(screen.getByRole('button', { name: /^Unconfirmed/ })).not.toBeNull();
    expect(screen.getByText('Summary pending')).not.toBeNull();
    expect(screen.queryByText('AI summary')).toBeNull();
    expect(screen.queryByText('Preliminary')).toBeNull();
  });

  it('links the QuillMonitor reference instead of the database page when one exists', () => {
    renderCard(<NewsCard article={{
      ...preliminaryArticle,
      metadata: { ...preliminaryArticle.metadata, reference_url: 'https://x.com/peckshield/status/1975000000000000001' },
    }} />);

    expect(screen.getByRole('link', { name: 'QuillMonitor' }).getAttribute('href'))
      .toBe('https://x.com/peckshield/status/1975000000000000001');
  });

  it('shows confirmed status, both dates, the loss and funds returned', () => {
    renderCard(<NewsCard article={{
      ...preliminaryArticle,
      title: 'NEAR Intents: Bridge exploit ($3.8M loss)',
      createdAt: new Date('2026-10-09T12:00:00.000Z'),
      metadata: {
        ...preliminaryArticle.metadata,
        verification_status: 'verified',
        incident_date: '2026-09-30',
        project_name: 'NEAR Intents',
        amount_lost_usd: 3_800_000,
        amount_display: '$3.8M',
        funds_returned: true,
      },
    }} />);

    expect(screen.getByRole('button', { name: /^Confirmed/ })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /^Unconfirmed/ })).toBeNull();
    expect(screen.getByText('Exploited Sep 30, 2026')).not.toBeNull();
    expect(screen.getByText(/^Added Oct 9/)).not.toBeNull();
    expect(screen.getByText('$3.8M')).not.toBeNull();
    expect(screen.getByText('Funds returned')).not.toBeNull();
  });

  it('shows the AI summary label only when the summary source is AI', () => {
    const rss: NewsArticle = {
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
      isProcessed: true,
    };

    renderCard(<NewsCard article={rss} />);
    expect(screen.queryByText('AI summary')).toBeNull();
    expect(screen.getByRole('link', { name: 'BleepingComputer' })).not.toBeNull();
    cleanup();

    renderCard(<NewsCard article={{ ...rss, metadata: { summary_origin: 'ai' } }} />);
    expect(screen.getByText('AI summary')).not.toBeNull();
  });

  it('renders a record whose category is no longer configured', () => {
    renderCard(<NewsCard article={{ ...preliminaryArticle, category: 'retired-category' as unknown as NewsArticle['category'] }} />);
    expect(screen.getByRole('link', { name: preliminaryArticle.title })).not.toBeNull();
  });
});

describe('NewsCard SlowMist presentation', () => {
  it('names SlowMist as the source without repeating it as the author', () => {
    renderCard(<NewsCard article={{
      ...preliminaryArticle,
      id: 'slowmist:1',
      sourceName: 'SlowMist Hacked',
      author: 'SlowMist',
      isProcessed: true,
      metadata: {
        provider: 'slowmist',
        is_web3_incident: true,
        summary_origin: 'provider-template',
        attribution_url: 'https://hacked.slowmist.io/en/',
      },
    }} />);

    const source = screen.getByRole('link', { name: 'SlowMist Hacked' });
    expect(source.getAttribute('href')).toBe('https://hacked.slowmist.io/en/');
    expect(screen.queryByText('by SlowMist')).toBeNull();
    expect(screen.queryByRole('link', { name: 'QuillMonitor' })).toBeNull();
    expect(screen.queryByText('AI summary')).toBeNull();
  });
});
