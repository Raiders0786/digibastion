import { describe, expect, it } from 'vitest';
import {
  OPTIN_TTL_MS,
  RESUBSCRIBE_RATE_LIMIT,
  WEEKLY_SEND_DAY,
  columnsFromOptinPending,
  describeChannels,
  isOptinTokenUsable,
  mergeStoredPreferences,
  optinConfirmUrl,
  parseSignupConsentSource,
  planSubscribeRequest,
  renderNextStepsHtml,
  renderNextStepsText,
  renderResubscribeEmail,
  resubscribeConfirmedColumns,
  subscriptionColumns,
} from './subscription-optin.ts';
import { parseSubscriptionPreferences, type SubscriptionPreferences } from './subscription-preferences.ts';

function prefs(input: Record<string, unknown>): SubscriptionPreferences {
  const result = parseSubscriptionPreferences({ categories: ['web3-security'], ...input });
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('planSubscribeRequest', () => {
  it('sends nothing to a suppressed address, whatever the row says', () => {
    expect(planSubscribeRequest({ existing: null, suppressed: true })).toBe('suppressed');
    expect(planSubscribeRequest({ existing: { is_verified: true, is_active: false }, suppressed: true })).toBe('suppressed');
  });

  it('creates a row for a new address', () => {
    expect(planSubscribeRequest({ existing: null, suppressed: false })).toBe('create');
  });

  it('re-sends verification to a pending address', () => {
    expect(planSubscribeRequest({ existing: { is_verified: false, is_active: true }, suppressed: false })).toBe('verify-pending');
  });

  it('starts an opt-in for a verified, inactive address', () => {
    expect(planSubscribeRequest({ existing: { is_verified: true, is_active: false }, suppressed: false })).toBe('resubscribe');
  });

  it('keeps the already-subscribed path for an active address', () => {
    expect(planSubscribeRequest({ existing: { is_verified: true, is_active: true }, suppressed: false })).toBe('already-active');
  });
});

describe('parseSignupConsentSource', () => {
  it('accepts the two public sources and defaults a legacy payload to the form', () => {
    expect(parseSignupConsentSource('threat-intel-form')).toBe('threat-intel-form');
    expect(parseSignupConsentSource('quick-subscribe')).toBe('quick-subscribe');
    expect(parseSignupConsentSource(undefined)).toBe('threat-intel-form');
  });

  it('rejects sources a public signup may not claim', () => {
    expect(parseSignupConsentSource('resubscribe')).toBeNull();
    expect(parseSignupConsentSource('legacy')).toBeNull();
    expect(parseSignupConsentSource('manage')).toBeNull();
    expect(parseSignupConsentSource(7)).toBeNull();
  });
});

describe('subscriptionColumns', () => {
  it('adds Monday as the legacy weekly day to the preference columns', () => {
    const columns = subscriptionColumns(prefs({ wants_daily: true, wants_weekly: true, chains: ['Ethereum'] }));
    expect(WEEKLY_SEND_DAY).toBe(1);
    expect(columns).toMatchObject({
      wants_realtime: false,
      wants_daily: true,
      wants_weekly: true,
      frequency: 'daily',
      chains: ['ethereum'],
      preferred_day: 1,
    });
    expect(columns).not.toHaveProperty('is_active');
  });
});

describe('opt-in pending preferences', () => {
  it('round-trips stored pending columns into update columns', () => {
    const pending = subscriptionColumns(prefs({ wants_realtime: true, include_preliminary: false, timezone: 'Asia/Kolkata' }));
    const json = JSON.parse(JSON.stringify(pending));
    expect(columnsFromOptinPending(json)).toEqual(pending);
  });

  it('returns null for missing or tampered pending data', () => {
    expect(columnsFromOptinPending(null)).toBeNull();
    expect(columnsFromOptinPending({ categories: ['web3-security'], wants_realtime: false, wants_daily: false, wants_weekly: false })).toBeNull();
    expect(columnsFromOptinPending({ categories: ['not-a-category'], wants_daily: true })).toBeNull();
  });

  it('builds the confirmation update: active, consented, opt-in cleared, management token untouched', () => {
    const now = new Date('2026-10-11T10:00:00Z');
    const pending = subscriptionColumns(prefs({ wants_weekly: true }));
    const update = resubscribeConfirmedColumns(pending, now, 'a'.repeat(64));
    expect(update).toMatchObject({
      ...pending,
      is_active: true,
      unsubscribed_at: null,
      consented_at: now.toISOString(),
      consent_source: 'resubscribe',
      consent_ip_hash: 'a'.repeat(64),
      optin_token: null,
      optin_token_expires_at: null,
      optin_pending: null,
      updated_at: now.toISOString(),
    });
    expect(update).not.toHaveProperty('verification_token');
    expect(resubscribeConfirmedColumns(pending, now, null)).not.toHaveProperty('consent_ip_hash');
  });
});

describe('isOptinTokenUsable', () => {
  const now = new Date('2026-10-11T10:00:00Z');
  it('accepts an unexpired token and rejects expired or missing expiry', () => {
    expect(isOptinTokenUsable({ optin_token_expires_at: '2026-10-11T10:00:01Z' }, now)).toBe(true);
    expect(isOptinTokenUsable({ optin_token_expires_at: '2026-10-11T10:00:00Z' }, now)).toBe(false);
    expect(isOptinTokenUsable({ optin_token_expires_at: null }, now)).toBe(false);
    expect(isOptinTokenUsable({ optin_token_expires_at: 'not a date' }, now)).toBe(false);
  });

  it('gives a 24-hour window', () => {
    expect(OPTIN_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });
});

describe('mergeStoredPreferences', () => {
  const stored = {
    content_scope: 'web3-incidents',
    include_preliminary: false,
    chains: ['ethereum'],
    timezone: 'Europe/Berlin',
    timezone_offset: 2,
    preferred_hour: 7,
  };

  it('keeps stored scope, preliminary, chains, timezone and hour when a legacy payload omits them', () => {
    const result = parseSubscriptionPreferences(mergeStoredPreferences({ categories: ['web3-security'], frequency: 'weekly' }, stored));
    expect(result.ok && result.value).toMatchObject({
      content_scope: 'web3-incidents',
      include_preliminary: false,
      chains: ['ethereum'],
      timezone: 'Europe/Berlin',
      timezone_offset: 2,
      preferred_hour: 7,
      channels: { realtime: false, daily: false, weekly: true },
    });
  });

  it('lets the payload override and clear stored values', () => {
    const merged = mergeStoredPreferences(
      { categories: ['web3-security'], wants_daily: true, content_scope: 'all', chains: [], timezone: null, include_preliminary: true },
      stored,
    );
    expect(merged).toMatchObject({ content_scope: 'all', chains: [], timezone: null, include_preliminary: true });
  });

  it('ignores stored nulls so parsing applies its defaults', () => {
    const merged = mergeStoredPreferences({ categories: ['web3-security'], wants_daily: true }, { content_scope: null, chains: null });
    expect(merged).not.toHaveProperty('content_scope');
    expect(merged).not.toHaveProperty('chains');
  });

  it('returns the payload unchanged when it is not an object', () => {
    expect(mergeStoredPreferences(null, stored)).toBeNull();
  });
});

describe('describeChannels', () => {
  it('names each chosen email type in a fixed order', () => {
    expect(describeChannels({ realtime: true, daily: false, weekly: true })).toEqual(['Real-time alerts', 'Weekly deep-dive (Mondays)']);
    expect(describeChannels({ realtime: false, daily: true, weekly: false })).toEqual(['Daily brief']);
  });
});

describe('resubscribe email', () => {
  it('links to verify-email with the encoded token', () => {
    expect(optinConfirmUrl('abc-123')).toBe('https://www.digibastion.com/verify-email?token=abc-123');
    expect(optinConfirmUrl('a b')).toBe('https://www.digibastion.com/verify-email?token=a%20b');
  });

  it('rate limits at three requests an hour per address', () => {
    expect(RESUBSCRIBE_RATE_LIMIT).toEqual({ scope: 'subscription:resubscribe:email', maxAttempts: 3, windowSeconds: 3600 });
  });

  it('renders a factual confirmation email with the chosen channels and escaped content', () => {
    const email = renderResubscribeEmail({
      name: '<b>Ann</b>',
      channels: { realtime: true, daily: true, weekly: false },
      categories: ['defi-exploits'],
      confirmUrl: 'https://www.digibastion.com/verify-email?token=t&x=1',
    });
    expect(email.subject).toBe('Confirm you want Digibastion emails again');
    expect(`${email.html}${email.text}`).not.toContain('DigiBastion');
    expect(`${email.html}${email.text}`).not.toMatch(/https:\/\/digibastion\.com/);
    expect(email.html).toContain('&lt;b&gt;Ann&lt;/b&gt;');
    expect(email.html).not.toContain('<b>Ann</b>');
    expect(email.html).toContain('https://www.digibastion.com/verify-email?token=t&amp;x=1');
    expect(email.html).toContain('Real-time alerts');
    expect(email.html).toContain('Daily brief');
    expect(email.html).toContain('Defi Exploits');
    expect(email.text).toContain('https://www.digibastion.com/verify-email?token=t&x=1');
    expect(email.text).toContain('Nothing changes unless you confirm');
    // No emoji or hype in the subject.
    expect(email.subject).not.toMatch(/[\u{1F300}-\u{1FAFF}]|urgent|immediate/iu);
  });
});

describe('next steps after subscribing', () => {
  const weekly = 'https://www.digibastion.com/threat-intel/weekly?utm_source=email&utm_medium=email&utm_campaign=subscribe_confirm&utm_content=weekly';

  it('points to the Telegram channel and the weekly reports with subscribe_confirm tags', () => {
    const html = renderNextStepsHtml('While you wait');
    expect(html).toContain('While you wait');
    expect(html).toContain('href="https://t.me/digibastion"');
    expect(html).toContain('@digibastion');
    expect(html).toContain(`href="${weekly.replace(/&/g, '&amp;')}"`);
    const text = renderNextStepsText('While you wait');
    expect(text).toContain('https://t.me/digibastion');
    expect(text).toContain(weekly);
  });

  it('never tags the Telegram link or carries personal data in the tags', () => {
    const html = renderNextStepsHtml('More from Digibastion', 'https://www.digibastion.com/');
    expect(html).not.toMatch(/t\.me\/digibastion\?/);
    expect(html).not.toMatch(/utm_[a-z]+=[^&"]*(@|token)/);
  });
});
