// JSON-LD builders. Pure module (see the boundary rule in src/seo): relative
// imports and _shared modules only, no '@/' alias, no React, no window, so the
// prerender and the Cloudflare Worker can load it outside Vite.
import { canonicalIncidentUrl, canonicalizeUrl } from '../../supabase/functions/_shared/site-urls';
import type { WeeklyPublicContent } from '../../supabase/functions/_shared/newsletter-content';
import { weeklyDescription, weeklyPagePath, weeklySeoTitle } from '../lib/threatIntel/weekly';
import type { PrerenderLink } from '../seo/routeTypes';
import type { FaqEntry } from '../seo/siteFacts';

export const SITE_URL = 'https://www.digibastion.com';
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export interface SeoArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  modifiedAt: string;
  author: string;
  tags: string[];
  sources?: ReadonlyArray<{ url: string }>;
  image?: string;
}

export interface SeoNewsArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  /** When Digibastion stored the record. Never the incident date. */
  createdAt: Date | string;
  modifiedAt?: Date | string;
  /** Who reported it (sourceLabelFor). Digibastion is never the author. */
  sourceLabel?: string;
  /** Every source URL for the record; non-http(s) values are dropped. */
  citations?: readonly string[];
  /** Project and chain names. */
  about?: readonly string[];
  tags: string[];
  image?: string;
  /** Defaults to 1920 x 1060, the size of /og-threat-intel.png. */
  imageWidth?: number;
  imageHeight?: number;
}

export const absoluteUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const DEFAULT_SOCIAL_IMAGE = absoluteUrl('/og-image.png');

const withUtcTime = (date: string): string => date.includes('T') ? date : `${date}T00:00:00+00:00`;

const isoDate = (date: Date | string): string =>
  date instanceof Date ? date.toISOString() : withUtcTime(date);

const isHttpUrl = (value: string): boolean => /^https?:\/\/[^\s]+$/i.test(value.trim());

const uniqueHttpUrls = (values: readonly string[] | undefined): string[] =>
  [...new Set((values ?? []).map((value) => value.trim()).filter(isHttpUrl))];

const publisher = {
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'Digibastion',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl('/favicon-512x512.png'),
    width: 512,
    height: 512,
  },
};

export const buildArticleSchema = (article: SeoArticle) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  '@id': `${absoluteUrl(`/articles/${article.slug}`)}#article`,
  headline: article.title,
  description: article.description,
  datePublished: withUtcTime(article.publishedAt),
  dateModified: withUtcTime(article.modifiedAt),
  inLanguage: 'en-US',
  articleSection: article.category,
  keywords: article.tags,
  image: {
    '@type': 'ImageObject',
    url: absoluteUrl(article.image || DEFAULT_SOCIAL_IMAGE),
    width: 1920,
    height: 1060,
  },
  isAccessibleForFree: true,
  isPartOf: {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'Digibastion',
    url: SITE_URL,
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': absoluteUrl(`/articles/${article.slug}`),
  },
  author: {
    '@type': 'Organization',
    name: article.author,
    url: absoluteUrl('/about'),
  },
  publisher,
  ...(article.sources?.length
    ? { citation: article.sources.map((source) => source.url) }
    : {}),
});

export const buildNewsArticleSchema = (article: SeoNewsArticle) => {
  const url = canonicalIncidentUrl(article.id);
  const citations = uniqueHttpUrls(article.citations);
  const author = article.sourceLabel?.trim();
  const about = (article.about ?? []).map((name) => name.trim()).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    headline: article.title,
    description: article.description,
    datePublished: isoDate(article.createdAt),
    ...(article.modifiedAt ? { dateModified: isoDate(article.modifiedAt) } : {}),
    inLanguage: 'en-US',
    articleSection: article.category,
    keywords: article.tags,
    image: {
      '@type': 'ImageObject',
      url: absoluteUrl(article.image || '/og-threat-intel.png'),
      width: article.imageWidth ?? 1920,
      height: article.imageHeight ?? 1060,
    },
    isAccessibleForFree: true,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    // The source reported it; Digibastion only relays it, so it is the publisher and never the author.
    ...(author && author !== 'Source not given' && !/digibastion/i.test(author)
      ? { author: { '@type': 'Organization', name: author } }
      : {}),
    publisher,
    ...(citations.length ? { isBasedOn: citations, citation: citations } : {}),
    ...(about.length ? { about: about.map((name) => ({ '@type': 'Thing', name })) } : {}),
  };
};

export const buildNewsBreadcrumbSchema = (article: Pick<SeoNewsArticle, 'id' | 'title'>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Threat Intelligence',
      item: absoluteUrl('/threat-intel'),
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: article.title,
      item: absoluteUrl(`/threat-intel/${encodeURIComponent(article.id)}`),
    },
  ],
});

