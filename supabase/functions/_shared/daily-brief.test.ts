import { describe, expect, it } from 'vitest';
import {
  buildDailyBriefContent,
  buildDailySubject,
  dailyIssuePeriod,
  filterDailyBriefForSubscriber,
  isDailyBriefContent,
  type DailyBriefInput,
} from './daily-brief.ts';
import { DAILY_CAPS, type NewsletterItem, type StatusChange } from './newsletter-content.ts';

const SITE = 'https://www.digibastion.com';

function item(overrides: Partial<NewsletterItem> = {}): NewsletterItem {
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
    incidentDate: '2026-10-10',
    cveId: null,
    tags: [],
    technologies: [],
    summary: 'Attackers drained the bridge contract.',
    createdAt: '2026-10-10T08:00:00.000Z',
    ...overrides,
  };
}

const vuln = (overrides: Partial<NewsletterItem> = {}) => item({
  uid: 'rss:cve-1',
  title: 'CVE-2026-1234 in OpenSSL',
  sourceName: 'The Hacker News',
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
  cveId: 'CVE-2026-1234',
  ...overrides,
});

function change(overrides: Partial<StatusChange> = {}): StatusChange {
  return {
    change: 'confirmed',
    at: '2026-10-10T12:00:00.000Z',
    item: item({ uid: 'quillmonitor:changed', status: 'unconfirmed' }),
    previousAmountUsd: null,
    amountUsd: null,
    ...overrides,
  };
}

function input(overrides: Partial<DailyBriefInput> = {}): DailyBriefInput {
  return {
    issueDate: '2026-10-11',
    periodStart: '2026-10-10T00:00:00.000Z',
    periodEnd: '2026-10-11T00:00:00.000Z',
    recent: [],
    stillUnconfirmed: [],
    statusChanges: [],
    ...overrides,
  };
}

describe('dailyIssuePeriod', () => {
  it('covers the previous UTC day and ends at the issue date', () => {
    expect(dailyIssuePeriod('2026-10-11')).toEqual({
      periodStart: '2026-10-10T00:00:00.000Z',
      periodEnd: '2026-10-11T00:00:00.000Z',
    });
  });

  it('rejects malformed and impossible dates', () => {
    expect(dailyIssuePeriod('2026-13-01')).toBeNull();
    expect(dailyIssuePeriod('2026-02-30')).toBeNull();
    expect(dailyIssuePeriod('11-10-2026')).toBeNull();
  });
});

