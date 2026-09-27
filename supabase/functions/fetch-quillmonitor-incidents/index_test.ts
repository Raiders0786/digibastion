import { assertEquals, assertMatch } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  assessQuillMonitorRunHealth,
  formatUsd,
  mapQuillMonitorCategory,
  mapQuillMonitorSeverity,
  normalizeQuillMonitorIncident,
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
  assertMatch(normalized.title, /\$13M loss/);
});

Deno.test('classification prioritizes operational and supply-chain signals', () => {
  assertEquals(mapQuillMonitorCategory({ ...incident, category: 'Wallet', attackedMethod: 'Private Key Compromise' }), 'operational-security');
  assertEquals(mapQuillMonitorCategory({ ...incident, category: 'Protocol', attackedMethod: 'Frontend Supply Chain' }), 'supply-chain');
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
});

Deno.test('accepts provider ISO timestamps and canonicalizes them to an incident date', () => {
  const parsed = parseQuillMonitorIncident({ ...incident, date: '2026-08-30T00:00:00Z' });
  if (!parsed) throw new Error('Expected ISO timestamp to parse');

  assertEquals(parsed.date, '2026-08-30');
  assertEquals(normalizeQuillMonitorIncident(parsed).published_at, '2026-08-30T00:00:00.000Z');
});

Deno.test('marks high validation rejection ratios as unhealthy without failing small anomalies', () => {
  assertEquals(assessQuillMonitorRunHealth(300, 283, 0), {
    success: false,
    invalidRatio: 283 / 300,
    errorSummary: 'Provider validation rejected 283 of 300 records (94.3%)',
  });
  assertEquals(assessQuillMonitorRunHealth(100, 1, 0).success, true);
  assertEquals(assessQuillMonitorRunHealth(100, 0, 2).success, false);
  assertEquals(assessQuillMonitorRunHealth(0, 0, 0).success, false);
});
