import { describe, expect, it } from 'vitest';
import {
  CONSENT_SOURCES,
  MAX_SUBSCRIPTION_CHAINS,
  channelsFromFrequency,
  frequencyFromChannels,
  isValidTimeZone,
  normalizeChain,
  parseSubscriptionPreferences,
  preferencesToColumns,
  readDeliveryChannels,
  type SubscriptionPreferences,
} from './subscription-preferences.ts';

const base = { categories: ['web3-security'] };

function parsed(input: Record<string, unknown>): SubscriptionPreferences {
  const result = parseSubscriptionPreferences(input);
  if (!result.ok) throw new Error(`expected ok, got ${result.error}`);
  return result.value;
}

function parseError(input: unknown): string {
  const result = parseSubscriptionPreferences(input);
  if (result.ok) throw new Error('expected an error');
  return result.error;
}

describe('channels and frequency', () => {
  it('maps every legacy frequency to one channel and back', () => {
    for (const frequency of ['immediate', 'daily', 'weekly'] as const) {
      const channels = channelsFromFrequency(frequency);
      expect(Object.values(channels).filter(Boolean)).toHaveLength(1);
      expect(frequencyFromChannels(channels)).toBe(frequency);
    }
    expect(channelsFromFrequency('immediate')).toEqual({ realtime: true, daily: false, weekly: false });
    expect(channelsFromFrequency('monthly')).toEqual({ realtime: false, daily: false, weekly: false });
    expect(channelsFromFrequency(undefined)).toEqual({ realtime: false, daily: false, weekly: false });
  });

  it('uses the trigger priority: immediate, then daily, then weekly', () => {
    expect(frequencyFromChannels({ realtime: true, daily: true, weekly: true })).toBe('immediate');
    expect(frequencyFromChannels({ realtime: false, daily: true, weekly: true })).toBe('daily');
    expect(frequencyFromChannels({ realtime: false, daily: false, weekly: true })).toBe('weekly');
    expect(frequencyFromChannels({ realtime: false, daily: false, weekly: false })).toBeNull();
  });

  it('reads the wants_* columns when present and falls back to frequency for old rows', () => {
    expect(readDeliveryChannels({ wants_realtime: true, wants_daily: false, wants_weekly: true, frequency: 'immediate' }))
      .toEqual({ realtime: true, daily: false, weekly: true });
    expect(readDeliveryChannels({ frequency: 'weekly' })).toEqual({ realtime: false, daily: false, weekly: true });
    // After the migration an all-false row means no email type, never a resurrected legacy one.
    expect(readDeliveryChannels({ wants_realtime: false, wants_daily: false, wants_weekly: false, frequency: 'daily' }))
      .toEqual({ realtime: false, daily: false, weekly: false });
  });
});

