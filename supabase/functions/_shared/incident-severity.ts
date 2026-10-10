// One loss-based severity rubric for every Web3 incident importer, so the same
// incident gets the same severity whichever provider reported it.
// Pure module: no Deno or URL imports, so vitest can import it.

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

// Attack methods that usually mean a direct loss of funds even when the
// provider has not published an amount yet.
const HIGH_RISK_ATTACK_SIGNALS = ['private key', 'access control', 'oracle', 'reentrancy', 'flash loan'];

// Lowercase and turn punctuation into spaces so "Flash-loan" and
// "private_key_compromise" match the same signals as "flash loan".
function normalizeAttackType(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function severityFromLoss(amountUsd: number | null, attackType: string | null): IncidentSeverity {
  const amount = typeof amountUsd === 'number' && Number.isFinite(amountUsd) && amountUsd >= 0 ? amountUsd : null;
  if (amount !== null && amount >= 50_000_000) return 'critical';
  if (amount !== null && amount >= 10_000_000) return 'high';
  if (amount !== null && amount >= 1_000_000) return 'medium';

  const attack = normalizeAttackType(attackType ?? '');
  if (HIGH_RISK_ATTACK_SIGNALS.some((signal) => attack.includes(signal))) return 'high';
  if (amount !== null && amount > 0) return 'medium';
  return 'low';
}
