import { describe, expect, it } from 'vitest';
import { buildUnsubscribeLinks } from './email-compliance.ts';
import type { RenderContext } from './newsletter-render.ts';
import type { NewsletterItem, WeeklyIssueContent } from './newsletter-content.ts';
import { assembleWeeklyContent } from './weekly-content.ts';
import { buildWeeklySubject, isWeeklyPublicContent, renderWeeklyEmail, toPublicWeekly } from './weekly-render.ts';
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
  item({ uid: 'b', amountUsd: 8_100_000, projectName: 'Second Vault', sourceName: 'SlowMist', chain: 'BNB Chain', attackType: 'Phishing' }),
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
    const { html } = renderWeeklyEmail(build([item({ uid: 'x', title: '<script>x</script>', sourceName: 'A & B' })]), ctx);
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

describe('isWeeklyPublicContent and toPublicWeekly', () => {
  it('accepts stored weekly content and rejects other shapes', () => {
    const content = build(week);
    expect(isWeeklyPublicContent(content)).toBe(true);
    expect(isWeeklyPublicContent(toPublicWeekly(content))).toBe(true);
    expect(isWeeklyPublicContent({ kind: 'weekly', version: 1 })).toBe(false);
    expect(isWeeklyPublicContent({ ...content, version: 2 })).toBe(false);
  });
});
