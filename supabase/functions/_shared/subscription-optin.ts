// Subscribe, re-subscribe and opt-in decisions shared by submit-form,
// update-subscription and verify-email. Re-subscribing an inactive address
// never re-activates it directly: it stores the preferences in optin_pending,
// emails a single-use optin_token, and verify-email applies them on click.
// Pure module: no Deno or URL imports, so vitest can import it.
import { escapeHtml } from './subscription-delivery.ts';
import { renderEmailDocument } from './email-compliance.ts';
import {
  parseSubscriptionPreferences,
  preferencesToColumns,
  type ConsentSource,
  type DeliveryChannels,
  type SubscriptionPreferences,
} from './subscription-preferences.ts';

export const SITE_URL = 'https://www.digibastion.com';
export const OPTIN_TTL_MS = 24 * 60 * 60 * 1000;
export const RESUBSCRIBE_RATE_LIMIT = { scope: 'subscription:resubscribe:email', maxAttempts: 3, windowSeconds: 3600 } as const;
/**
 * The weekly goes out on Mondays. The legacy digest still reads preferred_day
 * until the cutover, so rows written now carry Monday too.
 */
export const WEEKLY_SEND_DAY = 1;

export type SubscribeAction = 'suppressed' | 'create' | 'verify-pending' | 'resubscribe' | 'already-active';

export function planSubscribeRequest(o: {
  existing: { is_verified?: unknown; is_active?: unknown } | null;
  suppressed: boolean;
}): SubscribeAction {
  if (o.suppressed) return 'suppressed';
  if (!o.existing) return 'create';
  if (o.existing.is_verified !== true) return 'verify-pending';
  return o.existing.is_active === false ? 'resubscribe' : 'already-active';
}

const SIGNUP_CONSENT_SOURCES: readonly ConsentSource[] = ['threat-intel-form', 'quick-subscribe'];

/** consent_source a public signup may claim; a payload without one is the form. */
export function parseSignupConsentSource(value: unknown): ConsentSource | null {
  if (value === undefined || value === null) return 'threat-intel-form';
  return typeof value === 'string' && (SIGNUP_CONSENT_SOURCES as readonly string[]).includes(value)
    ? value as ConsentSource
    : null;
}

/** Column values for an insert or update: the preferences plus the legacy weekly day. */
export function subscriptionColumns(p: SubscriptionPreferences): Record<string, unknown> {
  return { ...preferencesToColumns(p), preferred_day: WEEKLY_SEND_DAY };
}

/**
 * Re-validates optin_pending (written by subscriptionColumns) before it is
 * applied. Null when it is missing or no longer valid.
 */
export function columnsFromOptinPending(pending: unknown): Record<string, unknown> | null {
  const parsed = parseSubscriptionPreferences(pending);
  return parsed.ok ? subscriptionColumns(parsed.value) : null;
}

export function isOptinTokenUsable(row: { optin_token_expires_at?: string | null }, now: Date): boolean {
  if (!row.optin_token_expires_at) return false;
  const expiresAt = Date.parse(row.optin_token_expires_at);
  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}

/**
 * The update verify-email applies when a re-subscribe link is used. The
 * management token (verification_token) is deliberately left alone.
 */
export function resubscribeConfirmedColumns(
  pendingColumns: Record<string, unknown>,
  now: Date,
  consentIpHash: string | null,
): Record<string, unknown> {
  const at = now.toISOString();
  return {
    ...pendingColumns,
    is_active: true,
    unsubscribed_at: null,
    consented_at: at,
    consent_source: 'resubscribe',
    ...(consentIpHash ? { consent_ip_hash: consentIpHash } : {}),
    optin_token: null,
    optin_token_expires_at: null,
    optin_pending: null,
    updated_at: at,
  };
}

const STORED_DEFAULT_KEYS = ['content_scope', 'include_preliminary', 'chains', 'timezone', 'timezone_offset', 'preferred_hour'] as const;

