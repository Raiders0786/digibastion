// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NEWS_ARTICLE_COLUMNS } from '@/lib/threatIntel/articleRow';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';
import { useRelatedArticles } from '@/hooks/useRelatedArticles';

const db = vi.hoisted(() => {
  const state: { rows: unknown[] } = { rows: [] };
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'or', 'eq', 'neq', 'order', 'limit']) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data: state.rows, error: null }).then(resolve);
  return { state, query, from: vi.fn(() => query) };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: db.from } }));

const row = (id: string, tags: string[], metadata: Record<string, unknown> = {}) => ({
  id,
  title: `Report ${id}`,
  summary: 'Summary',
  content: 'Body',
  category: 'supply-chain',
  severity: 'high',
  tags,
  affected_technologies: [],
  link: null,
  source_url: null,
  source_name: 'Feed',
  author: null,
  cve_id: null,
  published_at: '2026-10-01T00:00:00Z',
  is_processed: false,
  metadata,
});

describe('useRelatedArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.state.rows = [
      row('plain', []),
      row('duplicate', ['npm'], { duplicate_of_uid: 'quillmonitor:1' }),
      row('tagged', ['NPM']),
      { id: '', title: 'broken' },
    ];
  });

  afterEach(cleanup);

  it('selects public columns, applies the publishable filter and ranks by tag overlap', async () => {
    const tags = ['npm'];
    const { result } = renderHook(() => useRelatedArticles({
      currentArticleId: 'current',
      category: 'supply-chain',
      tags,
      limit: 4,
    }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(db.query.select).toHaveBeenCalledWith(NEWS_ARTICLE_COLUMNS);
    expect(db.query.or).toHaveBeenCalledWith(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER);
    expect(result.current.relatedArticles.map((article) => article.id)).toEqual(['tagged', 'plain']);
  });
});
