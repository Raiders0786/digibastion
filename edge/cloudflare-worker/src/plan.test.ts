import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { weeklyPublicContent } from '../../../supabase/functions/_shared/weekly-test-fixtures';
import {
  applySecurityHeaders,
  ARTICLE_UUID,
  articleFromRow,
  classifyRequest,
  incidentOutcome,
  LEGACY_REDIRECTS,
  notFoundHtml,
  originTarget,
  primaryRedirectLocation,
  rewriteHtml,
  rewriteOriginLocation,
  SECURITY_HEADERS,
  weeklyOutcome,
} from './plan';
import { staticRouteMeta } from '../../../src/seo/routeMeta';

const vercel = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
  redirects: { source: string; destination: string; permanent: boolean }[];
};

const HTML = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
const url = (path: string, host = 'www.digibastion.com') => new URL(`https://${host}${path}`);

// Shaped like dist/index.html after the prerender: head markers kept, body marker consumed.
const SHELL = [
  '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" />',
  '<!--seo:head-->',
  '<title>Digibastion: Web3 Security Alerts, Checklists and Guides</title>',
  '<meta name="robots" content="index, follow" />',
  '<!--/seo:head-->',
  '<script type="module" crossorigin src="/assets/index-abc.js"></script>',
  '</head><body>',
  '<div id="root"><div class="x" data-prerender-body><h1>Home</h1><div><p>nested</p></div></div></div>',
  '\n    <script type="application/ld+json">{"@type":"Organization"}</script>',
  '</body></html>',
].join('');

// A page someone already prerendered with its own canonical.
const PRERENDERED = SHELL.replace(
  '<!--/seo:head-->',
  '<link rel="canonical" href="https://www.digibastion.com/threat-intel/old" /><!--/seo:head-->',
);

const incidentRow = (metadata: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) => ({
  id: 'qm-123',
  uid: 'quillmonitor:123',
  title: 'Example Protocol bridge exploit',
  summary: 'Summary pending',
  content: null,
  category: 'defi-exploits',
  severity: 'high',
  tags: ['bridge'],
  affected_technologies: [],
  link: 'https://www.quillaudits.com/web3-hacks-database/example',
  source_url: null,
  source_name: 'QuillMonitor',
  cve_id: null,
  published_at: '2026-09-28T00:00:00Z',
  created_at: '2026-09-29T10:00:00Z',
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    project_name: 'Example Protocol',
    chain: 'Ethereum',
    attack_type: 'Bridge Exploit',
    amount_lost_usd: 4_200_000,
    incident_date: '2026-09-28',
    ...metadata,
  },
  ...overrides,
});

