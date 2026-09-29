import {
  assert,
  assertEquals,
  assertMatch,
  assertStringIncludes,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  hasCompleteSlowMistPage,
  isHighConfidenceSlowMistDuplicate,
  normalizeSlowMistIncident,
  parseSlowMistPage,
  slowMistRecordNeedsWrite,
  slowMistTargetFromTitle,
  slowMistUid,
} from '../_shared/slowmist.ts';

function syntheticItem(index: number, overrides: {
  date?: string;
  amount?: string;
  attackMethod?: string;
  target?: string;
  reference?: string;
} = {}): string {
  const date = overrides.date ?? `2026-09-${String(index + 1).padStart(2, '0')}`;
  const amount = overrides.amount ?? '$ 1,234.56';
  const attackMethod = overrides.attackMethod ?? 'Smart Contract Vulnerability';
  const target = overrides.target ?? `Synthetic Project ${index}`;
  const reference = overrides.reference ?? `https://example.com/report?id=${index}&amp;source=test`;
  return `<li>
    <span class="time">${date}</span>
    <h3><em>Hacked target: </em>${target}</h3>
    <p><em>Description of the event: </em>PROVIDER DESCRIPTION MUST NOT BE STORED ${index}</p>
    <p><span><em>Amount of loss: </em>${amount}</span><span><em>Attack method: </em>${attackMethod}</span></p>
    <p class="link-reference"><a href="${reference}">View Reference Sources</a></p>
    <img src="https://example.com/provider-image-${index}.png">
  </li>`;
}

function syntheticPage(count = 20): string {
  return `<html><body>
    <div class="case-content-num"><p>${count} records</p></div>
    <div class="case-content"><ul>
      ${Array.from({ length: count }, (_, index) => syntheticItem(index, index === 0 ? { amount: '-' } : {})).join('\n')}
    </ul></div>
  </body></html>`;
}

Deno.test('parses exactly 20 server-rendered factual entries without descriptions or images', () => {
  const parsed = parseSlowMistPage(syntheticPage());
  assert(hasCompleteSlowMistPage(parsed));
  assertEquals(parsed.recordsFound, 20);
  assertEquals(parsed.invalidRecords, 0);
  assertEquals(parsed.incidents[0].amountInUsd, null);
  assertEquals(parsed.incidents[1].amountInUsd, 1234.56);
  assertEquals(parsed.incidents[1].reference, 'https://example.com/report?id=1&source=test');
  const serialized = JSON.stringify(parsed);
  assertEquals(serialized.includes('PROVIDER DESCRIPTION'), false);
  assertEquals(serialized.includes('provider-image'), false);
});

Deno.test('rejects incomplete pages and malformed factual fields', () => {
  assertEquals(hasCompleteSlowMistPage(parseSlowMistPage(syntheticPage(19))), false);
  const malformed = syntheticPage().replace('2026-09-01', '2026-02-31');
  const parsed = parseSlowMistPage(malformed);
  assert(parsed);
  assertEquals(parsed.invalidRecords, 1);
  assertEquals(hasCompleteSlowMistPage(parsed), false);
});

Deno.test('normalizes only facts into attributed, alert-suppressed articles', async () => {
  const parsed = parseSlowMistPage(syntheticPage());
  assert(hasCompleteSlowMistPage(parsed));
  const article = await normalizeSlowMistIncident(parsed.incidents[1], '2026-09-29T12:00:00.000Z');

  assertEquals(article.source_name, 'SlowMist Hacked');
  assertEquals(article.raw_content, null);
  assertEquals(article.published_at, '2026-09-02T00:00:00.000Z');
  assertEquals(article.metadata.provider, 'slowmist');
  assertEquals(article.metadata.provider_incident_id_is_synthetic, true);
  assertEquals(article.metadata.suppress_realtime_alert, true);
  assertEquals(article.metadata.attribution_url, 'https://hacked.slowmist.io/en/');
  assertEquals(article.metadata.summary_origin, 'provider-template');
  assertStringIncludes(article.summary, 'SlowMist Hacked lists an incident affecting Synthetic Project 1');
  assertEquals(article.summary.includes('PROVIDER DESCRIPTION'), false);
  assertEquals(article.content.includes('PROVIDER DESCRIPTION'), false);
  assertMatch(article.uid, /^slowmist:2026-09-02:[0-9a-f]{24}$/);
});

