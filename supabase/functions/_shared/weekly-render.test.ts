import { describe, expect, it } from 'vitest';
import { buildUnsubscribeLinks } from './email-compliance.ts';
import type { RenderContext } from './newsletter-render.ts';
import type { NewsletterItem, WeeklyIssueContent } from './newsletter-content.ts';
import { assembleWeeklyContent, selectWeeklyUpdates } from './weekly-content.ts';
import { buildWeeklySubject, isWeeklyPublicContent, personalizeWeekly, renderWeeklyEmail, toPublicWeekly, WEEKLY_MORE_SHOWN } from './weekly-render.ts';
import { computeWeeklyTotals, selectTopIncidents } from './weekly-stats.ts';
import { SITE, WEEK_START, weeklyItem as item, weeklyVulnerability as vuln } from './weekly-test-fixtures.ts';

const links = buildUnsubscribeLinks({ siteUrl: SITE, functionsBaseUrl: 'https://fn.example/functions/v1', email: 'a@b.com', token: 'tok' });
const ctx: RenderContext = { links, postalAddress: '1 Main St, Springfield 12345', siteUrl: SITE };

function build(thisWeek: NewsletterItem[], vulnerabilities: NewsletterItem[] = [vuln()]): WeeklyIssueContent {
  const totals = computeWeeklyTotals({ weekStart: WEEK_START, thisWeek, previousWeek: [item({ uid: 'p', createdAt: '2026-09-30T00:00:00.000Z', incidentDate: '2026-09-29', amountUsd: 8_000_000 })] });
  return assembleWeeklyContent({
    weekStart: WEEK_START,
    totals,
    top: selectTopIncidents(thisWeek),
    vulnerabilities,
    knownProjectNames: [],
    modelOutput: null,
    aiEnabled: false,
    model: null,
    prompt: null,
    rawOutput: null,
    error: null,
  });
}

const week = [
  item({ uid: 'a', amountUsd: 4_200_000 }),
  item({ uid: 'b', amountUsd: 8_100_000, projectName: 'Second Vault', sourceName: 'SlowMist', providers: ['slowmist'], chain: 'BNB Chain', attackType: 'Phishing' }),
  item({ uid: 'c', status: 'unconfirmed', amountUsd: 2_000_000, projectName: 'Third Pool' }),
];

describe('buildWeeklySubject', () => {
  it('states the reported loss and incident count from the totals', () => {
    expect(buildWeeklySubject(build(week))).toBe('Weekly deep-dive, week of Oct 5: ~$12.3M reported across 2 incidents');
  });

  it('handles singular, no-loss and empty weeks without emoji or hype', () => {
    expect(buildWeeklySubject(build([item({ uid: 'x', amountUsd: null })]))).toBe('Weekly deep-dive, week of Oct 5: 1 incident');
    expect(buildWeeklySubject(build([item({ uid: 'x', status: 'unconfirmed' })]))).toBe('Weekly deep-dive, week of Oct 5: 1 unconfirmed report');
    expect(buildWeeklySubject(build([]))).toBe('Weekly deep-dive, week of Oct 5');
  });
});