describe('classifyRequest', () => {
  it('sends the apex host to www with the same path and query', () => {
    expect(classifyRequest('GET', url('/threat-intel/abc?utm_source=x', 'digibastion.com'), HTML)).toEqual({
      kind: 'redirect',
      status: 301,
      location: 'https://www.digibastion.com/threat-intel/abc?utm_source=x',
    });
    expect(classifyRequest('GET', url('/', 'digibastion.com'), null)).toEqual({
      kind: 'redirect',
      status: 301,
      location: 'https://www.digibastion.com/',
    });
  });

  it('classifies incident pages by safe id', () => {
    expect(classifyRequest('GET', url('/threat-intel/qm-123'), HTML)).toEqual({ kind: 'incident', id: 'qm-123' });
    expect(classifyRequest('HEAD', url('/threat-intel/3f2a_B-9'), null)).toEqual({ kind: 'incident', id: '3f2a_B-9' });
    expect(classifyRequest('GET', url('/threat-intel/bad%20id'), HTML)).toEqual({ kind: 'passthrough' });
    expect(classifyRequest('GET', url(`/threat-intel/${'a'.repeat(129)}`), HTML)).toEqual({ kind: 'passthrough' });
  });

  it('leaves the methodology and archive pages alone', () => {
    expect(classifyRequest('GET', url('/threat-intel/methodology'), HTML)).toEqual({ kind: 'passthrough' });
    expect(classifyRequest('GET', url('/threat-intel/weekly'), HTML)).toEqual({ kind: 'passthrough' });
    expect(classifyRequest('GET', url('/threat-intel'), HTML)).toEqual({ kind: 'passthrough' });
  });

  it('classifies weekly pages by date', () => {
    expect(classifyRequest('GET', url('/threat-intel/weekly/2026-10-05'), HTML)).toEqual({ kind: 'weekly', weekStart: '2026-10-05' });
    expect(classifyRequest('GET', url('/threat-intel/weekly/latest'), HTML)).toEqual({ kind: 'passthrough' });
  });

  it('rewrites only GET and HEAD that accept HTML', () => {
    expect(classifyRequest('POST', url('/threat-intel/qm-123'), HTML)).toEqual({ kind: 'passthrough' });
    expect(classifyRequest('GET', url('/threat-intel/qm-123'), 'application/json')).toEqual({ kind: 'passthrough' });
    expect(classifyRequest('GET', url('/threat-intel/qm-123'), '*/*')).toEqual({ kind: 'incident', id: 'qm-123' });
    expect(classifyRequest('GET', url('/threat-intel/qm-123'), '')).toEqual({ kind: 'incident', id: 'qm-123' });
  });

  it('301s /news to /threat-intel keeping the query, and /present to /about', () => {
    expect(classifyRequest('GET', url('/news?category=phishing'), HTML)).toEqual({
      kind: 'redirect',
      status: 301,
      location: 'https://www.digibastion.com/threat-intel?category=phishing',
    });
    expect(classifyRequest('GET', url('/present'), HTML)).toEqual({
      kind: 'redirect',
      status: 301,
      location: 'https://www.digibastion.com/about',
    });
  });

  it('301s every legacy path that vercel.json redirects', () => {
    const expected = Object.fromEntries(vercel.redirects.map((r) => [r.source, r.destination]));
    expect(LEGACY_REDIRECTS).toEqual(expected);
    for (const { source, destination } of vercel.redirects) {
      expect(classifyRequest('GET', url(source), null)).toEqual({
        kind: 'redirect',
        status: 301,
        location: `https://www.digibastion.com${destination}`,
      });
    }
  });

  it('proxies feeds and sitemaps from the functions host with real content types', () => {
    const fn = 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1';
    expect(classifyRequest('GET', url('/feed.xml'), null)).toEqual({ kind: 'proxy', target: `${fn}/threat-intel-feed?format=rss`, contentType: 'application/rss+xml; charset=utf-8' });
    expect(classifyRequest('GET', url('/feed.atom'), null)).toEqual({ kind: 'proxy', target: `${fn}/threat-intel-feed?format=atom`, contentType: 'application/atom+xml; charset=utf-8' });
    expect(classifyRequest('GET', url('/feed.json'), null)).toEqual({ kind: 'proxy', target: `${fn}/threat-intel-feed?format=json`, contentType: 'application/feed+json; charset=utf-8' });
    expect(classifyRequest('HEAD', url('/sitemap-dynamic.xml'), null)).toEqual({ kind: 'proxy', target: `${fn}/generate-sitemap?part=dynamic`, contentType: 'application/xml; charset=utf-8' });
    expect(classifyRequest('GET', url('/sitemap-news.xml'), null)).toEqual({ kind: 'proxy', target: `${fn}/generate-sitemap?part=news`, contentType: 'application/xml; charset=utf-8' });
  });

  it('forwards extra query parameters to a proxy but never overrides its fixed ones', () => {
    const route = classifyRequest('GET', url('/sitemap-dynamic.xml?page=2&part=news'), null);
    expect(route).toMatchObject({ kind: 'proxy' });
    const target = new URL((route as { target: string }).target);
    expect(target.searchParams.get('part')).toBe('dynamic');
    expect(target.searchParams.get('page')).toBe('2');
    const feed = new URL((classifyRequest('GET', url('/feed.json?type=incidents&format=rss'), null) as { target: string }).target);
    expect(feed.searchParams.get('format')).toBe('json');
    expect(feed.searchParams.get('type')).toBe('incidents');
  });

  it('passes everything else through', () => {
    expect(classifyRequest('GET', url('/assets/index-abc.js'), '*/*')).toEqual({ kind: 'passthrough' });
    expect(classifyRequest('GET', url('/robots.txt'), null)).toEqual({ kind: 'passthrough' });
    expect(classifyRequest('POST', url('/feed.xml'), null)).toEqual({ kind: 'passthrough' });
    expect(classifyRequest('GET', url('/threat-intel/qm-123', 'digibastion.lovable.app'), HTML)).toEqual({ kind: 'incident', id: 'qm-123' });
  });
});

