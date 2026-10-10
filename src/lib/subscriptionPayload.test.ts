import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SUBSCRIPTION_FORM_STATE,
  buildSubscriptionPayload,
  describeFormChannels,
  hasDeliveryChannel,
  initialStateFromView,
  stateFromSubscription,
  type SubscriptionFormState,
} from '@/lib/subscriptionPayload';
import { getBrowserTimeZone } from '@/lib/digestSchedule';

const state: SubscriptionFormState = {
  ...DEFAULT_SUBSCRIPTION_FORM_STATE,
  categories: ['defi-exploits'],
  technologies: ['ethereum'],
  scope: 'web3-incidents',
  severity: 'high',
  realtime: true,
  daily: false,
  weekly: true,
  includePreliminary: false,
  chains: ['ethereum', 'base'],
  preferredHour: 8,
  timezone: 'Asia/Kolkata',
  timezoneOffset: 5.5,
};

describe('buildSubscriptionPayload', () => {
  it('sends the three channel booleans and no frequency or weekday', () => {
    const payload = buildSubscriptionPayload(state, 'threat-intel-form');
    expect(payload).toMatchObject({
      categories: ['defi-exploits'],
      technologies: ['ethereum'],
      content_scope: 'web3-incidents',
      severity_threshold: 'high',
      wants_realtime: true,
      wants_daily: false,
      wants_weekly: true,
      include_preliminary: false,
      chains: ['ethereum', 'base'],
      timezone: 'Asia/Kolkata',
      timezone_offset: 5.5,
      preferred_hour: 8,
      consent_source: 'threat-intel-form',
    });
    expect(payload).not.toHaveProperty('frequency');
    expect(payload).not.toHaveProperty('preferred_day');
  });

  it('drops chains outside the Web3 incidents scope, where they do not apply', () => {
    expect(buildSubscriptionPayload({ ...state, scope: 'all' }, 'quick-subscribe').chains).toEqual([]);
  });

  it('leaves consent_source out of a manage-page update', () => {
    expect(buildSubscriptionPayload(state, 'manage')).not.toHaveProperty('consent_source');
  });

  it('sends a null timezone when none was detected', () => {
    expect(buildSubscriptionPayload({ ...state, timezone: null }, 'quick-subscribe').timezone).toBeNull();
  });
});

describe('hasDeliveryChannel', () => {
  it('requires at least one email type', () => {
    expect(hasDeliveryChannel({ realtime: false, daily: false, weekly: false })).toBe(false);
    expect(hasDeliveryChannel({ realtime: false, daily: false, weekly: true })).toBe(true);
  });

  it('names the chosen types in a fixed order', () => {
    expect(describeFormChannels({ realtime: true, daily: false, weekly: true })).toEqual(['Real-time alerts', 'Weekly deep-dive']);
  });
});

describe('initialStateFromView', () => {
  it('turns unconfirmed reports off for the confirmed view', () => {
    expect(initialStateFromView({ verification: 'confirmed' })).toMatchObject({ includePreliminary: false });
    expect(initialStateFromView({ verification: 'unconfirmed' })).toMatchObject({ includePreliminary: true });
    expect(initialStateFromView({ verification: 'all' })).not.toHaveProperty('includePreliminary');
  });

  it('carries scope, categories and normalized, de-duplicated chains', () => {
    expect(initialStateFromView({
      scope: 'web3-incidents',
      categories: ['defi-exploits'],
      chains: [' Ethereum ', 'ethereum', 'Base', 'bad%value'],
    })).toEqual({ scope: 'web3-incidents', categories: ['defi-exploits'], chains: ['ethereum', 'base'] });
  });

  it('caps chains at ten', () => {
    const chains = Array.from({ length: 12 }, (_, index) => `chain${index}`);
    expect(initialStateFromView({ chains }).chains).toHaveLength(10);
  });

  it('pre-checks only the weekly box when opened from the weekly page', () => {
    expect(initialStateFromView({ weekly: true })).toMatchObject({ weekly: true, daily: false, realtime: false });
    expect(initialStateFromView({})).toEqual({});
  });
});

describe('stateFromSubscription', () => {
  it('reads the channel columns when they exist', () => {
    expect(stateFromSubscription({
      categories: ['defi-exploits', 'not-a-category'],
      content_scope: 'web3-incidents',
      wants_realtime: false,
      wants_daily: true,
      wants_weekly: true,
      frequency: 'daily',
      include_preliminary: false,
      chains: ['ethereum'],
      timezone: 'Europe/Berlin',
      timezone_offset: 1,
      preferred_hour: 7,
      severity_threshold: 'critical',
    })).toMatchObject({
      categories: ['defi-exploits'],
      scope: 'web3-incidents',
      realtime: false,
      daily: true,
      weekly: true,
      includePreliminary: false,
      chains: ['ethereum'],
      timezone: 'Europe/Berlin',
      timezoneOffset: 1,
      preferredHour: 7,
      severity: 'critical',
    });
  });

  it('falls back to the legacy frequency and defaults', () => {
    expect(stateFromSubscription({ frequency: 'immediate' })).toMatchObject({
      realtime: true,
      daily: false,
      weekly: false,
      includePreliminary: true,
      chains: [],
      scope: 'all',
      severity: 'medium',
      preferredHour: 9,
    });
  });
});

describe('getBrowserTimeZone', () => {
  it('returns an IANA name the API accepts, or null', () => {
    const zone = getBrowserTimeZone();
    expect(zone === null || /^[A-Za-z]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(zone)).toBe(true);
  });
});
