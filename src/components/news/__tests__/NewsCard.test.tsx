// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewsCard } from '@/components/news/NewsCard';
import type { NewsArticle } from '@/types/news';

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
    attribution_url: 'https://www.quillaudits.com/web3-hacks-database',
  },
};

afterEach(cleanup);

describe('NewsCard QuillMonitor presentation', () => {
  it('labels preliminary records, preserves pending summaries, and links attribution', () => {
    const onClick = vi.fn();
    render(<NewsCard article={preliminaryArticle} onClick={onClick} />);

    expect(screen.getByText('Preliminary')).not.toBeNull();
    expect(screen.getByText('Summary pending')).not.toBeNull();
    expect(screen.queryByText('AI Summary')).toBeNull();
    const attribution = screen.getByRole('link', { name: 'Powered by QuillMonitor' });
    expect(attribution.getAttribute('href')).toBe('https://www.quillaudits.com/web3-hacks-database');

    fireEvent.click(attribution);
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: preliminaryArticle.title }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not label verified records as preliminary', () => {
    render(<NewsCard
      article={{
        ...preliminaryArticle,
        metadata: { ...preliminaryArticle.metadata, verification_status: 'verified' },
      }}
    />);
    expect(screen.queryByText('Preliminary')).toBeNull();
  });
});

describe('NewsCard SlowMist presentation', () => {
  it('shows a compact provider badge without duplicating the provider as author', () => {
    render(<NewsCard article={{
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

    const source = screen.getByRole('link', { name: 'Source: SlowMist Hacked' });
    expect(source.getAttribute('href')).toBe('https://hacked.slowmist.io/en/');
    expect(screen.queryByText('by SlowMist')).toBeNull();
    expect(screen.queryByText('Powered by QuillMonitor')).toBeNull();
    expect(screen.queryByText('AI Summary')).toBeNull();
  });
});
