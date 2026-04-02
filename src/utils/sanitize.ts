/**
 * Client-side safety net: strip any residual HTML from DB text fields.
 * Handles double/triple-encoded entities from RSS feeds (Cisco, Debian, etc.).
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  let s = text;
  let prev = '';
  // Loop decode → strip until stable (handles double-encoded entities)
  while (s !== prev) {
    prev = s;
    s = s
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&(amp|lt|gt|quot|apos|nbsp|mdash|ndash|hellip|rsquo|lsquo|rdquo|ldquo);/gi, (_, name) => {
        const map: Record<string, string> = {
          amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
          mdash: '—', ndash: '–', hellip: '…', rsquo: '\u2019', lsquo: '\u2018',
          rdquo: '\u201D', ldquo: '\u201C',
        };
        return map[name.toLowerCase()] ?? '';
      });
    s = s.replace(/<[^>]*>/g, '');
  }
  return s.replace(/\s+/g, ' ').trim();
}
