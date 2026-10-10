// Summary helpers shared by the importers and summarize-article. Pure module:
// no Deno or URL imports, so vitest can import it.
import type { SummaryOrigin } from './incident-fields.ts';

const TRAILING_PUNCTUATION = /[\s,;:.\-–—]+$/u;

/**
 * Shortens publisher text to at most maxLength characters, cutting at the last
 * word boundary and ending with "…". A single very long word (a URL, a hash)
 * is cut hard rather than dropping most of the text.
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const room = Math.max(0, maxLength - 1); // one character for the ellipsis
  const window = text.slice(0, room + 1);
  const boundary = window.search(/\s\S*$/);
  const head = boundary > room * 0.6 ? window.slice(0, boundary) : text.slice(0, room);
  return `${head.replace(TRAILING_PUNCTUATION, '')}…`;
}

// QuillMonitor stores "Summary pending" when the provider has no description.
export function isPendingSummary(summary: unknown): boolean {
  if (typeof summary !== 'string') return true;
  const trimmed = summary.trim();
  return trimmed === '' || trimmed.toLowerCase() === 'summary pending';
}

// Merges, never replaces: metadata holds provider fields other code relies on.
export function withSummaryOrigin(metadata: unknown, origin: SummaryOrigin): Record<string, unknown> {
  const existing = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {};
  return { ...existing, summary_origin: origin };
}
