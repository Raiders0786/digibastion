import { describe, expect, it } from 'vitest';
import { buildDailyBriefContent, buildDailySubject } from './daily-brief.ts';
import { buildUnsubscribeLinks } from './email-compliance.ts';
import type { DailyBriefContent, NewsletterItem, StatusChange } from './newsletter-content.ts';
import { DAILY_RENDERED_ITEMS, DAILY_UPDATES_SHOWN, renderDailyBriefEmail, renderNewsletterEmail, type RenderContext } from './newsletter-render.ts';
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
      change({ change: 'retracted', item: item({ uid: 'q:x', sourceName: 'SlowMist', providers: ['slowmist'] }) }),
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

  it('stays under 90 KB when updates fill the email', () => {
    const long = 'A long summary sentence about a phishing campaign aimed at wallet users that keeps going. '.repeat(4).slice(0, 280);
    const news = Array.from({ length: 150 }, (_, index) => item({
      uid: `rss:${index}-${'z'.repeat(40)}`, isWeb3Incident: false, status: null, category: 'operational-security',
      severity: 'medium', cveId: null, summary: long, title: `${'Long news title '.repeat(8)}${index}`,
    }));
    const { html, text } = renderDailyBriefEmail(content({ recent: news }), ctx);
    expect(new TextEncoder().encode(html).length).toBeLessThan(90 * 1024);
    expect(text).toContain(`${150 - DAILY_UPDATES_SHOWN} more updates on Digibastion`);
  });

  it('shows more updates only in the room the featured sections leave', () => {
    const incidents = Array.from({ length: 15 }, (_, index) => item({ uid: `inc:${index}` }));
    const unconfirmed = Array.from({ length: 10 }, (_, index) => item({ uid: `unc:${index}`, status: 'unconfirmed' }));
    const cves = Array.from({ length: 10 }, (_, index) => item({ uid: `cve:${index}`, isWeb3Incident: false, status: null, cveId: 'CVE-2026-0001', category: 'vulnerability-disclosure', severity: 'critical' }));
    const news = Array.from({ length: 30 }, (_, index) => item({ uid: `rss:${index}`, title: `News ${index}`, isWeb3Incident: false, status: null, category: 'operational-security', severity: 'medium', cveId: null }));
    const { text } = renderDailyBriefEmail(content({ recent: [...incidents, ...unconfirmed, ...cves, ...news], statusChanges: [] }), ctx);
    const room = DAILY_RENDERED_ITEMS - 35;
    expect(text).toContain('More updates');
    expect(text).toContain(`${30 - room} more updates on Digibastion`);
  });

  it('renders a quiet-day brief with the note and the other updates', () => {
    const base = content({ recent: [] });
    const quiet: DailyBriefContent = {
      ...base,
      quiet: { filterSummary: 'high severity and above in DeFi exploits', highlights: [item({ uid: 'h1', title: 'Phishing wave hits wallets', severity: 'medium' })] },
    };
    const { subject, html, text } = renderDailyBriefEmail(quiet, ctx);
    expect(subject).toBe('Daily brief, Oct 11: quiet day, nothing matched your filters');
    expect(text).toContain('Nothing new matched your filters (high severity and above in DeFi exploits) today. Here is the top other update from the same day.');
    expect(text).toContain('Other updates');
    expect(html).toContain('Phishing wave hits wallets');
  });

  it('adds the open pixel only when the send has one', () => {
    const pixel = 'https://fn.example/functions/v1/email-tracking?tid=0f8fad5b-d9cb-469f-a165-70867728950e&a=o';
    const { html } = renderDailyBriefEmail(content(), { ...ctx, openPixelUrl: pixel });
    expect(html.match(/<img/g)).toHaveLength(1);
    expect(html).toContain('email-tracking?tid=0f8fad5b-d9cb-469f-a165-70867728950e&amp;a=o');
    expect(renderDailyBriefEmail(content(), ctx).html).not.toMatch(/<img/i);
  });

  it('escapes source-provided text', () => {
    const { html } = renderDailyBriefEmail(content({ recent: [item({ title: '<script>alert(1)</script>', sourceName: 'A & B', providers: [] })] }), ctx);
    expect(html).not.toContain('<script>');
    expect(html).toContain('A &amp; B');
  });
});

