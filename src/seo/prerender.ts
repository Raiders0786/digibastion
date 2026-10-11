// Head and body HTML for one route, written into dist/ at build time (and
// by the Cloudflare Worker at request time). Pure module (boundary rule):
// relative imports and _shared modules only, no React, no window.
import { escapeXml } from '../../supabase/functions/_shared/xml';
import { serializeJsonLd } from '../utils/jsonLd';
import type { PrerenderBody, PrerenderLink, RobotsDirective, RouteMeta } from './routeTypes';

export const HEAD_START = '<!--seo:head-->';
export const HEAD_END = '<!--/seo:head-->';
export const BODY_MARKER = '<!--seo:body-->';

export type PrerenderLayout = 'file' | 'dir' | 'both';

const escapeHtml = escapeXml;

const ROBOTS_CONTENT: Record<RobotsDirective, string> = {
  index: 'index, follow, max-image-preview:large, max-snippet:-1',
  'noindex,follow': 'noindex, follow',
  'noindex,nofollow': 'noindex, nofollow',
};

const metaName = (name: string, content: string) => `<meta name="${name}" content="${escapeHtml(content)}" />`;
const metaProperty = (property: string, content: string) => `<meta property="${property}" content="${escapeHtml(content)}" />`;

/**
 * Tags that go between <!--seo:head--> markers. The template keeps the tags
 * that never change per route (charset, og:site_name, og:locale,
 * twitter:card, twitter:site, icons, the Organization JSON-LD) outside them.
 */
export function renderHead(meta: RouteMeta): string {
  const lines: string[] = [
    `<title>${escapeHtml(meta.title)}</title>`,
    metaName('description', meta.description),
    metaName('robots', ROBOTS_CONTENT[meta.robots]),
  ];
  if (meta.canonical) lines.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`);
  lines.push(metaProperty('og:type', meta.type));
  if (meta.canonical) lines.push(metaProperty('og:url', meta.canonical));
  lines.push(
    metaProperty('og:title', meta.title),
    metaProperty('og:description', meta.description),
    metaProperty('og:image', meta.image),
    metaProperty('og:image:width', String(meta.imageWidth ?? 1920)),
    metaProperty('og:image:height', String(meta.imageHeight ?? 1060)),
    metaProperty('og:image:alt', meta.imageAlt),
  );
  if (meta.type === 'article') {
    if (meta.publishedTime) lines.push(metaProperty('article:published_time', meta.publishedTime));
    if (meta.modifiedTime) lines.push(metaProperty('article:modified_time', meta.modifiedTime));
    if (meta.section) lines.push(metaProperty('article:section', meta.section));
    for (const tag of meta.tags ?? []) lines.push(metaProperty('article:tag', tag));
  }
  if (meta.canonical) lines.push(metaName('twitter:url', meta.canonical));
  lines.push(
    metaName('twitter:title', meta.title),
    metaName('twitter:description', meta.description),
    metaName('twitter:image', meta.image),
    metaName('twitter:image:alt', meta.imageAlt),
  );
  // data-prerender: main.tsx removes these before React renders its own copy.
  if (meta.jsonLd.length > 0) {
    lines.push(`<script type="application/ld+json" data-prerender>${serializeJsonLd(meta.jsonLd)}</script>`);
  }
  return lines.join('\n    ');
}

/** Same-site paths, anchors and http(s) URLs only; anything else is dropped. */
function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (/^\/(?!\/)/.test(trimmed) || /^#/.test(trimmed) || /^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

function renderLink(link: PrerenderLink): string {
  const href = safeHref(link.href);
  return href ? `<a href="${escapeHtml(href)}">${escapeHtml(link.label)}</a>` : escapeHtml(link.label);
}

/**
 * The readable page crawlers see before JavaScript runs. React replaces it
 * on load (createRoot, not hydration), so it never has to match the app's markup.
 */
export function renderBody(body: PrerenderBody): string {
  const parts: string[] = ['<div class="max-w-3xl mx-auto px-4 pt-28 pb-16 text-muted-foreground" data-prerender-body>'];
  if (body.breadcrumbs.length > 0) {
    parts.push(`<nav aria-label="Breadcrumb"><ol>${body.breadcrumbs.map((link) => `<li>${renderLink(link)}</li>`).join('')}</ol></nav>`);
  }
  parts.push(`<h1>${escapeHtml(body.h1)}</h1>`);
  if (body.intro) parts.push(`<p>${escapeHtml(body.intro)}</p>`);
  if (body.items && body.items.length > 0) {
    parts.push(`<ul>${body.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
  }
  // Trusted: rendered at build time from our own guide components, never from provider data.
  if (body.html) parts.push(`<article>${body.html}</article>`);
  if (body.links.length > 0) {
    parts.push(`<nav aria-label="Related"><ul>${body.links.map((link) => `<li>${renderLink(link)}</li>`).join('')}</ul></nav>`);
  }
  parts.push('</div>');
  return parts.join('');
}

/** Puts head tags between the head markers and the body in place of the body marker. */
export function injectIntoTemplate(template: string, head: string, body: string): string {
  const headStart = template.indexOf(HEAD_START);
  const headEnd = template.indexOf(HEAD_END);
  const bodyAt = template.indexOf(BODY_MARKER);
  if (headStart < 0 || headEnd < headStart || bodyAt < 0) {
    throw new Error('Template is missing the seo:head or seo:body marker');
  }
  // Slicing, not String.replace, so "$&" or "$1" in a title stays literal.
  const withHead = `${template.slice(0, headStart + HEAD_START.length)}\n    ${head}\n    ${template.slice(headEnd)}`;
  const at = withHead.indexOf(BODY_MARKER);
  return `${withHead.slice(0, at)}${body}${withHead.slice(at + BODY_MARKER.length)}`;
}

const SAFE_PATH = /^\/[A-Za-z0-9/_-]*$/;

/**
 * Files to write for a route, relative to dist/. `file` writes <route>.html
 * (default: no trailing-slash redirect risk); `dir` writes <route>/index.html.
 * '/' maps to nothing: dist/index.html is the fallback shell.
 */
export function outputPathsFor(path: string, layout: PrerenderLayout): string[] {
  if (!SAFE_PATH.test(path)) throw new Error(`Unsafe prerender path: ${path}`);
  if (path === '/') return [];
  const segments = path.slice(1).split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`Unsafe prerender path: ${path}`);
  }
  const base = segments.join('/');
  switch (layout) {
    case 'file': return [`${base}.html`];
    case 'dir': return [`${base}/index.html`];
    case 'both': return [`${base}.html`, `${base}/index.html`];
    default: throw new Error(`Unknown prerender layout: ${String(layout)}`);
  }
}
