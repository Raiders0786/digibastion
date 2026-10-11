import { describe, expect, it } from 'vitest';
import {
  absoluteSiteUrl, canonicalIncidentUrl, canonicalWeeklyUrl, canonicalizeUrl,
  FEED_URLS, incidentPath, trimTrailingSlashes, weeklyPath,
} from './site-urls';

describe('site-urls', () => {
  it('builds incident and weekly paths', () => {
    expect(incidentPath('a/b')).toBe('/threat-intel/a%2Fb');
    expect(weeklyPath('2026-10-05')).toBe('/threat-intel/weekly/2026-10-05');
    expect(() => weeklyPath('2026-10-5')).toThrow();
  });
  it('joins site and path once', () => {
    expect(trimTrailingSlashes('https://x.test///')).toBe('https://x.test');
    expect(absoluteSiteUrl('tools', 'https://x.test/')).toBe('https://x.test/tools');
    expect(canonicalIncidentUrl('abc')).toBe('https://www.digibastion.com/threat-intel/abc');
    expect(canonicalWeeklyUrl('2026-10-05')).toBe('https://www.digibastion.com/threat-intel/weekly/2026-10-05');
  });
  it('canonicalizes: strips query, fragment and trailing slash', () => {
    expect(canonicalizeUrl('https://www.digibastion.com/threat-intel/abc?utm_source=telegram&utm_medium=social#top'))
      .toBe('https://www.digibastion.com/threat-intel/abc');
    expect(canonicalizeUrl('/articles/x/')).toBe('https://www.digibastion.com/articles/x');
    expect(canonicalizeUrl('https://www.digibastion.com')).toBe('https://www.digibastion.com/');
    expect(canonicalizeUrl('https://www.digibastion.com/?ref=x')).toBe('https://www.digibastion.com/');
    expect(canonicalizeUrl('https://www.digibastion.com#top')).toBe('https://www.digibastion.com/');
  });
  it('refuses other hosts, including look-alikes and the apex', () => {
    expect(canonicalizeUrl('https://digibastion.com/tools')).toBeNull();
    expect(canonicalizeUrl('https://www.digibastion.com.evil.test/tools')).toBeNull();
    expect(canonicalizeUrl('https://www.digibastion.com@evil.test/tools')).toBeNull();
    expect(canonicalizeUrl('https://www.quillaudits.com/web3-hacks-database')).toBeNull();
    expect(canonicalizeUrl('//evil.test/x')).toBeNull();
  });
  it('lists the three feed URLs on the functions host', () => {
    expect(FEED_URLS.rss).toBe('https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=rss');
    expect(FEED_URLS.atom).toContain('format=atom');
    expect(FEED_URLS.json).toContain('format=json');
  });
});
