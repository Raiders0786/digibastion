import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE_FALLBACK_META } from '../routeMeta';

const main = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8');
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const between = (start: string, end: string) => html.slice(html.indexOf(start) + start.length, html.indexOf(end));

describe('entry and template', () => {
  it('replaces the prerendered body instead of hydrating it', () => {
    expect(main).toContain('createRoot(');
    expect(main).not.toContain('hydrateRoot');
  });

  it('removes prerendered JSON-LD before React renders', () => {
    expect(main.indexOf('script[data-prerender]')).toBeGreaterThan(-1);
    expect(main.indexOf('script[data-prerender]')).toBeLessThan(main.indexOf('.render('));
  });

  it('has markers and no homepage canonical in the shell', () => {
    expect(html).toContain('<!--seo:head-->');
    expect(html).toContain('<!--/seo:head-->');
    expect(html).toContain('<div id="root"><!--seo:body--></div>');
    expect(html).not.toMatch(/rel="canonical"|property="og:url"|name="twitter:url"/);
    expect(html).toContain('type="application/rss+xml"');
    expect(html).toContain('type="application/atom+xml"');
    expect(html).toContain('type="application/feed+json"');
  });

  it('starts from the fallback meta and keeps fixed tags outside the markers', () => {
    const head = between('<!--seo:head-->', '<!--/seo:head-->');
    expect(head).toContain(`<title>${SITE_FALLBACK_META.title}</title>`);
    expect(head).toContain(`content="${SITE_FALLBACK_META.description}"`);
    expect(head).not.toMatch(/og:site_name|og:locale|twitter:card|twitter:site/);
    expect(html).toContain('property="og:site_name"');
    expect(html).toContain('name="twitter:card"');
  });

  it('drops the stale tags and the SoftwareApplication block', () => {
    expect(html).not.toMatch(/name="keywords"|name="googlebot"|name="title"|SoftwareApplication|real-time/i);
    expect(html).toContain('"logo": "https://www.digibastion.com/favicon-512x512.png"');
  });
});
