// USD loss parser shared by the web3-incidents importer and the
// dedupe-incidents legacy amount repair, so both read amounts the same way.
// Pure module: no Deno or URL imports, so vitest can import it.

const UNIT_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  m: 1_000_000,
  mn: 1_000_000,
  million: 1_000_000,
  millions: 1_000_000,
  b: 1_000_000_000,
  bn: 1_000_000_000,
  billion: 1_000_000_000,
  billions: 1_000_000_000,
};

// "$3.8M", "$3.8 million", "$3,800,000", "$1.2B", "$500K". The unit must touch
// the number: single-letter units with no space, words after optional spaces.
const DOLLAR_AMOUNT = /\$\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?:\s*(thousand|millions?|billions?|mn|bn)\b|([kmb])\b)?/i;
// "3.8 million dollars", "12 million USD".
const WORDED_AMOUNT = /\b(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?\s*(thousand|millions?|billions?)\s+(?:us\s+)?(?:dollars?|usd)\b/i;

// Anything above this is a parsing error, not a real incident; the largest
// crypto thefts on record are around $1.5B.
const MAX_PLAUSIBLE_USD = 100_000_000_000;

function amountFromMatch(match: RegExpExecArray, unit: string | undefined): number | null {
  const base = Number(`${match[1].replace(/,/g, '')}${match[2] ? `.${match[2]}` : ''}`);
  if (!Number.isFinite(base)) return null;
  const multiplier = unit ? UNIT_MULTIPLIERS[unit.toLowerCase()] : 1;
  if (!multiplier) return null;
  // Rounding removes float noise such as 3.8 * 1e6 = 3799999.9999999995.
  const amount = unit ? Math.round(base * multiplier) : base;
  return amount > 0 && amount <= MAX_PLAUSIBLE_USD ? amount : null;
}

/**
 * Returns the first USD amount in the text as full dollars. Only the unit next
 * to the number scales it; a "billion" elsewhere in the text never does.
 */
export function parseUsdAmount(text: string): number | null {
  if (!text) return null;
  const dollar = DOLLAR_AMOUNT.exec(text);
  const worded = WORDED_AMOUNT.exec(text);
  const first = dollar && worded
    ? (dollar.index <= worded.index ? dollar : worded)
    : dollar ?? worded;
  if (!first) return null;
  const unit = first === dollar ? (dollar[3] ?? dollar[4]) : first[3];
  return amountFromMatch(first, unit);
}
