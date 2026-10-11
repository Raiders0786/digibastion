import { describe, expect, it } from 'vitest';
import {
  buildTrackedUrl,
  incidentOgImageUrl,
  shareTargets,
  shareTextForIncident,
  shareTextForWeekly,
  sourceCredit,
  stripTracking,
  trackEmailLink,
  weeklyOgImageUrl,
} from './share-links';
import { weeklyPublicContent } from './weekly-test-fixtures';

const tg = { source: 'telegram', medium: 'social', campaign: 'incident_alerts' } as const;

describe('buildTrackedUrl', () => {
  it('keeps the existing Telegram string byte for byte', () => {
    expect(buildTrackedUrl('/threat-intel/abc', tg))
      .toBe('https://www.digibastion.com/threat-intel/abc?utm_source=telegram&utm_medium=social&utm_campaign=incident_alerts');
  });
  it('only tags our own host', () => {
    expect(buildTrackedUrl('https://www.quillaudits.com/web3-hacks-database', tg)).toBe('https://www.quillaudits.com/web3-hacks-database');
    expect(buildTrackedUrl('https://revoke.cash', tg)).toBe('https://revoke.cash');
    expect(buildTrackedUrl('https://www.digibastion.com.evil.test/a', tg)).toBe('https://www.digibastion.com.evil.test/a');
    expect(buildTrackedUrl('//evil.test/a', tg)).toBe('//evil.test/a');
  });
  it('refuses token and account paths', () => {
    expect(buildTrackedUrl('/verify-email?token=abc', tg)).toBe('https://www.digibastion.com/verify-email?token=abc');
    expect(buildTrackedUrl('/manage-subscription', tg)).toBe('https://www.digibastion.com/manage-subscription');
    expect(buildTrackedUrl('/unsubscribe/x', tg)).toBe('https://www.digibastion.com/unsubscribe/x');
    expect(buildTrackedUrl('/threat-intel?token=x', tg)).toBe('https://www.digibastion.com/threat-intel?token=x');
  });
  it('keeps other params and the hash, and replaces old tags', () => {
    expect(buildTrackedUrl('https://www.digibastion.com/threat-intel?scope=web3-incidents&utm_source=x#top', { ...tg, content: 'retraction' }))
      .toBe('https://www.digibastion.com/threat-intel?scope=web3-incidents&utm_source=telegram&utm_medium=social&utm_campaign=incident_alerts&utm_content=retraction#top');
  });
  it('handles a trailing-slash site URL', () => {
    expect(buildTrackedUrl('/a', tg, 'https://www.digibastion.com/')).toMatch(/^https:\/\/www\.digibastion\.com\/a\?/);
  });
  it('tags URLs on a custom site URL, such as a preview host', () => {
    expect(buildTrackedUrl('https://preview.example/threat-intel', tg, 'https://preview.example'))
      .toBe('https://preview.example/threat-intel?utm_source=telegram&utm_medium=social&utm_campaign=incident_alerts');
  });
  it('returns the URL untouched with no tracking', () => {
    expect(buildTrackedUrl('/threat-intel/abc')).toBe('https://www.digibastion.com/threat-intel/abc');
  });
  it('encodes the content value', () => {
    expect(buildTrackedUrl('/a', { ...tg, content: 'a b&c' })).toContain('utm_content=a%20b%26c');
  });
});

describe('stripTracking', () => {
  it('drops utm_* and keeps the rest', () => {
    expect(stripTracking('https://www.digibastion.com/threat-intel?utm_source=telegram&scope=all#x')).toBe('https://www.digibastion.com/threat-intel?scope=all#x');
    expect(stripTracking('https://www.digibastion.com/a?utm_source=t')).toBe('https://www.digibastion.com/a');
    expect(stripTracking('https://www.digibastion.com/a')).toBe('https://www.digibastion.com/a');
  });
});

describe('shareTargets', () => {
  it('encodes text with &, #, emoji and non-Latin script', () => {
    const t = shareTargets({ url: 'https://www.digibastion.com/threat-intel/a?utm_source=x', text: 'A & B #1 🚨 攻撃', via: 'digibastion' });
    expect(t.x).toBe('https://x.com/intent/post?text=A%20%26%20B%20%231%20%F0%9F%9A%A8%20%E6%94%BB%E6%92%83&url=https%3A%2F%2Fwww.digibastion.com%2Fthreat-intel%2Fa%3Futm_source%3Dx&via=digibastion');
    expect(t.telegram.startsWith('https://t.me/share/url?url=')).toBe(true);
    expect(t.linkedin).toBe('https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fwww.digibastion.com%2Fthreat-intel%2Fa%3Futm_source%3Dx');
    expect(t.reddit).toContain('https://www.reddit.com/submit?url=');
    expect(t.bluesky).toContain('https://bsky.app/intent/compose?text=');
  });
  it('omits via when there is no handle', () => {
    expect(shareTargets({ url: 'https://www.digibastion.com/', text: 't', via: null }).x).not.toContain('via=');
  });
});

