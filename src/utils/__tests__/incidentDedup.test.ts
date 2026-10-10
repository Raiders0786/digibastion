import { describe, expect, it } from 'vitest';
import {
  candidateFromRow,
  incidentTargetFromTitle,
  isHighConfidenceDuplicate,
  normalizeIncidentTarget,
  pickCanonical,
  providerPriority,
  rowProvider,
  type IncidentRow,
} from '../../../supabase/functions/_shared/incident-dedup';

// Fixtures are modelled on the duplicates seen on the live Web3 view
// (spec section 3): NEAR Intents three times, Meter twice, and
// Limit Break / Magic Eden as one incident under two names.
const nearQuillMonitor: IncidentRow = {
  uid: 'quillmonitor:near-intents-1',
  title: 'NEAR Intents: Private Key Compromise ($3.8M loss)',
  published_at: '2026-10-02T00:00:00.000Z',
  source_name: 'QuillMonitor',
  metadata: {
    provider: 'quillmonitor',
    project_name: 'NEAR Intents',
    incident_date: '2026-10-02',
    attack_type: 'Private Key Compromise',
    amount_lost_usd: 3_800_000,
    reference_url: 'https://x.com/near/status/1',
    verification_status: 'verified',
  },
};
const nearWeb3Feed1: IncidentRow = {
  uid: 'a1b2c3-feed1-near',
  title: 'NEAR Intents exploited for $3.8 million',
  published_at: '2026-10-03T00:00:00.000Z',
  source_name: null,
  link: 'https://x.com/zachxbt/status/2',
  metadata: {
    provider: 'web3-incidents',
    incident_date: '2026-10-03',
    attack_type: 'exploit',
    amount_lost_usd: 3_800_000,
    data_source: 'feed-1',
  },
};
// Legacy feed-2 row: amount stored a million times too large by the old parser.
const nearWeb3Feed2: IncidentRow = {
  uid: 'd4e5f6-feed2-near',
  title: 'NEAR Intents - Private Key Compromise ($3.8M)',
  published_at: '2026-10-02T00:00:00.000Z',
  source_name: null,
  link: '',
  metadata: {
    provider: 'web3-incidents',
    project_name: 'NEAR Intents',
    attack_type: 'Private Key Compromise',
    amount_lost_usd: 3_800_000_000_000,
    data_source: 'feed-2',
  },
};
const meterQuillMonitor: IncidentRow = {
  uid: 'quillmonitor:meter-1',
  title: 'Meter: Bridge Exploit ($4.4M loss)',
  published_at: '2026-09-14T00:00:00.000Z',
  source_name: 'QuillMonitor',
  metadata: { provider: 'quillmonitor', project_name: 'Meter', incident_date: '2026-09-14', attack_type: 'Bridge Exploit', amount_lost_usd: 4_400_000 },
};
const meterWeb3: IncidentRow = {
  uid: 'meter-feed1',
  title: 'Meter exploited for $4.4M',
  published_at: '2026-09-14T00:00:00.000Z',
  source_name: null,
  metadata: { provider: 'web3-incidents', incident_date: '2026-09-14', attack_type: 'exploit', amount_lost_usd: 4_400_000 },
};
const limitBreak: IncidentRow = {
  uid: 'quillmonitor:limit-break-1',
  title: 'Limit Break: Supply Chain Attack ($1.2M loss)',
  published_at: '2026-09-20T00:00:00.000Z',
  source_name: 'QuillMonitor',
  metadata: { provider: 'quillmonitor', project_name: 'Limit Break', incident_date: '2026-09-20', attack_type: 'Supply Chain Attack', amount_lost_usd: 1_200_000 },
};
const magicEden: IncidentRow = {
  uid: 'magic-eden-feed1',
  title: 'Magic Eden users drained after Limit Break contract compromise',
  published_at: '2026-09-20T00:00:00.000Z',
  source_name: null,
  metadata: { provider: 'web3-incidents', incident_date: '2026-09-20', attack_type: 'supply-chain', amount_lost_usd: 1_500_000 },
};

describe('target extraction and normalization', () => {
  it('extracts project names from legacy title shapes', () => {
    expect(incidentTargetFromTitle('Example Bridge: Access Control Exploit')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Example Bridge - $2M exploit')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Example Bridge exploited for $2M')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Example Bridge suffers oracle attack')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Example Bridge loses $2M')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Example Bridge hit by private key leak')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Project-With-Hyphen')).toBe('Project-With-Hyphen');
    expect(incidentTargetFromTitle('Tom &amp; Jerry Finance: Exploit')).toBe('Tom & Jerry Finance');
    expect(incidentTargetFromTitle(null)).toBe('');
  });

  it('normalizes case, punctuation and spacing', () => {
    expect(normalizeIncidentTarget('  NEAR   Intents ')).toBe('near intents');
    expect(normalizeIncidentTarget('near-intents')).toBe('near intents');
  });
});

