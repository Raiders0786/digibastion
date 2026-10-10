import { describe, expect, it } from 'vitest';
import { buildDailyBriefContent, buildDailySubject } from './daily-brief.ts';
import { buildUnsubscribeLinks } from './email-compliance.ts';
import type { DailyBriefContent, NewsletterItem, StatusChange } from './newsletter-content.ts';
import { renderDailyBriefEmail, renderNewsletterEmail, type RenderContext } from './newsletter-render.ts';
import { assembleWeeklyContent } from './weekly-content.ts';
import { buildWeeklySubject } from './weekly-render.ts';
import { computeWeeklyTotals } from './weekly-stats.ts';

const SITE = 'https://www.digibastion.com';
const POSTAL = '123 Example Street, Suite 4, Springfield, IL 62701, USA';

const links = buildUnsubscribeLinks({
  siteUrl: SITE,
  functionsBaseUrl: 'https://example.supabase.co/functions/v1',
  email: 'reader@example.com',
  token: 'tok-123',
});
const ctx: RenderContext = { links, postalAddress: POSTAL, siteUrl: SITE };

function item(overrides: Partial<NewsletterItem> = {}): NewsletterItem {
  const uid = overrides.uid ?? 'quillmonitor:abc';
  return {
    uid,
    articleId: `id-${uid}`,
    title: 'Example Protocol loses funds in bridge attack',
    incidentUrl: `${SITE}/threat-intel/id-${encodeURIComponent(uid)}`,
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
    summary: 'Attackers drained the bridge contract after a signature check was skipped.',
    createdAt: '2026-10-10T08:00:00.000Z',
    ...overrides,
  };
}

