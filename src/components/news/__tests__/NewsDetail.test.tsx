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

afterEach(cleanup);

describe('NewsDetail SlowMist attribution', () => {
  it('separates provider attribution from de-duplicated original sources', () => {
    render(
      <MemoryRouter>
        <NewsDetail article={slowMistArticle} onBack={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Threat intelligence provided by')).not.toBeNull();
    const provider = screen.getByRole('link', { name: 'SlowMist Hacked' });
    expect(provider.getAttribute('href')).toBe('https://hacked.slowmist.io/en/');
    expect(screen.queryByText('by SlowMist')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Original Source' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Incident reference' })).not.toBeNull();
    expect(screen.getAllByText('SlowMist Hacked')).toHaveLength(1);
  });
});
