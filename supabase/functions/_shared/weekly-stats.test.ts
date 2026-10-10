import { describe, expect, it } from 'vitest';
import {
  computeWeeklyTotals,
  selectTopIncidents,
  selectWeeklyVulnerabilities,
  weeklyCountedIncidents,
  weeklyPeriod,
} from './weekly-stats.ts';
import { WEEK_START, weeklyItem as item, weeklyVulnerability as vuln } from './weekly-test-fixtures.ts';

describe('weeklyPeriod', () => {
  it('covers Monday to Sunday and is sent the next Monday', () => {
    expect(weeklyPeriod('2026-10-05')).toEqual({
      weekStart: '2026-10-05',
      weekEnd: '2026-10-11',
      issueDate: '2026-10-12',
      periodStart: '2026-10-05T00:00:00.000Z',
      periodEnd: '2026-10-12T00:00:00.000Z',
    });
  });

  it('rejects a day that is not a Monday and impossible dates', () => {
    expect(weeklyPeriod('2026-10-06')).toBeNull();
    expect(weeklyPeriod('2026-02-30')).toBeNull();
    expect(weeklyPeriod('garbage')).toBeNull();
  });
});

describe('computeWeeklyTotals', () => {
  it('counts only incidents ingested inside the week', () => {
    const totals = computeWeeklyTotals({
      weekStart: WEEK_START,
      thisWeek: [
        item({ uid: 'a', createdAt: '2026-10-05T00:00:00.000Z', amountUsd: 1_000_000 }),
        item({ uid: 'b', createdAt: '2026-10-11T23:59:59.000Z', amountUsd: 2_000_000 }),
        item({ uid: 'c', createdAt: '2026-10-12T00:00:00.000Z', amountUsd: 5_000_000 }),
        item({ uid: 'd', createdAt: '2026-10-04T23:59:59.000Z', amountUsd: 5_000_000 }),
      ],
      previousWeek: [],
    });
    expect(totals.incidentCount).toBe(2);
    expect(totals.lossUsd).toBe(3_000_000);
  });

  it('compares with the previous week', () => {
    const totals = computeWeeklyTotals({
      weekStart: WEEK_START,
      thisWeek: [item({ uid: 'a', amountUsd: 1_000_000 })],
      previousWeek: [
        item({ uid: 'p1', createdAt: '2026-09-28T10:00:00.000Z', incidentDate: '2026-09-27', amountUsd: 3_000_000 }),
        item({ uid: 'p2', createdAt: '2026-10-05T10:00:00.000Z', amountUsd: 9_000_000 }),
      ],
    });
    expect(totals.previousLossUsd).toBe(3_000_000);
  });

  it('keeps late reports out of the totals and counts them separately', () => {
    const totals = computeWeeklyTotals({
      weekStart: WEEK_START,
      thisWeek: [
        item({ uid: 'a', amountUsd: 1_000_000 }),
        item({ uid: 'late', incidentDate: '2026-08-01', amountUsd: 50_000_000 }),
        item({ uid: 'edge', incidentDate: '2026-09-05', amountUsd: 2_000_000 }),
      ],
      previousWeek: [],
    });
    expect(totals.lateReportCount).toBe(1);
    expect(totals.incidentCount).toBe(2);
    expect(totals.lossUsd).toBe(3_000_000);
    expect(weeklyCountedIncidents(WEEK_START, [item({ uid: 'late', incidentDate: '2026-08-01' })])).toEqual([]);
  });

  it('keeps unconfirmed losses separate', () => {
    const totals = computeWeeklyTotals({
      weekStart: WEEK_START,
      thisWeek: [
        item({ uid: 'a', status: 'confirmed', amountUsd: 1_000_000 }),
        item({ uid: 'b', status: null, amountUsd: 2_000_000 }),
        item({ uid: 'c', status: 'unconfirmed', amountUsd: 7_000_000 }),
      ],
      previousWeek: [],
    });
    expect(totals.lossUsd).toBe(3_000_000);
    expect(totals.unconfirmedLossUsd).toBe(7_000_000);
    expect(totals.incidentCount).toBe(2);
    expect(totals.unconfirmedCount).toBe(1);
  });

  it('ignores implausible amounts and non-incidents', () => {
    const totals = computeWeeklyTotals({
      weekStart: WEEK_START,
      thisWeek: [
        item({ uid: 'a', amountUsd: 3.8e12 }),
        item({ uid: 'b', amountUsd: 1_000_000 }),
        vuln({ createdAt: '2026-10-06T00:00:00.000Z' }),
      ],
      previousWeek: [],
    });
    expect(totals.lossUsd).toBe(1_000_000);
    expect(totals.incidentCount).toBe(2);
  });

  it('counts funds returned and de-duplicates by uid', () => {
    const totals = computeWeeklyTotals({
      weekStart: WEEK_START,
      thisWeek: [item({ uid: 'a', fundsReturned: true }), item({ uid: 'a', fundsReturned: true }), item({ uid: 'b', fundsReturned: false })],
      previousWeek: [],
    });
    expect(totals.incidentCount).toBe(2);
    expect(totals.fundsReturnedCount).toBe(1);
  });

  it('folds breakdowns beyond the top five into other', () => {
    const chains = ['Ethereum', 'BNB Chain', 'Solana', 'Arbitrum', 'Base', 'Polygon', 'Optimism'];
    const thisWeek = chains.map((chain, index) => item({ uid: `u${index}`, chain, amountUsd: (index + 1) * 1_000_000 }));
    thisWeek.push(item({ uid: 'dup-eth', chain: 'ethereum', amountUsd: 100_000 }));
    const totals = computeWeeklyTotals({ weekStart: WEEK_START, thisWeek, previousWeek: [] });
    expect(totals.byChain.map((entry) => entry.key)).toEqual(['optimism', 'polygon', 'base', 'arbitrum', 'solana', 'other']);
    const other = totals.byChain[5];
    expect(other).toEqual({ key: 'other', label: 'Other', count: 3, lossUsd: 3_100_000 });
    expect(totals.byChain.reduce((sum, entry) => sum + entry.count, 0)).toBe(totals.incidentCount);
  });

  it('labels missing chains and attack types as unknown and ranks ties by count', () => {
    const totals = computeWeeklyTotals({
      weekStart: WEEK_START,
      thisWeek: [
        item({ uid: 'a', attackType: null, amountUsd: null }),
        item({ uid: 'b', attackType: 'Phishing', amountUsd: null }),
        item({ uid: 'c', attackType: 'Phishing', amountUsd: null }),
      ],
      previousWeek: [],
    });
    expect(totals.byAttackType).toEqual([
      { key: 'phishing', label: 'Phishing', count: 2, lossUsd: 0 },
      { key: 'unknown', label: 'Unknown', count: 1, lossUsd: 0 },
    ]);
  });
});