describe('buildDailyBriefContent', () => {
  it('assigns confirmed and null-status incidents, unconfirmed items and vulnerabilities to their sections', () => {
    const confirmed = item({ uid: 'q:1', status: 'confirmed' });
    const noFlow = item({ uid: 'slowmist:2', status: null, sourceName: 'SlowMist', providers: ['slowmist'] });
    const unconfirmed = item({ uid: 'q:3', status: 'unconfirmed' });
    const cve = vuln({ uid: 'rss:4' });
    const supplyChain = vuln({ uid: 'rss:5', cveId: null, category: 'supply-chain', severity: 'high' });
    const lowVuln = vuln({ uid: 'rss:6', severity: 'medium' });
    const plainNews = vuln({ uid: 'rss:7', cveId: null, category: 'operational-security' });

    const content = buildDailyBriefContent(input({ recent: [confirmed, noFlow, unconfirmed, cve, supplyChain, lowVuln, plainNews] }));

    expect(content).toMatchObject({ version: 1, kind: 'daily', issueDate: '2026-10-11' });
    expect(content.incidents.map((entry) => entry.uid).sort()).toEqual(['q:1', 'slowmist:2']);
    expect(content.unconfirmed.map((entry) => entry.uid)).toEqual(['q:3']);
    expect(content.vulnerabilities.map((entry) => entry.uid).sort()).toEqual(['rss:4', 'rss:5']);
  });

  it('carries over still-unconfirmed incidents without duplicating recent ones', () => {
    const recentUnconfirmed = item({ uid: 'q:1', status: 'unconfirmed' });
    const older = item({ uid: 'q:2', status: 'unconfirmed', createdAt: '2026-10-07T08:00:00.000Z' });
    const content = buildDailyBriefContent(input({
      recent: [recentUnconfirmed],
      stillUnconfirmed: [older, { ...recentUnconfirmed }],
    }));
    expect(content.unconfirmed.map((entry) => entry.uid).sort()).toEqual(['q:1', 'q:2']);
  });

  it('keeps status changes and shows a confirmed change with its confirmed status', () => {
    const revised = change({
      change: 'revised',
      item: item({ uid: 'q:rev' }),
      previousAmountUsd: 1_000_000,
      amountUsd: 4_200_000,
    });
    const content = buildDailyBriefContent(input({ statusChanges: [change(), revised] }));
    expect(content.statusChanges).toHaveLength(2);
    const confirmed = content.statusChanges.find((entry) => entry.change === 'confirmed');
    expect(confirmed?.item.status).toBe('confirmed');
  });

  it('collapses several changes to one incident: retraction wins, revisions span the day', () => {
    const uid = 'q:many';
    const content = buildDailyBriefContent(input({
      statusChanges: [
        change({ change: 'revised', at: '2026-10-10T01:00:00.000Z', item: item({ uid }), previousAmountUsd: 1_000_000, amountUsd: 2_000_000 }),
        change({ change: 'revised', at: '2026-10-10T05:00:00.000Z', item: item({ uid }), previousAmountUsd: 2_000_000, amountUsd: 3_000_000 }),
        change({ change: 'revised', at: '2026-10-10T02:00:00.000Z', item: item({ uid: 'q:other' }), previousAmountUsd: 1_000_000, amountUsd: 2_000_000 }),
        change({ change: 'revised', at: '2026-10-10T03:00:00.000Z', item: item({ uid: 'q:other' }), previousAmountUsd: 2_000_000, amountUsd: 1_000_000 }),
        change({ change: 'confirmed', at: '2026-10-10T04:00:00.000Z', item: item({ uid: 'q:gone' }) }),
        change({ change: 'retracted', at: '2026-10-10T06:00:00.000Z', item: item({ uid: 'q:gone' }) }),
      ],
    }));
    const byUid = new Map(content.statusChanges.map((entry) => [`${entry.item.uid}/${entry.change}`, entry]));
    expect(byUid.get(`${uid}/revised`)).toMatchObject({ previousAmountUsd: 1_000_000, amountUsd: 3_000_000 });
    // Revised there and back again: no net change, nothing to report.
    expect([...byUid.keys()].some((key) => key.startsWith('q:other/'))).toBe(false);
    expect([...byUid.keys()].filter((key) => key.startsWith('q:gone/'))).toEqual(['q:gone/retracted']);
  });

  it('caps every section and sorts with compareItems', () => {
    const many = (prefix: string, overrides: Partial<NewsletterItem>) => Array.from({ length: 30 }, (_, index) =>
      item({ uid: `${prefix}:${index}`, amountUsd: (index + 1) * 1_000, ...overrides }));
    const content = buildDailyBriefContent(input({
      recent: [
        ...many('inc', {}),
        ...many('unc', { status: 'unconfirmed' }),
        ...many('cve', { isWeb3Incident: false, status: null, cveId: 'CVE-1', category: 'vulnerability-disclosure' }),
      ],
      statusChanges: Array.from({ length: 30 }, (_, index) => change({ item: item({ uid: `chg:${index}` }) })),
    }));
    expect(content.incidents).toHaveLength(DAILY_CAPS.incidents);
    expect(content.unconfirmed).toHaveLength(DAILY_CAPS.unconfirmed);
    expect(content.vulnerabilities).toHaveLength(DAILY_CAPS.vulnerabilities);
    expect(content.statusChanges).toHaveLength(DAILY_CAPS.statusChanges);
    expect(content.incidents[0].uid).toBe('inc:29'); // largest amount first
  });

  it('picks the action deterministically per date', () => {
    const a = buildDailyBriefContent(input({ recent: [item()] }));
    const b = buildDailyBriefContent(input({ recent: [item()] }));
    expect(a.action).toEqual(b.action);
    const phishing = buildDailyBriefContent(input({ recent: [item({ attackType: 'Phishing' })] }));
    expect(['revoke-approvals', 'read-before-signing']).toContain(phishing.action.id);
  });
});

