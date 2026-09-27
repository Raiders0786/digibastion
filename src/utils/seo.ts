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
  publishedAt: Date | string;
  author?: string;
  tags: string[];
  image?: string;
  sourceUrl?: string;
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

const publisher = {
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'Digibastion',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl('/favicon.png'),
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
  const url = absoluteUrl(`/threat-intel/${encodeURIComponent(article.id)}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    headline: article.title,
    description: article.description,
    datePublished: isoDate(article.publishedAt),
    inLanguage: 'en-US',
    articleSection: article.category,
    keywords: article.tags,
    image: {
      '@type': 'ImageObject',
      url: absoluteUrl(article.image || '/og-threat-intel.png'),
      width: 1920,
      height: 1060,
    },
    isAccessibleForFree: true,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    author: article.author
      ? { '@type': 'Organization', name: article.author }
      : publisher,
    publisher,
    ...(article.sourceUrl ? { citation: article.sourceUrl } : {}),
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

export const buildThreatIntelCollectionSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${absoluteUrl('/threat-intel')}#collection`,
  name: 'Digibastion Threat Intelligence Feed',
  description: 'Sourced security incidents and alerts covering Web3, DeFi, software supply chains, and operational security.',
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