export const buildThreatIntelCollectionSchema = (
  description = 'Crypto hacks, DeFi exploits and phishing from QuillMonitor and other public trackers, one record per incident, each linked to its source.',
) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${absoluteUrl('/threat-intel')}#collection`,
  name: 'Digibastion Threat Intel',
  description,
  url: absoluteUrl('/threat-intel'),
  inLanguage: 'en-US',
  isPartOf: { '@id': WEBSITE_ID },
  publisher,
  about: [
    { '@type': 'Thing', name: 'Web3 security' },
    { '@type': 'Thing', name: 'Cyber threat intelligence' },
    { '@type': 'Thing', name: 'Software supply chain security' },
  ],
});

export const buildArticleBreadcrumbSchema = (article: Pick<SeoArticle, 'slug' | 'title'>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Security Guides',
      item: absoluteUrl('/articles'),
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: article.title,
      item: absoluteUrl(`/articles/${article.slug}`),
    },
  ],
});

export const buildArticleCollectionSchema = (
  articles: ReadonlyArray<Pick<SeoArticle, 'slug' | 'title'>>,
) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${absoluteUrl('/articles')}#collection`,
  name: 'Digibastion Security Guides',
  description: 'Practical security guides plus source-backed incident analysis for people, developers, and teams.',
  url: absoluteUrl('/articles'),
  inLanguage: 'en-US',
  isPartOf: { '@id': WEBSITE_ID },
  publisher,
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/articles/${article.slug}`),
      name: article.title,
    })),
  },
});

/** BreadcrumbList from Home to the current page; pass the current page last. */
export const buildBreadcrumbSchema = (items: readonly PrerenderLink[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: absoluteUrl(item.href),
  })),
});

export type WebPageType = 'WebPage' | 'AboutPage' | 'CollectionPage' | 'ContactPage' | 'FAQPage';

/** A plain page node tied to the site's WebSite and Organization nodes. */
export const buildWebPageSchema = (page: {
  type?: WebPageType;
  path: string;
  name: string;
  description: string;
  aboutOrganization?: boolean;
}) => {
  const url = canonicalizeUrl(page.path) ?? absoluteUrl(page.path);
  return {
    '@context': 'https://schema.org',
    '@type': page.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: page.name,
    description: page.description,
    inLanguage: 'en-US',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    ...(page.aboutOrganization ? { about: { '@id': ORGANIZATION_ID }, mainEntity: { '@id': ORGANIZATION_ID } } : {}),
  };
};

/** FAQPage whose answers are the exact text shown on the page. */
export const buildFaqSchema = (entries: readonly FaqEntry[], pageUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${pageUrl}#faq`,
  url: pageUrl,
  inLanguage: 'en-US',
  mainEntity: entries.map((entry) => ({
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: { '@type': 'Answer', text: entry.answer },
  })),
});

/** A checklist is a list of things to do, not step-by-step instructions, so ItemList rather than HowTo. */
export const buildChecklistSchema = (c: {
  id: string;
  title: string;
  items: ReadonlyArray<{ title: string; description?: string }>;
}) => {
  const url = absoluteUrl(`/category/${encodeURIComponent(c.id)}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${url}#checklist`,
    name: `${c.title} checklist`,
    url,
    numberOfItems: c.items.length,
    itemListElement: c.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      ...(item.description ? { description: item.description } : {}),
    })),
  };
};

/** One weekly deep-dive as a Report covering its week, listing its top incidents by canonical URL. */
export const buildWeeklySchema = (c: WeeklyPublicContent, generatedAt: string) => {
  const url = absoluteUrl(weeklyPagePath(c.weekStart));
  const title = weeklySeoTitle(c);
  return {
    '@context': 'https://schema.org',
    '@type': 'Report',
    '@id': `${url}#report`,
    name: title,
    headline: title,
    description: weeklyDescription(c),
    url,
    datePublished: generatedAt,
    temporalCoverage: `${c.weekStart}/${c.weekEnd}`,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    isPartOf: { '@id': WEBSITE_ID },
    publisher,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: c.top.length,
      itemListElement: c.top.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: entry.item.title,
        url: entry.item.articleId
          ? canonicalIncidentUrl(entry.item.articleId)
          : canonicalizeUrl(entry.item.incidentUrl) ?? absoluteUrl('/threat-intel'),
      })),
    },
  };
};

/** A short list of pages, such as the incidents currently shown on /threat-intel. */
export const buildItemListSchema = (name: string, items: ReadonlyArray<{ url: string; name: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: item.url,
    name: item.name,
  })),
});
