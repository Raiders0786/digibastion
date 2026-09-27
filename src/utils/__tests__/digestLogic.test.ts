import { describe, expect, it } from 'vitest';
import { MAX_DIGEST_ARTICLES, normalizeUtcMinuteToQuarterHour, prepareDigestArticles, shouldSendToSubscriber } from '../../../supabase/functions/_shared/digest-logic';

const baseSchedule = {
  frequency: 'daily',
  preferred_hour: 9,
  timezone_offset: 0,
  preferred_day: 0,
};

describe('digest scheduling', () => {
  it('normalizes a delayed cron arrival to its intended quarter-hour slot', () => {
    expect(normalizeUtcMinuteToQuarterHour(16)).toBe(15);
    expect(normalizeUtcMinuteToQuarterHour(1)).toBe(0);
  });

  it('delivers at 9:00 in India without a 30-minute drift', () => {
    expect(shouldSendToSubscriber({ ...baseSchedule, timezone_offset: 5.5 }, 3, 30, 0)).toBe(true);
    expect(shouldSendToSubscriber({ ...baseSchedule, timezone_offset: 5.5 }, 3, 0, 0)).toBe(false);
  });

  it('supports quarter-hour offsets and local weekly day rollover', () => {
    expect(shouldSendToSubscriber({ ...baseSchedule, timezone_offset: 5.75 }, 3, 15, 0)).toBe(true);
    expect(shouldSendToSubscriber({ ...baseSchedule, frequency: 'weekly', timezone_offset: 2, preferred_hour: 1, preferred_day: 1 }, 23, 0, 0)).toBe(true);
  });
});

describe('digest preparation', () => {
  const article = (index: number, overrides: Record<string, unknown> = {}) => ({
    id: String(index),
    title: `Article ${index}`,
    severity: 'high',
    link: `https://example.com/${index}`,
    published_at: new Date(2026, 0, index + 1).toISOString(),
    ...overrides,
  });

  it('collapses coverage of the same CVE and retains the highest severity item', () => {
    const result = prepareDigestArticles([
      article(1, { severity: 'high', cve_id: 'CVE-2026-35273' }),
      article(2, { severity: 'critical', cve_id: 'cve-2026-35273' }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('critical');
  });

  it('caps the complete message and prioritizes critical coverage', () => {
    const result = prepareDigestArticles([
      ...Array.from({ length: 25 }, (_, index) => article(index)),
      article(99, { severity: 'critical' }),
    ]);
    expect(result).toHaveLength(MAX_DIGEST_ARTICLES);
    expect(result[0].severity).toBe('critical');
  });
});
