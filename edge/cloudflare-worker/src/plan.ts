// Pure request planning for the optional Cloudflare Worker (see ../README.md).
// No Workers globals here, so vitest can load it. It reuses the same route
// registry, head renderer and publishability rules as the build-time prerender,
// so a page looks the same whether the build or the Worker wrote its head.
import {
  isIndexableIncidentMetadata,
  isPublishableMetadata,
  SAFE_ARTICLE_ID,
  WEEK_START,
} from '../../../supabase/functions/_shared/publishable';
import { FUNCTIONS_BASE_URL, incidentPath, SITE_URL } from '../../../supabase/functions/_shared/site-urls';
import { incidentRouteMeta, incidentSeoInputFromArticle } from '../../../src/seo/incidentMeta';
import { BODY_MARKER, HEAD_END, HEAD_START, renderBody, renderHead } from '../../../src/seo/prerender';
import { SITE_FALLBACK_META, SITE_LINKS, weeklyRouteMeta } from '../../../src/seo/routeMeta';
import type { RouteMeta } from '../../../src/seo/routeTypes';
import { parseWeeklyNewsletterResponse } from '../../../src/lib/threatIntel/weekly';
import type { NewsArticle, NewsCategory, SeverityLevel } from '../../../src/types/news';
import { sanitizeText } from '../../../src/utils/sanitize';

export type Route =
  | { kind: 'incident'; id: string }
  | { kind: 'weekly'; weekStart: string }
  | { kind: 'redirect'; location: string; status: 301 }
  | { kind: 'proxy'; target: string; contentType: string }
  | { kind: 'passthrough' };

/** Copied from vercel.json; plan.test.ts fails if the two drift. */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel-insights.com https://*.vercel-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.web3forms.com https://unavatar.io https://*.vercel-insights.com https://*.vercel-analytics.com; worker-src 'self'; manifest-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://api.web3forms.com; upgrade-insecure-requests",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
});

/** Retired paths and where they live now; the same list as vercel.json "redirects". */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = Object.freeze({
  '/news': '/threat-intel',
  '/present': '/about',
  '/articles/web3-wallet-security-guide': '/articles/getting-started-web3-security',
  '/articles/defi-security-best-practices': '/articles/defi-smart-contract-audit-checklist',
  '/articles/nft-security-guide': '/articles/nft-marketplace-security',
});

interface ProxySpec {
  fn: string;
  fixed: Record<string, string>;
  contentType: string;
}

/**
 * Same-host copies of the feeds and dynamic sitemaps. The Supabase gateway
 * serves XML as text/plain with a sandbox CSP on GET; these paths send the
 * real content type from our own host.
 */
const PROXIES: Readonly<Record<string, ProxySpec>> = Object.freeze({
  '/feed.xml': { fn: 'threat-intel-feed', fixed: { format: 'rss' }, contentType: 'application/rss+xml; charset=utf-8' },
  '/feed.atom': { fn: 'threat-intel-feed', fixed: { format: 'atom' }, contentType: 'application/atom+xml; charset=utf-8' },
  '/feed.json': { fn: 'threat-intel-feed', fixed: { format: 'json' }, contentType: 'application/feed+json; charset=utf-8' },
  '/sitemap-dynamic.xml': { fn: 'generate-sitemap', fixed: { part: 'dynamic' }, contentType: 'application/xml; charset=utf-8' },
  '/sitemap-news.xml': { fn: 'generate-sitemap', fixed: { part: 'news' }, contentType: 'application/xml; charset=utf-8' },
});

const APEX_HOST = 'digibastion.com';
const INCIDENT_PATH = /^\/threat-intel\/([^/]+)$/;
const WEEKLY_PATH = /^\/threat-intel\/weekly\/([^/]+)$/;
const RESERVED_INCIDENT_IDS = new Set(['methodology', 'weekly']);
/** news_articles.id is a uuid; anything else cannot exist and gets a 404 without a query. */
export const ARTICLE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Browsers send text/html; many preview bots send only a wildcard or nothing. */
function acceptsHtml(accept: string | null): boolean {
  if (accept === null || accept.trim() === '') return true;
  return /text\/html|application\/xhtml\+xml|\*\/\*/i.test(accept);
}

function proxyTarget(spec: ProxySpec, search: URLSearchParams): string {
  const params = new URLSearchParams(spec.fixed);
  search.forEach((value, key) => {
    if (!(key in spec.fixed)) params.append(key, value);
  });
  return `${FUNCTIONS_BASE_URL}/${spec.fn}?${params.toString()}`;
}

