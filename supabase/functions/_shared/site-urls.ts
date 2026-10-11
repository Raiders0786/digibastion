// Canonical Digibastion URLs. Pure module: no Deno or URL-specifier imports,
// so vitest, Vite, the Worker and Deno can all load it.
export const SITE_URL = 'https://www.digibastion.com' as const;
export const SITE_HOST = 'www.digibastion.com' as const;
export const FUNCTIONS_BASE_URL = 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1' as const;

const WEEK = /^\d{4}-\d{2}-\d{2}$/;

export function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

export function incidentPath(articleId: string): string {
  return `/threat-intel/${encodeURIComponent(articleId)}`;
}

export function weeklyPath(weekStart: string): string {
  if (!WEEK.test(weekStart)) throw new Error('weekStart must be YYYY-MM-DD');
  return `/threat-intel/weekly/${weekStart}`;
}

export function absoluteSiteUrl(path: string, siteUrl: string = SITE_URL): string {
  return `${trimTrailingSlashes(siteUrl)}${path.startsWith('/') ? path : `/${path}`}`;
}

export const canonicalIncidentUrl = (id: string, siteUrl: string = SITE_URL): string =>
  absoluteSiteUrl(incidentPath(id), siteUrl);

export const canonicalWeeklyUrl = (weekStart: string, siteUrl: string = SITE_URL): string =>
  absoluteSiteUrl(weeklyPath(weekStart), siteUrl);

/**
 * Canonical form of a URL on our site: no query, no fragment, no trailing
 * slash except on `/`. Returns null for any other host, including the apex
 * domain and look-alikes such as `www.digibastion.com.evil.test`.
 */
export function canonicalizeUrl(input: string, siteUrl: string = SITE_URL): string | null {
  const site = trimTrailingSlashes(siteUrl);
  let rest: string;
  if (input.startsWith('//')) return null; // protocol-relative: another host
  if (input.startsWith('/')) rest = input;
  else if (input === site || ['/', '?', '#'].some((c) => input.startsWith(`${site}${c}`))) rest = input.slice(site.length);
  else return null;
  let path = rest.split('#')[0].split('?')[0];
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, '') || '/';
  return `${site}${path}`;
}

/** The feeds live on the functions host; the site links to them. */
export const FEED_URLS = {
  rss: `${FUNCTIONS_BASE_URL}/threat-intel-feed?format=rss`,
  atom: `${FUNCTIONS_BASE_URL}/threat-intel-feed?format=atom`,
  json: `${FUNCTIONS_BASE_URL}/threat-intel-feed?format=json`,
} as const;
