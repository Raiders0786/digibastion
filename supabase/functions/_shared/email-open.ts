// Privacy-friendly open tracking for the daily brief and the weekly
// deep-dive. The email carries a 1x1 image whose URL names only a random
// tracking id; email-tracking turns the first load into one email_events
// "open" row with the time, the country, a device type and an email app,
// both derived from the request. It stores no IP address or hash, no region
// and no browser string, and later loads of the same email add nothing.
//
// Open counts are a floor and a ceiling at once: some mail apps block images,
// and Apple Mail Privacy Protection loads them for the reader.
// Pure module: no Deno or URL imports, so vitest can import it.

/** email_events.email_type values whose opens are recorded this way. */
export const PRIVATE_OPEN_EMAIL_TYPES: ReadonlySet<string> = new Set(['daily_brief', 'weekly_deep_dive']);

export function isPrivateOpenType(emailType: string | null | undefined): boolean {
  return typeof emailType === 'string' && PRIVATE_OPEN_EMAIL_TYPES.has(emailType);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The pixel URL for one sent email; null for a malformed id. */
export function openPixelUrl(functionsBaseUrl: string, trackingId: string): string | null {
  if (!UUID.test(trackingId)) return null;
  return `${functionsBaseUrl.replace(/\/+$/, '')}/email-tracking?tid=${trackingId}&a=o`;
}

/** The image tag, or nothing without a URL (test sends have none). */
export function openPixelHtml(url: string | null | undefined): string {
  if (!url) return '';
  const safe = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<img src="${safe}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;
}

export interface PrivateOpenEvent {
  subscription_id: string | null;
  tracking_id: string;
  event_type: 'open';
  email_type: string;
  timestamp_utc: string;
  country_code: string | null;
  device_type: string;
  email_client: string;
}

/** The only fields a newsletter open stores. */
export function privateOpenEvent(o: {
  subscriptionId: string | null;
  trackingId: string;
  emailType: string;
  at: Date;
  countryCode: string | null;
  deviceType: string;
  emailClient: string;
}): PrivateOpenEvent {
  const country = o.countryCode && /^[A-Za-z]{2}$/.test(o.countryCode) ? o.countryCode.toUpperCase() : null;
  return {
    subscription_id: o.subscriptionId,
    tracking_id: o.trackingId,
    event_type: 'open',
    email_type: o.emailType,
    timestamp_utc: o.at.toISOString(),
    country_code: country,
    device_type: o.deviceType.slice(0, 20),
    email_client: o.emailClient.slice(0, 40),
  };
}
