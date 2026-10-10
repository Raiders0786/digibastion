import { describe, expect, it } from 'vitest';
import {
  getDuplicateOfUid,
  isPublishable,
  mapNewsArticleRow,
  mapPublishableNewsArticleRows,
  NEWS_ARTICLE_COLUMNS,
  PUBLISHABLE_POSTGREST_FILTER,
} from '@/lib/threatIntel/articleRow';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';

const baseRow = {
  id: '6f1c2d4e-0000-4000-8000-000000000001',
  title: 'Bridge &amp; <b>Router</b> drained',
  summary: 'Attacker drained the bridge.',
  content: '<p>Full report</p>',
  category: 'web3-security',
  severity: 'critical',
  tags: ['bridge', 7, ''],
  affected_technologies: ['Ethereum'],
  link: 'https://example.com/report',
  source_url: '',
  source_name: 'QuillMonitor',
  author: null,
  cve_id: null,
  published_at: '2026-10-01T12:00:00Z',
  is_processed: true,
  metadata: { provider: 'quillmonitor', verification_status: 'verified' },
};

describe('NEWS_ARTICLE_COLUMNS', () => {
  it('selects only public card and detail fields', () => {
    const columns = NEWS_ARTICLE_COLUMNS.split(',');
    expect(columns).toContain('metadata');
    expect(columns).not.toContain('raw_content');
    expect(columns).not.toContain('search_vector');
  });
});

describe('mapNewsArticleRow', () => {
  it('maps and sanitizes a database row', () => {
    expect(mapNewsArticleRow(baseRow)).toEqual({
      id: baseRow.id,
      title: 'Bridge & Router drained',
      summary: 'Attacker drained the bridge.',
      content: 'Full report',
      category: 'web3-security',
      tags: ['bridge'],
      severity: 'critical',
      sourceUrl: undefined,
      link: 'https://example.com/report',
      publishedAt: new Date('2026-10-01T12:00:00Z'),
      affectedTechnologies: ['Ethereum'],
      author: undefined,
      cveId: undefined,
      isProcessed: true,
      sourceName: 'QuillMonitor',
      metadata: { provider: 'quillmonitor', verification_status: 'verified' },
    });
  });

  it('falls back to the summary when content is empty', () => {
    expect(mapNewsArticleRow({ ...baseRow, content: '   ' })?.content).toBe('Attacker drained the bridge.');
  });

  it('normalizes unknown severity to info and keeps unknown categories for the display fallback', () => {
    const article = mapNewsArticleRow({ ...baseRow, severity: 'severe', category: 'legacy-feed' });
    expect(article?.severity).toBe('info');
    expect(article?.category).toBe('legacy-feed');
  });

  it('uses vulnerability-disclosure when the category is missing', () => {
    expect(mapNewsArticleRow({ ...baseRow, category: null })?.category).toBe('vulnerability-disclosure');
  });

  it('drops metadata that is not a plain object', () => {
    expect(mapNewsArticleRow({ ...baseRow, metadata: ['x'] })?.metadata).toBeUndefined();
  });

  it.each([
    ['null', null],
    ['an array', [baseRow]],
    ['a row without an id', { ...baseRow, id: '' }],
    ['a row without a title', { ...baseRow, title: '<b></b>' }],
    ['a row with an invalid date', { ...baseRow, published_at: 'not a date' }],
  ])('returns null for %s', (_label, row) => {
    expect(mapNewsArticleRow(row)).toBeNull();
  });
});

describe('isPublishable', () => {
  it.each([
    [undefined, true],
    [null, true],
    [{}, true],
    [{ classification_relevant: true }, true],
    [{ duplicate_of_uid: null }, true],
    [{ classification_relevant: false }, false],
    [{ classification_relevant: 'false' }, false],
    [{ duplicate_of_uid: 'quillmonitor:42' }, false],
    [{ duplicate_of_uid: '' }, false],
  ])('isPublishable(%j) is %s', (metadata, expected) => {
    expect(isPublishable(metadata)).toBe(expected);
  });

  it('reads the primary uid of a merged duplicate', () => {
    expect(getDuplicateOfUid({ duplicate_of_uid: 'quillmonitor:42' })).toBe('quillmonitor:42');
    expect(getDuplicateOfUid({ duplicate_of_uid: '' })).toBeNull();
    expect(getDuplicateOfUid(undefined)).toBeNull();
  });
});

describe('mapPublishableNewsArticleRows', () => {
  it('drops invalid, rejected and duplicate rows', () => {
    const rows = [
      baseRow,
      { ...baseRow, id: 'dup', metadata: { duplicate_of_uid: 'quillmonitor:1' } },
      { ...baseRow, id: 'rejected', metadata: { classification_relevant: false } },
      { ...baseRow, id: '' },
    ];
    expect(mapPublishableNewsArticleRows(rows).map((article) => article.id)).toEqual([baseRow.id]);
  });

  it('returns an empty list for non-array input', () => {
    expect(mapPublishableNewsArticleRows(null)).toEqual([]);
  });
});

describe('publishable PostgREST filter', () => {
  it('excludes classifier rejections and merged duplicates in one or() group', () => {
    expect(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER).toBe(
      'and(or(metadata->>classification_relevant.is.null,metadata->>classification_relevant.neq.false),metadata->>duplicate_of_uid.is.null)',
    );
    expect(PUBLISHABLE_POSTGREST_FILTER).toBe(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER);
  });
});
