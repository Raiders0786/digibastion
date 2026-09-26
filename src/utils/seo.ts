export const SITE_URL = 'https://www.digibastion.com';

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
}

export const absoluteUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const withUtcTime = (date: string): string => date.includes('T') ? date : `${date}T00:00:00+00:00`;

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
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': absoluteUrl(`/articles/${article.slug}`),
  },
  author: {
    '@type': 'Organization',
    name: article.author,
    url: SITE_URL,
  },
  publisher: {
    '@type': 'Organization',
    name: 'Digibastion',
    url: SITE_URL,
  },
  ...(article.sources?.length
    ? { citation: article.sources.map((source) => source.url) }
    : {}),
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
  description: 'Practical, source-backed guides for protecting crypto accounts, wallets, applications, and teams.',
  url: absoluteUrl('/articles'),
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