/**
 * An update payload with the stored scope, preliminary choice, chains,
 * timezone and delivery hour filled in where the payload leaves them out, so
 * a legacy frontend that only knows frequency does not reset them.
 */
export function mergeStoredPreferences(payload: unknown, stored: Record<string, unknown>): unknown {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return payload;
  const defaults: Record<string, unknown> = {};
  for (const key of STORED_DEFAULT_KEYS) {
    if (stored[key] !== null && stored[key] !== undefined) defaults[key] = stored[key];
  }
  return { ...defaults, ...(payload as Record<string, unknown>) };
}

export function describeChannels(c: DeliveryChannels): string[] {
  const names: string[] = [];
  if (c.realtime) names.push('Real-time alerts');
  if (c.daily) names.push('Daily brief');
  if (c.weekly) names.push('Weekly deep-dive (Mondays)');
  return names;
}

export function optinConfirmUrl(token: string): string {
  return `${SITE_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

function categoryLabel(category: string): string {
  return category.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function renderResubscribeEmail(o: {
  name: string | null;
  channels: DeliveryChannels;
  categories: string[];
  confirmUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = 'Confirm you want DigiBastion emails again';
  const displayName = o.name || 'there';
  const channels = describeChannels(o.channels);
  const categories = o.categories.slice(0, 10).map(categoryLabel);
  const intro = 'Someone asked to restart DigiBastion emails for this address. If that was you, confirm below. Nothing changes unless you confirm.';
  const listItem = (value: string) => `<li style="margin:0 0 4px;">${escapeHtml(value)}</li>`;

  const bodyHtml = `
        <tr>
          <td class="email-pad" style="padding:28px 28px 8px;">
            <p style="margin:0 0 10px;color:#c4b5fd;font-size:12px;font-weight:700;letter-spacing:1.2px;">DIGIBASTION · THREAT INTELLIGENCE</p>
            <h1 style="margin:0 0 14px;color:#f3f4f6;font-size:22px;line-height:1.3;">${escapeHtml(subject)}</h1>
            <p style="margin:0;color:#d1d5db;font-size:15px;line-height:1.6;">Hi ${escapeHtml(displayName)},<br><br>${escapeHtml(intro)}</p>
          </td>
        </tr>
        <tr>
          <td class="email-pad" align="center" style="padding:20px 28px;">
            <a href="${escapeHtml(o.confirmUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Confirm and restart emails</a>
          </td>
        </tr>
        <tr>
          <td class="email-pad" style="padding:0 28px 24px;">
            <p style="margin:0 0 6px;color:#f3f4f6;font-size:14px;font-weight:600;">You will get</p>
            <ul style="margin:0 0 12px;padding-left:20px;color:#cbd5e1;font-size:14px;line-height:1.5;">${channels.map(listItem).join('')}</ul>
            <p style="margin:0 0 6px;color:#f3f4f6;font-size:14px;font-weight:600;">Categories</p>
            <ul style="margin:0;padding-left:20px;color:#cbd5e1;font-size:14px;line-height:1.5;">${categories.map(listItem).join('')}</ul>
          </td>
        </tr>`;
  const footerHtml = `<p style="margin:0;color:#a8b3c7;font-size:12px;line-height:19px;">This link works once and expires in 24 hours. If you did not ask for this, ignore this email and you will stay unsubscribed.</p>`;

  const text = [
    subject,
    '',
    `Hi ${displayName},`,
    '',
    intro,
    '',
    `Confirm and restart emails: ${o.confirmUrl}`,
    '',
    'You will get:',
    ...channels.map((channel) => `- ${channel}`),
    '',
    'Categories:',
    ...categories.map((category) => `- ${category}`),
    '',
    'This link works once and expires in 24 hours. If you did not ask for this, ignore this email and you will stay unsubscribed.',
    '',
    'DigiBastion Threat Intelligence',
    SITE_URL,
  ].join('\n');

  return {
    subject,
    html: renderEmailDocument({ title: subject, preheader: 'Confirm to restart your DigiBastion emails.', bodyHtml, footerHtml }),
    text,
  };
}
