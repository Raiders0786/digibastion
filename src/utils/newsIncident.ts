import type { NewsArticle, NewsCategory } from '@/types/news';

const LEGACY_INCIDENT_PROVIDERS = new Set(['quillmonitor', 'web3-incidents', 'web3']);
const LEGACY_WEB3_CATEGORIES = new Set<NewsCategory>(['web3-security', 'defi-exploits']);

type IncidentArticle = Pick<NewsArticle, 'category' | 'metadata' | 'sourceName'>;

export const WEB3_INCIDENT_POSTGREST_FILTER = [
  'metadata->>is_web3_incident.eq.true',
  'and(metadata->>is_web3_incident.is.null,metadata->>provider.in.(quillmonitor,web3-incidents,web3))',
].join(',');

export const WEB3_DOMAIN_POSTGREST_FILTER = [
  'metadata->>security_domain.eq.web3',
  'and(metadata->>security_domain.is.null,metadata->>is_web3_incident.eq.true)',
  'and(metadata->>security_domain.is.null,category.in.(web3-security,defi-exploits))',
].join(',');

export const CLASSIFICATION_RELEVANCE_POSTGREST_FILTER = [
  'metadata->>classification_relevant.is.null',
  'metadata->>classification_relevant.neq.false',
].join(',');

export function isClassificationRelevant(article: Pick<NewsArticle, 'metadata'>): boolean {
  return article.metadata?.classification_relevant !== false;
}

export function isQuillMonitorArticle(article: Pick<NewsArticle, 'metadata' | 'sourceName'>): boolean {
  return article.metadata?.provider === 'quillmonitor' || article.sourceName === 'QuillMonitor';
}

export function isPreliminaryQuillMonitorArticle(
  article: Pick<NewsArticle, 'metadata' | 'sourceName'>,
): boolean {
  return isQuillMonitorArticle(article) && article.metadata?.verification_status === 'unverified';
}

export function isWeb3Incident(article: Pick<NewsArticle, 'metadata' | 'sourceName'>): boolean {
  if (article.metadata?.is_web3_incident === true) return true;
  if (article.metadata?.is_web3_incident === false) return false;
  return LEGACY_INCIDENT_PROVIDERS.has(article.metadata?.provider || '') || isQuillMonitorArticle(article);
}

export function isWeb3SecurityDomain(article: IncidentArticle): boolean {
  if (article.metadata?.security_domain) return article.metadata.security_domain === 'web3';
  return isWeb3Incident(article) || LEGACY_WEB3_CATEGORIES.has(article.category);
}

export function buildCategoryPostgrestFilter(categories: NewsCategory[]): string | null {
  if (!categories.includes('web3-security')) return null;

  const otherCategories = categories.filter((category) => category !== 'web3-security' && category !== 'defi-exploits');
  return [
    WEB3_DOMAIN_POSTGREST_FILTER,
    ...(otherCategories.length > 0 ? [`category.in.(${otherCategories.join(',')})`] : []),
  ].join(',');
}
