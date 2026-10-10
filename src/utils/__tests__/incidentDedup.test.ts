import { describe, expect, it } from 'vitest';
import {
  candidateFromRow,
  groupDuplicates,
  incidentDateWindows,
  incidentSourcesFromRow,
  incidentTargetFromTitle,
  isHighConfidenceDuplicate,
  matchExistingIncident,
  MAX_BACKFILL_SAMPLES,
  normalizeIncidentTarget,
  pickCanonical,
  planCanonicalMerges,
  planDuplicateBackfill,
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
      references: ['https://x.com/i/status/1'],
    });
    expect(candidateFromRow(nearWeb3Feed1)).toMatchObject({ target: 'NEAR Intents', date: '2026-10-03' });
    expect(candidateFromRow({ ...meterWeb3, metadata: { provider: 'web3-incidents' } }))
      .toMatchObject({ target: 'Meter', date: '2026-09-14', attackMethod: null, amountInUsd: null });
  });

  it('rejects punctuation-only project names', () => {
    expect(candidateFromRow({ ...meterWeb3, metadata: { project_name: '???', incident_date: '2026-09-14' } })).toBeNull();
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
  it('matches the actual Meter reports through their shared Blockaid post', () => {
    const web3 = candidateFromRow({ uid: 'meter-live-web3', title: 'Meter token prices crash after unauthorized mint',
      published_at: '2026-09-24T00:00:00Z', link: 'https://x.com/Meter_IO/status/2103165031278125517',
      source_url: JSON.stringify([{ url: 'https://x.com/blockaid_/status/2103121249706877178' }]),
      metadata: { provider: 'web3-incidents', amount_lost_usd: 2_300_000 } });
    const quill = candidateFromRow({ uid: 'meter-live-quill', title: 'Meter.IO: Security incident',
      published_at: '2026-09-24T00:00:00Z', metadata: { provider: 'quillmonitor', project_name: 'Meter.IO',
        amount_lost_usd: 2_300_000, reference_url: 'https://x.com/blockaid_/status/2103121249706877178' } });
    if (!web3 || !quill) throw new Error('Invalid Meter fixtures');
    expect(isHighConfidenceDuplicate(web3, quill)).toBe(true);
    expect(isHighConfidenceDuplicate(web3, { ...quill, date: '2026-09-25' })).toBe(false);
    expect(isHighConfidenceDuplicate(web3, { ...quill, amountInUsd: 0 })).toBe(false);
    expect(isHighConfidenceDuplicate(web3, { ...quill, amountInUsd: 1_800_000 })).toBe(false);
    expect(isHighConfidenceDuplicate(web3, { ...quill, references: [], reference: 'https://x.com/blockaid_/status/99' })).toBe(false);
    expect(groupDuplicates([{ uid: web3.uid, title: web3.target, published_at: web3.date,
      source_url: JSON.stringify([{ url: quill.reference }]), metadata: { provider: 'web3-incidents', amount_lost_usd: 2_300_000 } },
      { uid: quill.uid, title: quill.target, published_at: quill.date,
        metadata: { provider: 'quillmonitor', amount_lost_usd: 2_300_000, reference_url: quill.reference } }])).toHaveLength(1);
  });

  it('does not merge different project names through a generic provider page', () => {
    const a = { target: 'Limit Break', date: '2026-09-25', amountInUsd: 1_800_000, attackMethod: null,
      reference: 'https://www.quillaudits.com/web3-hacks-database' };
    expect(isHighConfidenceDuplicate(a, { ...a, target: 'Magic Eden' })).toBe(false);
  });
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

  it('never matches targets that normalize to an empty string', () => {
    const blank = { ...other, date: '2026-09-20' };
    expect(isHighConfidenceDuplicate({ ...blank, target: '???' }, { ...blank, target: '—' })).toBe(false);
  });

  it('does not treat a zero amount as matching evidence', () => {
    const zero = { ...other, amountInUsd: 0 };
    expect(isHighConfidenceDuplicate({ ...zero, date: '2026-09-20' }, { ...zero, date: '2026-09-21' })).toBe(false);
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

describe('incidentSourcesFromRow', () => {
  it('uses stored sources when present', () => {
    expect(incidentSourcesFromRow({
      ...nearWeb3Feed1,
      metadata: { provider: 'web3-incidents', sources: [{ provider: 'web3-incidents', url: 'https://x.com/a', label: '@a', amount_usd: 3_800_000 }] },
    })).toEqual([{ provider: 'web3-incidents', url: 'https://x.com/a', label: '@a', amount_usd: 3_800_000 }]);
  });

  it('builds one source from reference_url or link and drops implausible legacy amounts', () => {
    expect(incidentSourcesFromRow(nearWeb3Feed1)).toEqual([
      { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/2', label: 'Web3 incident tracker', amount_usd: 3_800_000 },
    ]);
    expect(incidentSourcesFromRow(nearWeb3Feed2)).toEqual([
      { provider: 'web3-incidents', url: null, label: 'Web3 incident tracker', amount_usd: null },
    ]);
  });
});

describe('planCanonicalMerges', () => {
  it('marks lower-priority duplicates and collects their sources on the canonical row', () => {
    const plan = planCanonicalMerges([nearQuillMonitor, limitBreak], [nearWeb3Feed1, nearWeb3Feed2, magicEden]);
    expect(plan.marks.map((mark) => [mark.uid, mark.duplicateOfUid, mark.needsWrite])).toEqual([
      ['a1b2c3-feed1-near', 'quillmonitor:near-intents-1', true],
      ['d4e5f6-feed2-near', 'quillmonitor:near-intents-1', true],
    ]);
    expect(plan.marks[0].metadata).toMatchObject({
      provider: 'web3-incidents',
      data_source: 'feed-1',
      classification_relevant: false,
      duplicate_of_uid: 'quillmonitor:near-intents-1',
    });
    expect(plan.sourcesByCanonical['quillmonitor:near-intents-1']).toEqual([
      { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/2', label: 'Web3 incident tracker', amount_usd: 3_800_000 },
      { provider: 'web3-incidents', url: null, label: 'Web3 incident tracker', amount_usd: null },
    ]);
    expect(plan.sourcesByCanonical['quillmonitor:limit-break-1']).toBeUndefined();
  });

  it('skips rows already marked as a duplicate of a record outside the batch', () => {
    const elsewhere = {
      ...nearWeb3Feed1,
      metadata: { ...(nearWeb3Feed1.metadata as object), classification_relevant: false, duplicate_of_uid: 'quillmonitor:other' },
    };
    expect(planCanonicalMerges([nearQuillMonitor], [elsewhere]).marks).toEqual([]);
  });

  it('reports no write for rows already marked against the same canonical', () => {
    const marked = {
      ...meterWeb3,
      metadata: { ...(meterWeb3.metadata as object), classification_relevant: false, duplicate_of_uid: 'quillmonitor:meter-1' },
    };
    const plan = planCanonicalMerges([meterQuillMonitor], [marked]);
    expect(plan.marks).toHaveLength(1);
    expect(plan.marks[0].needsWrite).toBe(false);
    expect(plan.sourcesByCanonical['quillmonitor:meter-1']).toHaveLength(1);
  });

  it('never marks a row of equal or higher priority', () => {
    const otherQuill = { ...nearQuillMonitor, uid: 'quillmonitor:near-intents-2' };
    expect(planCanonicalMerges([nearQuillMonitor], [otherQuill]).marks).toEqual([]);
  });
});

describe('matchExistingIncident', () => {
  it('finds a higher-priority record of the same incident', () => {
    expect(matchExistingIncident(nearWeb3Feed1, [nearQuillMonitor, meterQuillMonitor])).toBe('quillmonitor:near-intents-1');
  });

  it('finds an equal-priority record with a different uid', () => {
    // Same day, so a re-titled feed entry (new uid) is still caught.
    expect(matchExistingIncident(nearWeb3Feed2, [{ ...nearWeb3Feed2, uid: 'older-near-row' }])).toBe('older-near-row');
  });

  it('does not match the legacy feed-2 NEAR row from the next day (inflated amount, different method)', () => {
    expect(matchExistingIncident(nearWeb3Feed1, [nearWeb3Feed2])).toBeNull();
  });

  it('ignores lower-priority records, the incident itself and hidden rows', () => {
    const slowMist = { ...nearWeb3Feed2, uid: 'slowmist:2026-10-02:abc', metadata: { ...(nearWeb3Feed2.metadata as object), provider: 'slowmist' } };
    expect(matchExistingIncident(nearWeb3Feed1, [slowMist])).toBeNull();
    expect(matchExistingIncident(nearWeb3Feed1, [nearWeb3Feed1])).toBeNull();
    const hidden = { ...nearQuillMonitor, metadata: { ...(nearQuillMonitor.metadata as object), classification_relevant: false } };
    expect(matchExistingIncident(nearWeb3Feed1, [hidden])).toBeNull();
  });

  it('returns null when the incident has no usable date', () => {
    const undated = { ...nearWeb3Feed1, metadata: { provider: 'web3-incidents', incident_date: null, incident_date_unknown: true } };
    expect(matchExistingIncident(undated, [nearQuillMonitor])).toBeNull();
  });
});

describe('incidentDateWindows', () => {
  it('pads each date by two days and merges overlapping windows', () => {
    expect(incidentDateWindows(['2026-10-02', '2026-09-14', '2026-10-03', 'bad', '2026-10-02'])).toEqual([
      { from: '2026-09-12T00:00:00.000Z', to: '2026-09-17T00:00:00.000Z' },
      { from: '2026-09-30T00:00:00.000Z', to: '2026-10-06T00:00:00.000Z' },
    ]);
    expect(incidentDateWindows([])).toEqual([]);
  });
});

describe('groupDuplicates', () => {
  it('groups NEAR Intents and Meter under their QuillMonitor records', () => {
    expect(groupDuplicates([nearWeb3Feed2, meterWeb3, nearWeb3Feed1, nearQuillMonitor, meterQuillMonitor])).toEqual([
      { canonical: 'quillmonitor:meter-1', duplicates: ['meter-feed1'] },
      { canonical: 'quillmonitor:near-intents-1', duplicates: ['a1b2c3-feed1-near', 'd4e5f6-feed2-near'] },
    ]);
  });

  it('leaves Limit Break and Magic Eden as separate incidents', () => {
    expect(groupDuplicates([limitBreak, magicEden])).toEqual([]);
  });

  it('is stable for rows that are already marked', () => {
    const marked = {
      ...nearWeb3Feed1,
      metadata: { ...(nearWeb3Feed1.metadata as object), classification_relevant: false, duplicate_of_uid: 'quillmonitor:near-intents-1' },
    };
    expect(groupDuplicates([nearQuillMonitor, marked])).toEqual([
      { canonical: 'quillmonitor:near-intents-1', duplicates: ['a1b2c3-feed1-near'] },
    ]);
  });

  it('ignores rows hidden for other reasons and never merges two QuillMonitor rows', () => {
    const hidden = { ...meterWeb3, metadata: { ...(meterWeb3.metadata as object), classification_relevant: false } };
    expect(groupDuplicates([meterQuillMonitor, hidden])).toEqual([]);
    const secondQuill = { ...meterQuillMonitor, uid: 'quillmonitor:meter-2' };
    expect(groupDuplicates([meterQuillMonitor, secondQuill])).toEqual([]);
  });

  it('does not chain matches: each duplicate must match the canonical row itself', () => {
    const day0 = { ...meterWeb3, uid: 'w-0', metadata: { provider: 'web3-incidents', incident_date: '2026-09-10', attack_type: 'exploit' } };
    const day2 = { ...meterWeb3, uid: 'w-2', metadata: { provider: 'web3-incidents', incident_date: '2026-09-12', attack_type: 'exploit' } };
    const day4 = { ...meterWeb3, uid: 'w-4', metadata: { provider: 'web3-incidents', incident_date: '2026-09-14', attack_type: 'exploit' } };
    expect(groupDuplicates([day0, day2, day4])).toEqual([{ canonical: 'w-0', duplicates: ['w-2'] }]);
  });
});

describe('planDuplicateBackfill', () => {
  it('marks duplicates and adds their sources to the canonical row', () => {
    const plan = planDuplicateBackfill([nearQuillMonitor, nearWeb3Feed1, nearWeb3Feed2, limitBreak, magicEden]);
    expect(plan.groups).toEqual([
      { canonical: 'quillmonitor:near-intents-1', duplicates: ['a1b2c3-feed1-near', 'd4e5f6-feed2-near'] },
    ]);
    expect(plan.marks.map((mark) => [mark.uid, mark.duplicateOfUid, mark.needsWrite])).toEqual([
      ['a1b2c3-feed1-near', 'quillmonitor:near-intents-1', true],
      ['d4e5f6-feed2-near', 'quillmonitor:near-intents-1', true],
    ]);
    expect(plan.canonicalUpdates).toHaveLength(1);
    expect(plan.canonicalUpdates[0].uid).toBe('quillmonitor:near-intents-1');
    expect(plan.canonicalUpdates[0].metadata).toMatchObject({ provider: 'quillmonitor', verification_status: 'verified' });
    expect(plan.canonicalUpdates[0].metadata.sources).toEqual([
      { provider: 'quillmonitor', url: 'https://x.com/near/status/1', label: 'QuillMonitor', amount_usd: 3_800_000 },
      { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/2', label: 'Web3 incident tracker', amount_usd: 3_800_000 },
      { provider: 'web3-incidents', url: null, label: 'Web3 incident tracker', amount_usd: null },
    ]);
    expect(plan.samples).toEqual([
      {
        canonical: { uid: 'quillmonitor:near-intents-1', title: 'NEAR Intents: Private Key Compromise ($3.8M loss)' },
        duplicate: { uid: 'a1b2c3-feed1-near', title: 'NEAR Intents exploited for $3.8 million' },
      },
      {
        canonical: { uid: 'quillmonitor:near-intents-1', title: 'NEAR Intents: Private Key Compromise ($3.8M loss)' },
        duplicate: { uid: 'd4e5f6-feed2-near', title: 'NEAR Intents - Private Key Compromise ($3.8M)' },
      },
    ]);
  });

  it('plans no writes on a second run over already-merged rows', () => {
    const first = planDuplicateBackfill([meterQuillMonitor, meterWeb3]);
    const canonical = { ...meterQuillMonitor, metadata: first.canonicalUpdates[0].metadata };
    const duplicate = { ...meterWeb3, metadata: first.marks[0].metadata };
    const second = planDuplicateBackfill([canonical, duplicate]);
    expect(second.marks.every((mark) => !mark.needsWrite)).toBe(true);
    expect(second.canonicalUpdates).toEqual([]);
  });

  it(`caps samples at ${MAX_BACKFILL_SAMPLES}`, () => {
    const rows: IncidentRow[] = [];
    for (let index = 0; index < 60; index++) {
      const target = `Project ${index}`;
      rows.push({ ...meterQuillMonitor, uid: `quillmonitor:p${index}`, metadata: { provider: 'quillmonitor', project_name: target, incident_date: '2026-09-14' } });
      rows.push({ ...meterWeb3, uid: `w${index}`, metadata: { provider: 'web3-incidents', project_name: target, incident_date: '2026-09-14' } });
    }
    const plan = planDuplicateBackfill(rows);
    expect(plan.marks).toHaveLength(60);
    expect(plan.samples).toHaveLength(MAX_BACKFILL_SAMPLES);
  });
});

describe('groupDuplicates with rows already marked as duplicates', () => {
  it('never lets a marked row head a group when its canonical is not loaded', () => {
    const w1 = {
      ...meterWeb3,
      uid: 'w-1',
      metadata: { ...(meterWeb3.metadata as object), classification_relevant: false, duplicate_of_uid: 'quillmonitor:absent' },
    };
    const w2 = { ...meterWeb3, uid: 'w-2' };
    expect(groupDuplicates([w1, w2])).toEqual([]);
    const plan = planDuplicateBackfill([w1, w2]);
    expect(plan.marks).toEqual([]);
    expect(plan.canonicalUpdates).toEqual([]);
  });

  it('plans no writes on a second run when the marked canonical is loaded', () => {
    const first = planDuplicateBackfill([nearQuillMonitor, nearWeb3Feed1]);
    const canonical = { ...nearQuillMonitor, metadata: first.canonicalUpdates[0].metadata };
    const duplicate = { ...nearWeb3Feed1, metadata: first.marks[0].metadata };
    const second = planDuplicateBackfill([canonical, duplicate]);
    expect(second.groups).toEqual([{ canonical: 'quillmonitor:near-intents-1', duplicates: ['a1b2c3-feed1-near'] }]);
    expect(second.marks.every((mark) => !mark.needsWrite)).toBe(true);
    expect(second.canonicalUpdates).toEqual([]);
  });
});