describe('filterDailyBriefForSubscriber', () => {
  const content = buildDailyBriefContent(input({
    recent: [
      item({ uid: 'q:eth', chain: 'Ethereum', severity: 'critical' }),
      item({ uid: 'q:sol', chain: 'Solana', severity: 'medium' }),
      item({ uid: 'q:unc', status: 'unconfirmed', chain: 'Ethereum' }),
      vuln({ uid: 'rss:cve' }),
    ],
    statusChanges: [change({ item: item({ uid: 'q:chg', chain: 'Ethereum', status: 'unconfirmed' }) })],
  }));

  it('applies the severity threshold', () => {
    const filtered = filterDailyBriefForSubscriber(content, { severity_threshold: 'high' });
    expect(filtered?.incidents.map((entry) => entry.uid)).toEqual(['q:eth']);
  });

  it('applies content_scope web3-incidents', () => {
    const filtered = filterDailyBriefForSubscriber(content, { content_scope: 'web3-incidents', severity_threshold: 'info' });
    expect(filtered?.vulnerabilities).toEqual([]);
    expect(filtered?.incidents).toHaveLength(2);
  });

  it('applies chains to incidents only', () => {
    const filtered = filterDailyBriefForSubscriber(content, { chains: ['ethereum'], severity_threshold: 'info' });
    expect(filtered?.incidents.map((entry) => entry.uid)).toEqual(['q:eth']);
    expect(filtered?.vulnerabilities.map((entry) => entry.uid)).toEqual(['rss:cve']);
  });

  it('drops unconfirmed items when include_preliminary is false but keeps confirmations', () => {
    const filtered = filterDailyBriefForSubscriber(content, { include_preliminary: false, severity_threshold: 'info' });
    expect(filtered?.unconfirmed).toEqual([]);
    expect(filtered?.statusChanges.map((entry) => entry.change)).toEqual(['confirmed']);
  });

  it('returns null when the filter empties sections 1 to 4', () => {
    expect(filterDailyBriefForSubscriber(content, { chains: ['base'], content_scope: 'web3-incidents' })).toBeNull();
  });
});

describe('buildDailySubject', () => {
  it('counts the sections and omits zero parts', () => {
    const content = buildDailyBriefContent(input({
      recent: [item({ uid: 'a' }), item({ uid: 'b' }), item({ uid: 'c' }), item({ uid: 'd', status: 'unconfirmed' })],
      statusChanges: [change({ item: item({ uid: 'e' }) }), change({ change: 'retracted', item: item({ uid: 'f' }) })],
    }));
    expect(buildDailySubject(content)).toBe('Daily brief, Oct 11: 3 incidents, 1 unconfirmed, 2 status changes');
  });

  it('uses singular forms and includes vulnerabilities when they are all there is', () => {
    const content = buildDailyBriefContent(input({ recent: [vuln()] }));
    expect(buildDailySubject(content)).toBe('Daily brief, Oct 11: 1 vulnerability');
    const one = buildDailyBriefContent(input({ recent: [item()] }));
    expect(buildDailySubject(one)).toBe('Daily brief, Oct 11: 1 incident');
  });

  it('has no hype or emoji', () => {
    const subject = buildDailySubject(buildDailyBriefContent(input({ recent: [item({ severity: 'critical' })] })));
    expect(subject).not.toMatch(/urgent|massive|devastating|immediate action/i);
    expect(subject).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe('isDailyBriefContent', () => {
  it('accepts built content and rejects other shapes', () => {
    expect(isDailyBriefContent(buildDailyBriefContent(input()))).toBe(true);
    expect(isDailyBriefContent({ kind: 'weekly' })).toBe(false);
    expect(isDailyBriefContent(null)).toBe(false);
  });
});
