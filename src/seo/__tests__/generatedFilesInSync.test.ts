import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { getArticleContent } from '@/data/articleContent';
import { articlesMeta } from '@/data/articlesData';
import { initialSecurityData } from '@/data/securityData';
import { toolCategories } from '@/data/tools/categories';
import { buildLlmsFullTxt, buildLlmsTxt, buildSitemapIndexXml, buildStaticSitemapXml } from '../staticFiles';

const deps = {
  articles: articlesMeta,
  categories: initialSecurityData,
  toolCount: toolCategories.reduce((n, c) => n + c.tools.length, 0),
  guideHtml: (slug: string) => {
    const node = getArticleContent(slug);
    return node ? renderToStaticMarkup(createElement(StaticRouter, { location: '/' }, node)) : null;
  },
};
const read = (name: string) => readFileSync(resolve(process.cwd(), 'public', name), 'utf8');

describe('generated SEO files match the committed copies (run npm run seo:generate)', () => {
  it('sitemap.xml', () => expect(read('sitemap.xml')).toBe(buildStaticSitemapXml(deps)));
  it('sitemap-index.xml', () => expect(read('sitemap-index.xml')).toBe(buildSitemapIndexXml(deps)));
  it('llms.txt', () => expect(read('llms.txt')).toBe(buildLlmsTxt(deps)));
  it('llms-full.txt', () => expect(read('llms-full.txt')).toBe(buildLlmsFullTxt(deps)));
  it('llms.txt uses absolute URLs only', () => {
    expect(read('llms.txt')).not.toMatch(/\]\(\//);
  });
});

describe('generated SEO file content', () => {
  const sitemap = buildStaticSitemapXml(deps);
  const llms = buildLlmsTxt(deps);
  const full = buildLlmsFullTxt(deps);

  it('lists every static page, checklist and guide once, with a lastmod', () => {
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs).size).toBe(locs.length);
    expect(locs).toEqual(expect.arrayContaining([
      'https://www.digibastion.com/',
      'https://www.digibastion.com/faq',
      'https://www.digibastion.com/threat-intel/weekly',
      'https://www.digibastion.com/tools',
      'https://www.digibastion.com/category/opsec',
    ]));
    expect(locs.filter((loc) => loc.includes('/articles/'))).toHaveLength(articlesMeta.length);
    expect(locs.filter((loc) => loc.includes('/category/'))).toHaveLength(initialSecurityData.length);
    expect((sitemap.match(/<lastmod>/g) ?? []).length).toBe(locs.length);
    expect(sitemap).not.toMatch(/\/news|\/admin|\/verify-email|\/manage-subscription|\/unsubscribe|\/quiz-result|utm_/);
  });

  it('points the sitemap index at the static sitemap with its newest lastmod', () => {
    const newest = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]).sort().pop();
    expect(buildSitemapIndexXml(deps)).toContain('<loc>https://www.digibastion.com/sitemap.xml</loc>');
    expect(buildSitemapIndexXml(deps)).toContain(`<lastmod>${newest}</lastmod>`);
  });

  it('keeps llms.txt honest and complete', () => {
    expect(llms.startsWith('# Digibastion\n\n> Digibastion is a free Web3 security site.')).toBe(true);
    expect(llms).toMatch(/Digibastion does not check incidents itself/);
    // Not even in a negation: a partial quote must never read as a verification claim.
    expect(llms).not.toMatch(/verified by Digibastion/i);
    expect(full).not.toMatch(/verified by Digibastion/i);
    expect(llms).not.toMatch(/vetted|Satoshi-level|HMAC|July 2024 onward|Top 100|digibastion\.com\/news|real-time/i);
    expect(llms).not.toContain('DigiBastion');
    expect(llms).toContain('https://t.me/digibastion');
    expect(llms).toContain('threat-intel-feed?format=rss');
    expect(llms).toContain('https://vantage.digibastion.com');
    // Newsletters are live: llms.txt may name them, but never as "soon".
    expect(llms).toMatch(/daily brief and weekly deep-dive/i);
    expect(llms).not.toMatch(/start soon|starting soon/i);
    expect((llms.match(/\(https:\/\/www\.digibastion\.com\/articles\/[^)]+\)/g) ?? []).length).toBe(articlesMeta.length);
    expect((llms.match(/\(https:\/\/www\.digibastion\.com\/category\/[^)]+\)/g) ?? []).length).toBe(initialSecurityData.length);
  });

  it('puts the FAQ, every guide and every checklist in llms-full.txt, but no live incidents', () => {
    expect(full).toContain('What is Digibastion?');
    for (const guide of articlesMeta) expect(full).toContain(`https://www.digibastion.com/articles/${guide.slug}`);
    for (const category of initialSecurityData) expect(full).toContain(`https://www.digibastion.com/category/${category.id}`);
    expect(full).not.toMatch(/<\/?(div|p|h2|li|script)\b/);
    expect(full).not.toMatch(/https:\/\/www\.digibastion\.com\/threat-intel\/[0-9a-f]{8}-/);
  });
});