/** What to do with one request. Pure: the same input always gives the same plan. */
export function classifyRequest(method: string, url: URL, accept: string | null): Route {
  if (url.hostname === APEX_HOST) {
    return { kind: 'redirect', status: 301, location: `${SITE_URL}${url.pathname}${url.search}` };
  }
  const verb = method.toUpperCase();
  if (verb !== 'GET' && verb !== 'HEAD') return { kind: 'passthrough' };

  const path = url.pathname;
  const legacy = LEGACY_REDIRECTS[path];
  if (legacy) return { kind: 'redirect', status: 301, location: `${url.origin}${legacy}${url.search}` };

  const proxy = PROXIES[path];
  if (proxy) return { kind: 'proxy', target: proxyTarget(proxy, url.searchParams), contentType: proxy.contentType };

  if (!acceptsHtml(accept)) return { kind: 'passthrough' };

  const weekly = WEEKLY_PATH.exec(path);
  if (weekly) return WEEK_START.test(weekly[1]) ? { kind: 'weekly', weekStart: weekly[1] } : { kind: 'passthrough' };

  const incident = INCIDENT_PATH.exec(path);
  if (incident && !RESERVED_INCIDENT_IDS.has(incident[1]) && SAFE_ARTICLE_ID.test(incident[1])) {
    return { kind: 'incident', id: incident[1] };
  }
  return { kind: 'passthrough' };
}

/** Sets the vercel.json headers, optionally sending the CSP as report-only while it is being tried out. */
export function applySecurityHeaders(headers: Headers, options: { cspReportOnly: boolean }): Headers {
  headers.delete('Content-Security-Policy');
  headers.delete('Content-Security-Policy-Report-Only');
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (key === 'Content-Security-Policy' && options.cspReportOnly) headers.set('Content-Security-Policy-Report-Only', value);
    else headers.set(key, value);
  }
  return headers;
}

const ROOT_OPEN = '<div id="root">';
// The root element's own closing tag: the first </div> followed by a script,
// a noscript block or </body>. The prerendered body never contains a script.
const ROOT_CLOSE = /<\/div>(?=\s*(?:<script\b|<noscript\b|<\/body>))/gi;

/**
 * The origin page with this route's head between the seo:head markers and its
 * readable body inside #root. Null when the origin page has no markers or no
 * root element, so the caller can serve the origin page unchanged.
 */
export function rewriteHtml(originHtml: string, meta: RouteMeta): string | null {
  const headStart = originHtml.indexOf(HEAD_START);
  const headEnd = originHtml.indexOf(HEAD_END);
  if (headStart < 0 || headEnd < headStart) return null;

  // Slicing, not String.replace, so "$&" in a title stays literal.
  const html = `${originHtml.slice(0, headStart + HEAD_START.length)}\n    ${renderHead(meta)}\n    ${originHtml.slice(headEnd)}`;
  const body = renderBody(meta.body);

  const markerAt = html.indexOf(BODY_MARKER);
  if (markerAt >= 0) return `${html.slice(0, markerAt)}${body}${html.slice(markerAt + BODY_MARKER.length)}`;

  const rootAt = html.indexOf(ROOT_OPEN);
  if (rootAt < 0) return null;
  const contentStart = rootAt + ROOT_OPEN.length;
  ROOT_CLOSE.lastIndex = contentStart;
  const close = ROOT_CLOSE.exec(html);
  if (!close) return null;
  return `${html.slice(0, contentStart)}${body}${html.slice(close.index)}`;
}

export const NOT_FOUND_META: RouteMeta = {
  ...SITE_FALLBACK_META,
  path: '/404',
  title: 'Page not found | Digibastion',
  description: 'This page does not exist or was removed. Recent Web3 incidents, weekly reports and security guides are linked below.',
  robots: 'noindex,follow',
  canonical: null,
  jsonLd: [],
  body: {
    breadcrumbs: [{ href: '/', label: 'Home' }],
    h1: 'Page not found',
    intro: 'We could not find this page. The record may have been removed, merged into another report, or the link may be incomplete.',
    links: [...SITE_LINKS],
  },
};

/** The origin page turned into a noindex "not found" page, for a real 404. */
export function notFoundHtml(originHtml: string): string {
  const rewritten = rewriteHtml(originHtml, NOT_FOUND_META);
  if (rewritten) return rewritten;
  const tag = '<meta name="robots" content="noindex" />';
  const headAt = originHtml.search(/<head[^>]*>/i);
  if (headAt < 0) return `${tag}${originHtml}`;
  const insertAt = originHtml.indexOf('>', headAt) + 1;
  return `${originHtml.slice(0, insertAt)}${tag}${originHtml.slice(insertAt)}`;
}

/** Columns the incident page needs; the same fields mapNewsArticleRow reads. */
export const INCIDENT_COLUMNS = 'id,uid,title,summary,content,category,severity,tags,affected_technologies,link,source_url,source_name,author,cve_id,published_at,created_at,metadata';

const SEVERITIES: readonly SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'info'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '') : [];
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * A news_articles row as the NewsArticle the page builders take. Follows
 * mapNewsArticleRow in src/lib/threatIntel/articleRow.ts, which the Worker
 * cannot import (its '@/' imports pull in React icons).
 */
