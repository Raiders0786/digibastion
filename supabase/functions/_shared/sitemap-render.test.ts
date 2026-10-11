// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  incidentLastmod, MAX_SITEMAP_URLS, pageCount, pageEntries, renderNewsSitemap, renderUrlset, renderUrlText, sitemapDate,
} from './sitemap-render';
import { escapeXml, xmlText } from './xml';

const parses = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml').getElementsByTagName('parsererror').length === 0;

describe('xml', () => {
  it('escapes the five XML characters', () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe('a &amp; b &lt; c &gt; d &quot; e &apos; f');
  });
  it('drops control characters XML cannot carry', () => {
    expect(xmlText('a\u0000b\u0008c\td\ne')).toBe('abc\td\ne');
  });
});

describe('sitemap-render', () => {
  it('renders valid XML with escaped locs', () => {
    const xml = renderUrlset([{ loc: 'https://www.digibastion.com/threat-intel/a?x=1&y=2', lastmod: '2026-10-01' }]);
    expect(parses(xml)).toBe(true);
    expect(xml).toContain('<loc>https://www.digibastion.com/threat-intel/a?x=1&amp;y=2</loc>');
    expect(xml).toContain('<lastmod>2026-10-01</lastmod>');
  });
  it('renders a valid empty urlset', () => {
    expect(parses(renderUrlset([]))).toBe(true);
  });
  it('omits lastmod when unknown', () => {
    expect(renderUrlset([{ loc: 'https://www.digibastion.com/', lastmod: null }])).not.toContain('<lastmod>');
  });
  it('refuses more than 50,000 URLs and pages at 45,000', () => {
    const many = Array.from({ length: 50_001 }, (_, i) => ({ loc: `https://www.digibastion.com/threat-intel/${i}` }));
    expect(() => renderUrlset(many)).toThrow(/50,000/);
    expect(MAX_SITEMAP_URLS).toBe(45_000);
    expect(pageEntries(many, 1)).toHaveLength(45_000);
    expect(pageEntries(many, 2)).toHaveLength(5_001);
    expect(pageEntries(many, 3)).toHaveLength(0);
    expect(pageCount(many.length)).toBe(2);
    expect(pageCount(0)).toBe(1);
  });
  it('picks lastmod from created_at, provider_updated_at and status changes, never the future', () => {
    const now = new Date('2026-10-11T12:00:00Z');
    expect(incidentLastmod({ created_at: '2026-09-29T10:00:00Z', metadata: { provider_updated_at: '2024-10-25T00:00:00Z' } }, null, now)).toBe('2026-09-29');
    expect(incidentLastmod({ created_at: '2026-09-29T10:00:00Z', metadata: { provider_updated_at: '2026-10-02T00:00:00Z' } }, '2026-10-05T00:00:00Z', now)).toBe('2026-10-05');
    expect(incidentLastmod({ created_at: '2026-09-29T10:00:00Z', metadata: { provider_updated_at: '2027-01-01T00:00:00Z' } }, null, now)).toBe('2026-10-11');
    expect(incidentLastmod({ created_at: 'nope', metadata: null }, null, now)).toBeNull();
    expect(sitemapDate('nope')).toBeNull();
    expect(sitemapDate('2026-10-05T23:30:00Z')).toBe('2026-10-05');
  });
  it('renders a valid Google News sitemap with escaped titles', () => {
    const xml = renderNewsSitemap([{ loc: 'https://www.digibastion.com/threat-intel/a', title: 'A & B <exploit> 🚨', publishedAt: '2026-10-11T02:20:00Z' }]);
    expect(parses(xml)).toBe(true);
    expect(xml).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
    expect(xml).toContain('<news:name>Digibastion</news:name>');
    expect(xml).toContain('<news:title>A &amp; B &lt;exploit&gt; 🚨</news:title>');
    expect(xml).toContain('<news:publication_date>2026-10-11T02:20:00.000Z</news:publication_date>');
  });
  it('skips news entries with a bad date and caps at 1,000', () => {
    expect(renderNewsSitemap([{ loc: 'https://www.digibastion.com/threat-intel/a', title: 'x', publishedAt: 'bad' }])).not.toContain('<url>');
    const many = Array.from({ length: 1_200 }, (_, i) => ({ loc: `https://www.digibastion.com/threat-intel/${i}`, title: 't', publishedAt: '2026-10-11T00:00:00Z' }));
    expect(renderNewsSitemap(many).match(/<url>/g)).toHaveLength(1_000);
  });
  it('renders the text fallback', () => {
    expect(renderUrlText([{ loc: 'https://www.digibastion.com/a' }, { loc: 'https://www.digibastion.com/b' }]))
      .toBe('https://www.digibastion.com/a\nhttps://www.digibastion.com/b\n');
  });
});
