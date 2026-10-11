import { describe, expect, it } from 'vitest';
import { attackPhrase, buildIncidentAnswer, displayChain, formatAnswerDate, stripZeroLossSuffix, type AnswerInput } from './incident-answer';

const base: AnswerInput = {
  title: 'HOT Omni Bridge exploit', projectName: 'HOT Omni Bridge', chain: 'NEAR', attackType: 'Bridge exploit',
  amountUsd: 3_860_000, amountDisplay: '$3.86M', incidentDate: '2026-09-30', fundsReturned: true,
  sourceName: 'QuillMonitor', providers: ['quillmonitor'], status: 'confirmed',
};

describe('buildIncidentAnswer', () => {
  it('writes the full sentence', () => {
    expect(buildIncidentAnswer(base)).toBe(
      'HOT Omni Bridge on NEAR lost about $3.86M in a bridge exploit on 30 Sep 2026, according to QuillMonitor (confirmed). The funds were later reported returned.');
  });
  it('says unconfirmed when the source does', () => {
    expect(buildIncidentAnswer({ ...base, status: 'unconfirmed', fundsReturned: null }))
      .toBe('HOT Omni Bridge on NEAR lost about $3.86M in a bridge exploit on 30 Sep 2026, according to QuillMonitor (unconfirmed).');
  });
  it('formats the amount when only the number is known', () => {
    expect(buildIncidentAnswer({ ...base, amountDisplay: null, amountUsd: 4_200_000, fundsReturned: false }))
      .toBe('HOT Omni Bridge on NEAR lost about $4.2M in a bridge exploit on 30 Sep 2026, according to QuillMonitor (confirmed).');
  });
  it('handles a missing amount, chain, date and status', () => {
    expect(buildIncidentAnswer({ ...base, amountUsd: null, amountDisplay: null, chain: null, incidentDate: null,
      status: null, fundsReturned: null, attackType: 'Access control', providers: ['web3-incidents'], sourceName: null }))
      .toBe('HOT Omni Bridge was hit by an access control attack, according to Web3 Is Going Just Great. No loss figure has been reported.');
  });
  it('falls back to the title and a generic attack', () => {
    expect(buildIncidentAnswer({ ...base, projectName: null, attackType: null, amountUsd: null, amountDisplay: null,
      chain: null, incidentDate: null, status: null, fundsReturned: null }))
      .toBe('HOT Omni Bridge exploit was hit by a security incident, according to QuillMonitor. No loss figure has been reported.');
  });
  it('does not add "attack" after a word that already names one', () => {
    const noAmount = { ...base, amountUsd: null, amountDisplay: null, chain: null, incidentDate: null, status: null, fundsReturned: null };
    expect(buildIncidentAnswer({ ...noAmount, attackType: 'Phishing' }))
      .toBe('HOT Omni Bridge was hit by a phishing, according to QuillMonitor. No loss figure has been reported.');
    expect(buildIncidentAnswer({ ...noAmount, attackType: 'Private key compromise' }))
      .toContain('was hit by a private key compromise,');
    expect(buildIncidentAnswer({ ...base, attackType: 'Oracle manipulation' }))
      .toContain('lost about $3.86M in an oracle manipulation attack on');
  });
  it('keeps acronyms in the attack type', () => {
    expect(buildIncidentAnswer({ ...base, attackType: 'DNS hijack' })).toContain('in a DNS hijack attack');
  });
  it('treats a zero amount as no figure', () => {
    expect(buildIncidentAnswer({ ...base, amountUsd: 0, amountDisplay: null, fundsReturned: null }))
      .toContain('No loss figure has been reported.');
  });
  it('never says verified or Digibastion', () => {
    expect(buildIncidentAnswer(base)).not.toMatch(/verified|digibastion/i);
    expect(buildIncidentAnswer({ ...base, providers: [], sourceName: 'Digibastion' })).not.toMatch(/digibastion/i);
  });
  it('leaves out placeholder chains', () => {
    for (const chain of ['Other', 'other', 'Unknown', 'N/A', 'none', '-', 'Centralized', ' centralised ', '']) {
      expect(displayChain(chain)).toBeNull();
    }
    expect(displayChain(null)).toBeNull();
    expect(displayChain(' Ethereum ')).toBe('Ethereum');
    expect(buildIncidentAnswer({ ...base, projectName: 'popcornswap', chain: 'Other', attackType: 'Rug pull', fundsReturned: null }))
      .toBe('popcornswap lost about $3.86M in a rug pull on 30 Sep 2026, according to QuillMonitor (confirmed).');
    expect(buildIncidentAnswer({ ...base, projectName: 'SomeExchange', chain: 'Centralized', fundsReturned: null }))
      .toMatch(/^SomeExchange lost about/);
  });
  it('does not add "attack" after an issue, error or bug', () => {
    expect(attackPhrase('Business Logic Issue')).toBe('business logic issue');
    expect(attackPhrase('Rounding error')).toBe('rounding error');
    expect(attackPhrase('Contract bug')).toBe('contract bug');
    expect(attackPhrase('Flash loan')).toBe('flash loan attack');
    expect(buildIncidentAnswer({ ...base, attackType: 'Business Logic Issue', fundsReturned: null }))
      .toContain('lost about $3.86M in a business logic issue on 30 Sep 2026');
  });
  it('drops a "($0 loss)" suffix from importer titles', () => {
    expect(stripZeroLossSuffix('Foo Protocol: Exploit ($0 loss)')).toBe('Foo Protocol: Exploit');
    expect(stripZeroLossSuffix('Foo Protocol: Exploit ($0 Loss) ')).toBe('Foo Protocol: Exploit');
    expect(stripZeroLossSuffix('Foo ($10 loss)')).toBe('Foo ($10 loss)');
    expect(buildIncidentAnswer({ ...base, projectName: null, title: 'Foo exploit ($0 loss)', amountUsd: 0, amountDisplay: null,
      chain: null, incidentDate: null, status: null, fundsReturned: null }))
      .toBe('Foo exploit was hit by a bridge exploit, according to QuillMonitor. No loss figure has been reported.');
  });
  it('formats dates', () => {
    expect(formatAnswerDate('2026-09-30')).toBe('30 Sep 2026');
    expect(formatAnswerDate('2026-01-05')).toBe('5 Jan 2026');
    expect(formatAnswerDate('2026-13-05')).toBe('2026-13-05');
    expect(formatAnswerDate('bad')).toBe('bad');
  });
});
