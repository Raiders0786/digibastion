import { assertEquals, assertMatch } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  assessQuillMonitorRunHealth,
  buildQuillMonitorRequestUrl,
  formatUsd,
  hasCompleteQuillMonitorResult,
  isSafeQuillMonitorSyncWindow,
  mapQuillMonitorCategory,
  mapQuillMonitorSeverity,
  normalizeQuillMonitorIncident,
  parseQuillMonitorPage,
  parseQuillMonitorIncident,
} from '../_shared/quillmonitor.ts';

const incident = {
  id: 'incident-123',
  target: 'Example Bridge',
  date: '2026-09-25',
  chain: 'Ethereum',
  category: 'Bridge',
  attackedMethod: 'Access Control',
  amountInUsd: 12_500_000,
  description: 'An attacker bypassed access controls and withdrew funds.',
  reference: 'https://example.com/report',
  verificationStatus: 'verified' as const,
  createdAt: '2026-09-25T12:00:00.000Z',
  updatedAt: '2026-09-26T12:00:00.000Z',
};

Deno.test('parses and normalizes a documented QuillMonitor incident', () => {
  const parsed = parseQuillMonitorIncident(incident);
  if (!parsed) throw new Error('Expected incident to parse');
  const normalized = normalizeQuillMonitorIncident(parsed);
  assertEquals(normalized.uid, 'quillmonitor:incident-123');
  assertEquals(normalized.source_name, 'QuillMonitor');
  assertEquals(normalized.category, 'defi-exploits');
  assertEquals(normalized.severity, 'high');
  assertEquals(normalized.metadata.amount_lost_usd, 12_500_000);
  assertEquals(normalized.metadata.security_domain, 'web3');
  assertEquals(normalized.metadata.is_web3_incident, true);
  assertEquals(normalized.metadata.taxonomy_version, '2026-09-27.1');
  assertEquals(normalized.metadata.verification_status, 'verified');
  assertEquals(normalized.metadata.provider_updated_at, '2026-09-26T12:00:00.000Z');
  assertMatch(normalized.title, /\$12\.5M loss/);
});

Deno.test('preserves preliminary status and labels missing summaries', () => {
  const parsed = parseQuillMonitorIncident({
    ...incident,
    verificationStatus: 'unverified',
    description: '',
  });
  if (!parsed) throw new Error('Expected preliminary incident to parse');

  const normalized = normalizeQuillMonitorIncident(parsed);
  assertEquals(normalized.uid, 'quillmonitor:incident-123');
  assertEquals(normalized.summary, 'Summary pending');
  assertEquals(normalized.metadata.summary_status, 'pending');
  assertEquals(normalized.metadata.verification_status, 'unverified');
  assertEquals(normalized.raw_content, null);
});

Deno.test('classification prioritizes operational and supply-chain signals', () => {
  assertEquals(mapQuillMonitorCategory({ ...incident, category: 'Wallet', attackedMethod: 'Private Key Compromise' }), 'operational-security');
  assertEquals(mapQuillMonitorCategory({ ...incident, category: 'Protocol', attackedMethod: 'Frontend Supply Chain' }), 'supply-chain');
});

Deno.test('classification does not treat generic protocol or smart-contract wording as DeFi', () => {
  assertEquals(mapQuillMonitorCategory({
    ...incident,
    category: 'Protocol',
    attackedMethod: 'Smart Contract Reentrancy',
    description: 'A protocol contract was exploited.',
  }), 'web3-security');
  assertEquals(mapQuillMonitorCategory({
    ...incident,
    category: 'DEX',
    attackedMethod: 'Reentrancy',
  }), 'defi-exploits');
});

Deno.test('severity uses reported loss and strong attack methods', () => {
  assertEquals(mapQuillMonitorSeverity({ ...incident, amountInUsd: 75_000_000 }), 'critical');
  assertEquals(mapQuillMonitorSeverity({ ...incident, amountInUsd: null, attackedMethod: 'Reentrancy' }), 'high');
  assertEquals(formatUsd(1_250_000), '$1.3M');
});

Deno.test('rejects records without stable identity or incident date', () => {
  assertEquals(parseQuillMonitorIncident({ ...incident, id: '' }), null);
  assertEquals(parseQuillMonitorIncident({ ...incident, date: 'not-a-date' }), null);
  assertEquals(parseQuillMonitorIncident({ ...incident, date: '2026-02-31' }), null);
  assertEquals(parseQuillMonitorIncident({ ...incident, date: '2026-02-31T00:00:00Z' }), null);
  assertEquals(parseQuillMonitorIncident({ ...incident, verificationStatus: 'pending' }), null);
  assertEquals(parseQuillMonitorIncident({ ...incident, createdAt: 'not-a-date' }), null);
  assertEquals(parseQuillMonitorIncident({ ...incident, updatedAt: '' }), null);
});

