import { describe, expect, it } from 'vitest';
import {
  extractSources,
  formatUsd,
  parseIncidentDate,
  parseUsdAmount,
  web3IncidentSources,
} from '../../../supabase/functions/fetch-web3-incidents/parsing';

describe('parseUsdAmount', () => {
  it('reads the unit next to the number', () => {
    expect(parseUsdAmount('NEAR Intents exploited for $3.8M')).toBe(3_800_000);
    expect(parseUsdAmount('Attackers took $3.8 million from the bridge')).toBe(3_800_000);
    expect(parseUsdAmount('Roughly 3.8 million dollars were drained')).toBe(3_800_000);
    expect(parseUsdAmount('Exchange loses $1.2B in hot wallet hack')).toBe(1_200_000_000);
    expect(parseUsdAmount('A $500K phishing loss')).toBe(500_000);
    expect(parseUsdAmount('$2 billion stolen')).toBe(2_000_000_000);
    expect(parseUsdAmount('$12 millions')).toBe(12_000_000);
  });

  it('returns full-dollar values unscaled (old bug: treated as millions)', () => {
    expect(parseUsdAmount('Meter bridge drained of $3,800,000')).toBe(3_800_000);
    expect(parseUsdAmount('A user lost $500 to a fake airdrop')).toBe(500);
    expect(parseUsdAmount('$1,234.56 in USDC')).toBe(1_234.56);
  });

  it('never scales by a unit word elsewhere in the text', () => {
    expect(parseUsdAmount('Protocol loses $3.8M; 2026 losses now exceed one billion')).toBe(3_800_000);
    expect(parseUsdAmount('$250,000 stolen, a fraction of the billion-dollar TVL')).toBe(250_000);
    expect(parseUsdAmount('$700 lost. Analysts expect millions more at risk')).toBe(700);
  });

  it('uses the first amount in the text', () => {
    expect(parseUsdAmount('$3.8M stolen, $1.1M later returned')).toBe(3_800_000);
    expect(parseUsdAmount('About 2 million USD was taken, then $500K returned')).toBe(2_000_000);
  });

  it('does not treat a separate word as a unit', () => {
    expect(parseUsdAmount('$5 more was needed')).toBe(5);
    expect(parseUsdAmount('$500 bounty offered')).toBe(500);
  });

  it('returns null when no USD amount is present or the value is implausible', () => {
    expect(parseUsdAmount('Undisclosed amount of ETH stolen')).toBeNull();
    expect(parseUsdAmount('')).toBeNull();
    expect(parseUsdAmount('$0 lost')).toBeNull();
    expect(parseUsdAmount('$900B exploit claim')).toBeNull();
  });
});

describe('parseIncidentDate', () => {
  it('parses feed-1 section headers', () => {
    expect(parseIncidentDate('January 8, 2026')).toBe('2026-01-08');
    expect(parseIncidentDate('September 30 2026')).toBe('2026-09-30');
    expect(parseIncidentDate('Sep 3, 2026')).toBe('2026-09-03');
  });

  it('reads DD/MM/YY as day first', () => {
    expect(parseIncidentDate('07/01/26')).toBe('2026-01-07');
    expect(parseIncidentDate('31/12/99')).toBe('1999-12-31');
    expect(parseIncidentDate('07/01/2026')).toBe('2026-01-07');
  });

  it('parses ISO dates and converts timestamps to their UTC day', () => {
    expect(parseIncidentDate('2026-09-20')).toBe('2026-09-20');
    expect(parseIncidentDate('2026-09-20T23:30:00-02:00')).toBe('2026-09-21');
    expect(parseIncidentDate('2026-09-20T10:00:00Z')).toBe('2026-09-20');
  });

  it('returns null instead of today for unparseable or impossible dates', () => {
    expect(parseIncidentDate('yesterday')).toBeNull();
    expect(parseIncidentDate('')).toBeNull();
    expect(parseIncidentDate('February 31, 2026')).toBeNull();
    expect(parseIncidentDate('31/02/26')).toBeNull();
    expect(parseIncidentDate('2026-13-01')).toBeNull();
    expect(parseIncidentDate('Smarch 3, 2026')).toBeNull();
  });
});

describe('formatUsd', () => {
  it('formats full-dollar amounts compactly', () => {
    expect(formatUsd(3_800_000)).toBe('$3.8M');
    expect(formatUsd(500)).toBe('$500');
    expect(formatUsd(1_200_000_000)).toBe('$1.2B');
    expect(formatUsd(null)).toBeNull();
  });
});

describe('web3 incident sources', () => {
  const markdown = [
    'The protocol was drained ([tweet](https://x.com/zachxbt/status/1?utm_source=feed)).',
    '[Etherscan tx](https://etherscan.io/tx/0xabc)',
    '[archive](https://web.archive.org/web/1/https://example.com)',
    '[(attribution)](https://www.web3isgoinggreat.com/single/x)',
  ].join('\n');

  it('extracts cited links without archives, attribution or tracking parameters', () => {
    expect(extractSources(markdown)).toEqual([
      { url: 'https://x.com/zachxbt/status/1', label: '@zachxbt' },
      { url: 'https://etherscan.io/tx/0xabc', label: 'Etherscan' },
    ]);
  });

  it('attributes the parsed loss to the first link only', () => {
    expect(web3IncidentSources(extractSources(markdown), 3_800_000)).toEqual([
      { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/1', label: '@zachxbt', amount_usd: 3_800_000 },
      { provider: 'web3-incidents', url: 'https://etherscan.io/tx/0xabc', label: 'Etherscan', amount_usd: null },
    ]);
    expect(web3IncidentSources([], 3_800_000)).toEqual([]);
  });
});
