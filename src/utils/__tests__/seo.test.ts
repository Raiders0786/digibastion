import { describe, expect, it } from 'vitest';
import {
  absoluteUrl,
  buildArticleBreadcrumbSchema,
  buildArticleCollectionSchema,
  buildArticleSchema,
} from '../seo';

const article = {
  slug: 'incident-review',
  title: 'Incident review',
  description: 'A source-backed incident review.',
  category: 'Incident Response',
  publishedAt: '2026-09-27',
  modifiedAt: '2026-09-27',
  author: 'Digibastion Security Team',
  tags: ['incident response'],
  sources: [{ url: 'https://example.gov/advisory' }],
};

describe('SEO schema builders', () => {
  it('normalizes site-relative URLs', () => {
    expect(absoluteUrl('articles')).toBe('https://www.digibastion.com/articles');
    expect(absoluteUrl('/articles')).toBe('https://www.digibastion.com/articles');
    expect(absoluteUrl('https://example.com')).toBe('https://example.com');
  });

  it('builds a complete article graph with citations', () => {
    expect(buildArticleSchema(article)).toMatchObject({
      '@type': 'Article',
      headline: 'Incident review',
      datePublished: '2026-09-27T00:00:00+00:00',
      dateModified: '2026-09-27T00:00:00+00:00',
      keywords: ['incident response'],
      citation: ['https://example.gov/advisory'],
    });
  });

  it('builds hierarchy and collection schemas from the same article data', () => {
    const breadcrumb = buildArticleBreadcrumbSchema(article);
    const collection = buildArticleCollectionSchema([article]);

    expect(breadcrumb.itemListElement).toHaveLength(3);
    expect(breadcrumb.itemListElement[2]).toMatchObject({
      position: 3,
      item: 'https://www.digibastion.com/articles/incident-review',
    });
    expect(collection.mainEntity).toMatchObject({
      numberOfItems: 1,
      itemListElement: [{ position: 1, name: 'Incident review' }],
    });
  });
});
