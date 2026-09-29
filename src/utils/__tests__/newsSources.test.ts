import { describe, expect, it } from 'vitest';
import type { NewsArticle } from '@/types/news';
import { getNewsSourceLinks } from '@/utils/newsSources';

const article: NewsArticle = {
  id: 'slowmist:1',
  title: 'SlowMist incident',
  summary: 'Incident summary',
  content: 'Incident details',
  category: 'web3-security',
  tags: [],
  severity: 'high',
  publishedAt: new Date('2026-09-29T00:00:00Z'),
  sourceName: 'SlowMist Hacked',
  link: 'https://hacked.slowmist.io/en/incident/1',
};

describe('getNewsSourceLinks', () => {
  it('keeps original references while omitting duplicate provider attribution', () => {
    const sources = getNewsSourceLinks({
      ...article,
      sourceUrl: JSON.stringify([
        { url: 'https://hacked.slowmist.io/en/', label: 'SlowMist Hacked' },
        { url: 'https://hacked.slowmist.io/en/incident/1', label: 'SlowMist incident report' },
        { url: 'https://example.com/reference', label: 'Original reference' },
        { url: 'https://example.com/reference', label: 'Duplicate reference' },
        { url: 'javascript:alert(1)', label: 'Unsafe' },
      ]),
    }, 'https://hacked.slowmist.io/en/');

    expect(sources).toEqual([
      { url: 'https://hacked.slowmist.io/en/incident/1', label: 'SlowMist incident report' },
      { url: 'https://example.com/reference', label: 'Original reference' },
    ]);
  });

  it('falls back to the article link when structured sources are unavailable', () => {
    expect(getNewsSourceLinks(article)).toEqual([
      { url: 'https://hacked.slowmist.io/en/incident/1', label: 'SlowMist Hacked' },
    ]);
  });
});