describe('shareTextForIncident', () => {
  const base = { title: 'Bridge exploit', projectName: 'Example Protocol', chain: 'Ethereum', attackType: 'Bridge exploit', amountUsd: 4_200_000, amountDisplay: '$4.2M', incidentDate: null, fundsReturned: null, sourceName: 'QuillMonitor', providers: ['quillmonitor'], status: 'confirmed' as const };
  it('confirmed', () => expect(shareTextForIncident(base)).toBe('Example Protocol bridge exploit on Ethereum: ~$4.2M reported lost. Confirmed by QuillMonitor.'));
  it('unconfirmed', () => expect(shareTextForIncident({ ...base, status: 'unconfirmed' })).toBe('Unconfirmed: Example Protocol bridge exploit on Ethereum, ~$4.2M reported lost (per QuillMonitor).'));
  it('no status, no loss', () => expect(shareTextForIncident({ ...base, status: null, amountUsd: null, amountDisplay: null, providers: [], sourceName: 'BleepingComputer' })).toBe('Example Protocol bridge exploit on Ethereum. Source: BleepingComputer.'));
  it('stays under 200 characters', () => expect(shareTextForIncident({ ...base, projectName: 'x'.repeat(300) }).length).toBeLessThanOrEqual(200));
  it('stays under 200 characters with a long source name', () => {
    expect(shareTextForIncident({ ...base, providers: [], sourceName: 'S '.repeat(150) }).length).toBeLessThanOrEqual(200);
  });
  it('adds "attack" to attack types that do not name an event', () => {
    expect(shareTextForIncident({ ...base, attackType: 'Reentrancy' })).toContain('Example Protocol reentrancy attack on Ethereum');
  });
  it('never says verified', () => {
    for (const status of ['confirmed', 'unconfirmed', null] as const) {
      expect(shareTextForIncident({ ...base, status })).not.toMatch(/verified/i);
    }
  });
});

describe('shareTextForWeekly', () => {
  it('states the week, the reported loss and the count', () => {
    expect(shareTextForWeekly(weeklyPublicContent())).toBe('Web3 security, week of Oct 5: ~$12.3M reported lost across 9 incidents. Every item names its source.');
  });
  it('leaves the loss out when there is none', () => {
    const c = weeklyPublicContent();
    c.totals = { ...c.totals, lossUsd: 0, incidentCount: 1 };
    expect(shareTextForWeekly(c)).toBe('Web3 security, week of Oct 5: 1 incident. Every item names its source.');
  });
  it('handles a quiet week', () => {
    const c = weeklyPublicContent();
    c.totals = { ...c.totals, lossUsd: 0, incidentCount: 0 };
    expect(shareTextForWeekly(c)).toBe('Web3 security, week of Oct 5: no incidents recorded.');
  });
});

it('builds og-image URLs on the functions host', () => {
  expect(incidentOgImageUrl('a/b')).toBe('https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/og-image?kind=incident&id=a%2Fb');
  expect(weeklyOgImageUrl('2026-10-05')).toBe('https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/og-image?kind=weekly&week=2026-10-05');
});

describe('trackEmailLink', () => {
  it('tags our pages for an email campaign and leaves other hosts alone', () => {
    expect(trackEmailLink('https://www.digibastion.com/threat-intel/a', 'daily_brief', 'title'))
      .toBe('https://www.digibastion.com/threat-intel/a?utm_source=email&utm_medium=email&utm_campaign=daily_brief&utm_content=title');
    expect(trackEmailLink('https://revoke.cash', 'daily_brief', 'action')).toBe('https://revoke.cash');
  });
});

describe('sourceCredit', () => {
  const incidentUrl = 'https://www.digibastion.com/threat-intel/a';
  it('names and links the source and flags QuillMonitor-only items', () => {
    expect(sourceCredit({ providers: ['quillmonitor'], sourceName: 'QuillMonitor', sourceUrl: 'https://x.com/a/status/1', incidentUrl }))
      .toEqual({ label: 'QuillMonitor', url: 'https://x.com/a/status/1', poweredByQuillMonitor: true });
  });
  it('does not flag a merged two-source item', () => {
    expect(sourceCredit({ providers: ['quillmonitor', 'web3-incidents'], sourceName: null, sourceUrl: null, incidentUrl }).poweredByQuillMonitor).toBe(false);
  });
  it('never links our own page as the source', () => {
    expect(sourceCredit({ providers: [], sourceName: 'The Hacker News', sourceUrl: incidentUrl, incidentUrl }))
      .toEqual({ label: 'The Hacker News', url: null, poweredByQuillMonitor: false });
    expect(sourceCredit({ providers: [], sourceName: 'Digibastion Intelligence', sourceUrl: null, incidentUrl }).label).toBe('Source not given');
  });
});