export function articleFromRow(row: unknown): NewsArticle | null {
  if (!isRecord(row)) return null;
  const id = typeof row.id === 'string' ? row.id.trim() : '';
  const title = sanitizeText(typeof row.title === 'string' ? row.title : '');
  const publishedAt = parseDate(row.published_at);
  if (!id || !title || !publishedAt) return null;
  const summary = sanitizeText(typeof row.summary === 'string' ? row.summary : '');
  return {
    id,
    title,
    summary,
    content: typeof row.content === 'string' && row.content.trim() !== '' ? sanitizeText(row.content) : summary,
    category: (optionalText(row.category) ?? 'vulnerability-disclosure') as NewsCategory,
    tags: stringList(row.tags),
    severity: SEVERITIES.includes(row.severity as SeverityLevel) ? (row.severity as SeverityLevel) : 'info',
    sourceUrl: optionalText(row.source_url),
    link: optionalText(row.link),
    publishedAt,
    createdAt: parseDate(row.created_at) ?? undefined,
    affectedTechnologies: stringList(row.affected_technologies),
    author: optionalText(row.author),
    cveId: optionalText(row.cve_id),
    sourceName: optionalText(row.source_name),
    metadata: isRecord(row.metadata) ? (row.metadata as NewsArticle['metadata']) : undefined,
  };
}

function duplicateOfUid(metadata: unknown): string | null {
  if (!isRecord(metadata)) return null;
  const uid = metadata.duplicate_of_uid;
  return typeof uid === 'string' && uid.trim() !== '' ? uid.trim() : null;
}

export type IncidentOutcome =
  | { kind: 'render'; meta: RouteMeta }
  | { kind: 'duplicate'; primaryUid: string }
  | { kind: 'not-found' };

/**
 * What the page for one row should be, in the same order as the app's deep
 * link: merged records forward, rejected records are missing, the rest
 * render. Only rows that pass isIndexableIncidentMetadata may be indexed;
 * RSS relays render as noindex,follow so links in emails keep working.
 */
export function incidentOutcome(row: unknown): IncidentOutcome {
  const article = articleFromRow(row);
  if (!article || !isRecord(row)) return { kind: 'not-found' };
  const primaryUid = duplicateOfUid(row.metadata);
  if (primaryUid) return { kind: 'duplicate', primaryUid };
  if (!isPublishableMetadata(row.metadata)) return { kind: 'not-found' };
  const meta = incidentRouteMeta(incidentSeoInputFromArticle(article));
  const indexable = meta.robots === 'index' && isIndexableIncidentMetadata(row.metadata);
  return { kind: 'render', meta: indexable ? meta : { ...meta, robots: 'noindex,follow' } };
}

/**
 * Where a merged record's URL should 301 to, keeping the query (UTM tags).
 * Null unless the primary is a different, publishable record, so a bad
 * merge (A -> B -> A) can never loop.
 */
export function primaryRedirectLocation(currentId: string, primary: unknown, search: string, siteOrigin: string): string | null {
  if (!isRecord(primary) || typeof primary.id !== 'string') return null;
  const id = primary.id;
  if (id === currentId || !SAFE_ARTICLE_ID.test(id) || !isPublishableMetadata(primary.metadata)) return null;
  return `${siteOrigin}${incidentPath(id)}${search}`;
}

export type WeeklyOutcome = { kind: 'render'; meta: RouteMeta } | { kind: 'not-found' };

/** The get_weekly_newsletter payload as page metadata; null, malformed or another week is a 404. */
export function weeklyOutcome(payload: unknown, weekStart: string): WeeklyOutcome {
  const page = parseWeeklyNewsletterResponse(payload);
  if (!page || page.content.weekStart !== weekStart) return { kind: 'not-found' };
  return { kind: 'render', meta: weeklyRouteMeta(page.content, page.generatedAt ?? page.content.issueDate) };
}

/** A Location from the origin host, moved onto the site host so visitors never land on the origin. */
/**
 * The origin URL for a request path. The path is set on a copy of the base
 * rather than resolved against it, so a path like `//evil.example/x` cannot
 * move the request to another host. Returns null when the base is unusable
 * or the result would leave the origin.
 */
export function originTarget(originBase: string, pathname: string, search: string): string | null {
  let origin: URL;
  try {
    origin = new URL(originBase);
  } catch {
    return null;
  }
  const target = new URL(origin.href);
  const prefix = origin.pathname.replace(/\/+$/, '');
  target.pathname = `${prefix}/${pathname.replace(/^\/+/, '')}`;
  target.search = search;
  target.hash = '';
  return target.origin === origin.origin ? target.href : null;
}

export function rewriteOriginLocation(location: string, originBase: string, siteOrigin: string): string {
  let resolved: URL;
  let origin: URL;
  try {
    origin = new URL(originBase);
    resolved = new URL(location, origin);
  } catch {
    return location;
  }
  if (resolved.origin !== origin.origin) return location;
  return `${siteOrigin}${resolved.pathname}${resolved.search}${resolved.hash}`;
}
