// Shared NewsletterItem fixtures for the weekly module tests. Not a test file
// itself (vitest collects *.test.ts only) and never imported by a function.
import type { NewsletterItem, WeeklyPublicContent } from './newsletter-content.ts';

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

/** A public weekly issue (no archive) with five top items: two written by AI, the rest from templates. */
export function weeklyPublicContent(overrides: Partial<WeeklyPublicContent> = {}): WeeklyPublicContent {
  const names = ['Example Protocol', 'Second Vault', 'Third Pool', 'Fourth Bridge', 'Fifth Lender'];
  const sources = ['QuillMonitor', 'SlowMist', 'QuillMonitor', 'Web3 Is Going Great', 'SlowMist'];
  const top = names.map((name, index) => {
    const item = weeklyItem({
      uid: `quillmonitor:top${index + 1}`,
      title: `${name} incident`,
      projectName: name,
      sourceName: sources[index],
      sourceUrl: `https://source.example/${index + 1}`,
      status: index === 2 ? 'unconfirmed' : 'confirmed',
      amountUsd: (5 - index) * 1_000_000,
      amountDisplay: `$${5 - index}M`,
    });
    return {
      item,
      what: { id: `top:${item.uid}:what`, text: `${name} reported a loss.`, origin: index < 2 ? 'ai' as const : 'template' as const },
      action: { id: `top:${item.uid}:action`, text: `Review approvals linked to ${name}.`, origin: 'template' as const },
    };
  });
  return {
    version: 1,
    kind: 'weekly',
    weekStart: WEEK_START,
    weekEnd: '2026-10-11',
    issueDate: '2026-10-12',
    totals: {
      lossUsd: 12_300_000,
      previousLossUsd: 8_000_000,
      unconfirmedLossUsd: 3_000_000,
      incidentCount: 9,
      unconfirmedCount: 2,
      fundsReturnedCount: 1,
      lateReportCount: 1,
      byAttackType: [{ key: 'bridge-exploit', label: 'Bridge Exploit', count: 4, lossUsd: 9_000_000 }],
      byChain: [{ key: 'ethereum', label: 'Ethereum', count: 5, lossUsd: 10_000_000 }],
    },
    top,
    trends: { id: 'trends', text: 'Bridge exploits led the week.', origin: 'template' },
    vulnerabilities: {
      items: [weeklyVulnerability()],
      summary: { id: 'vulnerabilities', text: 'One critical CVE was disclosed.', origin: 'template' },
    },
    opsecTip: { id: 'revoke', text: 'Review your token approvals.', url: 'https://revoke.cash', guideTitle: 'Wallet security' },
    sources: ['QuillMonitor', 'SlowMist', 'Web3 Is Going Great', 'The Hacker News'],
    ...overrides,
  };
}
