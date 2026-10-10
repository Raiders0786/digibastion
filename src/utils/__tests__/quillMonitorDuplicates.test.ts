import { describe, expect, it } from 'vitest';
import {
  isQuillMonitorDuplicate,
  orderCanonicalsFirst,
  planQuillMonitorDuplicates,
  quillMonitorMarkForWrite,
  quillMonitorCanonicalOf,
  type IncidentRow,
} from '../../../supabase/functions/_shared/incident-dedup';
import {
  finalizeQuillMonitorArticle,
  normalizeQuillMonitorIncident,
  type NormalizedQuillMonitorArticle,
  type QuillMonitorIncident,
} from '../../../supabase/functions/_shared/quillmonitor';

// The production pair from the 2026-10-10 release check: one NEAR Intents
// incident reported twice by QuillMonitor, once unverified (Phalcon post) and
// once verified (NEAR post). Reference URLs are illustrative.
const UNVERIFIED_UID = 'quillmonitor:6abe7cb74bf2b9001882e340';
const VERIFIED_UID = 'quillmonitor:6abf52e051c7780018c8e336';
const PHALCON_REF = 'https://x.com/Phalcon_xyz/status/1973000000000000001';
const NEAR_REF = 'https://x.com/NEARProtocol/status/1973000000000000002';

function quillIncident(overrides: Partial<QuillMonitorIncident>): QuillMonitorIncident {
  return {
    id: 'x',
    target: 'NEAR Intents',
    date: '2026-10-01',
    chain: 'NEAR',
    category: 'Bridge',
    attackedMethod: 'Private Key Compromise',
    amountInUsd: 3_800_000,
    description: 'An attacker drained the solver.',
    reference: '',
    verificationStatus: 'unverified',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  };
}

const unverified = normalizeQuillMonitorIncident(quillIncident({
  id: '6abe7cb74bf2b9001882e340', reference: PHALCON_REF, verificationStatus: 'unverified',
}));
const verified = normalizeQuillMonitorIncident(quillIncident({
  id: '6abf52e051c7780018c8e336', reference: NEAR_REF, verificationStatus: 'verified',
}));

function withMetadata(row: NormalizedQuillMonitorArticle, metadata: Record<string, unknown>): NormalizedQuillMonitorArticle {
  return { ...row, metadata: { ...row.metadata, ...metadata } };
}

// The row as stored after an earlier sync or backfill marked it.
function marked(row: NormalizedQuillMonitorArticle, duplicateOfUid: string): IncidentRow {
  return withMetadata(row, { classification_relevant: false, duplicate_of_uid: duplicateOfUid });
}