const vuln = (overrides: Partial<NewsletterItem> = {}) => item({
  uid: 'rss:cve-1',
  title: 'CVE-2026-1234 in OpenSSL',
  sourceName: 'The Hacker News',
  sourceUrl: 'https://thehackernews.com/cve',
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

function change(overrides: Partial<StatusChange>): StatusChange {
  return {
    change: 'confirmed',
    at: '2026-10-10T12:00:00.000Z',
    item: item({ uid: 'q:chg' }),
    previousAmountUsd: null,
    amountUsd: null,
    ...overrides,
  };
}

function content(overrides: Partial<Parameters<typeof buildDailyBriefContent>[0]> = {}): DailyBriefContent {
  return buildDailyBriefContent({
    issueDate: '2026-10-11',
    periodStart: '2026-10-10T00:00:00.000Z',
    periodEnd: '2026-10-11T00:00:00.000Z',
    recent: [
      item({ uid: 'q:1' }),
      item({ uid: 'q:2', status: 'unconfirmed', projectName: 'Other Finance', title: 'Other Finance reported drained' }),
      vuln(),
    ],
    stillUnconfirmed: [],
    statusChanges: [
      change({ change: 'confirmed', item: item({ uid: 'q:c' }) }),
      change({ change: 'revised', item: item({ uid: 'q:r', amountUsd: 40_000_000 }), previousAmountUsd: 4_200_000, amountUsd: 40_000_000 }),
      change({ change: 'retracted', item: item({ uid: 'q:x', sourceName: 'SlowMist' }) }),
    ],
    ...overrides,
  });
}

const SECTION_TITLES = ['Incidents', 'Still unconfirmed', 'Status changes', 'Vulnerabilities and supply-chain', 'One thing to do today'];

describe('renderDailyBriefEmail', () => {
  it('renders all five section titles when populated', () => {
    const { html, text, subject } = renderDailyBriefEmail(content(), ctx);
    for (const title of SECTION_TITLES) {
      expect(html).toContain(`>${title}<`);
      expect(text).toContain(title);
    }
    expect(subject).toBe(buildDailySubject(content()));
  });

  it('hides empty sections but keeps the action', () => {
    const { html, text } = renderDailyBriefEmail(content({ recent: [vuln()], statusChanges: [] }), ctx);
    expect(html).not.toContain('>Incidents<');
    expect(html).not.toContain('>Still unconfirmed<');
    expect(html).not.toContain('>Status changes<');
    expect(html).toContain('>Vulnerabilities and supply-chain<');
    expect(html).toContain('>One thing to do today<');
    expect(text).not.toContain('Still unconfirmed');
  });

  it('renders the postal address and the unsubscribe link beside the manage link', () => {
    const { html, text } = renderDailyBriefEmail(content(), ctx);
    expect(html).toContain(POSTAL);
    expect(text).toContain(POSTAL);
    const unsubscribe = html.indexOf(links.unsubscribePageUrl.replace(/&/g, '&amp;'));
    const manage = html.indexOf(links.manageUrl.replace(/&/g, '&amp;'));
    expect(unsubscribe).toBeGreaterThan(-1);
    expect(manage).toBeGreaterThan(unsubscribe);
    expect(manage - unsubscribe).toBeLessThan(400);
  });

  it('shows the test warning only when asked', () => {
    expect(renderDailyBriefEmail(content(), ctx).html).not.toContain('Postal address not configured');
    const test = renderDailyBriefEmail(content(), { ...ctx, postalAddress: null, testWarning: true });
    expect(test.html).toContain('Postal address not configured');
    expect(test.text).toContain('Postal address not configured');
  });

  it('shows every item with its source name and incident page link', () => {
    const c = content();
    const { html, text } = renderDailyBriefEmail(c, ctx);
    const items = [...c.incidents, ...c.unconfirmed, ...c.vulnerabilities, ...c.statusChanges.map((entry) => entry.item)];
    for (const entry of items) {
      expect(html).toContain(entry.incidentUrl);
      expect(text).toContain(entry.incidentUrl);
      if (entry.sourceName) {
        expect(html).toContain(entry.sourceName);
        expect(text).toContain(entry.sourceName);
      }
    }
    expect(html).toContain('~$4.2M reported');
    expect(html).toContain('Ethereum');
    expect(html).toContain('Bridge Exploit');
  });

  it('labels unconfirmed items and never claims Digibastion verified anything', () => {
    const { html, text } = renderDailyBriefEmail(content(), ctx);
    expect(html).toMatch(/unconfirmed/i);
    expect(`${html}\n${text}`).not.toMatch(/verified by digibastion/i);
    expect(`${html}\n${text}`).not.toMatch(/immediate action required|massive|devastating|urgent/i);
    expect(html).not.toMatch(/<img/i); // no tracking pixel
  });

  it('words status changes from the source', () => {
    const { html, text } = renderDailyBriefEmail(content(), ctx);
    expect(html).toContain('Confirmed by QuillMonitor');
    expect(html).toContain('Revised: loss now ~$40M reported (was ~$4.2M)');
    expect(html).toContain('Retracted by the source');
    expect(text).toContain('Revised: loss now ~$40M reported (was ~$4.2M)');
  });

  it('stays under 90 KB at the maximum caps', () => {
    const long = 'Attackers drained the bridge contract after a signature check was skipped and moved funds through a mixer before bridging them out. '.repeat(3).slice(0, 280);
    const many = (prefix: string, overrides: Partial<NewsletterItem>) => Array.from({ length: 20 }, (_, index) =>
      item({ uid: `${prefix}:${index}-${'x'.repeat(40)}`, summary: long, title: `${'Long incident title '.repeat(8)}${index}`, ...overrides }));
    const c = content({
      recent: [
        ...many('inc', {}),
        ...many('unc', { status: 'unconfirmed' }),
        ...many('cve', { isWeb3Incident: false, status: null, cveId: 'CVE-2026-0001', category: 'vulnerability-disclosure', severity: 'critical' }),
      ],
      statusChanges: Array.from({ length: 20 }, (_, index) =>
        change({ change: 'revised', item: item({ uid: `chg:${index}-${'y'.repeat(40)}`, summary: long }), previousAmountUsd: 1_000_000, amountUsd: 2_000_000 })),
    });
    const { html } = renderDailyBriefEmail(c, ctx);
    expect(new TextEncoder().encode(html).length).toBeLessThan(90 * 1024);
  });

  it('escapes source-provided text', () => {
    const { html } = renderDailyBriefEmail(content({ recent: [item({ title: '<script>alert(1)</script>', sourceName: 'A & B' })] }), ctx);
    expect(html).not.toContain('<script>');
    expect(html).toContain('A &amp; B');
  });
});

describe('renderNewsletterEmail', () => {
  it('renders daily content', () => {
    const rendered = renderNewsletterEmail('daily', content(), ctx);
    expect(rendered?.subject).toBe(buildDailySubject(content()));
  });

  it('returns null for content that is not a daily brief', () => {
    expect(renderNewsletterEmail('daily', { kind: 'weekly' }, ctx)).toBeNull();
  });

  it('renders a stored weekly issue, archive included, and rejects malformed weekly content', () => {
    const top = [item({ createdAt: '2026-10-07T08:00:00.000Z', incidentDate: '2026-10-07' })];
    const stored = assembleWeeklyContent({
      weekStart: '2026-10-05',
      totals: computeWeeklyTotals({ weekStart: '2026-10-05', thisWeek: top, previousWeek: [] }),
      top,
      vulnerabilities: [],
      knownProjectNames: [],
      modelOutput: null,
      aiEnabled: false,
      model: null,
      prompt: null,
      rawOutput: null,
      error: null,
    });
    const rendered = renderNewsletterEmail('weekly', stored, ctx);
    expect(rendered?.subject).toBe(buildWeeklySubject(stored));
    expect(rendered?.html).toContain(POSTAL);
    expect(rendered?.html).not.toContain('archive');
    expect(renderNewsletterEmail('weekly', { kind: 'weekly', version: 1 }, ctx)).toBeNull();
    expect(renderNewsletterEmail('weekly', content(), ctx)).toBeNull();
  });
});