describe('renderWeeklyEmail', () => {
  it('renders totals computed in code', () => {
    const { html, text } = renderWeeklyEmail(build(week), ctx);
    for (const output of [html, text]) {
      expect(output).toContain('~$12.3M reported');
      expect(output).toContain('~$8M reported');
      expect(output).toContain('~$2M reported');
      expect(output).toMatch(/Unconfirmed/);
      expect(output).toContain('Phishing');
      expect(output).toContain('BNB Chain');
    }
  });

  it('shows the source and incident URL of every top item', () => {
    const content = build(week);
    const { html, text } = renderWeeklyEmail(content, ctx);
    for (const entry of content.top) {
      expect(html).toContain(entry.item.incidentUrl);
      expect(text).toContain(entry.item.incidentUrl);
      expect(html).toContain(entry.item.sourceName ?? '');
      expect(text).toContain(entry.what.text);
    }
    expect(html).toContain('Top incidents');
    expect(html).toContain('Trends');
    expect(html).toContain('Vulnerabilities and supply-chain');
    expect(html).toContain('Opsec tip');
    expect(html).toContain(content.opsecTip.url);
    expect(html).toContain('Sources this week');
  });

  it('carries the postal address and the unsubscribe link beside manage preferences', () => {
    const { html, text } = renderWeeklyEmail(build(week), ctx);
    expect(html).toContain('1 Main St, Springfield 12345');
    expect(html).toMatch(/Unsubscribe<\/a>[^<]*<a [^>]*>Manage preferences/);
    expect(text).toContain(`Unsubscribe: ${links.unsubscribePageUrl}`);
  });

  it('labels AI paragraphs and never claims Digibastion verification', () => {
    const content = build(week);
    content.trends = { ...content.trends, origin: 'ai' };
    const { html, text } = renderWeeklyEmail(content, ctx);
    expect(html).toContain('Written by AI from the data above');
    expect(text).toContain('Written by AI from the data above');
    expect(`${html}${text}`).not.toMatch(/verified by digibastion/i);
    expect(renderWeeklyEmail(build(week), ctx).html).not.toContain('Written by AI');
  });

  it('escapes source text', () => {
    const { html } = renderWeeklyEmail(build([item({ uid: 'x', title: '<script>x</script>', sourceName: 'A & B', providers: [] })]), ctx);
    expect(html).not.toContain('<script>x');
    expect(html).toContain('A &amp; B');
  });

  it('stays under Gmail clipping size at full size', () => {
    const many = Array.from({ length: 40 }, (_, index) => item({ uid: `u${index}`, summary: 'x'.repeat(280), title: 'T'.repeat(300), chain: `Chain ${index}`, attackType: `Attack ${index}` }));
    const vulns = Array.from({ length: 10 }, (_, index) => vuln({ uid: `v${index}`, summary: 'y'.repeat(280), title: 'V'.repeat(300) }));
    const { html } = renderWeeklyEmail(build(many, vulns), ctx);
    expect(new TextEncoder().encode(html).length).toBeLessThan(90 * 1024);
  });
});

describe('weekly email links and attribution', () => {
  const tag = (content: string) => `utm_source=email&amp;utm_medium=email&amp;utm_campaign=weekly_deep_dive&amp;utm_content=${content}`;
  const textTag = (content: string) => `utm_source=email&utm_medium=email&utm_campaign=weekly_deep_dive&utm_content=${content}`;
  const webVersion = `${SITE}/threat-intel/weekly/${WEEK_START}`;

  it('links the web version under the period line and asks readers to share it', () => {
    const { html, text } = renderWeeklyEmail(build(week), ctx);
    const read = html.indexOf('>Read this issue on the web</a>');
    expect(read).toBeGreaterThan(-1);
    expect(html.lastIndexOf(`href="${webVersion}?${tag('web_version')}"`, read)).toBeGreaterThan(html.indexOf('Figures are computed'));
    expect(read).toBeLessThan(html.indexOf('This week in numbers'));
    expect(html).toContain(`Share this issue: <a href="${webVersion}?${tag('web_version')}"`);
    expect(text).toContain(`Read this issue on the web: ${webVersion}?${textTag('web_version')}`);
    expect(text).toContain(`Share this issue: ${webVersion}?${textTag('web_version')}`);
  });

  it('tags item links, keeps source links clean and credits QuillMonitor only on QuillMonitor-only items', () => {
    const content = build(week);
    const { html, text } = renderWeeklyEmail(content, ctx);
    const top = content.top[0].item;
    expect(html).toContain(`href="${top.incidentUrl}?${tag('title')}"`);
    expect(html).toContain(`href="${top.incidentUrl}?${tag('details')}"`);
    expect(text).toContain(`Details on Digibastion: ${top.incidentUrl}?${textTag('details')}`);
    expect(html).toContain('href="https://x.com/quillaudits/status/1"');
    expect(html).toContain('Powered by <a href="https://www.quillaudits.com/web3-hacks-database"');
    const merged = renderWeeklyEmail(build([item({ uid: 'm', providers: ['quillmonitor', 'web3-incidents'] })], []), ctx);
    expect(merged.html).not.toContain('Powered by');
  });

  it('tags our guide in the tip and leaves outside tools alone', () => {
    const content = build(week);
    expect(renderWeeklyEmail({ ...content, opsecTip: { ...content.opsecTip, url: `${SITE}/category/opsec` } }, ctx).html)
      .toContain(`href="${SITE}/category/opsec?${tag('tip')}"`);
    expect(renderWeeklyEmail({ ...content, opsecTip: { ...content.opsecTip, url: 'https://revoke.cash' } }, ctx).html)
      .toContain('href="https://revoke.cash"');
  });

  it('prints the source name unlinked when the only link is our own page', () => {
    const own = item({ uid: 'o', providers: [], sourceName: 'Rekt', sourceUrl: `${SITE}/threat-intel/id-o` });
    const { html } = renderWeeklyEmail(build([own], []), ctx);
    expect(html).toContain('Source: Rekt ·');
  });

  it('never links the apex domain', () => {
    const { html, text } = renderWeeklyEmail(build(week), ctx);
    expect(`${html}${text}`).not.toMatch(/https:\/\/digibastion\.com/);
  });
});

