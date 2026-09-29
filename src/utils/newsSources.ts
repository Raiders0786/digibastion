import type { NewsArticle } from '@/types/news';
import { safeExternalUrl } from '@/utils/safeUrl';

export interface NewsSourceLink {
  url: string;
  label: string;
}

const sourceLabel = (value: unknown, url: string): string => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return new URL(url).hostname.replace(/^www\./, '');
};

/** Build a safe, de-duplicated source list while omitting provider attribution pages. */
export function getNewsSourceLinks(article: NewsArticle, omittedUrl?: string | null): NewsSourceLink[] {
  const omitted = safeExternalUrl(omittedUrl);
  const candidates: NewsSourceLink[] = [];

  if (article.sourceUrl) {
    try {
      const parsed: unknown = JSON.parse(article.sourceUrl);
      if (Array.isArray(parsed)) {
        for (const source of parsed) {
          if (typeof source !== 'object' || source === null) continue;
          const candidate = source as Record<string, unknown>;
          const url = safeExternalUrl(candidate.url);
          if (url) candidates.push({ url, label: sourceLabel(candidate.label, url) });
        }
      }
    } catch {
      // RSS sourceUrl values are not article references; article.link remains the fallback.
    }
  }

  const seen = new Set<string>();
  const sources = candidates.filter(({ url }) => {
    if (url === omitted || seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  const primaryUrl = safeExternalUrl(article.link);
  if (sources.length === 0 && primaryUrl && primaryUrl !== omitted) {
    sources.push({
      url: primaryUrl,
      label: article.sourceName?.trim() || sourceLabel(null, primaryUrl),
    });
  }
  return sources;
}
