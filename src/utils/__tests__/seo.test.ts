import { describe, expect, it } from 'vitest';
import {
  absoluteUrl,
  buildArticleBreadcrumbSchema,
  buildArticleCollectionSchema,
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildChecklistSchema,
  buildFaqSchema,
  buildNewsArticleSchema,
  buildNewsBreadcrumbSchema,
  buildThreatIntelCollectionSchema,
  buildWeeklySchema,
} from '../seo';
import { faqEntries } from '@/seo/siteFacts';
import { weeklyPublicContent } from '../../../supabase/functions/_shared/weekly-test-fixtures';

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
      createdAt: new Date('2026-09-27T08:30:00.000Z'),
      sourceLabel: 'BleepingComputer',
      tags: ['supply chain'],
      citations: ['https://example.gov/advisory'],
    };

    expect(buildNewsArticleSchema(news)).toMatchObject({
      '@type': 'NewsArticle',
      '@id': 'https://www.digibastion.com/threat-intel/alert%2Fid#article',
      datePublished: '2026-09-27T08:30:00.000Z',
      citation: ['https://example.gov/advisory'],
      isBasedOn: ['https://example.gov/advisory'],
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

describe('honest incident schema', () => {
  const base = {
    id: 'qm-1',
    title: 'Bridge exploit',
    description: 'Example lost about $4.2M.',
    category: 'defi-exploits',
    tags: [],
  };

  it('dates the record by when Digibastion stored it, not the incident date', () => {
    const schema = buildNewsArticleSchema({ ...base, createdAt: '2026-09-29T10:00:00Z', modifiedAt: '2026-09-30T00:00:00Z', sourceLabel: 'QuillMonitor' });
    expect(schema.datePublished.startsWith('2026-09-29')).toBe(true);
    expect(schema.dateModified).toBe('2026-09-30T00:00:00Z');
  });

  it('credits the publisher of an RSS record as the author', () => {
    const schema = buildNewsArticleSchema({ ...base, createdAt: '2026-09-29T10:00:00Z', sourceLabel: 'BleepingComputer' });
    expect(schema.author).toEqual({ '@type': 'Organization', name: 'BleepingComputer' });
  });

  it('omits the author when no source is known and never names Digibastion as author', () => {
    const none = buildNewsArticleSchema({ ...base, createdAt: '2026-09-29T10:00:00Z' });
    expect(none).not.toHaveProperty('author');
    const unknown = buildNewsArticleSchema({ ...base, createdAt: '2026-09-29T10:00:00Z', sourceLabel: 'Source not given' });
    expect(unknown).not.toHaveProperty('author');
    for (const schema of [none, unknown]) {
      expect(JSON.stringify(schema)).not.toContain('"author":{"@type":"Organization","@id":"https://www.digibastion.com/#organization"');
    }
  });

  it('lists http(s) citations once and names the project and chain', () => {
    const schema = buildNewsArticleSchema({
      ...base,
      createdAt: '2026-09-29T10:00:00Z',
      sourceLabel: 'QuillMonitor',
      citations: ['https://a.example/1', 'https://a.example/1', 'javascript:alert(1)', 'https://b.example/2'],
      about: ['Example Protocol', 'Ethereum'],
    });
    expect(schema.citation).toEqual(['https://a.example/1', 'https://b.example/2']);
    expect(schema.isBasedOn).toEqual(['https://a.example/1', 'https://b.example/2']);
    expect(schema.about).toEqual([{ '@type': 'Thing', name: 'Example Protocol' }, { '@type': 'Thing', name: 'Ethereum' }]);
    expect(schema.publisher).toMatchObject({ '@id': 'https://www.digibastion.com/#organization' });
  });
});

describe('weekly, FAQ, checklist and breadcrumb schemas', () => {
  it('describes a weekly issue as a Report with clean incident URLs', () => {
    const content = weeklyPublicContent();
    const schema = buildWeeklySchema(content, '2026-10-12T00:10:00Z');
    expect(schema).toMatchObject({
      '@type': 'Report',
      datePublished: '2026-10-12T00:10:00Z',
      temporalCoverage: '2026-10-05/2026-10-11',
      url: 'https://www.digibastion.com/threat-intel/weekly/2026-10-05',
    });
    const urls = schema.mainEntity.itemListElement.map((entry: { url: string }) => entry.url);
    expect(urls.length).toBe(content.top.length);
    for (const [index, url] of urls.entries()) {
      expect(url).not.toContain('utm_');
      expect(url).toBe(`https://www.digibastion.com/threat-intel/${encodeURIComponent(content.top[index].item.articleId ?? '')}`);
    }
  });

  it('emits one Question per FAQ entry with the visible answer', () => {
    const entries = faqEntries();
    const schema = buildFaqSchema(entries, 'https://www.digibastion.com/faq');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(entries.length);
    schema.mainEntity.forEach((question: { name: string; acceptedAnswer: { text: string } }, index: number) => {
      expect(question.name).toBe(entries[index].question);
      expect(question.acceptedAnswer.text).toBe(entries[index].answer);
    });
  });

  it('describes a checklist as an ItemList, not a HowTo', () => {
    const schema = buildChecklistSchema({ id: 'wallet', title: 'Crypto Wallet Security', items: [{ title: 'Use a hardware wallet' }, { title: 'Back up the seed', description: 'Offline' }] });
    expect(schema['@type']).toBe('ItemList');
    expect(JSON.stringify(schema)).not.toContain('HowTo');
    expect(schema.numberOfItems).toBe(2);
    expect(schema.itemListElement[1]).toMatchObject({ position: 2, name: 'Back up the seed', description: 'Offline' });
  });

  it('builds breadcrumbs with absolute URLs', () => {
    const schema = buildBreadcrumbSchema([{ href: '/', label: 'Home' }, { href: '/faq', label: 'FAQ' }]);
    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.digibastion.com/' },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://www.digibastion.com/faq' },
    ]);
  });
});