describe('QuillMonitor same-provider duplicate rule', () => {
  it('treats the real NEAR Intents pair as one incident with the verified record as canonical', () => {
    expect(isQuillMonitorDuplicate(unverified, verified)).toBe(true);
    expect([...quillMonitorCanonicalOf([unverified, verified])]).toEqual([[UNVERIFIED_UID, VERIFIED_UID]]);
    expect([...quillMonitorCanonicalOf([verified, unverified])]).toEqual([[UNVERIFIED_UID, VERIFIED_UID]]);
  });

  it('follows the verification status when it is the other way round', () => {
    const swappedUnverified = withMetadata(unverified, { verification_status: 'verified' });
    const swappedVerified = withMetadata(verified, { verification_status: 'unverified' });
    expect([...quillMonitorCanonicalOf([swappedUnverified, swappedVerified])]).toEqual([[VERIFIED_UID, UNVERIFIED_UID]]);
  });

  it('picks the smallest uid when both have the same verification status', () => {
    const bothUnverified = [unverified, withMetadata(verified, { verification_status: 'unverified' })];
    expect([...quillMonitorCanonicalOf(bothUnverified)]).toEqual([[VERIFIED_UID, UNVERIFIED_UID]]);
    const bothVerified = [withMetadata(unverified, { verification_status: 'verified' }), verified];
    expect([...quillMonitorCanonicalOf(bothVerified)]).toEqual([[VERIFIED_UID, UNVERIFIED_UID]]);
  });

  it('needs the same amount, the same day and a usable project name', () => {
    const variants: [string, Record<string, unknown>][] = [
      ['different amount', { amount_lost_usd: 3_700_000 }],
      ['one day apart', { incident_date: '2026-10-02' }],
      ['punctuation-only target', { project_name: '???' }],
      ['zero amount', { amount_lost_usd: 0 }],
      ['implausible amount', { amount_lost_usd: 3_800_000_000_000 }],
      ['no amount', { amount_lost_usd: null }],
      ['different project', { project_name: 'NEAR Bridge' }],
    ];
    for (const [label, change] of variants) {
      expect({ label, duplicate: isQuillMonitorDuplicate(unverified, withMetadata(verified, change)) })
        .toEqual({ label, duplicate: false });
    }
    // Both sides blank or both zero still do not match each other.
    const blank = { project_name: '—', title: '' };
    expect(isQuillMonitorDuplicate(withMetadata(unverified, blank), withMetadata(verified, blank))).toBe(false);
    expect(isQuillMonitorDuplicate(
      withMetadata(unverified, { amount_lost_usd: 0 }),
      withMetadata(verified, { amount_lost_usd: 0 }),
    )).toBe(false);
  });

  it('only pairs QuillMonitor rows and never takes the shared X post shortcut', () => {
    const web3 = withMetadata(verified, { provider: 'web3-incidents' });
    expect(isQuillMonitorDuplicate(unverified, { ...web3, uid: 'web3-near' })).toBe(false);
    const renamedSamePost = withMetadata(verified, { project_name: 'NEAR', reference_url: PHALCON_REF });
    expect(isQuillMonitorDuplicate(unverified, renamedSamePost)).toBe(false);
  });

  it('normalizes case and punctuation in the project name', () => {
    expect(isQuillMonitorDuplicate(unverified, withMetadata(verified, { project_name: 'near-intents ' }))).toBe(true);
  });
});