describe('rowProvider and candidateFromRow', () => {
  it('reads the provider from metadata, falling back to the SlowMist source name', () => {
    expect(rowProvider(nearQuillMonitor)).toBe('quillmonitor');
    expect(rowProvider({ ...meterWeb3, metadata: {}, source_name: 'SlowMist Hacked' })).toBe('slowmist');
    expect(rowProvider({ ...meterWeb3, metadata: null })).toBe('');
  });

  it('prefers metadata project name and incident date, falls back to title and published_at', () => {
    expect(candidateFromRow(nearQuillMonitor)).toEqual({
      uid: 'quillmonitor:near-intents-1',
      provider: 'quillmonitor',
      target: 'NEAR Intents',
      date: '2026-10-02',
      attackMethod: 'Private Key Compromise',
      amountInUsd: 3_800_000,
      reference: 'https://x.com/near/status/1',
    });
    expect(candidateFromRow(nearWeb3Feed1)).toMatchObject({ target: 'NEAR Intents', date: '2026-10-03' });
    expect(candidateFromRow({ ...meterWeb3, metadata: { provider: 'web3-incidents' } }))
      .toMatchObject({ target: 'Meter', date: '2026-09-14', attackMethod: null, amountInUsd: null });
  });

  it('does not use the ingestion time as the incident date', () => {
    expect(candidateFromRow({
      ...meterWeb3,
      published_at: '2026-10-10T08:00:00.000Z',
      metadata: { provider: 'web3-incidents', incident_date: null, incident_date_unknown: true },
    })).toBeNull();
    expect(candidateFromRow({ ...meterWeb3, published_at: null, metadata: {} })).toBeNull();
    expect(candidateFromRow({ ...meterWeb3, title: '', metadata: { incident_date: '2026-09-14' } })).toBeNull();
  });
});

describe('isHighConfidenceDuplicate', () => {
  const incident = {
    target: 'Example Bridge',
    date: '2026-09-20',
    attackMethod: 'Oracle Manipulation',
    amountInUsd: 2_000_000,
    reference: 'https://example.com/reference',
  };
  const other = { target: 'Example Bridge', date: '2026-09-21', attackMethod: null, amountInUsd: null, reference: null };

  it('matches the same target on the same day without other evidence', () => {
    expect(isHighConfidenceDuplicate(incident, { ...other, target: '  example   bridge ', date: '2026-09-20' })).toBe(true);
  });

  it('needs a matching amount, attack method or reference within two days', () => {
    expect(isHighConfidenceDuplicate(incident, { ...other, attackMethod: 'Oracle Manipulation' })).toBe(true);
    expect(isHighConfidenceDuplicate(incident, { ...other, amountInUsd: 2_000_000 })).toBe(true);
    expect(isHighConfidenceDuplicate(incident, { ...other, reference: 'https://example.com/reference' })).toBe(true);
    expect(isHighConfidenceDuplicate(incident, { ...other, attackMethod: 'Different Method' })).toBe(false);
    expect(isHighConfidenceDuplicate(incident, { ...other, date: '2026-09-22', amountInUsd: 2_000_000 })).toBe(true);
  });

  it('never matches beyond two days or across different targets', () => {
    expect(isHighConfidenceDuplicate(incident, { ...incident, date: '2026-09-23' })).toBe(false);
    expect(isHighConfidenceDuplicate(incident, { ...incident, target: 'Different Bridge' })).toBe(false);
  });

  it('matches the NEAR Intents and Meter records across providers', () => {
    const quill = candidateFromRow(nearQuillMonitor)!;
    expect(isHighConfidenceDuplicate(quill, candidateFromRow(nearWeb3Feed1)!)).toBe(true); // adjacent day, same amount
    expect(isHighConfidenceDuplicate(quill, candidateFromRow(nearWeb3Feed2)!)).toBe(true); // same day
    expect(isHighConfidenceDuplicate(candidateFromRow(meterQuillMonitor)!, candidateFromRow(meterWeb3)!)).toBe(true);
  });

  it('does not merge Limit Break and Magic Eden automatically', () => {
    // Same day and same incident in reality, but the providers name different
    // entities (the compromised vendor vs the affected marketplace). Merging on
    // anything weaker than an exact project name would also merge unrelated
    // incidents, so this pair needs a manual alias, not a looser matcher.
    expect(isHighConfidenceDuplicate(candidateFromRow(limitBreak)!, candidateFromRow(magicEden)!)).toBe(false);
  });
});

describe('provider priority', () => {
  it('ranks QuillMonitor, then web3-incidents, then SlowMist, then unknown', () => {
    expect(providerPriority('quillmonitor')).toBe(0);
    expect(providerPriority('web3-incidents')).toBe(1);
    expect(providerPriority('web3')).toBe(1);
    expect(providerPriority('slowmist')).toBe(2);
    expect(providerPriority('rss')).toBe(3);
  });

  it('picks the higher-priority record, then the lower uid', () => {
    const quill = { uid: 'quillmonitor:b', provider: 'quillmonitor' };
    const web3 = { uid: 'a', provider: 'web3-incidents' };
    expect(pickCanonical(undefined, web3)).toBe(web3);
    expect(pickCanonical(web3, quill)).toBe(quill);
    expect(pickCanonical(quill, web3)).toBe(quill);
    expect(pickCanonical({ uid: 'quillmonitor:c', provider: 'quillmonitor' }, quill)).toBe(quill);
  });
});
