// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewsArticle } from '@/types/news';
import News from '@/pages/News';

const article: NewsArticle = {
  id: 'article-1',
  title: 'Test threat report',
  summary: 'A test report used to verify route-driven navigation.',
  content: 'Report details.',
  category: 'vulnerability-disclosure',
  severity: 'high',
  tags: [],
  publishedAt: new Date('2026-09-27T08:00:00Z'),
  sourceName: 'Test Source',
};

const useNewsArticlesMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useNewsArticles', () => ({
  useNewsArticles: (options: unknown) => {
    useNewsArticlesMock(options);
    return ({
    articles: [article],
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
      checkedAt: new Date('2026-09-27T08:00:00Z'),
      activeFeedCount: 1,
      checkedFeedCount: 1,
      pipelineCheckedAt: new Date('2026-09-27T08:00:00Z'),
      pipelineIsStale: false,
      newestPublishedAt: article.publishedAt,
    },
    stats: { total: 1, critical: 0, high: 1, supplyChain: 0, aiSummarized: 0, web3Incidents: 0 },
    pagination: { currentPage: 1, totalPages: 1, totalCount: 1, hasNextPage: false, hasPrevPage: false },
    });
  },
}));

const deepLink = vi.hoisted(() => {
  const rows: Record<string, unknown> = {};
  const from = vi.fn(() => {
    const filters: Record<string, unknown> = {};
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn((column: string, value: unknown) => {
      filters[column] = value;
      return chain;
    });
    chain.maybeSingle = vi.fn(async () => {
      const key = filters.id !== undefined ? `id:${String(filters.id)}` : `uid:${String(filters.uid)}`;
      return { data: rows[key] ?? null, error: null };
    });
    return chain;
  });
  return { rows, from };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: deepLink.from,
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
vi.mock('@/components/news/NewsDetail', () => ({
  NewsDetail: ({ article: selected }: { article: NewsArticle }) => <div data-testid="article-detail">{selected.title}</div>,
}));

function renderAt(url: string) {
  const router = createMemoryRouter(
    [
      { path: '/threat-intel', element: <News /> },
      { path: '/threat-intel/:articleId', element: <News /> },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('threat-intel article navigation', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(deepLink.rows)) delete deepLink.rows[key];
  });

  it('hydrates shareable feed filters and keeps them in the URL when scope changes', async () => {
    const router = createMemoryRouter(
      [
        { path: '/threat-intel', element: <News /> },
        { path: '/threat-intel/:articleId', element: <News /> },
      ],
      {
        initialEntries: ['/threat-intel?scope=web3-incidents&categories=web3-security&q=bridge&date=30d&sort=severity&page=2'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByDisplayValue('bridge')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Web3 Incidents' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Web3 Security' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(useNewsArticlesMock).toHaveBeenLastCalledWith(expect.objectContaining({
      categories: ['web3-security'],
      searchQuery: 'bridge',
      dateFilter: '30d',
      sortBy: 'severity',
      view: 'web3-incidents',
      page: 2,
    })));

    fireEvent.click(screen.getByRole('button', { name: 'DeFi Exploits' }));
    await waitFor(() => {
      expect(router.state.location.search).toContain('scope=web3-incidents');
      expect(router.state.location.search).toContain('categories=web3-security%2Cdefi-exploits');
      expect(useNewsArticlesMock).toHaveBeenLastCalledWith(expect.objectContaining({
        categories: ['web3-security', 'defi-exploits'],
        view: 'web3-incidents',
      }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'All Intelligence' }));
    await waitFor(() => {
      expect(router.state.location.search).not.toContain('scope=');
      expect(router.state.location.search).toContain('categories=web3-security%2Cdefi-exploits');
      expect(router.state.location.search).not.toContain('page=2');
    });
  });

  it('returns to the feed when browser Back removes the article route', async () => {
    const router = createMemoryRouter(
      [
        { path: '/threat-intel', element: <News /> },
        { path: '/threat-intel/:articleId', element: <News /> },
      ],
      {
        initialEntries: ['/threat-intel', '/threat-intel/article-1'],
        initialIndex: 1,
      },
    );

    render(<RouterProvider router={router} />);
    expect((await screen.findByTestId('article-detail')).textContent).toContain('Test threat report');

    await act(async () => {
      await router.navigate(-1);
    });

    await waitFor(() => expect(screen.queryByTestId('article-detail')).toBeNull());
    expect(screen.getByRole('heading', { name: 'Threat Intelligence Feed' })).not.toBeNull();
  });

  it('redirects a deep link for a merged duplicate to the primary incident', async () => {
    deepLink.rows['id:dup-1'] = {
      id: 'dup-1',
      title: 'Duplicate report',
      summary: 'Summary',
      content: 'Body',
      category: 'web3-security',
      severity: 'critical',
      tags: [],
      affected_technologies: [],
      link: null,
      source_url: null,
      source_name: 'SlowMist Hacked',
      author: null,
      cve_id: null,
      published_at: '2026-09-27T08:00:00Z',
      is_processed: false,
      metadata: { classification_relevant: false, duplicate_of_uid: 'quillmonitor:42' },
    };
    deepLink.rows['uid:quillmonitor:42'] = { id: 'article-1' };

    const router = renderAt('/threat-intel/dup-1');

    await waitFor(() => expect(router.state.location.pathname).toBe('/threat-intel/article-1'));
    expect((await screen.findByTestId('article-detail')).textContent).toContain('Test threat report');
    expect(deepLink.from).toHaveBeenCalledWith('news_articles');
  });

  it('does not follow a merged duplicate whose primary is itself a duplicate', async () => {
    deepLink.rows['id:dup-2'] = {
      id: 'dup-2',
      title: 'Duplicate report',
      summary: 'Summary',
      content: 'Body',
      category: 'web3-security',
      severity: 'critical',
      tags: [],
      affected_technologies: [],
      link: null,
      source_url: null,
      source_name: 'SlowMist Hacked',
      author: null,
      cve_id: null,
      published_at: '2026-09-27T08:00:00Z',
      is_processed: false,
      metadata: { duplicate_of_uid: 'slowmist:7' },
    };
    deepLink.rows['uid:slowmist:7'] = { id: 'dup-3', metadata: { duplicate_of_uid: 'web3-incidents:9' } };

    const router = renderAt('/threat-intel/dup-2');

    const uidLookups = () => deepLink.from.mock.results
      .filter((result) => (result.value as { eq: { mock: { calls: unknown[][] } } }).eq.mock.calls.some(([column]) => column === 'uid'))
      .length;
    await waitFor(() => expect(uidLookups()).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(router.state.location.pathname).toBe('/threat-intel/dup-2');
    expect(screen.queryByTestId('article-detail')).toBeNull();
  });
});
