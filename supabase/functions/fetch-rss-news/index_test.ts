import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// ─── Inline the pure functions from index.ts for isolated testing ───────────

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: ' ', mdash: '—', ndash: '–', hellip: '…',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D',
  bull: '•', middot: '·', copy: '©', reg: '®', trade: '™',
  times: '×', divide: '÷', deg: '°', para: '¶', sect: '§',
  laquo: '«', raquo: '»', cent: '¢', pound: '£', euro: '€',
  yen: '¥', micro: 'µ', plusmn: '±', frac12: '½', frac14: '¼', frac34: '¾',
};

function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&#(\d+);/g, (_, code) => {
      const n = parseInt(code, 10);
      return n > 0 && n < 0x10FFFF ? String.fromCodePoint(n) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const n = parseInt(hex, 16);
      return n > 0 && n < 0x10FFFF ? String.fromCodePoint(n) : '';
    })
    .replace(/&([a-zA-Z]+);/g, (full, name) => {
      return NAMED_ENTITIES[name.toLowerCase()] ?? full;
    });
}

function stripHtml(html: string): string {
  if (!html) return '';
  let text = html;
  let prev = '';
  while (text !== prev) {
    prev = text;
    text = decodeHtmlEntities(text);
    text = text.replace(/<[^>]*>/g, '');
  }
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

function cleanSummary(text: string): string {
  if (!text) return '';
  return text
    .replace(/The post\s.*?\sappeared first on\s.*?\.?\s*$/i, '')
    .replace(/Continue reading\s*→?\s*$/i, '')
    .replace(/\[\u2026\]|\[\.\.\.\]/g, '…')
    .trim();
}

function getTagContent(xml: string, tag: string): string {
  const cdataPattern = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(pattern);
  return match ? match[1].trim() : '';
}

function extractLink(xml: string): string {
  const altHref = xml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
    || xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']/i);
  if (altHref) return altHref[1].trim();
  const anyHref = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (anyHref) return anyHref[1].trim();
  return getTagContent(xml, 'link');
}

interface ParsedItem {
  title: string; link: string; description: string; pubDate: string; guid: string;
}

function parseRSSItem(itemXml: string): ParsedItem | null {
  try {
    const title = getTagContent(itemXml, 'title');
    const link = extractLink(itemXml) || getTagContent(itemXml, 'guid');
    const description = getTagContent(itemXml, 'description')
      || getTagContent(itemXml, 'summary')
      || getTagContent(itemXml, 'content');
    const pubDate = getTagContent(itemXml, 'pubDate')
      || getTagContent(itemXml, 'published')
      || getTagContent(itemXml, 'updated')
      || getTagContent(itemXml, 'dc:date');
    const guid = getTagContent(itemXml, 'guid') || getTagContent(itemXml, 'id') || link;
    if (!title || !link) return null;
    return { title, link, description, pubDate, guid };
  } catch { return null; }
}

function parseRSSFeed(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const itemPattern = /<item[^>]*>[\s\S]*?<\/item>|<entry[^>]*>[\s\S]*?<\/entry>/gi;
  const matches = xml.match(itemPattern) || [];
  for (const match of matches) {
    const parsed = parseRSSItem(match);
    if (parsed) items.push(parsed);
  }
  return items;
}

function determineSeverity(matchedKeywords: string[], title: string): string {
  const titleLower = title.toLowerCase();
  const keywordsLower = matchedKeywords.map(k => k.toLowerCase());
  const criticalIndicators = ['critical', 'zero-day', '0day', '0-day', 'rce', 'remote code execution', 'actively exploited'];
  const highIndicators = ['high', 'exploit', 'breach', 'ransomware', 'malware', 'backdoor', 'apt', 'privilege escalation'];
  const mediumIndicators = ['medium', 'vulnerability', 'patch', 'update', 'advisory'];
  for (const ind of criticalIndicators) { if (titleLower.includes(ind) || keywordsLower.includes(ind)) return 'critical'; }
  for (const ind of highIndicators) { if (titleLower.includes(ind) || keywordsLower.includes(ind)) return 'high'; }
  for (const ind of mediumIndicators) { if (titleLower.includes(ind) || keywordsLower.includes(ind)) return 'medium'; }
  return 'low';
}

function extractCVE(content: string): string | null {
  const match = content.match(/CVE-\d{4}-\d{4,}/gi);
  return match ? match[0].toUpperCase() : null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

Deno.test("stripHtml: returns empty for falsy input", () => {
  assertEquals(stripHtml(''), '');
});

Deno.test("stripHtml: strips simple HTML", () => {
  assertEquals(stripHtml('<p>Hello</p>'), 'Hello');
});

Deno.test("stripHtml: handles double-encoded entities", () => {
  assertEquals(stripHtml('&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;'), 'Hello');
});

Deno.test("stripHtml: decodes numeric entities", () => {
  assertEquals(stripHtml('&#8217;'), '\u2019');
});

Deno.test("stripHtml: strips nested tags", () => {
  assertEquals(stripHtml('<p><em>text</em></p>'), 'text');
});

Deno.test("cleanSummary: strips boilerplate", () => {
  assertEquals(cleanSummary('Good content. The post Good content appeared first on Blog.'), 'Good content.');
});

Deno.test("cleanSummary: strips Continue reading", () => {
  assertEquals(cleanSummary('Read this article Continue reading →'), 'Read this article');
});

Deno.test("cleanSummary: handles empty", () => {
  assertEquals(cleanSummary(''), '');
});

Deno.test("parseRSSFeed: extracts RSS 2.0 items", () => {
  const xml = `<rss><channel>
    <item><title>Test Article</title><link>https://example.com/1</link><description>Desc</description><pubDate>Mon, 01 Jan 2025 00:00:00 GMT</pubDate></item>
  </channel></rss>`;
  const items = parseRSSFeed(xml);
  assertEquals(items.length, 1);
  assertEquals(items[0].title, 'Test Article');
  assertEquals(items[0].link, 'https://example.com/1');
});

Deno.test("parseRSSFeed: extracts Atom entries", () => {
  const xml = `<feed><entry><title>Atom Article</title><link rel="alternate" href="https://example.com/2"/><summary>Summary</summary><updated>2025-01-01T00:00:00Z</updated></entry></feed>`;
  const items = parseRSSFeed(xml);
  assertEquals(items.length, 1);
  assertEquals(items[0].title, 'Atom Article');
  assertEquals(items[0].link, 'https://example.com/2');
});

Deno.test("parseRSSFeed: handles CDATA", () => {
  const xml = `<rss><channel><item><title><![CDATA[CDATA Title]]></title><link>https://example.com/3</link><description><![CDATA[<p>HTML in CDATA</p>]]></description></item></channel></rss>`;
  const items = parseRSSFeed(xml);
  assertEquals(items.length, 1);
  assertEquals(items[0].title, 'CDATA Title');
  assertEquals(items[0].description, '<p>HTML in CDATA</p>');
});

Deno.test("parseRSSItem: returns null for missing title", () => {
  const result = parseRSSItem('<item><link>https://example.com</link></item>');
  assertEquals(result, null);
});

Deno.test("parseRSSItem: returns null for missing link", () => {
  const result = parseRSSItem('<item><title>No Link</title></item>');
  assertEquals(result, null);
});

Deno.test("determineSeverity: zero-day → critical", () => {
  assertEquals(determineSeverity([], 'New Zero-Day Found'), 'critical');
});

Deno.test("determineSeverity: ransomware → high", () => {
  assertEquals(determineSeverity(['ransomware'], 'Ransomware Attack'), 'high');
});

Deno.test("determineSeverity: advisory → medium", () => {
  assertEquals(determineSeverity([], 'Security Advisory Released'), 'medium');
});

Deno.test("determineSeverity: generic title → low", () => {
  assertEquals(determineSeverity([], 'Some generic news'), 'low');
});

Deno.test("extractCVE: extracts CVE ID", () => {
  assertEquals(extractCVE('Patch for CVE-2024-12345 released'), 'CVE-2024-12345');
});

Deno.test("extractCVE: returns null when no CVE", () => {
  assertEquals(extractCVE('No CVE mentioned here'), null);
});
