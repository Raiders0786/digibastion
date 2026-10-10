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
  it('uses loss thresholds of $50M, $10M and $1M', () => {
    expect(severityFromLoss(50_000_000, null)).toBe('critical');
    expect(severityFromLoss(49_999_999, null)).toBe('high');
    expect(severityFromLoss(10_000_000, null)).toBe('high');
    expect(severityFromLoss(9_999_999, null)).toBe('medium');
    expect(severityFromLoss(1_000_000, null)).toBe('medium');
  });

  it('rates losses under $1M as medium and no loss as low', () => {
    expect(severityFromLoss(999_999, 'Phishing')).toBe('medium');
    expect(severityFromLoss(500, null)).toBe('medium');
    expect(severityFromLoss(0, null)).toBe('low');
    expect(severityFromLoss(null, null)).toBe('low');
  });

  it('raises small or unknown losses to high for direct-loss attack methods', () => {
    expect(severityFromLoss(null, 'Private Key Compromise')).toBe('high');
    expect(severityFromLoss(200_000, 'Access Control')).toBe('high');
    expect(severityFromLoss(null, 'Oracle Manipulation')).toBe('high');
    expect(severityFromLoss(null, 'Reentrancy')).toBe('high');
    expect(severityFromLoss(null, 'Flash Loan Attack')).toBe('high');
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
    expect(mapQuillMonitorSeverity(quillIncident)).toBe('low');
  });
});
