// Shared NewsletterItem fixtures for the weekly module tests. Not a test file
// itself (vitest collects *.test.ts only) and never imported by a function.
import type { NewsletterItem } from './newsletter-content.ts';

export const SITE = 'https://www.digibastion.com';
export const WEEK_START = '2026-10-05';

export function weeklyItem(overrides: Partial<NewsletterItem> = {}): NewsletterItem {
  const uid = overrides.uid ?? 'quillmonitor:abc';
  return {
    uid,
    articleId: `id-${uid}`,
    title: 'Example Protocol loses funds in bridge attack',
    incidentUrl: `${SITE}/threat-intel/id-${uid}`,
    sourceName: 'QuillMonitor',
    sourceUrl: 'https://x.com/quillaudits/status/1',
    providers: ['quillmonitor'],
    severity: 'high',
    category: 'defi-exploits',
    isWeb3Incident: true,
    status: 'confirmed',
    projectName: 'Example Protocol',
    chain: 'Ethereum',
    attackType: 'Bridge Exploit',
    amountUsd: 4_200_000,
    amountDisplay: '$4.2M',
    fundsReturned: null,
    incidentDate: '2026-10-07',
    cveId: null,
    tags: [],
    technologies: [],
    summary: 'Attackers drained the bridge contract.',
    createdAt: '2026-10-07T08:00:00.000Z',
    ...overrides,
  };
}

export function weeklyVulnerability(overrides: Partial<NewsletterItem> = {}): NewsletterItem {
  return weeklyItem({
    uid: 'rss:cve-1',
    title: 'CVE-2026-1234 in OpenSSL',
    sourceName: 'The Hacker News',
    sourceUrl: 'https://thehackernews.com/a',
    providers: [],
    severity: 'critical',
    category: 'vulnerability-disclosure',
    isWeb3Incident: false,
    status: null,
    projectName: null,
    chain: null,
    attackType: null,
    amountUsd: null,
    amountDisplay: null,
    incidentDate: null,
    cveId: 'CVE-2026-1234',
    ...overrides,
  });
}