Deno.test('keeps identity stable across mutable factual corrections and hashes changed content', async () => {
  const base = {
    target: 'Example Bridge',
    date: '2026-09-20',
    attackMethod: 'Private Key Leakage',
    amountInUsd: 1_000_000,
    reference: 'https://example.com/first',
  };
  const corrected = {
    ...base,
    attackMethod: 'Access Control',
    amountInUsd: 2_000_000,
    reference: 'https://example.com/correction',
  };
  assertEquals(await slowMistUid(base), await slowMistUid(corrected));
  const [first, second] = await Promise.all([
    normalizeSlowMistIncident(base),
    normalizeSlowMistIncident(corrected),
  ]);
  assert(first.metadata.provider_content_hash !== second.metadata.provider_content_hash);
});

Deno.test('writes only material provider changes or duplicate-state transitions', () => {
  const desired = { provider_content_hash: 'same' };
  assertEquals(slowMistRecordNeedsWrite({ provider_content_hash: 'same' }, desired, null), false);
  assertEquals(slowMistRecordNeedsWrite({ provider_content_hash: 'old' }, desired, null), true);
  assertEquals(slowMistRecordNeedsWrite({ provider_content_hash: 'same' }, desired, 'quillmonitor:1'), true);
  assertEquals(slowMistRecordNeedsWrite({
    provider_content_hash: 'same',
    classification_relevant: false,
    duplicate_of_uid: 'quillmonitor:1',
  }, desired, 'quillmonitor:1'), false);
  assertEquals(slowMistRecordNeedsWrite({
    provider_content_hash: 'same',
    classification_relevant: false,
    duplicate_of_uid: 'quillmonitor:1',
  }, desired, null), true);
});

Deno.test('extracts legacy web3 project targets from common title shapes', () => {
  assertEquals(slowMistTargetFromTitle('Example Bridge: Access Control Exploit'), 'Example Bridge');
  assertEquals(slowMistTargetFromTitle('Example Bridge - $2M exploit'), 'Example Bridge');
  assertEquals(slowMistTargetFromTitle('Example Bridge exploited for $2M'), 'Example Bridge');
  assertEquals(slowMistTargetFromTitle('Example Bridge suffers oracle attack'), 'Example Bridge');
  assertEquals(slowMistTargetFromTitle('Example Bridge loses $2M'), 'Example Bridge');
  assertEquals(slowMistTargetFromTitle('Example Bridge hit by private key leak'), 'Example Bridge');
  assertEquals(slowMistTargetFromTitle('Project-With-Hyphen'), 'Project-With-Hyphen');
});

Deno.test('cross-provider matching requires exact target and strong adjacent-date evidence', () => {
  const incident = {
    target: 'Example Bridge',
    date: '2026-09-20',
    attackMethod: 'Oracle Manipulation',
    amountInUsd: 2_000_000,
    reference: 'https://example.com/reference',
  };
  assertEquals(isHighConfidenceSlowMistDuplicate(incident, {
    target: '  example   bridge ',
    date: '2026-09-20',
    attackMethod: null,
    amountInUsd: null,
    reference: null,
  }), true);
  assertEquals(isHighConfidenceSlowMistDuplicate(incident, {
    target: 'Example Bridge',
    date: '2026-09-21',
    attackMethod: 'Oracle Manipulation',
    amountInUsd: null,
    reference: null,
  }), true);
  assertEquals(isHighConfidenceSlowMistDuplicate(incident, {
    target: 'Example Bridge',
    date: '2026-09-21',
    attackMethod: 'Different Method',
    amountInUsd: null,
    reference: null,
  }), false);
  assertEquals(isHighConfidenceSlowMistDuplicate(incident, {
    target: 'Different Bridge',
    date: '2026-09-20',
    attackMethod: 'Oracle Manipulation',
    amountInUsd: 2_000_000,
    reference: 'https://example.com/reference',
  }), false);
  assertEquals(isHighConfidenceSlowMistDuplicate(incident, {
    target: 'Example Bridge',
    date: '2026-09-22',
    attackMethod: 'Oracle Manipulation',
    amountInUsd: 2_000_000,
    reference: 'https://example.com/reference',
  }), true);
  assertEquals(isHighConfidenceSlowMistDuplicate(incident, {
    target: 'Example Bridge',
    date: '2026-09-22',
    attackMethod: 'Different Method',
    amountInUsd: null,
    reference: null,
  }), false);
});
