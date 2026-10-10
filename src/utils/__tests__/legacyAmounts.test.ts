import { describe, expect, it } from 'vitest';
import {
  isLegacyAmountMetadata,
  MAX_LEGACY_AMOUNT_SAMPLES,
  planLegacyAmountRepairs,
  type LegacyAmountRow,
} from '../../../supabase/functions/_shared/legacy-amounts';

// A row written by the old web3-incidents importer: "$50,000" was stored as
// 50,000 million dollars and rated critical. It has no incident_date_unknown
// key, which the new importer always writes.
const legacyRow = (overrides: Partial<LegacyAmountRow> = {}, metadata: Record<string, unknown> = {}): LegacyAmountRow => ({
  uid: 'p-legacy-1',
  title: 'Wallet drainer takes $50,000 from collectors',
  summary: 'A phishing site drained NFT collectors.',
  content: 'A phishing site drained NFT collectors.',
  tags: ['phishing'],
  severity: 'critical',
  ...overrides,
  metadata: {
    provider: 'web3-incidents',
    is_web3_incident: true,
    amount_lost_usd: 50_000_000_000,
    amount_display: '$50000M',
    attack_type: 'phishing',
    reference_url: 'https://example.com/report',
    ...metadata,
  },
});

describe('isLegacyAmountMetadata', () => {
  it('flags web3-incidents rows written before the v2 amount parser', () => {
    expect(isLegacyAmountMetadata({ provider: 'web3-incidents' })).toBe(true);
    expect(isLegacyAmountMetadata({ provider: 'web3' })).toBe(true);
  });

  it('skips rows from the new importer, repaired rows and other providers', () => {
    expect(isLegacyAmountMetadata({ provider: 'web3-incidents', incident_date_unknown: false })).toBe(false);
    expect(isLegacyAmountMetadata({ provider: 'web3-incidents', incident_date_unknown: true })).toBe(false);
    expect(isLegacyAmountMetadata({ provider: 'web3-incidents', amount_parser: 'v2' })).toBe(false);
    expect(isLegacyAmountMetadata({ provider: 'quillmonitor' })).toBe(false);
    expect(isLegacyAmountMetadata({ provider: 'slowmist' })).toBe(false);
    expect(isLegacyAmountMetadata(null)).toBe(false);
    expect(isLegacyAmountMetadata(['web3-incidents'])).toBe(false);
  });
});

describe('planLegacyAmountRepairs', () => {
  it('re-parses "$50,000" as $50K and lowers the severity to medium', () => {
    const plan = planLegacyAmountRepairs([legacyRow()]);

    expect(plan.legacyRows).toBe(1);
    expect(plan.changed).toBe(1);
    expect(plan.repairs).toHaveLength(1);
    const [repair] = plan.repairs;
    expect(repair.uid).toBe('p-legacy-1');
    expect(repair.severity).toBe('medium');
    expect(repair.metadata).toEqual({
      provider: 'web3-incidents',
      is_web3_incident: true,
      amount_lost_usd: 50_000,
      amount_display: '$50K',
      amount_parser: 'v2',
      attack_type: 'phishing',
      reference_url: 'https://example.com/report',
    });
    expect(plan.samples).toEqual([{
      uid: 'p-legacy-1',
      title: 'Wallet drainer takes $50,000 from collectors',
      before: { amountUsd: 50_000_000_000, amountDisplay: '$50000M', severity: 'critical' },
      after: { amountUsd: 50_000, amountDisplay: '$50K', severity: 'medium' },
    }]);
  });

  it('only scales by the unit next to the number', () => {
    const plan = planLegacyAmountRepairs([legacyRow({
      title: 'Bridge exploited for $3 million as TVL tops a billion elsewhere',
      tags: [],
    }, { attack_type: null, amount_lost_usd: 3_000_000_000_000_000, amount_display: '$3000000000M' })]);

    expect(plan.repairs[0].metadata.amount_lost_usd).toBe(3_000_000);
    expect(plan.repairs[0].metadata.amount_display).toBe('$3M');
    expect(plan.repairs[0].severity).toBe('medium');
  });

  it('reads the summary, then the content, when the title has no amount', () => {
    const fromSummary = planLegacyAmountRepairs([legacyRow({
      title: 'Lending protocol exploited',
      summary: 'The attacker took $12.5 million in stablecoins.',
      content: 'Losses were later put at $20 million.',
    })]);
    expect(fromSummary.repairs[0].metadata.amount_lost_usd).toBe(12_500_000);
    expect(fromSummary.repairs[0].severity).toBe('high');

    const fromContent = planLegacyAmountRepairs([legacyRow({
      title: 'Lending protocol exploited',
      summary: 'Details are still emerging.',
      content: 'Losses were later put at $60 million.',
    })]);
    expect(fromContent.repairs[0].metadata.amount_lost_usd).toBe(60_000_000);
    expect(fromContent.repairs[0].severity).toBe('critical');
  });

  it('removes an unparseable amount and rates the row from its attack text', () => {
    const plan = planLegacyAmountRepairs([legacyRow({
      title: 'DeFi protocol drained',
      summary: 'An undisclosed amount was taken.',
      content: 'An undisclosed amount was taken.',
      tags: ['exploit', 'private-key-compromise'],
    }, { attack_type: 'exploit' })]);

    const [repair] = plan.repairs;
    expect(repair.metadata).not.toHaveProperty('amount_lost_usd');
    expect(repair.metadata).not.toHaveProperty('amount_display');
    expect(repair.metadata.amount_parser).toBe('v2');
    expect(repair.severity).toBe('high');

    const lowRisk = planLegacyAmountRepairs([legacyRow({
      title: 'Project rug pulls',
      summary: 'No figure yet.',
      content: 'No figure yet.',
      tags: ['rug-pull'],
    }, { attack_type: 'rug-pull' })]);
    expect(lowRisk.repairs[0].severity).toBe('low');
  });

  it('skips rows that are already on the v2 parser or come from the new importer', () => {
    const plan = planLegacyAmountRepairs([
      legacyRow({ uid: 'p-v2' }, { amount_parser: 'v2' }),
      legacyRow({ uid: 'p-new' }, { incident_date_unknown: false, amount_lost_usd: 50_000, amount_display: '$50K' }),
      legacyRow({ uid: 'qm-1' }, { provider: 'quillmonitor' }),
    ]);
    expect(plan).toEqual({ legacyRows: 0, changed: 0, repairs: [], samples: [] });
  });

  it('still stamps rows whose figures were already right, so a rerun finds nothing', () => {
    const plan = planLegacyAmountRepairs([legacyRow({ severity: 'medium' }, {
      amount_lost_usd: 50_000,
      amount_display: '$50K',
    })]);
    expect(plan.legacyRows).toBe(1);
    expect(plan.changed).toBe(0);
    expect(plan.repairs[0].metadata.amount_parser).toBe('v2');
    expect(plan.samples).toEqual([]);
  });

  it('caps the samples', () => {
    const rows = Array.from({ length: MAX_LEGACY_AMOUNT_SAMPLES + 5 }, (_, index) => legacyRow({ uid: `p-${index}` }));
    const plan = planLegacyAmountRepairs(rows);
    expect(plan.repairs).toHaveLength(MAX_LEGACY_AMOUNT_SAMPLES + 5);
    expect(plan.samples).toHaveLength(MAX_LEGACY_AMOUNT_SAMPLES);
  });

  it('does not mutate the input rows', () => {
    const row = legacyRow();
    const before = JSON.stringify(row);
    planLegacyAmountRepairs([row]);
    expect(JSON.stringify(row)).toBe(before);
  });
});