describe('SECURITY_HEADERS', () => {
  it('matches the headers in vercel.json', () => {
    const expected = Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value]));
    expect(SECURITY_HEADERS).toEqual(expected);
    for (const key of ['Content-Security-Policy', 'X-Frame-Options', 'Permissions-Policy']) {
      expect(SECURITY_HEADERS[key]).toBe(expected[key]);
    }
  });

  it('can send the policy as report-only', () => {
    const enforced = applySecurityHeaders(new Headers(), { cspReportOnly: false });
    expect(enforced.get('content-security-policy')).toBe(SECURITY_HEADERS['Content-Security-Policy']);
    const reportOnly = applySecurityHeaders(new Headers({ 'Content-Security-Policy': 'stale' }), { cspReportOnly: true });
    expect(reportOnly.get('content-security-policy')).toBeNull();
    expect(reportOnly.get('content-security-policy-report-only')).toBe(SECURITY_HEADERS['Content-Security-Policy']);
    expect(reportOnly.get('x-frame-options')).toBe('SAMEORIGIN');
  });
});

describe('rewriteHtml', () => {
  const meta = staticRouteMeta('/about');

  it('writes the route head and body and exactly one canonical', () => {
    for (const origin of [SHELL, PRERENDERED]) {
      const html = rewriteHtml(origin, meta);
      expect(html).not.toBeNull();
      expect(html!.match(/rel="canonical"/g)).toHaveLength(1);
      expect(html).toContain('href="https://www.digibastion.com/about"');
      expect(html!.match(/<title>/g)).toHaveLength(1);
      expect(html).toContain(`<h1>${meta.body.h1}</h1>`);
      expect(html).not.toContain('nested');
      // Everything outside the markers survives.
      expect(html).toContain('<script type="module" crossorigin src="/assets/index-abc.js"></script>');
      expect(html).toContain('{"@type":"Organization"}');
    }
  });

  it('fills a body marker when the origin still has one', () => {
    const raw = SHELL.replace(/<div id="root">[\s\S]*?<\/div><\/div><\/div>/, '<div id="root"><!--seo:body--></div>');
    const html = rewriteHtml(raw, meta);
    expect(html).toContain(`<h1>${meta.body.h1}</h1>`);
    expect(html).not.toContain('<!--seo:body-->');
  });

  it('keeps "$&" in a title literal', () => {
    const html = rewriteHtml(SHELL, { ...meta, title: 'Costs $& more $1' });
    expect(html).toContain('<title>Costs $&amp; more $1</title>');
  });

  it('returns null when a head marker is missing', () => {
    expect(rewriteHtml(SHELL.replace('<!--/seo:head-->', ''), meta)).toBeNull();
    expect(rewriteHtml(SHELL.replace('<!--seo:head-->', ''), meta)).toBeNull();
    expect(rewriteHtml('<html><body>maintenance</body></html>', meta)).toBeNull();
  });

  it('returns null when there is no root element to fill', () => {
    expect(rewriteHtml(SHELL.replace('<div id="root">', '<div id="app">'), meta)).toBeNull();
  });
});

describe('notFoundHtml', () => {
  it('is noindex, has no canonical and says the page is missing', () => {
    const html = notFoundHtml(PRERENDERED);
    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).not.toContain('rel="canonical"');
    expect(html).toMatch(/<title>Page not found[^<]*<\/title>/);
  });

  it('still adds noindex when the origin has no markers', () => {
    const html = notFoundHtml('<html><head><title>x</title></head><body></body></html>');
    expect(html).toContain('<meta name="robots" content="noindex" />');
  });
});

