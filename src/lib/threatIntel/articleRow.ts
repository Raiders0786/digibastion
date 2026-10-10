import type { NewsArticle, NewsCategory } from '@/types/news';
import { sanitizeText } from '@/utils/sanitize';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';
import { isSeverityLevel } from '@/lib/threatIntel/taxonomy';

/**
 * Public card and detail columns. Do not use select('*'): raw_content and
 * search_vector are large and never needed in the browser.
 */
export const NEWS_ARTICLE_COLUMNS = 'id,title,summary,content,category,severity,tags,affected_technologies,link,source_url,source_name,author,cve_id,published_at,is_processed,metadata' as const;

/** PostgREST filter for one `.or()` call that keeps only publishable rows (see isPublishable). */
export const PUBLISHABLE_POSTGREST_FILTER = CLASSIFICATION_RELEVANCE_POSTGREST_FILTER;

// The server classifier's own default (supabase/functions/_shared/rss-classifier.ts).
const FALLBACK_CATEGORY: NewsCategory = 'vulnerability-disclosure';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Convert one news_articles row (table select or search_news_articles RPC) into
 * a NewsArticle. Returns null when the row has no id, no title after
 * sanitizing, or no valid published_at.
 */
export function mapNewsArticleRow(row: unknown): NewsArticle | null {
  if (!isRecord(row)) return null;

  const id = typeof row.id === 'string' ? row.id.trim() : typeof row.id === 'number' ? String(row.id) : '';
  const title = sanitizeText(typeof row.title === 'string' ? row.title : '');
  const publishedAt = parseDate(row.published_at);
  if (!id || !title || !publishedAt) return null;

  const summary = sanitizeText(typeof row.summary === 'string' ? row.summary : '');
  const content = typeof row.content === 'string' && row.content.trim() !== ''
    ? sanitizeText(row.content)
    : summary;

  return {
    id,
    title,
    summary,
    content,
    // Unknown categories are kept as-is and rendered through getCategoryConfig().
    category: (optionalText(row.category) ?? FALLBACK_CATEGORY) as NewsCategory,
    tags: stringList(row.tags),
    severity: isSeverityLevel(row.severity) ? row.severity : 'info',
    sourceUrl: optionalText(row.source_url),
    link: optionalText(row.link),
    publishedAt,
    affectedTechnologies: stringList(row.affected_technologies),
    author: optionalText(row.author),
    cveId: optionalText(row.cve_id),
    isProcessed: row.is_processed === true,
    sourceName: optionalText(row.source_name),
    metadata: isRecord(row.metadata) ? (row.metadata as NewsArticle['metadata']) : undefined,
  };
}

/**
 * False when the classifier rejected the row or the cross-provider matcher
 * merged it into another record. Same rule as PUBLISHABLE_POSTGREST_FILTER and
 * the SQL predicate in search_news_articles / count_news_articles / threat_intel_stats.
 */
export function isPublishable(metadata: unknown): boolean {
  if (!isRecord(metadata)) return true;
  if (metadata.classification_relevant === false || metadata.classification_relevant === 'false') return false;
  return metadata.duplicate_of_uid === undefined || metadata.duplicate_of_uid === null;
}

/** The uid of the primary record when this row is a merged duplicate. */
export function getDuplicateOfUid(metadata: unknown): string | null {
  if (!isRecord(metadata)) return null;
  const uid = metadata.duplicate_of_uid;
  return typeof uid === 'string' && uid.trim() !== '' ? uid.trim() : null;
}

export function mapPublishableNewsArticleRows(rows: unknown): NewsArticle[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(mapNewsArticleRow)
    .filter((article): article is NewsArticle => article !== null && isPublishable(article.metadata));
}
