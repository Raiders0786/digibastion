// Sitemap XML for generate-sitemap: the dynamic urlset, a plain-text
// fallback and a Google News sitemap.
// Pure module: no Deno, no URL imports, no replaceAll.
import { xmlText } from './xml.ts';

export interface SitemapEntry { loc: string; lastmod?: string | null }
export interface NewsSitemapEntry { loc: string; title: string; publishedAt: string }

/** URLs per sitemap page; below the protocol's 50,000 so a page never nears the limit. */
export const MAX_SITEMAP_URLS = 45_000;
const PROTOCOL_LIMIT = 50_000;
const NEWS_LIMIT = 1_000;

/** YYYY-MM-DD in UTC, or null for anything that is not a date. */
export function sitemapDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString().slice(0, 10);
}

/**
 * The last time the page's content changed: the latest of when we stored
 * the record, when the provider last updated it and the newest logged status
 * change, capped at now. Never news_articles.updated_at, which every sync
 * rewrites.
 */
export function incidentLastmod(
  row: { created_at: string; metadata: unknown },
  latestStatusChangeAt: string | null,
  now: Date = new Date(),
): string | null {
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {};
  const times = [row.created_at, meta.provider_updated_at, latestStatusChangeAt]
    .map((value) => (typeof value === 'string' ? Date.parse(value) : Number.NaN))
    .filter((time) => !Number.isNaN(time));
  if (times.length === 0) return null;
  return new Date(Math.min(Math.max(...times), now.getTime())).toISOString().slice(0, 10);
}

/** Entries on 1-based page `page`; an empty list past the last page. */
export function pageEntries<T>(entries: readonly T[], page: number): T[] {
  const start = (Math.max(1, Math.floor(page)) - 1) * MAX_SITEMAP_URLS;
  return entries.slice(start, start + MAX_SITEMAP_URLS);
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / MAX_SITEMAP_URLS));
}

export function renderUrlset(entries: readonly SitemapEntry[]): string {
  if (entries.length > PROTOCOL_LIMIT) throw new Error('A sitemap may list at most 50,000 URLs');
  const body = entries.map((entry) => {
    const lastmod = entry.lastmod ? `\n  <lastmod>${xmlText(entry.lastmod)}</lastmod>` : '';
    return `<url>\n  <loc>${xmlText(entry.loc)}</loc>${lastmod}\n</url>\n`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}</urlset>\n`;
}

export function renderUrlText(entries: readonly SitemapEntry[]): string {
  return entries.map((entry) => `${entry.loc}\n`).join('');
}

export function renderNewsSitemap(entries: readonly NewsSitemapEntry[]): string {
  const body = entries
    .filter((entry) => !Number.isNaN(Date.parse(entry.publishedAt)))
    .slice(0, NEWS_LIMIT)
    .map((entry) => `<url>
  <loc>${xmlText(entry.loc)}</loc>
  <news:news>
    <news:publication><news:name>Digibastion</news:name><news:language>en</news:language></news:publication>
    <news:publication_date>${new Date(entry.publishedAt).toISOString()}</news:publication_date>
    <news:title>${xmlText(entry.title)}</news:title>
  </news:news>
</url>
`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${body}</urlset>
`;
}
