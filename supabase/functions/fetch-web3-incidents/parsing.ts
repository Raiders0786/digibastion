// Pure parsing helpers for the web3-incidents collector. Kept free of Deno and
// URL imports so vitest can cover the amount and date bugs directly.
import type { IncidentSource } from '../_shared/incident-fields.ts';

export { formatUsd } from '../_shared/quillmonitor.ts';

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

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function calendarDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC rolls 31 February into March; the round trip rejects that.
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

/**
 * Returns the incident date as YYYY-MM-DD (UTC), or null when the value is not
 * one of the formats the feed uses. Callers must not substitute today's date.
 */
export function parseIncidentDate(value: string): string | null {
  const text = (value ?? '').trim();
  if (!text) return null;

  // "January 8, 2026" (feed-1 section headers), also "Jan 8 2026".
  const named = /^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(text);
  if (named) {
    const month = MONTHS[named[1].toLowerCase()];
    return month ? calendarDate(Number(named[3]), month, Number(named[2])) : null;
  }

  // "07/01/26" is DD/MM/YY; four-digit years are accepted too.
  const numeric = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(text);
  if (numeric) {
    const shortYear = Number(numeric[3]);
    const year = numeric[3].length === 2 ? (shortYear < 50 ? 2000 + shortYear : 1900 + shortYear) : shortYear;
    return calendarDate(year, Number(numeric[2]), Number(numeric[1]));
  }

  // ISO date or timestamp. A timestamp is converted to its UTC calendar day.
  const iso = /^(\d{4})-(\d{2})-(\d{2})(T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(text);
  if (iso) {
    const date = calendarDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    if (!date || !iso[4]) return date;
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  }

  return null;
}

export interface ExtractedLink {
  url: string;
  label: string;
}

// Moved unchanged from index.ts so it can be tested: pulls cited links out of
// the feed markdown, skipping the feed's own pages and archive mirrors.
export function extractSources(content: string): ExtractedLink[] {
  const sources: ExtractedLink[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const linkText = match[1].trim();
    let url = match[2].trim();

    if (url.includes('web3isgoinggreat.com') ||
        url.includes('archive.org') ||
        url.includes('web.archive.org') ||
        linkText.toLowerCase().includes('archive') ||
        linkText.toLowerCase().includes('attribution') ||
        !url.startsWith('http')) {
      continue;
    }

    try {
      const urlObj = new URL(url);
      ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref_src', 'ref_url'].forEach(param => {
        urlObj.searchParams.delete(param);
      });
      url = urlObj.toString();
    } catch {
      // If URL parsing fails, use as-is
    }

    let label = linkText;
    if (linkText.toLowerCase().includes('tweet')) {
      if (url.includes('x.com') || url.includes('twitter.com')) {
        const usernameMatch = url.match(/(?:x\.com|twitter\.com)\/([^/]+)/);
        label = usernameMatch ? `@${usernameMatch[1]}` : 'Twitter/X';
      }
    } else if (url.includes('etherscan.io')) {
      label = 'Etherscan';
    } else if (url.includes('bscscan.com')) {
      label = 'BscScan';
    } else if (url.includes('polygonscan.com')) {
      label = 'PolygonScan';
    }

    if (!sources.some(s => s.url === url)) {
      sources.push({ url, label });
    }
  }

  return sources.slice(0, 5);
}

/**
 * Builds metadata.sources for a web3-incidents record. The parsed loss is
 * attributed to the first cited link only, so merged views do not count it
 * once per link.
 */
export function web3IncidentSources(links: ExtractedLink[], amountUsd: number | null): IncidentSource[] {
  return links.map((link, index) => ({
    provider: 'web3-incidents',
    url: link.url,
    label: link.label,
    amount_usd: index === 0 ? amountUsd : null,
  }));
}
