// Copies the live incident sitemap (the generate-sitemap function) into dist/
// at build time and lists it in dist/sitemap-index.xml. The sitemap protocol
// does not let an index on www.digibastion.com point at a sitemap on the
// Supabase host, so without this copy Search Console only sees the static
// pages. robots.txt still lists the live function sitemaps, which stay fresh
// between publishes.
//
// Never fails the build: on any error the index keeps only the static sitemap.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const SITE_URL = 'https://www.digibastion.com';
export const MIRROR_FILE = 'sitemap-incidents.xml';

const SERVER_ERROR_RETRIES = 1;

export interface MirrorOptions {
  outDir: string;
  /** e.g. https://<ref>.supabase.co/functions/v1 */
  functionsBase: string;
  fetchImpl: typeof fetch;
  timeoutMs: number;
  log: { info: (message: string) => void; warn: (message: string) => void };
  /** Wait before retrying a 5xx answer. Default 1500. */
  retryDelayMs?: number;
}

/** Throws unless `xml` is a urlset whose every <loc> is on `siteUrl`. */
export function checkUrlsetXml(xml: string, siteUrl: string): { count: number; newestLastmod: string | null } {
  if (!/<urlset[\s>]/.test(xml) || !xml.trimEnd().endsWith('</urlset>')) throw new Error('not a complete <urlset>');
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1].trim());
  if (locs.length === 0) throw new Error('no <loc> entries');
  const prefix = `${siteUrl}/`;
  const outside = locs.find((loc) => !loc.startsWith(prefix));
  if (outside) throw new Error(`URL outside ${siteUrl}: ${outside.slice(0, 80)}`);
  const lastmods = [...xml.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})[^<]*<\/lastmod>/g)].map((match) => match[1]).sort();
  return { count: locs.length, newestLastmod: lastmods.pop() ?? null };
}

/** Adds one <sitemap> entry to a sitemap index, unless it is already listed. */
export function addSitemapToIndex(indexXml: string, loc: string, lastmod: string): string {
  const close = indexXml.lastIndexOf('</sitemapindex>');
  if (close < 0) throw new Error('no closing </sitemapindex>');
  if (indexXml.includes(`<loc>${loc}</loc>`)) return indexXml;
  const entry = `<sitemap>\n  <loc>${loc}</loc>\n  <lastmod>${lastmod}</lastmod>\n</sitemap>\n`;
  return `${indexXml.slice(0, close)}${entry}${indexXml.slice(close)}`;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Returns the number of URLs mirrored, or 0 when nothing was written. */
export async function mirrorDynamicSitemap(options: MirrorOptions): Promise<number> {
  const { outDir, fetchImpl, timeoutMs, log } = options;
  const source = `${options.functionsBase.replace(/\/+$/, '')}/generate-sitemap?part=dynamic`;
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 1_500);
  try {
    let xml = '';
    for (let retry = 0; ; retry += 1) {
      const response = await fetchImpl(source, { signal: AbortSignal.timeout(timeoutMs) });
      if (response.status >= 500 && retry < SERVER_ERROR_RETRIES) {
        await response.body?.cancel();
        await sleep(retryDelayMs * (retry + 1));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      xml = await response.text();
      break;
    }
    const { count, newestLastmod } = checkUrlsetXml(xml, SITE_URL);
    const indexPath = path.join(outDir, 'sitemap-index.xml');
    const index = addSitemapToIndex(
      await readFile(indexPath, 'utf8'),
      `${SITE_URL}/${MIRROR_FILE}`,
      newestLastmod ?? new Date().toISOString().slice(0, 10),
    );
    // Write the sitemap before the index, so the index never names a missing file.
    await writeFile(path.join(outDir, MIRROR_FILE), xml, 'utf8');
    await writeFile(indexPath, index, 'utf8');
    log.info(`[seo] ${MIRROR_FILE}: ${count} URLs`);
    return count;
  } catch (error) {
    log.warn(`[seo] ${MIRROR_FILE} skipped: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}