describe('planQuillMonitorDuplicates (sync)', () => {
  it('marks the losing row in its own upsert when the batch holds both', () => {
    const plan = planQuillMonitorDuplicates([unverified, verified], [unverified, verified]);
    expect(plan.duplicateOfByUid).toEqual({ [UNVERIFIED_UID]: VERIFIED_UID, [VERIFIED_UID]: null });
    expect(plan.updates).toEqual([]);

    const loser = finalizeQuillMonitorArticle(unverified, undefined, [], plan.duplicateOfByUid[UNVERIFIED_UID]);
    expect(loser.metadata).toMatchObject({ classification_relevant: false, duplicate_of_uid: VERIFIED_UID });
    const canonical = finalizeQuillMonitorArticle(
      verified, undefined, plan.sourcesByCanonical[VERIFIED_UID] ?? [], plan.duplicateOfByUid[VERIFIED_UID],
    );
    expect(canonical.metadata.duplicate_of_uid).toBeUndefined();
    expect(canonical.metadata.classification_relevant).toBeUndefined();
    expect(canonical.metadata.sources).toEqual([
      { provider: 'quillmonitor', url: NEAR_REF, label: 'QuillMonitor', amount_usd: 3_800_000 },
      { provider: 'quillmonitor', url: PHALCON_REF, label: 'QuillMonitor', amount_usd: 3_800_000 },
    ]);
  });

  it('plans a separate mark for a stored losing row outside the batch', () => {
    const plan = planQuillMonitorDuplicates([verified], [unverified]);
    expect(plan.duplicateOfByUid).toEqual({ [VERIFIED_UID]: null });
    expect(plan.sourcesByCanonical[VERIFIED_UID]).toEqual([
      { provider: 'quillmonitor', url: PHALCON_REF, label: 'QuillMonitor', amount_usd: 3_800_000 },
    ]);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].uid).toBe(UNVERIFIED_UID);
    expect(plan.updates[0].dependsOn).toEqual([VERIFIED_UID]);
    expect(plan.updates[0].metadata).toMatchObject({
      provider: 'quillmonitor',
      reference_url: PHALCON_REF,
      classification_relevant: false,
      duplicate_of_uid: VERIFIED_UID,
    });
  });

  it('plans no separate write when the stored losing row is already marked', () => {
    const plan = planQuillMonitorDuplicates([verified], [marked(unverified, VERIFIED_UID)]);
    expect(plan.updates).toEqual([]);
    expect(plan.sourcesByCanonical[VERIFIED_UID]).toHaveLength(1);
  });

  it('adds the batch loser\'s source to a stored canonical row outside the batch', () => {
    const plan = planQuillMonitorDuplicates([unverified], [verified]);
    expect(plan.duplicateOfByUid).toEqual({ [UNVERIFIED_UID]: VERIFIED_UID });
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].uid).toBe(VERIFIED_UID);
    expect(plan.updates[0].dependsOn).toEqual([UNVERIFIED_UID]);
    expect(plan.updates[0].metadata.sources).toEqual([
      { provider: 'quillmonitor', url: NEAR_REF, label: 'QuillMonitor', amount_usd: 3_800_000 },
      { provider: 'quillmonitor', url: PHALCON_REF, label: 'QuillMonitor', amount_usd: 3_800_000 },
    ]);
    // A second sync over the stored result writes nothing more.
    const stored = { ...verified, metadata: plan.updates[0].metadata };
    expect(planQuillMonitorDuplicates([unverified], [stored]).updates).toEqual([]);
  });

  it('clears the mark of a batch row that no longer matches after a revision', () => {
    const revised = withMetadata(unverified, { amount_lost_usd: 2_000_000 });
    const plan = planQuillMonitorDuplicates([revised], [marked(unverified, VERIFIED_UID), verified]);
    expect(plan.duplicateOfByUid).toEqual({ [UNVERIFIED_UID]: null });
    const existing = { summary: null, metadata: marked(unverified, VERIFIED_UID).metadata };
    const finalized = finalizeQuillMonitorArticle(revised, existing, [], plan.duplicateOfByUid[UNVERIFIED_UID]);
    expect(finalized.metadata.duplicate_of_uid).toBeUndefined();
    expect(finalized.metadata.classification_relevant).toBeUndefined();
  });

  it('clears a stored row\'s mark when its canonical in the batch no longer matches', () => {
    const revisedCanonical = withMetadata(verified, { amount_lost_usd: 4_000_000 });
    const plan = planQuillMonitorDuplicates([revisedCanonical], [marked(unverified, VERIFIED_UID)]);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].uid).toBe(UNVERIFIED_UID);
    expect(plan.updates[0].dependsOn).toEqual([VERIFIED_UID]);
    expect(plan.updates[0].metadata.duplicate_of_uid).toBeUndefined();
    expect(plan.updates[0].metadata.classification_relevant).toBeUndefined();
    expect(plan.updates[0].metadata.reference_url).toBe(PHALCON_REF);
  });

  it('re-points the mark when the other record becomes canonical', () => {
    // QuillMonitor verifies the second report too: both verified, so the
    // smallest uid becomes canonical and the old canonical is marked instead.
    const nowVerified = withMetadata(unverified, { verification_status: 'verified' });
    const plan = planQuillMonitorDuplicates([nowVerified], [verified]);
    expect(plan.duplicateOfByUid).toEqual({ [UNVERIFIED_UID]: null });
    expect(plan.updates.map((update) => [update.uid, update.metadata.duplicate_of_uid, update.dependsOn]))
      .toEqual([[VERIFIED_UID, UNVERIFIED_UID, [UNVERIFIED_UID]]]);
  });

  it('leaves marks that point outside QuillMonitor or at rows it did not load alone', () => {
    const elsewhere = marked(unverified, 'quillmonitor:not-loaded');
    expect(planQuillMonitorDuplicates([withMetadata(verified, { amount_lost_usd: 1 })], [elsewhere]).updates).toEqual([]);
    const crossProvider = marked(unverified, 'web3-row');
    expect(planQuillMonitorDuplicates([verified], [crossProvider]).updates).toEqual([]);
    expect(planQuillMonitorDuplicates([verified], [crossProvider]).duplicateOfByUid).toEqual({ [VERIFIED_UID]: null });
  });

  it('ignores lower-priority rows and rows hidden for other reasons', () => {
    const web3 = { ...withMetadata(unverified, { provider: 'web3-incidents' }), uid: 'web3-near' };
    const hidden = withMetadata(unverified, { classification_relevant: false });
    const plan = planQuillMonitorDuplicates([verified], [web3, hidden]);
    expect(plan).toEqual({ duplicateOfByUid: { [VERIFIED_UID]: null }, sourcesByCanonical: {}, updates: [] });
  });
});

