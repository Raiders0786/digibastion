import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { addSitemapToIndex, checkUrlsetXml, mirrorDynamicSitemap } from '../sitemapMirror';

const SITE = 'https://www.digibastion.com';
const urlset = (locs: Array<[string, string]>) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locs.map(([loc, lastmod]) => `<url>\n  <loc>${loc}</loc>\n  <lastmod>${lastmod}</lastmod>\n</url>`).join('\n')}
</urlset>
`;
const INDEX = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap>
  <loc>https://www.digibastion.com/sitemap.xml</loc>
  <lastmod>2026-10-11</lastmod>
</sitemap>
</sitemapindex>
`;
const quiet = { info: () => undefined, warn: () => undefined };

describe('checkUrlsetXml', () => {
  it('counts the URLs and returns the newest lastmod', () => {
    const xml = urlset([[`${SITE}/threat-intel/a`, '2026-10-09'], [`${SITE}/threat-intel/b`, '2026-10-11']]);
    expect(checkUrlsetXml(xml, SITE)).toEqual({ count: 2, newestLastmod: '2026-10-11' });
  });

  it('rejects an empty urlset, HTML and a URL on another host', () => {
    expect(() => checkUrlsetXml(urlset([]), SITE)).toThrow(/no <loc>/);
    expect(() => checkUrlsetXml('<!doctype html><html></html>', SITE)).toThrow(/urlset/);
    expect(() => checkUrlsetXml(urlset([['https://evil.example/x', '2026-10-01']]), SITE)).toThrow(/outside/);
    expect(() => checkUrlsetXml(urlset([[`${SITE}.evil.example/x`, '2026-10-01']]), SITE)).toThrow(/outside/);
  });
});

describe('addSitemapToIndex', () => {
  it('adds one entry before the closing tag and keeps the existing one', () => {
    const xml = addSitemapToIndex(INDEX, `${SITE}/sitemap-incidents.xml`, '2026-10-11');
    expect(xml.match(/<sitemap>/g)).toHaveLength(2);
    expect(xml).toContain('<loc>https://www.digibastion.com/sitemap.xml</loc>');
    expect(xml).toContain('<loc>https://www.digibastion.com/sitemap-incidents.xml</loc>');
    expect(xml.trim().endsWith('</sitemapindex>')).toBe(true);
  });

  it('does not add the same sitemap twice', () => {
    const once = addSitemapToIndex(INDEX, `${SITE}/sitemap-incidents.xml`, '2026-10-11');
    expect(addSitemapToIndex(once, `${SITE}/sitemap-incidents.xml`, '2026-10-12')).toBe(once);
  });

  it('refuses an index without a closing tag', () => {
    expect(() => addSitemapToIndex('<sitemapindex>', `${SITE}/x.xml`, '2026-10-11')).toThrow(/sitemapindex/);
  });
});

describe('mirrorDynamicSitemap', () => {
  let outDir = '';
  afterEach(async () => {
    if (outDir) await rm(outDir, { recursive: true, force: true });
  });

  const setup = async () => {
    outDir = await mkdtemp(path.join(tmpdir(), 'seo-mirror-'));
    await writeFile(path.join(outDir, 'sitemap-index.xml'), INDEX, 'utf8');
  };

  it('writes the incident sitemap and lists it in the index', async () => {
    await setup();
    const body = urlset([[`${SITE}/threat-intel/a`, '2026-10-10']]);
    let requested = '';
    const fetchImpl = (async (url: string) => {
      requested = String(url);
      return new Response(body, { status: 200 });
    }) as unknown as typeof fetch;
    const count = await mirrorDynamicSitemap({ outDir, functionsBase: 'https://x.supabase.co/functions/v1/', fetchImpl, timeoutMs: 1_000, log: quiet, retryDelayMs: 0 });
    expect(count).toBe(1);
    expect(requested).toBe('https://x.supabase.co/functions/v1/generate-sitemap?part=dynamic');
    expect(await readFile(path.join(outDir, 'sitemap-incidents.xml'), 'utf8')).toBe(body);
    const index = await readFile(path.join(outDir, 'sitemap-index.xml'), 'utf8');
    expect(index).toContain('<loc>https://www.digibastion.com/sitemap-incidents.xml</loc>\n  <lastmod>2026-10-10</lastmod>');
  });

  it('retries a 5xx answer once and then succeeds', async () => {
    await setup();
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return calls === 1 ? new Response('oops', { status: 500 }) : new Response(urlset([[`${SITE}/a`, '2026-10-10']]), { status: 200 });
    }) as unknown as typeof fetch;
    expect(await mirrorDynamicSitemap({ outDir, functionsBase: 'https://x.supabase.co/functions/v1', fetchImpl, timeoutMs: 1_000, log: quiet, retryDelayMs: 0 })).toBe(1);
    expect(calls).toBe(2);
  });

  it('leaves the index untouched and writes nothing when the answer is unusable', async () => {
    await setup();
    for (const response of [
      () => new Response('down', { status: 503 }),
      () => new Response('<html>shell</html>', { status: 200 }),
      () => new Response(urlset([['https://evil.example/x', '2026-10-10']]), { status: 200 }),
    ]) {
      const fetchImpl = (async () => response()) as unknown as typeof fetch;
      expect(await mirrorDynamicSitemap({ outDir, functionsBase: 'https://x.supabase.co/functions/v1', fetchImpl, timeoutMs: 1_000, log: quiet, retryDelayMs: 0 })).toBe(0);
    }
    const throwing = (async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    expect(await mirrorDynamicSitemap({ outDir, functionsBase: 'https://x.supabase.co/functions/v1', fetchImpl: throwing, timeoutMs: 1_000, log: quiet, retryDelayMs: 0 })).toBe(0);
    expect(await readFile(path.join(outDir, 'sitemap-index.xml'), 'utf8')).toBe(INDEX);
    await expect(readFile(path.join(outDir, 'sitemap-incidents.xml'), 'utf8')).rejects.toThrow();
  });
});