describe('daily brief links and attribution', () => {
  const tag = (content: string) => `utm_source=email&amp;utm_medium=email&amp;utm_campaign=daily_brief&amp;utm_content=${content}`;
  const textTag = (content: string) => `utm_source=email&utm_medium=email&utm_campaign=daily_brief&utm_content=${content}`;
  const one = (entry: NewsletterItem) => content({ recent: [entry], statusChanges: [] });

  it('tags the title and details links and leaves the source link untagged', () => {
    const entry = item({ uid: 'q:1' });
    const { html, text } = renderDailyBriefEmail(one(entry), ctx);
    expect(html).toContain(`href="${entry.incidentUrl}?${tag('title')}"`);
    expect(html).toContain(`href="${entry.incidentUrl}?${tag('details')}"`);
    expect(html).toContain('href="https://x.com/quillaudits/status/1"');
    expect(text).toContain(`Details on Digibastion: ${entry.incidentUrl}?${textTag('details')}`);
    expect(text).toContain('Source: QuillMonitor https://x.com/quillaudits/status/1');
  });

  it('tags our guide link in the action and leaves outside tools alone', () => {
    const c = one(item({ uid: 'q:1' }));
    const guide = renderDailyBriefEmail({ ...c, action: { id: 'g', text: 'Read it.', url: `${SITE}/category/wallet`, guideTitle: 'Wallet' } }, ctx);
    expect(guide.html).toContain(`href="${SITE}/category/wallet?${tag('action')}"`);
    const tool = renderDailyBriefEmail({ ...c, action: { id: 'r', text: 'Revoke.', url: 'https://revoke.cash', guideTitle: 'Revoke.cash' } }, ctx);
    expect(tool.html).toContain('href="https://revoke.cash"');
  });

  it('links the latest weekly page and the Telegram channel', () => {
    const latest = renderDailyBriefEmail(one(item()), { ...ctx, latestWeekStart: '2026-10-05' });
    expect(latest.html).toContain(`href="${SITE}/threat-intel/weekly/2026-10-05?${tag('weekly')}"`);
    expect(latest.text).toContain(`${SITE}/threat-intel/weekly/2026-10-05?${textTag('weekly')}`);
    expect(latest.html).toContain('href="https://t.me/digibastion"');
    expect(latest.text).toContain('https://t.me/digibastion');
    const archive = renderDailyBriefEmail(one(item()), ctx);
    expect(archive.html).toContain(`href="${SITE}/threat-intel/weekly?${tag('weekly')}"`);
    const bad = renderDailyBriefEmail(one(item()), { ...ctx, latestWeekStart: '../x' });
    expect(bad.html).toContain(`href="${SITE}/threat-intel/weekly?${tag('weekly')}"`);
  });

  it('credits QuillMonitor only on QuillMonitor-only items', () => {
    const quill = renderDailyBriefEmail(one(item()), ctx);
    expect(quill.html).toContain('Powered by <a href="https://www.quillaudits.com/web3-hacks-database"');
    expect(quill.text).toContain('Powered by QuillMonitor: https://www.quillaudits.com/web3-hacks-database');
    const merged = renderDailyBriefEmail(one(item({ providers: ['quillmonitor', 'web3-incidents'] })), ctx);
    expect(merged.html).not.toContain('Powered by');
  });

  it('prints the source name unlinked when the only link is our own page', () => {
    const entry = item({ providers: [], sourceName: 'BleepingComputer', sourceUrl: item().incidentUrl });
    const { html, text } = renderDailyBriefEmail(one(entry), ctx);
    expect(html).toContain('Source: BleepingComputer ·');
    expect(text).toContain('Source: BleepingComputer\n');
  });

  it('never links the apex domain', () => {
    const { html, text } = renderDailyBriefEmail(content(), ctx);
    expect(`${html}${text}`).not.toMatch(/https:\/\/digibastion\.com/);
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
