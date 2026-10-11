// Optional Cloudflare Worker in front of www.digibastion.com. Inert until DNS
// moves to Cloudflare and a route is added (see ../README.md).
//
// It gives every incident and weekly page its own head tags at request time,
// returns real 404s and 301s, serves the feeds and dynamic sitemaps from our
// own host with the right content type, and sends the vercel.json security
// headers. Every visitor gets the same HTML (no user-agent checks). When
// Supabase fails or is slow, the origin page is served unchanged.
import {
  ARTICLE_UUID,
  applySecurityHeaders,
  classifyRequest,
  INCIDENT_COLUMNS,
  incidentOutcome,
  notFoundHtml,
  primaryRedirectLocation,
  rewriteHtml,
  rewriteOriginLocation,
  weeklyOutcome,
  type Route,
} from './plan';
import type { RouteMeta } from '../../../src/seo/routeTypes';

const DEFAULT_SUPABASE_URL = 'https://sdszjqltoheqhfkeprrd.supabase.co';
const SUPABASE_TIMEOUT_MS = 4_000;
const CACHE_SECONDS = 300;
const CACHE_PREFIX = '/__edge-cache/v1';

type Page =
  | { kind: 'render'; meta: RouteMeta }
  | { kind: 'redirect'; location: string }
  | { kind: 'not-found' };

interface Context {
  request: Request;
  url: URL;
  env: Env;
  ctx: ExecutionContext;
  cspReportOnly: boolean;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const context: Context = { request, url, env, ctx, cspReportOnly: env.CSP_REPORT_ONLY === 'true' };
    const route = classifyRequest(request.method, url, request.headers.get('Accept'));
    switch (route.kind) {
      case 'redirect':
        return redirect(route.location);
      case 'proxy':
        return proxy(context, route);
      case 'incident':
      case 'weekly':
        return dynamicPage(context, route);
      default:
        return finishOrigin(context, await fetchOrigin(context, false));
    }
  },
};

function redirect(location: string): Response {
  return new Response(null, { status: 301, headers: { Location: location, 'Cache-Control': 'public, max-age=3600' } });
}

/**
 * Empty (the default) sends requests on to the DNS record's origin, Lovable
 * at 185.158.133.1, as Cloudflare does for any proxied record. A separate
 * origin host only works if that host serves the site without redirecting
 * to www; digibastion.lovable.app redirects there today (checked 2026-10-11).
 */
function originBase(env: Env): string {
  return env.ORIGIN_URL?.trim() ?? '';
}

/**
 * The same path from the origin. `forRewrite` drops conditional and range
 * headers so the origin always sends a full page we can rewrite.
 */
async function fetchOrigin({ request, url, env }: Context, forRewrite: boolean): Promise<Response> {
  const base = originBase(env);
  const headers = new Headers(request.headers);
  headers.delete('Host');
  if (forRewrite) {
    for (const name of ['If-None-Match', 'If-Modified-Since', 'Range']) headers.delete(name);
  }
  const method = forRewrite ? 'GET' : request.method;
  const hasBody = method !== 'GET' && method !== 'HEAD';
  // A Worker's fetch to its own route's URL skips the Worker and reaches the DNS origin.
  const target = base ? new URL(`${url.pathname}${url.search}`, base).toString() : request.url;
  return fetch(target, { method, headers, body: hasBody ? request.body : null, redirect: 'manual' });
}

/** Origin response headers safe to send from our host. */
function originHeaders({ url, env }: Context, response: Response): Headers {
  const headers = new Headers(response.headers);
  // A preview host may be marked noindex; our pages set robots in their own meta tag.
  headers.delete('X-Robots-Tag');
  const location = headers.get('Location');
  const base = originBase(env);
  if (location && base) headers.set('Location', rewriteOriginLocation(location, base, url.origin));
  headers.set('X-Content-Type-Options', 'nosniff');
  return headers;
}

const isHtml = (headers: Headers): boolean => /text\/html/i.test(headers.get('Content-Type') ?? '');

function sameUrl(location: string, url: URL): boolean {
  try {
    return new URL(location, url).href === url.href;
  } catch {
    return false;
  }
}