describe('finalizeQuillMonitorArticle duplicate marks', () => {
  it('keeps an existing QuillMonitor duplicate mark when the lookup was skipped', () => {
    const existing = { summary: null, metadata: marked(unverified, VERIFIED_UID).metadata };
    const finalized = finalizeQuillMonitorArticle(unverified, existing, null);
    expect(finalized.metadata).toMatchObject({ classification_relevant: false, duplicate_of_uid: VERIFIED_UID });
  });

  it('keeps sources merged from a losing QuillMonitor row when the lookup was skipped', () => {
    const phalcon = { provider: 'quillmonitor', url: PHALCON_REF, label: 'QuillMonitor', amount_usd: 3_800_000 };
    const web3 = { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/3', label: '@zachxbt', amount_usd: 3_800_000 };
    const oldOwn = { provider: 'quillmonitor', url: 'https://old.example.com/near', label: 'QuillMonitor', amount_usd: 3_000_000 };
    const existing = { summary: null, metadata: { ...verified.metadata, sources: [oldOwn, phalcon, web3] } };
    expect(finalizeQuillMonitorArticle(verified, existing, null).metadata.sources).toEqual([
      { provider: 'quillmonitor', url: NEAR_REF, label: 'QuillMonitor', amount_usd: 3_800_000 },
      phalcon,
      web3,
    ]);
  });

  it('does not invent a mark when the lookup was skipped and the row had none', () => {
    const finalized = finalizeQuillMonitorArticle(unverified, { summary: null, metadata: verified.metadata }, null);
    expect(finalized.metadata.duplicate_of_uid).toBeUndefined();
    expect(finalized.metadata.classification_relevant).toBeUndefined();
  });

  it('writes no mark by default', () => {
    const finalized = finalizeQuillMonitorArticle(unverified, undefined, []);
    expect(finalized.metadata.duplicate_of_uid).toBeUndefined();
  });
});

describe('guarded writes outside the batch', () => {
  it('carries the updated_at string read with each stored row, unchanged', () => {
    const stamp = '2026-10-10T08:15:30.123456+00:00';
    const plan = planQuillMonitorDuplicates([verified], [{ ...unverified, updated_at: stamp }]);
    expect(plan.updates.map((update) => [update.uid, update.updatedAt])).toEqual([[UNVERIFIED_UID, stamp]]);
    expect(planQuillMonitorDuplicates([verified], [unverified]).updates[0].updatedAt).toBeNull();
  });
});

describe('upsert order for losing rows in the batch', () => {
  const plan = planQuillMonitorDuplicates([unverified, verified], []);
  const other = { ...verified, uid: 'quillmonitor:other' };

  it('writes canonical and unrelated rows before losing rows, otherwise keeping the order', () => {
    expect(orderCanonicalsFirst([unverified, other, verified], plan.duplicateOfByUid).map((row) => row.uid))
      .toEqual(['quillmonitor:other', VERIFIED_UID, UNVERIFIED_UID]);
  });

  it('marks a loser only once its canonical exists, and keeps the old mark otherwise', () => {
    expect(quillMonitorMarkForWrite(UNVERIFIED_UID, plan.duplicateOfByUid, new Set([VERIFIED_UID]))).toBe(VERIFIED_UID);
    expect(quillMonitorMarkForWrite(UNVERIFIED_UID, plan.duplicateOfByUid, new Set())).toBe('keep');
    expect(quillMonitorMarkForWrite(VERIFIED_UID, plan.duplicateOfByUid, new Set())).toBeNull();
    expect(quillMonitorMarkForWrite('quillmonitor:not-planned', plan.duplicateOfByUid, new Set())).toBeNull();
  });

  it('keeps the stored mark but still applies this sync\'s sources when told to keep', () => {
    const existing = { summary: null, metadata: marked(unverified, 'quillmonitor:earlier').metadata };
    const kept = finalizeQuillMonitorArticle(unverified, existing, [], 'keep');
    expect(kept.metadata).toMatchObject({ classification_relevant: false, duplicate_of_uid: 'quillmonitor:earlier' });
    expect(kept.metadata.sources).toHaveLength(1);
    const unmarked = finalizeQuillMonitorArticle(unverified, undefined, [], 'keep');
    expect(unmarked.metadata.duplicate_of_uid).toBeUndefined();
  });
});
