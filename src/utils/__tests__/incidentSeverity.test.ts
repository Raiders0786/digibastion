import { describe, expect, it } from 'vitest';
import { severityFromLoss } from '../../../supabase/functions/_shared/incident-severity';
import { mapQuillMonitorSeverity, type QuillMonitorIncident } from '../../../supabase/functions/_shared/quillmonitor';

const quillIncident: QuillMonitorIncident = {
  id: 'incident-123',
  target: 'Example Bridge',
  date: '2026-09-25',
  chain: 'Ethereum',
  category: 'Bridge',
  attackedMethod: 'Smart Contract Bug',
  amountInUsd: null,
  description: '',
  reference: '',
  verificationStatus: 'verified',
  createdAt: '2026-09-25T12:00:00.000Z',
  updatedAt: '2026-09-25T12:00:00.000Z',
};

describe('severityFromLoss', () => {
  it('rates $50M or more critical and $10M up to $50M high', () => {
    expect(severityFromLoss(50_000_000, null)).toBe('critical');
    expect(severityFromLoss(49_999_999, null)).toBe('high');
    expect(severityFromLoss(10_000_000, null)).toBe('high');
  });

  it('rates any loss under $10M high when the attack is a direct-loss method', () => {
    expect(severityFromLoss(9_999_999, 'Access Control')).toBe('high');
    expect(severityFromLoss(2_500_000, 'Access Control')).toBe('high');
    expect(severityFromLoss(1_000_000, 'Reentrancy')).toBe('high');
    expect(severityFromLoss(500_000, 'Access Control')).toBe('high');
    expect(severityFromLoss(null, 'Private Key Compromise')).toBe('high');
    expect(severityFromLoss(null, 'Oracle Manipulation')).toBe('high');
    expect(severityFromLoss(null, 'Reentrancy')).toBe('high');
    expect(severityFromLoss(null, 'Flash Loan Attack')).toBe('high');
  });

  it('never rates a larger direct-loss hack below a smaller one', () => {
    const rank = { low: 0, medium: 1, high: 2, critical: 3 } as const;
    expect(rank[severityFromLoss(2_500_000, 'Access Control')])
      .toBeGreaterThanOrEqual(rank[severityFromLoss(500_000, 'Access Control')]);
  });

  it('rates other losses under $10M medium and no loss low', () => {
    expect(severityFromLoss(9_999_999, null)).toBe('medium');
    expect(severityFromLoss(1_000_000, null)).toBe('medium');
    expect(severityFromLoss(999_999, 'Phishing')).toBe('medium');
    expect(severityFromLoss(500, null)).toBe('medium');
    expect(severityFromLoss(0, null)).toBe('low');
    expect(severityFromLoss(null, null)).toBe('low');
  });

  it('matches attack signals regardless of punctuation', () => {
    expect(severityFromLoss(null, 'flash-loan')).toBe('high');
    expect(severityFromLoss(null, 'private-key-compromise')).toBe('high');
  });

  it('never lets an attack signal lower a loss-based critical', () => {
    expect(severityFromLoss(75_000_000, 'Reentrancy')).toBe('critical');
  });

  it('ignores invalid amounts', () => {
    expect(severityFromLoss(Number.NaN, null)).toBe('low');
    expect(severityFromLoss(-5, null)).toBe('low');
    expect(severityFromLoss(Number.POSITIVE_INFINITY, null)).toBe('low');
  });
});

describe('QuillMonitor severity uses the shared rubric', () => {
  it('matches severityFromLoss for the documented examples', () => {
    expect(mapQuillMonitorSeverity({ ...quillIncident, amountInUsd: 75_000_000 })).toBe('critical');
    expect(mapQuillMonitorSeverity({ ...quillIncident, amountInUsd: 12_500_000 })).toBe('high');
    expect(mapQuillMonitorSeverity({ ...quillIncident, attackedMethod: 'Reentrancy' })).toBe('high');
    expect(mapQuillMonitorSeverity({ ...quillIncident, amountInUsd: 250_000 })).toBe('medium');
    expect(mapQuillMonitorSeverity({ ...quillIncident, amountInUsd: 2_500_000 })).toBe('medium');
    expect(mapQuillMonitorSeverity({ ...quillIncident, amountInUsd: 2_500_000, attackedMethod: 'Access Control' })).toBe('high');
    expect(mapQuillMonitorSeverity(quillIncident)).toBe('low');
  });
});