describe('field helpers', () => {
  it('validates IANA time zones', () => {
    expect(isValidTimeZone('Asia/Kolkata')).toBe(true);
    expect(isValidTimeZone('America/Argentina/Buenos_Aires')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Mars/Base')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
    expect(isValidTimeZone(42)).toBe(false);
    expect(isValidTimeZone(`Europe/${'x'.repeat(70)}`)).toBe(false);
  });

  it('normalizes chains like the page facet filter', () => {
    expect(normalizeChain('  Ethereum ')).toBe('ethereum');
    expect(normalizeChain('BNB Chain')).toBe('bnb chain');
    expect(normalizeChain('eth%')).toBeNull();
    expect(normalizeChain('')).toBeNull();
    expect(normalizeChain(7)).toBeNull();
    expect(normalizeChain('a'.repeat(65))).toBeNull();
  });

  it('lists the consent sources the database accepts', () => {
    expect(CONSENT_SOURCES).toEqual(['threat-intel-form', 'quick-subscribe', 'manage', 'resubscribe', 'legacy']);
    expect(MAX_SUBSCRIPTION_CHAINS).toBe(10);
  });
});

describe('parseSubscriptionPreferences', () => {
  it('accepts the new payload', () => {
    const value = parsed({
      ...base,
      technologies: ['solidity'],
      content_scope: 'web3-incidents',
      severity_threshold: 'high',
      wants_realtime: false,
      wants_daily: true,
      wants_weekly: true,
      include_preliminary: false,
      chains: ['Ethereum', 'ethereum', ' Solana '],
      timezone: 'Asia/Kolkata',
      timezone_offset: 5.5,
      preferred_hour: 9,
    });
    expect(value).toEqual({
      categories: ['web3-security'],
      technologies: ['solidity'],
      content_scope: 'web3-incidents',
      severity_threshold: 'high',
      channels: { realtime: false, daily: true, weekly: true },
      include_preliminary: false,
      chains: ['ethereum', 'solana'],
      timezone: 'Asia/Kolkata',
      timezone_offset: 5.5,
      preferred_hour: 9,
    });
  });

  it('accepts the legacy payload with frequency and severity', () => {
    const value = parsed({ ...base, frequency: 'immediate', severity: 'critical', preferred_day: 3 });
    expect(value.channels).toEqual({ realtime: true, daily: false, weekly: false });
    expect(value.severity_threshold).toBe('critical');
    expect(value.include_preliminary).toBe(true);
    expect(value.chains).toEqual([]);
    expect(value.timezone).toBeNull();
    expect(value.timezone_offset).toBe(0);
    expect(value.preferred_hour).toBe(9);
    expect(value.content_scope).toBe('all');
  });

  it('defaults a legacy payload without frequency to the daily brief, as the old endpoints did', () => {
    expect(parsed({ ...base }).channels).toEqual({ realtime: false, daily: true, weekly: false });
  });

  it('rejects zero channels', () => {
    expect(parseError({ ...base, wants_realtime: false, wants_daily: false, wants_weekly: false }))
      .toBe('Choose at least one email type');
  });

  it('rejects more than ten chains', () => {
    const chains = Array.from({ length: 11 }, (_, index) => `chain${index}`);
    expect(parseError({ ...base, wants_daily: true, chains })).toMatch(/chain/i);
  });

  it('rejects an invalid chain value', () => {
    expect(parseError({ ...base, wants_daily: true, chains: ['eth%'] })).toMatch(/chain/i);
  });

  it('rejects an unknown time zone', () => {
    expect(parseError({ ...base, wants_daily: true, timezone: 'Mars/Base' })).toBe('Invalid time zone');
  });

  it('rejects a non-boolean include_preliminary', () => {
    expect(parseError({ ...base, wants_daily: true, include_preliminary: 'no' })).toMatch(/preliminary/i);
  });

  it('rejects a non-boolean channel flag', () => {
    expect(parseError({ ...base, wants_daily: 'yes' })).toBe('Invalid email type selection');
  });

  it('reuses the existing error strings', () => {
    expect(parseError(null)).toBe('Invalid request');
    expect(parseError({ categories: [] })).toBe('At least one category is required');
    expect(parseError({ categories: ['made-up'] })).toBe('Invalid security category');
    expect(parseError({ ...base, technologies: ['x'.repeat(51)] })).toBe('Invalid technology preference');
    expect(parseError({ ...base, frequency: 'monthly' })).toBe('Invalid frequency value');
    expect(parseError({ ...base, severity_threshold: 'severe' })).toBe('Invalid severity value');
    expect(parseError({ ...base, content_scope: 'web2' })).toBe('Invalid content scope');
    expect(parseError({ ...base, preferred_hour: 24 })).toBe('Invalid delivery schedule');
    expect(parseError({ ...base, preferred_hour: 9.5 })).toBe('Invalid delivery schedule');
    expect(parseError({ ...base, timezone_offset: 5.3 })).toBe('Invalid delivery schedule');
  });

  it('treats an empty time zone as missing and keeps the offset as the fallback', () => {
    const value = parsed({ ...base, wants_weekly: true, timezone: '', timezone_offset: -4 });
    expect(value.timezone).toBeNull();
    expect(value.timezone_offset).toBe(-4);
  });
});

describe('preferencesToColumns', () => {
  it('writes channels and a frequency consistent with the trigger priority', () => {
    const value = parsed({ ...base, wants_daily: true, wants_weekly: true, chains: ['Base'], timezone: 'Europe/Berlin' });
    expect(preferencesToColumns(value)).toEqual({
      categories: ['web3-security'],
      technologies: [],
      content_scope: 'all',
      severity_threshold: 'medium',
      wants_realtime: false,
      wants_daily: true,
      wants_weekly: true,
      frequency: 'daily',
      include_preliminary: true,
      chains: ['base'],
      timezone: 'Europe/Berlin',
      timezone_offset: 0,
      preferred_hour: 9,
    });
    expect(preferencesToColumns(parsed({ ...base, wants_realtime: true, wants_weekly: true })).frequency).toBe('immediate');
    expect(preferencesToColumns(parsed({ ...base, wants_weekly: true })).frequency).toBe('weekly');
  });
});
