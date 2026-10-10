// Resend webhook pieces: Svix signature verification and event parsing.
// Pure module: no Deno or URL imports, so vitest can import it.

const DEFAULT_TOLERANCE_SECONDS = 300;
const SECRET_PREFIX = 'whsec_';
const MAX_ID_LENGTH = 100;
const MAX_RECIPIENTS = 50;
const MAX_EMAIL_LENGTH = 255;

function base64ToBytes(value: string): Uint8Array | null {
  try {
    const raw = atob(value);
    return Uint8Array.from(raw, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function constantTimeEqual(left: string, right: string): boolean {
  // Lengths of base64 HMAC-SHA256 signatures are public (44 characters).
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

/**
 * Svix scheme used by Resend: the secret is "whsec_<base64 key>", the signed
 * content is `${id}.${timestamp}.${body}`, the signature is base64
 * HMAC-SHA256, and the header lists "v1,<sig>" entries separated by spaces.
 * The timestamp (seconds) must be within the tolerance of now.
 */
export async function verifyResendSignature(o: {
  secret: string;
  id: string | null;
  timestamp: string | null;
  signatureHeader: string | null;
  body: string;
  now: Date;
  toleranceSeconds?: number;
}): Promise<boolean> {
  if (!o.secret || !o.id || !o.timestamp || !o.signatureHeader) return false;
  if (!/^\d{1,12}$/.test(o.timestamp)) return false;
  const tolerance = o.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (Math.abs(Math.floor(o.now.getTime() / 1000) - Number(o.timestamp)) > tolerance) return false;

  const keyBytes = base64ToBytes(o.secret.startsWith(SECRET_PREFIX) ? o.secret.slice(SECRET_PREFIX.length) : o.secret);
  if (!keyBytes || keyBytes.length === 0) return false;

  const key = await globalThis.crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await globalThis.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${o.id}.${o.timestamp}.${o.body}`));
  const expected = bytesToBase64(new Uint8Array(signed));

  let matched = false;
  for (const entry of o.signatureHeader.split(' ')) {
    const comma = entry.indexOf(',');
    if (comma < 0 || entry.slice(0, comma) !== 'v1') continue;
    // Compare every candidate so timing does not reveal which one matched.
    if (constantTimeEqual(entry.slice(comma + 1), expected)) matched = true;
  }
  return matched;
}

export type ResendEventKind = 'bounce' | 'complaint' | 'delivered' | 'delayed' | 'ignored';
export type ResendEvent = { kind: ResendEventKind; emailId: string | null; recipients: string[]; eventId: string | null };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function boundedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}

function recipients(value: unknown): string[] {
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((entry) => boundedString(entry, MAX_EMAIL_LENGTH))
    .filter((entry): entry is string => entry !== null && entry.includes('@'))
    .slice(0, MAX_RECIPIENTS);
}

/**
 * email.bounced -> bounce, unless data.bounce.type is transient (then delayed);
 * email.complained -> complaint; email.delivered -> delivered;
 * email.delivery_delayed -> delayed; anything else -> ignored.
 */
export function parseResendEvent(payload: unknown): ResendEvent {
  const body = record(payload);
  const data = record(body.data);
  const base = {
    emailId: boundedString(data.email_id, MAX_ID_LENGTH),
    recipients: recipients(data.to),
    eventId: boundedString(body.id, MAX_ID_LENGTH),
  };
  switch (body.type) {
    case 'email.bounced': {
      const bounceType = record(data.bounce).type;
      const transient = typeof bounceType === 'string' && bounceType.toLowerCase() === 'transient';
      return { kind: transient ? 'delayed' : 'bounce', ...base };
    }
    case 'email.complained':
      return { kind: 'complaint', ...base };
    case 'email.delivered':
      return { kind: 'delivered', ...base };
    case 'email.delivery_delayed':
      return { kind: 'delayed', ...base };
    default:
      return { kind: 'ignored', ...base };
  }
}

export type EmailSendLastEvent = 'delivered' | 'bounced' | 'complained' | 'delivery_delayed';

/** The email_sends.last_event value for an event, or null when nothing is recorded. */
export function lastEventFor(kind: ResendEventKind): EmailSendLastEvent | null {
  switch (kind) {
    case 'bounce': return 'bounced';
    case 'complaint': return 'complained';
    case 'delivered': return 'delivered';
    case 'delayed': return 'delivery_delayed';
    default: return null;
  }
}