describe('incident lookups', () => {
  it('maps a row to an article and rejects rows without id, title or date', () => {
    expect(articleFromRow(incidentRow())).toMatchObject({ id: 'qm-123', title: 'Example Protocol bridge exploit', severity: 'high' });
    expect(articleFromRow(incidentRow({}, { title: '<b></b>' }))).toBeNull();
    expect(articleFromRow(incidentRow({}, { published_at: 'not a date' }))).toBeNull();
    expect(articleFromRow(null)).toBeNull();
    expect(articleFromRow(incidentRow({}, { severity: 'apocalyptic' }))).toMatchObject({ severity: 'info' });
  });

  it('renders an indexable incident with its own canonical and index robots', () => {
    const outcome = incidentOutcome(incidentRow());
    expect(outcome.kind).toBe('render');
    if (outcome.kind !== 'render') return;
    expect(outcome.meta.canonical).toBe('https://www.digibastion.com/threat-intel/qm-123');
    expect(outcome.meta.robots).toBe('index');
  });

  it('renders an RSS relay as noindex,follow so email links keep working', () => {
    const outcome = incidentOutcome(incidentRow({ provider: 'rss', is_web3_incident: false }));
    expect(outcome).toMatchObject({ kind: 'render', meta: { robots: 'noindex,follow' } });
  });

  it('never indexes a record the shared rule says is not an incident', () => {
    // Legacy row: no flag and an unknown provider.
    const outcome = incidentOutcome(incidentRow({ provider: 'slowmist-archive', is_web3_incident: undefined }));
    expect(outcome).toMatchObject({ kind: 'render', meta: { robots: 'noindex,follow' } });
  });

  it('sends merged records to the primary and hides rejected ones', () => {
    expect(incidentOutcome(incidentRow({ duplicate_of_uid: 'slowmist:9' }))).toEqual({ kind: 'duplicate', primaryUid: 'slowmist:9' });
    expect(incidentOutcome(incidentRow({ classification_relevant: false }))).toEqual({ kind: 'not-found' });
    expect(incidentOutcome(incidentRow({ classification_relevant: 'false' }))).toEqual({ kind: 'not-found' });
    expect(incidentOutcome(null)).toEqual({ kind: 'not-found' });
  });

  it('redirects to a primary only when it is a different, unmerged record', () => {
    expect(primaryRedirectLocation('qm-123', { id: 'sm-9', metadata: {} }, '?utm_source=telegram', 'https://www.digibastion.com'))
      .toBe('https://www.digibastion.com/threat-intel/sm-9?utm_source=telegram');
    expect(primaryRedirectLocation('qm-123', { id: 'qm-123', metadata: {} }, '', 'https://www.digibastion.com')).toBeNull();
    expect(primaryRedirectLocation('qm-123', { id: 'sm-9', metadata: { duplicate_of_uid: 'quillmonitor:123' } }, '', 'https://www.digibastion.com')).toBeNull();
    expect(primaryRedirectLocation('qm-123', { id: '../evil', metadata: {} }, '', 'https://www.digibastion.com')).toBeNull();
    expect(primaryRedirectLocation('qm-123', null, '', 'https://www.digibastion.com')).toBeNull();
  });
});

describe('ARTICLE_UUID', () => {
  it('accepts only uuids, the shape of news_articles.id', () => {
    expect(ARTICLE_UUID.test('3f2a9c1e-0b7d-4e5f-9a8b-1c2d3e4f5a6b')).toBe(true);
    expect(ARTICLE_UUID.test('qm-123')).toBe(false);
    expect(ARTICLE_UUID.test('3f2a9c1e-0b7d-4e5f-9a8b-1c2d3e4f5a6b0')).toBe(false);
  });
});

describe('weeklyOutcome', () => {
  it('renders a published issue for the requested week', () => {
    const content = weeklyPublicContent();
    const outcome = weeklyOutcome({ content, generated_at: '2026-10-12T00:10:00Z' }, content.weekStart);
    expect(outcome.kind).toBe('render');
    if (outcome.kind !== 'render') return;
    expect(outcome.meta.canonical).toBe(`https://www.digibastion.com/threat-intel/weekly/${content.weekStart}`);
  });

  it('is not found for null, malformed or mismatched issues', () => {
    const content = weeklyPublicContent();
    expect(weeklyOutcome(null, content.weekStart)).toEqual({ kind: 'not-found' });
    expect(weeklyOutcome({ content: { kind: 'weekly' } }, content.weekStart)).toEqual({ kind: 'not-found' });
    expect(weeklyOutcome({ content }, '2026-09-28')).toEqual({ kind: 'not-found' });
  });
});

describe('rewriteOriginLocation', () => {
  const origin = 'https://digibastion.lovable.app';
  const site = 'https://www.digibastion.com';

  it('moves redirects on the origin host onto the site host', () => {
    expect(rewriteOriginLocation('https://digibastion.lovable.app/about?x=1', origin, site)).toBe('https://www.digibastion.com/about?x=1');
    expect(rewriteOriginLocation('/about', origin, site)).toBe('https://www.digibastion.com/about');
  });

  it('leaves other hosts alone', () => {
    expect(rewriteOriginLocation('https://example.com/a', origin, site)).toBe('https://example.com/a');
  });
});

describe('originTarget', () => {
  const base = 'https://origin.example';

  it('keeps the path and query on the origin host', () => {
    expect(originTarget(base, '/threat-intel', '?scope=all')).toBe('https://origin.example/threat-intel?scope=all');
  });

  it('never leaves the origin host for a protocol-relative path', () => {
    expect(originTarget(base, '//evil.example/x', '?a=1')).toBe('https://origin.example/evil.example/x?a=1');
    expect(originTarget(base, '///evil.example', '')).toBe('https://origin.example/evil.example');
  });

  it('keeps a base path prefix and treats backslashes as path text', () => {
    expect(originTarget('https://origin.example/app/', '/about', '')).toBe('https://origin.example/app/about');
    expect(new URL(originTarget(base, '/\\evil.example', '')).origin).toBe(base);
  });

  it('returns null for an unusable base', () => {
    expect(originTarget('not a url', '/about', '')).toBeNull();
  });
});
