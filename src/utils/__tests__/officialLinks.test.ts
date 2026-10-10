import { describe, expect, it } from 'vitest';
import { buildSubscribeHref, nvdCveUrl } from '@/lib/threatIntel/officialLinks';

describe('nvdCveUrl', () => {
  it('links straight to a well-formed CVE record', () => {
    expect(nvdCveUrl('CVE-2026-12345')).toBe('https://nvd.nist.gov/vuln/detail/CVE-2026-12345');
    expect(nvdCveUrl(' cve-2026-12345 ')).toBe('https://nvd.nist.gov/vuln/detail/CVE-2026-12345');
  });

  it('falls back to the NVD home page for anything else', () => {
    expect(nvdCveUrl('not-a-cve')).toBe('https://nvd.nist.gov');
    expect(nvdCveUrl(undefined)).toBe('https://nvd.nist.gov');
  });
});

describe('buildSubscribeHref', () => {
  it('opens the subscribe tab with the category and scope pre-selected', () => {
    expect(buildSubscribeHref({ categories: ['defi-exploits'], scope: 'web3-incidents' }))
      .toBe('/threat-intel?tab=subscribe&categories=defi-exploits&scope=web3-incidents');
    expect(buildSubscribeHref({ categories: ['web3-security', 'defi-exploits'] }))
      .toBe('/threat-intel?tab=subscribe&categories=web3-security%2Cdefi-exploits');
    expect(buildSubscribeHref()).toBe('/threat-intel?tab=subscribe');
  });
});
