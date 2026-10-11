import { describe, expect, it } from 'vitest';
import {
  formatReportedUsd,
  isWeeklyPublicContent,
  parseWeekStart,
  parseWeeklyArchiveResponse,
  parseWeeklyNewsletterResponse,
  safeHttpUrl,
  weeklyDescription,
  weeklyPagePath,
  weeklyPageTitle,
  weeklySeoTitle,
  weeklySubscribeHref,
} from '@/lib/threatIntel/weekly';
import { weeklyPublicContent } from '../../../supabase/functions/_shared/weekly-test-fixtures';

describe('parseWeekStart', () => {
  it('accepts a Monday', () => {
    expect(parseWeekStart('2026-10-05')).toBe('2026-10-05');
  });

  it('rejects a Tuesday, an impossible date and garbage', () => {
    expect(parseWeekStart('2026-10-06')).toBeNull();
    expect(parseWeekStart('2026-02-30')).toBeNull();
    expect(parseWeekStart('2026-10-5')).toBeNull();
    expect(parseWeekStart('latest')).toBeNull();
    expect(parseWeekStart(' 2026-10-05')).toBeNull();
    expect(parseWeekStart(undefined)).toBeNull();
    expect(parseWeekStart('')).toBeNull();
  });
});

describe('isWeeklyPublicContent', () => {
  it('accepts a public weekly issue', () => {
    expect(isWeeklyPublicContent(weeklyPublicContent())).toBe(true);
  });

  it('rejects content missing totals or carrying a wrong version', () => {
    const { totals: _totals, ...withoutTotals } = weeklyPublicContent();
    expect(isWeeklyPublicContent(withoutTotals)).toBe(false);
    expect(isWeeklyPublicContent({ ...weeklyPublicContent(), version: 2 })).toBe(false);
    expect(isWeeklyPublicContent({ ...weeklyPublicContent(), kind: 'daily' })).toBe(false);
    expect(isWeeklyPublicContent(null)).toBe(false);
    expect(isWeeklyPublicContent('weekly')).toBe(false);
  });

  it('rejects totals with a missing figure and items without a title', () => {
    const content = weeklyPublicContent();
    expect(isWeeklyPublicContent({ ...content, totals: { ...content.totals, unconfirmedCount: undefined } })).toBe(false);
    expect(isWeeklyPublicContent({ ...content, totals: { ...content.totals, lossUsd: Number.NaN } })).toBe(false);
    const [first, ...rest] = content.top;
    expect(isWeeklyPublicContent({ ...content, top: [{ ...first, item: { ...first.item, title: 7 } }, ...rest] })).toBe(false);
    expect(isWeeklyPublicContent({ ...content, sources: [1] })).toBe(false);
  });
});

describe('parseWeeklyNewsletterResponse', () => {
  it('returns the content and the neighbouring weeks', () => {
    const parsed = parseWeeklyNewsletterResponse({
      content: weeklyPublicContent(),
      generated_at: '2026-10-12T00:10:00Z',
      previous_week_start: '2026-09-28',
      next_week_start: null,
    });
    expect(parsed?.content.weekStart).toBe('2026-10-05');
    expect(parsed?.previousWeekStart).toBe('2026-09-28');
    expect(parsed?.nextWeekStart).toBeNull();
    expect(parsed?.generatedAt).toBe('2026-10-12T00:10:00Z');
  });

  it('returns null for a missing issue or invalid content, and drops neighbours that are not Mondays', () => {
    expect(parseWeeklyNewsletterResponse(null)).toBeNull();
    expect(parseWeeklyNewsletterResponse({ content: { version: 1 } })).toBeNull();
    const parsed = parseWeeklyNewsletterResponse({ content: weeklyPublicContent(), previous_week_start: 'x', next_week_start: '2026-10-13' });
    expect(parsed?.previousWeekStart).toBeNull();
    expect(parsed?.nextWeekStart).toBeNull();
  });
});

describe('weekly page helpers', () => {
  it('titles the page by week', () => {
    expect(weeklyPageTitle(weeklyPublicContent())).toBe('Web3 security week of Oct 5, 2026');
  });

  it('describes the week from the totals with "reported" wording', () => {
    expect(weeklyDescription(weeklyPublicContent())).toBe(
      'Web3 incidents added Oct 5 to Oct 11, 2026: ~$12.3M reported across 9 incidents. Each item names its source.',
    );
  });

  it('formats reported amounts and leaves out zero or missing figures', () => {
    expect(formatReportedUsd(4_200_000)).toBe('~$4.2M reported');
    expect(formatReportedUsd(1_500)).toBe('~$1.5K reported');
    expect(formatReportedUsd(0)).toBeNull();
    expect(formatReportedUsd(Number.NaN)).toBeNull();
  });

  it('builds the page path and the weekly subscribe link', () => {
    expect(weeklyPagePath('2026-10-05')).toBe('/threat-intel/weekly/2026-10-05');
    expect(weeklySubscribeHref()).toBe('/threat-intel?tab=subscribe&scope=web3-incidents&weekly=1');
  });

  it('allows only http and https links', () => {
    expect(safeHttpUrl('https://source.example/1')).toBe('https://source.example/1');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });
});

describe('weeklySeoTitle', () => {
  it('puts the loss and the incident count in the title', () => {
    const title = weeklySeoTitle(weeklyPublicContent());
    expect(title).toBe('Web3 hacks, week of Oct 5, 2026: ~$12.3M across 9 incidents');
    expect(title.length).toBeLessThanOrEqual(70);
  });

  it('falls back to a plain title when no loss was reported', () => {
    const content = weeklyPublicContent();
    const title = weeklySeoTitle({ ...content, totals: { ...content.totals, lossUsd: 0 } });
    expect(title).toBe('Web3 hacks and exploits, week of Oct 5, 2026');
    expect(title.length).toBeLessThanOrEqual(70);
  });

  it('says "1 incident" for a single incident', () => {
    const content = weeklyPublicContent();
    expect(weeklySeoTitle({ ...content, totals: { ...content.totals, incidentCount: 1 } })).toMatch(/across 1 incident$/);
  });
});

describe('parseWeeklyArchiveResponse', () => {
  it('keeps only Monday weeks and coerces counts', () => {
    expect(parseWeeklyArchiveResponse([
      { week_start: '2026-10-05', week_end: '2026-10-11', generated_at: '2026-10-12T00:10:00Z', incident_count: 7, loss_usd: 18_400_000 },
      { week_start: '2026-09-28', week_end: null, generated_at: null, incident_count: '3', loss_usd: '1200.5' },
      { week_start: '2026-10-06', incident_count: 1, loss_usd: 1 },
      { week_start: '../x', incident_count: 1, loss_usd: 1 },
      { week_start: '2026-09-21', incident_count: 'lots', loss_usd: -5 },
      null,
      'nope',
    ])).toEqual([
      { weekStart: '2026-10-05', weekEnd: '2026-10-11', generatedAt: '2026-10-12T00:10:00Z', incidentCount: 7, lossUsd: 18_400_000 },
      { weekStart: '2026-09-28', weekEnd: null, generatedAt: null, incidentCount: 3, lossUsd: 1200.5 },
      { weekStart: '2026-09-21', weekEnd: null, generatedAt: null, incidentCount: 0, lossUsd: 0 },
    ]);
  });

  it('returns an empty list for anything that is not an array', () => {
    expect(parseWeeklyArchiveResponse(null)).toEqual([]);
    expect(parseWeeklyArchiveResponse({ week_start: '2026-10-05' })).toEqual([]);
  });
});
