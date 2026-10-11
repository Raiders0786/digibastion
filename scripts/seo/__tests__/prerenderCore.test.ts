import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runPrerender } from '../prerenderCore';

const TEMPLATE = '<!doctype html><html><head><meta charset="UTF-8" /><!--seo:head--><title>x</title><!--/seo:head--></head>'
  + '<body><div id="root"><!--seo:body--></div></body></html>';

const row = (id: string, title: string) => ({
  id, title, summary: 'Summary pending', content: '', category: 'defi-exploits', severity: 'high', tags: [], link: null,
  source_name: 'QuillMonitor', published_at: '2026-10-01T00:00:00Z', created_at: '2026-10-01T00:00:00Z',
  metadata: { provider: 'quillmonitor', is_web3_incident: true, project_name: title, chain: 'Ethereum', amount_lost_usd: 1_000_000 },
});

const quiet = { log: () => undefined, info: () => undefined, warn: () => undefined };

describe('runPrerender', () => {
  let outDir = '';
  beforeAll(async () => {
    outDir = await mkdtemp(path.join(tmpdir(), 'seo-prerender-'));
    await writeFile(path.join(outDir, 'index.html'), TEMPLATE, 'utf8');
    const fetchImpl = (async (url: string) => (String(url).includes('/rest/v1/news_articles')
      ? new Response(JSON.stringify([row('inc-one', 'Alpha Bridge'), row('inc-two', 'Beta Vault')]), { status: 200 })
      : new Response('{}', { status: 404 }))) as unknown as typeof fetch;
    await runPrerender({ root: process.cwd(), outDir, env: {}, fetchImpl, log: quiet });
  }, 60_000);
  afterAll(async () => {
    if (outDir) await rm(outDir, { recursive: true, force: true });
  });

  it('links the fetched incidents from the prerendered /threat-intel page', async () => {
    const hub = await readFile(path.join(outDir, 'threat-intel', 'index.html'), 'utf8');
    expect(hub).toContain('<a href="/threat-intel/inc-one">Alpha Bridge</a>');
    expect(hub).toContain('<a href="/threat-intel/inc-two">Beta Vault</a>');
    expect(hub).toContain('"@type":"ItemList"');
  });

  it('still writes each incident page and the fallback shell', async () => {
    expect(await readFile(path.join(outDir, 'threat-intel', 'inc-one', 'index.html'), 'utf8')).toContain('<h1>Alpha Bridge</h1>');
    expect(await readFile(path.join(outDir, 'index.html'), 'utf8')).not.toContain('<!--seo:body-->');
  });
});
