import { describe, expect, it } from 'vitest';
import {
  classifyRssRelevance,
  containsSecurityTerm,
  determineRssSeverity,
} from '../../../supabase/functions/_shared/rss-classifier';

const shortSignalKeywords = [
  { keyword: 'apt', category: 'threat', weight: 3 },
  { keyword: 'tor', category: 'opsec', weight: 2 },
];

describe('RSS classifier token matching', () => {
  it('rejects short security signals embedded in ordinary words', () => {
    expect(containsSecurityTerm('adaptations', 'apt')).toBe(false);
    expect(containsSecurityTerm('participatory', 'tor')).toBe(false);
    expect(containsSecurityTerm('opportunity', 'tor')).toBe(false);
    expect(containsSecurityTerm('open source release', 'rce')).toBe(false);
    expect(containsSecurityTerm('a definitive security analysis', 'defi')).toBe(false);
    expect(containsSecurityTerm('zero daylight between releases', 'zero day')).toBe(false);
    expect(containsSecurityTerm('CVSS 90 is not a valid score', 'cvss 9')).toBe(false);
  });

  it('accepts genuine acronym tokens, punctuation, and group suffixes', () => {
    expect(containsSecurityTerm('APT-29 uses Tor-based infrastructure', 'apt')).toBe(true);
    expect(containsSecurityTerm('APT38 uses the Tor network', 'apt')).toBe(true);
    expect(containsSecurityTerm('APT38 uses the Tor network', 'tor')).toBe(true);
    expect(containsSecurityTerm('zero-day exploitation', 'zero day')).toBe(true);
  });

  it('preserves common security-word inflections', () => {
    expect(containsSecurityTerm('widespread exploitation', 'exploit')).toBe(true);
    expect(containsSecurityTerm('an exploitable service', 'exploit')).toBe(true);
    expect(containsSecurityTerm('exploitability analysis', 'exploit')).toBe(true);
    expect(containsSecurityTerm('several vulnerabilities were patched', 'vulnerability')).toBe(true);
    expect(containsSecurityTerm('several vulnerabilities were patched', 'patch')).toBe(true);
  });

  it('distinguishes the APT threat acronym from the apt package manager', () => {
    expect(containsSecurityTerm('APT-29 uses Tor-based infrastructure', 'apt')).toBe(true);
    expect(containsSecurityTerm('APT38 launched a campaign', 'apt')).toBe(true);
    expect(containsSecurityTerm('apt package manager update', 'apt')).toBe(false);
  });

  it('filters the non-security squid article instead of tagging it apt/tor', () => {
    const result = classifyRssRelevance(
      'Friday Squid Blogging: Participatory Squid Dissection in October in Tennessee',
      'Families can explore squid adaptations during an educational opportunity.',
      shortSignalKeywords,
      'general',
    );

    expect(result.relevant).toBe(false);
    expect(result.matchedKeywords).toEqual([]);
    expect(result.weight).toBe(0);
  });

  it('keeps genuine APT/Tor reporting relevant and high severity', () => {
    const title = 'APT38 uses the Tor network in a new campaign';
    const result = classifyRssRelevance(title, '', shortSignalKeywords, 'general');

    expect(result.relevant).toBe(true);
    expect(result.matchedKeywords).toEqual(['apt', 'tor']);
    expect(determineRssSeverity(result.matchedKeywords, title)).toBe('high');
  });

  it('does not raise severity for embedded acronym text', () => {
    expect(determineRssSeverity([], 'Adaptive safeguards for open source projects')).toBe('low');
  });
});
