import { describe, expect, it } from 'vitest';
import { injectIntoTemplate, outputPathsFor, renderBody, renderHead } from '../prerender';
import { SITE_FALLBACK_META, staticRouteMeta } from '../routeMeta';

const TEMPLATE = '<html><head><meta charset="UTF-8" /><!--seo:head--><title>x</title><!--/seo:head--></head><body><div id="root"><!--seo:body--></div></body></html>';

describe('prerender', () => {
  it('renders exactly one canonical and escapes values', () => {
    const head = renderHead({ ...staticRouteMeta('/about'), title: 'A "quoted" <title> & more' });
    expect(head.match(/rel="canonical"/g)).toHaveLength(1);
    expect(head).toContain('<title>A &quot;quoted&quot; &lt;title&gt; &amp; more</title>');
    expect(head).toContain('<script type="application/ld+json" data-prerender>');
    expect(head).toContain('<link rel="canonical" href="https://www.digibastion.com/about" />');
    expect(head).toContain('<meta property="og:url" content="https://www.digibastion.com/about" />');
    expect(head).toContain('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />');
  });

  it('gives the fallback no canonical, og:url or twitter:url', () => {
    const head = renderHead(SITE_FALLBACK_META);
    expect(head).not.toMatch(/rel="canonical"|og:url|twitter:url/);
    expect(head).not.toContain('application/ld+json');
  });

  it('leaves the tags that live outside the markers alone', () => {
    const head = renderHead(staticRouteMeta('/about'));
    expect(head).not.toMatch(/twitter:card|og:site_name|og:locale|twitter:site/);
  });

  it('marks noindex pages and article dates', () => {
    const head = renderHead({ ...staticRouteMeta('/about'), robots: 'noindex,follow', type: 'article', publishedTime: '2026-10-01T00:00:00Z', tags: ['a&b'] });
    expect(head).toContain('<meta name="robots" content="noindex, follow" />');
    expect(head).toContain('<meta property="article:published_time" content="2026-10-01T00:00:00Z" />');
    expect(head).toContain('<meta property="article:tag" content="a&amp;b" />');
  });

  it('escapes JSON-LD so a title cannot close the script tag', () => {
    const head = renderHead({ ...staticRouteMeta('/about'), jsonLd: [{ name: '</script><script>alert(1)</script>' }] });
    expect(head).not.toContain('</script><script>');
    expect(head.match(/<\/script>/g)).toHaveLength(1);
  });

  it('renders crawlable links and keeps trusted guide HTML', () => {
    const body = renderBody({ breadcrumbs: [{ href: '/', label: 'Home' }], h1: 'T & U', intro: 'Intro', links: [{ href: '/faq', label: 'FAQ' }], html: '<p>Guide</p>' });
    expect(body).toContain('<a href="/faq">FAQ</a>');
    expect(body).toContain('<h1>T &amp; U</h1>');
    expect(body).toContain('<p>Guide</p>');
    expect(body).toContain('<nav aria-label="Breadcrumb">');
    expect(body).toContain('<nav aria-label="Related">');
    expect(body.startsWith('<div class="max-w-3xl mx-auto px-4 pt-28 pb-16 text-muted-foreground" data-prerender-body>')).toBe(true);
  });

  it('escapes untrusted text and refuses script links', () => {
    const body = renderBody({ breadcrumbs: [], h1: '<img src=x onerror=alert(1)>', intro: 'a', items: ['<b>x</b>'], links: [{ href: 'javascript:alert(1)', label: 'bad' }, { href: 'https://t.me/digibastion', label: 'Telegram' }] });
    expect(body).not.toContain('<img');
    expect(body).not.toContain('<b>');
    expect(body).not.toContain('javascript:');
    expect(body).toContain('<a href="https://t.me/digibastion">Telegram</a>');
  });

  it('injects between markers and throws without them', () => {
    const html = injectIntoTemplate(TEMPLATE, '<title>New</title>', '<p>Body</p>');
    expect(html).toContain('<title>New</title>');
    expect(html).not.toContain('<title>x</title>');
    expect(html).toContain('<div id="root"><p>Body</p></div>');
    expect(() => injectIntoTemplate('<html></html>', '', '')).toThrow(/marker/);
  });

  it('does not treat $ in content as a replacement pattern', () => {
    const html = injectIntoTemplate(TEMPLATE, "<title>Lost $& and $' $1</title>", '<p>$$</p>');
    expect(html).toContain("<title>Lost $& and $' $1</title>");
    expect(html).toContain('<p>$$</p>');
  });

  it('maps paths to files and refuses traversal', () => {
    expect(outputPathsFor('/threat-intel/abc', 'file')).toEqual(['threat-intel/abc.html']);
    expect(outputPathsFor('/threat-intel/abc', 'dir')).toEqual(['threat-intel/abc/index.html']);
    expect(outputPathsFor('/threat-intel/abc', 'both')).toEqual(['threat-intel/abc.html', 'threat-intel/abc/index.html']);
    expect(outputPathsFor('/', 'both')).toEqual([]);
    expect(() => outputPathsFor('/threat-intel/../../etc', 'file')).toThrow();
    expect(() => outputPathsFor('/a b', 'file')).toThrow();
    expect(() => outputPathsFor('/a//b', 'file')).toThrow();
    expect(() => outputPathsFor('/a/', 'file')).toThrow();
    expect(() => outputPathsFor('relative', 'file')).toThrow();
    expect(() => outputPathsFor('/threat-intel/abc', 'other' as 'file')).toThrow();
  });
});
