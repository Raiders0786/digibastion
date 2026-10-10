// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewsArticle } from '@/types/news';
import News from '@/pages/News';
import { countActiveFilters } from '@/components/news/FeedToolbar';

const makeArticle = (index: number): NewsArticle => ({
  id: `report-${index}`,
  title: `Report ${index}`,
  summary: `Summary for report ${index}.`,
  content: 'Details.',
  category: 'web3-security',
  severity: 'high',
  tags: [],
  publishedAt: new Date('2026-10-09T08:00:00Z'),
  sourceName: 'Test Source',
  link: `https://example.com/reports/${index}`,
});

const feed = vi.hoisted(() => ({ articles: [] as NewsArticle[] }));
const useNewsArticlesMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useNewsArticles', () => ({
  useNewsArticles: (options: unknown) => {
    useNewsArticlesMock(options);
    return {
      articles: feed.articles,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      refreshFromRSS: vi.fn(),
      refreshWeb3Incidents: vi.fn(),
      summarizeArticles: vi.fn(),
      isRefreshing: false,
      isRefreshingWeb3: false,
      isSummarizing: false,
      feedStatus: {
        source: 'live',
        isStale: false,
        checkedAt: new Date('2026-10-09T08:00:00Z'),
        activeFeedCount: 1,
        checkedFeedCount: 1,
        pipelineCheckedAt: new Date('2026-10-09T08:00:00Z'),
        pipelineIsStale: false,
        newestPublishedAt: new Date('2026-10-09T08:00:00Z'),
      },
      stats: { total: feed.articles.length, critical: 0, high: feed.articles.length, medium: 0, low: 0, info: 0, supplyChain: 0, unconfirmed: 0 },
      statsSource: 'server',
      pagination: { currentPage: 1, totalPages: 1, totalCount: feed.articles.length, hasNextPage: false, hasPrevPage: false },
    };
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/MetaTags', () => ({ MetaTags: () => null }));
vi.mock('@/components/news/RealtimeAlertListener', () => ({ RealtimeAlertListener: () => null }));
vi.mock('@/components/news/RealtimeStatusIndicator', () => ({ RealtimeStatusIndicator: () => null }));
vi.mock('@/components/mobile/PullToRefresh', () => ({ PullToRefresh: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/components/mobile/SwipeableTabs', () => ({ SwipeableTabs: ({ children }: { children: React.ReactNode }) => children }));

const renderAt = (url: string) => {
  const router = createMemoryRouter(
    [
      { path: '/threat-intel', element: <News /> },
      { path: '/threat-intel/:articleId', element: <News /> },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

describe('threat-intel hero and mobile filters', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    feed.articles = [makeArticle(1)];
  });

  it('leads the default Web3 view with the incident hero and both alert channels', async () => {
    renderAt('/threat-intel?categories=web3-security&severities=critical&date=30d');

    expect(await screen.findByRole('heading', { level: 1, name: 'Crypto and Web3 security incidents, as they happen' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Join on Telegram' }).getAttribute('href')).toBe('https://t.me/digibastion');
    const emailHref = screen.getByRole('link', { name: 'Get email alerts' }).getAttribute('href') ?? '';
    expect(emailHref).toContain('tab=subscribe');
    expect(emailHref).toContain('categories=web3-security');
    expect(emailHref).toContain('scope=web3-incidents');
    expect(useNewsArticlesMock).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'web3-incidents' }));
  });

  it('shows the active filter count on the mobile trigger and opens the filter sheet', async () => {
    renderAt('/threat-intel?categories=web3-security&severities=critical&date=30d');

    fireEvent.click(await screen.findByRole('button', { name: 'Filters (3)' }));
    const sheet = await screen.findByRole('dialog', { name: 'Filter feed' });
    expect(within(sheet).getByRole('button', { name: 'Web3 Security' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('uses the broader hero for the all-news scope', async () => {
    renderAt('/threat-intel?scope=all');

    expect(await screen.findByRole('heading', { level: 1, name: 'Security news and incident alerts' })).not.toBeNull();
    expect(useNewsArticlesMock).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'all' }));
  });

  it('inserts one subscribe card after the fifth result', async () => {
    feed.articles = Array.from({ length: 6 }, (_, index) => makeArticle(index + 1));
    renderAt('/threat-intel');

    const cards = await screen.findAllByTestId('inline-subscribe-card');
    expect(cards).toHaveLength(1);
    const fifth = screen.getByRole('link', { name: 'Report 5' });
    const sixth = screen.getByRole('link', { name: 'Report 6' });
    expect(fifth.compareDocumentPosition(cards[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cards[0].compareDocumentPosition(sixth) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('counts every narrowing filter once', () => {
    expect(countActiveFilters({ selectedCategories: [], selectedSeverities: [], dateFilter: 'all', sortBy: 'date' })).toBe(0);
    expect(countActiveFilters({
      selectedCategories: ['web3-security'],
      selectedSeverities: ['critical', 'high'],
      dateFilter: '7d',
      sortBy: 'severity',
    })).toBe(5);
  });
});
