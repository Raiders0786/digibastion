// Who an incident came from, in words and as a link. Every surface (feeds,
// prerendered pages, share text, emails) names the source with these helpers
// and never credits Digibastion as the verifier.
// Pure module: no Deno or URL imports.
import { SITE_HOST } from './site-urls.ts';

export const QUILLMONITOR_DATABASE_URL = 'https://www.quillaudits.com/web3-hacks-database' as const;

const PROVIDER_LABELS = new Map<string, string>([
  ['quillmonitor', 'QuillMonitor'],
  ['slowmist', 'SlowMist Hacked'],
  ['web3-incidents', 'Web3 Is Going Just Great'],
  ['web3', 'Web3 Is Going Just Great'],
]);

export function providerLabel(provider: string | null | undefined): string | null {
  return provider ? PROVIDER_LABELS.get(provider.trim().toLowerCase()) ?? null : null;
}

/** True when QuillMonitor is the only source, so "Powered by QuillMonitor" must show. */
export function isQuillMonitorOnly(providers: readonly string[]): boolean {
  return providers.length === 1 && providers[0] === 'quillmonitor';
}

export function sourceLabelFor(item: { providers: readonly string[]; sourceName: string | null }): string {
  for (const provider of item.providers) {
    const label = providerLabel(provider);
    if (label) return label;
  }
  const name = item.sourceName?.trim();
  if (!name || /digibastion/i.test(name)) return 'Source not given';
  return name;
}

/** The original report's URL, or null when it is missing, unsafe or one of our own pages. */
export function sourceLinkFor(item: { sourceUrl: string | null; incidentUrl: string }): string | null {
  const url = item.sourceUrl?.trim();
  if (!url || !/^https?:\/\//i.test(url) || url === item.incidentUrl) return null;
  const authority = url.replace(/^https?:\/\//i, '').split(/[/?#]/)[0];
  const host = authority.slice(authority.lastIndexOf('@') + 1).split(':')[0].toLowerCase();
  if (!host) return null;
  return host === SITE_HOST || host === 'digibastion.com' ? null : url;
}