function finishOrigin(context: Context, response: Response): Response {
  const headers = originHeaders(context, response);
  const location = headers.get('Location');
  if (response.status >= 300 && response.status < 400 && location && sameUrl(location, context.url)) {
    console.error(`[edge] origin redirects ${context.url.pathname} to itself; check ORIGIN_URL`);
    return new Response('The site is misconfigured: the origin redirects back to this address.', { status: 502 });
  }
  if (isHtml(headers)) applySecurityHeaders(headers, { cspReportOnly: context.cspReportOnly });
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function htmlResponse(context: Context, origin: Response, html: string, status: number): Response {
  const headers = originHeaders(context, origin);
  for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified']) headers.delete(name);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  if (status === 404) headers.set('Cache-Control', 'public, max-age=60');
  applySecurityHeaders(headers, { cspReportOnly: context.cspReportOnly });
  const body = context.request.method === 'HEAD' ? null : html;
  return new Response(body, { status, headers });
}

async function dynamicPage(context: Context, route: Extract<Route, { kind: 'incident' | 'weekly' }>): Promise<Response> {
  const origin = await fetchOrigin(context, true);
  if (origin.status !== 200 || !isHtml(origin.headers)) return finishOrigin(context, origin);
  const html = await origin.text();

  let page: Page;
  try {
    page = route.kind === 'incident' ? await incidentPage(context, route.id) : await weeklyPage(context, route.weekStart);
  } catch (error) {
    // Fail open: the SPA still loads its own data in the browser.
    console.warn(`[edge] ${route.kind} lookup failed, serving origin page: ${error instanceof Error ? error.message : String(error)}`);
    return htmlResponse(context, origin, html, 200);
  }

  if (page.kind === 'redirect') return redirect(page.location);
  if (page.kind === 'not-found') return htmlResponse(context, origin, notFoundHtml(html), 404);
  const rewritten = rewriteHtml(html, page.meta);
  if (!rewritten) console.warn('[edge] origin page has no seo markers; serving it unchanged');
  return htmlResponse(context, origin, rewritten ?? html, 200);
}

async function incidentPage(context: Context, id: string): Promise<Page> {
  if (!ARTICLE_UUID.test(id)) return { kind: 'not-found' };
  const rows = await supabaseJson(
    context,
    `incident/${id}`,
    `/rest/v1/news_articles?select=${encodeURIComponent(INCIDENT_COLUMNS)}&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  const outcome = incidentOutcome(Array.isArray(rows) ? rows[0] ?? null : null);
  if (outcome.kind !== 'duplicate') return outcome;

  const primaries = await supabaseJson(
    context,
    `primary/${encodeURIComponent(outcome.primaryUid)}`,
    `/rest/v1/news_articles?select=id,metadata&uid=eq.${encodeURIComponent(outcome.primaryUid)}&limit=1`,
  );
  const primary = Array.isArray(primaries) ? primaries[0] ?? null : null;
  const location = primaryRedirectLocation(id, primary, context.url.search, context.url.origin);
  return location ? { kind: 'redirect', location } : { kind: 'not-found' };
}

async function weeklyPage(context: Context, weekStart: string): Promise<Page> {
  const payload = await supabaseJson(context, `weekly/${weekStart}`, '/rest/v1/rpc/get_weekly_newsletter', { p_week_start: weekStart });
  return weeklyOutcome(payload, weekStart);
}

/**
 * One PostgREST read with the public anon key, cached for five minutes in
 * this data centre. Throws on any failure so the caller can fail open.
 */
async function supabaseJson(context: Context, cacheName: string, path: string, rpcBody?: Record<string, unknown>): Promise<unknown> {
  const { env, ctx, url } = context;
  const anonKey = env.SUPABASE_ANON_KEY?.trim();
  if (!anonKey) throw new Error('SUPABASE_ANON_KEY is not set');
  const base = (env.SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');

  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}${CACHE_PREFIX}/${cacheName}`);
  const hit = await cache.match(cacheKey);
  if (hit) return hit.json();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  let text: string;
  try {
    const response = await fetch(`${base}${path}`, {
      method: rpcBody ? 'POST' : 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
        ...(rpcBody ? { 'Content-Type': 'application/json' } : {}),
      },
      body: rpcBody ? JSON.stringify(rpcBody) : null,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${path.split('?')[0]}`);
    text = await response.text();
  } finally {
    clearTimeout(timer);
  }
  const data: unknown = JSON.parse(text);
  ctx.waitUntil(cache.put(cacheKey, new Response(text, {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
  })));
  return data;
}

async function proxy(context: Context, route: Extract<Route, { kind: 'proxy' }>): Promise<Response> {
  let upstream: Response;
  try {
    upstream = await fetch(route.target, { method: context.request.method, headers: { Accept: '*/*' } });
  } catch {
    return new Response('Feed temporarily unavailable.', { status: 502, headers: { 'Retry-After': '300' } });
  }
  // Fresh headers: the gateway's text/plain type and sandbox CSP must not reach readers.
  const headers = new Headers({
    'Content-Type': upstream.ok ? route.contentType : 'text/plain; charset=utf-8',
    'Cache-Control': upstream.headers.get('Cache-Control') ?? 'public, max-age=900',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const name of ['Access-Control-Allow-Origin', 'ETag', 'Last-Modified']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(context.request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers });
}