describe('isWeeklyPublicContent and toPublicWeekly', () => {
  it('accepts stored weekly content and rejects other shapes', () => {
    const content = build(week);
    expect(isWeeklyPublicContent(content)).toBe(true);
    expect(isWeeklyPublicContent(toPublicWeekly(content))).toBe(true);
    expect(isWeeklyPublicContent({ kind: 'weekly', version: 1 })).toBe(false);
    expect(isWeeklyPublicContent({ ...content, version: 2 })).toBe(false);
  });
});

describe('More this week', () => {
  const news = (uid: string, overrides: Partial<NewsletterItem> = {}) => item({
    uid, title: `News ${uid}`, isWeb3Incident: false, status: null, category: 'operational-security',
    severity: 'medium', projectName: null, chain: null, attackType: null, amountUsd: null, amountDisplay: null, ...overrides,
  });

  it('stores the week records outside the deep-dive, most important first', () => {
    const c = build(week);
    const updates = selectWeeklyUpdates([...week, news('n1'), news('n2', { severity: 'high' }), news('n1')], c);
    expect(updates.map((entry) => entry.uid)).toEqual(['n2', 'n1']);
  });

  it("adds the subscriber's matches, keeps them off the public page, and renders them", () => {
    const c = build(week);
    c.archive.updates = selectWeeklyUpdates([...week, news('n1'), news('n2', { category: 'tools-reviews' })], c);
    expect('updates' in toPublicWeekly(c)).toBe(false);
    expect(JSON.stringify(toPublicWeekly(c))).not.toContain('News n1');

    const opsec = personalizeWeekly(c, { severity_threshold: 'medium', categories: ['operational-security'] });
    expect(opsec.more?.map((entry) => entry.uid)).toEqual(['n1']);
    expect('archive' in opsec).toBe(false);
    const { html, text } = renderWeeklyEmail(opsec, ctx);
    expect(text).toContain('More this week');
    expect(html).toContain('News n1');
    expect(html).not.toContain('News n2');

    const none = personalizeWeekly(c, { severity_threshold: 'critical' });
    expect(none.more).toEqual([]);
    expect(renderWeeklyEmail(none, ctx).text).not.toContain('More this week');
  });

  it('works on issues built before archive.updates existed', () => {
    expect(personalizeWeekly(build(week), { severity_threshold: 'info' }).more).toEqual([]);
  });

  it('shows the first 20 and links the rest, under 90 KB', () => {
    const c = build(week);
    const long = 'A long summary sentence about a phishing campaign aimed at wallet users that keeps going. '.repeat(4).slice(0, 280);
    c.archive.updates = selectWeeklyUpdates(Array.from({ length: 200 }, (_, index) => news(`n${index}-${'z'.repeat(40)}`, { summary: long, title: `${'Long news title '.repeat(8)}${index}` })), c);
    const { html, text } = renderWeeklyEmail(personalizeWeekly(c, { severity_threshold: 'info' }), ctx);
    expect(text).toContain(`${200 - WEEKLY_MORE_SHOWN} more updates on Digibastion`);
    expect(new TextEncoder().encode(html).length).toBeLessThan(90 * 1024);
  });
});
