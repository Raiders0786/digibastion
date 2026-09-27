import { describe, expect, it } from 'vitest';
import {
  absoluteUrl,
  buildArticleBreadcrumbSchema,
  buildArticleCollectionSchema,
  buildArticleSchema,
  buildNewsArticleSchema,
  buildNewsBreadcrumbSchema,
  buildThreatIntelCollectionSchema,
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
      isAccessibleForFree: true,
      image: {
        url: 'https://www.digibastion.com/og-image.png',
        width: 1920,
        height: 1060,
      },
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

  it('builds news article, breadcrumb, and threat-intel collection schemas', () => {
    const news = {
      id: 'alert/id',
      title: 'Supply-chain alert',
      description: 'A sourced security alert.',
      category: 'supply-chain',
      publishedAt: new Date('2026-09-27T08:30:00.000Z'),
      author: 'Digibastion Security Team',
      tags: ['supply chain'],
      sourceUrl: 'https://example.gov/advisory',
    };

    expect(buildNewsArticleSchema(news)).toMatchObject({
      '@type': 'NewsArticle',
      '@id': 'https://www.digibastion.com/threat-intel/alert%2Fid#article',
      datePublished: '2026-09-27T08:30:00.000Z',
      citation: 'https://example.gov/advisory',
    });
    expect(buildNewsBreadcrumbSchema(news).itemListElement[2]).toMatchObject({
      position: 3,
      item: 'https://www.digibastion.com/threat-intel/alert%2Fid',
    });
    expect(buildThreatIntelCollectionSchema()).toMatchObject({
      '@type': 'CollectionPage',
      url: 'https://www.digibastion.com/threat-intel',
    });
  });
});