describe('selectTopIncidents', () => {
  it('orders by amount with null amounts last, then by severity', () => {
    const top = selectTopIncidents([
      item({ uid: 'none-critical', amountUsd: null, severity: 'critical' }),
      item({ uid: 'small', amountUsd: 1_000 }),
      item({ uid: 'big', amountUsd: 9_000_000 }),
      item({ uid: 'none-low', amountUsd: null, severity: 'low' }),
      item({ uid: 'mid', amountUsd: 500_000 }),
      item({ uid: 'mid-2', amountUsd: 400_000 }),
    ]);
    expect(top.map((entry) => entry.uid)).toEqual(['big', 'mid', 'mid-2', 'small', 'none-critical']);
  });

  it('treats implausible amounts as missing and drops duplicate uids', () => {
    const top = selectTopIncidents([item({ uid: 'x', amountUsd: 3.8e12 }), item({ uid: 'y', amountUsd: 10 }), item({ uid: 'y', amountUsd: 10 })], 5);
    expect(top.map((entry) => entry.uid)).toEqual(['y', 'x']);
  });
});

describe('selectWeeklyVulnerabilities', () => {
  it('keeps critical and high vulnerability or supply-chain items, capped at ten', () => {
    const items = [
      vuln({ uid: 'v1' }),
      vuln({ uid: 'v2', severity: 'medium' }),
      vuln({ uid: 'v3', category: 'supply-chain', cveId: null, severity: 'high' }),
      vuln({ uid: 'v4', category: 'general', cveId: null }),
      item({ uid: 'incident' }),
      ...Array.from({ length: 12 }, (_, index) => vuln({ uid: `bulk-${index}`, severity: 'high' })),
    ];
    const selected = selectWeeklyVulnerabilities(items);
    expect(selected).toHaveLength(10);
    expect(selected[0].uid).toBe('v1');
    expect(selected.map((entry) => entry.uid)).not.toContain('v2');
    expect(selected.map((entry) => entry.uid)).not.toContain('v4');
    expect(selected.map((entry) => entry.uid)).not.toContain('incident');
  });
});
