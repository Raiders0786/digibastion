// XML text and attribute escaping for sitemaps and feeds.
// Pure module. No replaceAll: tsconfig lib is ES2020.
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// XML 1.0 forbids most C0 control characters even when escaped. Scraped
// titles occasionally carry them, and one would break the whole document.
// eslint-disable-next-line no-control-regex
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

/** escapeXml after dropping characters XML 1.0 cannot carry at all. */
export function xmlText(value: string): string {
  return escapeXml(value.replace(INVALID_XML_CHARS, ''));
}