Deno.test('accepts provider ISO timestamps and canonicalizes them to an incident date', () => {
  const parsed = parseQuillMonitorIncident({ ...incident, date: '2026-08-30T00:00:00Z' });
  if (!parsed) throw new Error('Expected ISO timestamp to parse');

  assertEquals(parsed.date, '2026-08-30');
  assertEquals(normalizeQuillMonitorIncident(parsed).published_at, '2026-08-30T00:00:00.000Z');
});

Deno.test('rejects every invalid record before a synchronization cursor can advance', () => {
  assertEquals(assessQuillMonitorRunHealth(300, 283, 0), {
    success: false,
    invalidRatio: 283 / 300,
    errorSummary: 'Provider validation rejected 283 of 300 records (94.3%)',
  });
  assertEquals(assessQuillMonitorRunHealth(100, 1, 0).success, false);
  assertEquals(assessQuillMonitorRunHealth(100, 0, 2).success, false);
  assertEquals(assessQuillMonitorRunHealth(0, 0, 0).success, false);
  assertEquals(assessQuillMonitorRunHealth(0, 0, 0, true), {
    success: true,
    invalidRatio: 0,
    errorSummary: undefined,
  });
});

Deno.test('builds full and incremental provider requests without exposing credentials', () => {
  const full = new URL(buildQuillMonitorRequestUrl({ page: 1, limit: 100 }));
  assertEquals(full.searchParams.get('includeUnverified'), 'true');
  assertEquals(full.searchParams.get('sort'), 'newest');
  assertEquals(full.searchParams.has('since'), false);

  const incremental = new URL(buildQuillMonitorRequestUrl({
    page: 2,
    limit: 100,
    since: '2026-09-28T00:00:00.000Z',
    until: '2026-09-29T00:00:00.000Z',
  }));
  assertEquals(incremental.searchParams.get('includeUnverified'), 'true');
  assertEquals(incremental.searchParams.get('since'), '2026-09-28T00:00:00.000Z');
  assertEquals(incremental.searchParams.get('until'), '2026-09-29T00:00:00.000Z');
  assertEquals(incremental.searchParams.has('sort'), false);
});

Deno.test('validates fixed-window incremental pagination', () => {
  const payload = {
    success: true,
    data: [incident],
    totalIncidents: 2,
    totalPages: 2,
    currentPage: 1,
    limit: 1,
    nextPage: 2,
    syncUntil: '2026-09-29T12:00:00Z',
  };
  assertEquals(parseQuillMonitorPage(payload, 1, 1, true)?.syncUntil, '2026-09-29T12:00:00.000Z');
  assertEquals(parseQuillMonitorPage({ ...payload, nextPage: 3 }, 1, 1, true), null);
  assertEquals(parseQuillMonitorPage({ ...payload, syncUntil: undefined }, 1, 1, true), null);
  assertEquals(parseQuillMonitorPage({ ...payload, currentPage: 2 }, 1, 1, true), null);
  assertEquals(parseQuillMonitorPage({ ...payload, data: [incident, incident] }, 1, 1, true), null);
  assertEquals(parseQuillMonitorPage({ ...payload, totalPages: 3 }, 1, 1, true), null);
  assertEquals(hasCompleteQuillMonitorResult(2, 2), true);
  assertEquals(hasCompleteQuillMonitorResult(1, 2), false);
});

Deno.test('rejects regressing or implausibly future incremental windows', () => {
  const receivedAt = new Date('2026-09-29T12:00:00.000Z');
  assertEquals(isSafeQuillMonitorSyncWindow(
    '2026-09-29T11:00:00.000Z',
    '2026-09-29T12:00:30.000Z',
    receivedAt,
  ), true);
  assertEquals(isSafeQuillMonitorSyncWindow(
    '2026-09-29T11:00:00.000Z',
    '2026-09-29T10:59:59.000Z',
    receivedAt,
  ), false);
  assertEquals(isSafeQuillMonitorSyncWindow(
    '2026-09-29T11:00:00.000Z',
    '2026-09-29T12:01:01.000Z',
    receivedAt,
  ), false);
});
