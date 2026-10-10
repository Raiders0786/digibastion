import { describe, expect, it } from 'vitest';
import type { NewsArticle } from '@/types/news';
import { getIncidentDisplay } from '@/lib/threatIntel/incidentDisplay';
import { formatCompactUsd } from '../../../supabase/functions/_shared/usd-amount';
import { formatUsd } from '../../../supabase/functions/_shared/quillmonitor';

const CASES: Array<[number, string]> = [
  [2_250_000, '$2.25M'],
  [2_500_000, '$2.5M'],
  [7_000_000, '$7M'],
  [38_000, '$38K'],
  [1_250_000, '$1.25M'],
  [12_345, '$12.35K'],
  [999_999, '$1M'],
  [999_995_000, '$1B'],
  [999_999_999, '$1B'],
  [999.6, '$1K'],
  [1_000, '$1K'],
  [500, '$500'],
  [0, '$0'],
  [1_200_000_000, '$1.2B'],
  [1_500_000_000_000, '$1,500B'],
];

describe('formatCompactUsd', () => {
  it.each(CASES)('formats %d as %s', (amount, expected) => {
    expect(formatCompactUsd(amount)).toBe(expected);
  });

  it('rejects invalid amounts', () => {
    expect(formatCompactUsd(Number.NaN)).toBeNull();
    expect(formatCompactUsd(-1)).toBeNull();
    expect(formatCompactUsd(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('QuillMonitor formatUsd', () => {
  it.each(CASES)('formats %d as %s', (amount, expected) => {
    expect(formatUsd(amount)).toBe(expected);
  });

  it('returns null with no amount', () => {
    expect(formatUsd(null)).toBeNull();
  });
});

describe('frontend loss label formatting', () => {
  const article = (amount: number): NewsArticle => ({
    id: 'quillmonitor:example',
    title: 'Example',
    content: 'Details',
    summary: 'Summary',
    category: 'defi-exploits',
    tags: [],
    severity: 'high',
    publishedAt: new Date('2026-09-30T00:00:00.000Z'),
    sourceName: 'QuillMonitor',
    metadata: {
      provider: 'quillmonitor',
      is_web3_incident: true,
      verification_status: 'verified',
      amount_lost_usd: amount,
    },
  });

  it.each(CASES.filter(([amount]) => amount > 0 && amount < 1_000_000_000_000))('formats %d as %s', (amount, expected) => {
    expect(getIncidentDisplay(article(amount), { now: new Date('2026-10-10T12:00:00.000Z'), timeZone: 'UTC' }).lossLabel)
      .toBe(expected);
  });
});
