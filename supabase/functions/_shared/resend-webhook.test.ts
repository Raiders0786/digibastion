import { describe, expect, it } from 'vitest';
import { lastEventFor, parseResendEvent, verifyResendSignature } from './resend-webhook.ts';

const KEY_BYTES = new Uint8Array(Array.from({ length: 24 }, (_, index) => index + 1));
const SECRET = `whsec_${btoa(String.fromCharCode(...KEY_BYTES))}`;
const OTHER_SECRET = `whsec_${btoa('a completely different key')}`;
const ID = 'msg_2abc';
const NOW = new Date('2026-10-11T12:00:00.000Z');
const TIMESTAMP = String(Math.floor(NOW.getTime() / 1000));
const BODY = JSON.stringify({ type: 'email.bounced', data: { email_id: 're_1', to: ['a@example.com'] } });

async function sign(secret: string, id: string, timestamp: string, body: string): Promise<string> {
  const raw = atob(secret.slice('whsec_'.length));
  const keyBytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

const verify = (overrides: Partial<Parameters<typeof verifyResendSignature>[0]>) => verifyResendSignature({
  secret: SECRET,
  id: ID,
  timestamp: TIMESTAMP,
  signatureHeader: null,
  body: BODY,
  now: NOW,
  ...overrides,
});

describe('verifyResendSignature', () => {
  it('accepts a valid signature', async () => {
    const signature = await sign(SECRET, ID, TIMESTAMP, BODY);
    expect(await verify({ signatureHeader: `v1,${signature}` })).toBe(true);
  });

  it('rejects a tampered body', async () => {
    const signature = await sign(SECRET, ID, TIMESTAMP, BODY);
    expect(await verify({ signatureHeader: `v1,${signature}`, body: `${BODY} ` })).toBe(false);
  });

  it('rejects a signature made with another secret', async () => {
    const signature = await sign(OTHER_SECRET, ID, TIMESTAMP, BODY);
    expect(await verify({ signatureHeader: `v1,${signature}` })).toBe(false);
  });

  it('rejects a timestamp more than 300 seconds away', async () => {
    const stale = String(Number(TIMESTAMP) - 301);
    const signature = await sign(SECRET, ID, stale, BODY);
    expect(await verify({ signatureHeader: `v1,${signature}`, timestamp: stale })).toBe(false);
    const future = String(Number(TIMESTAMP) + 301);
    const futureSignature = await sign(SECRET, ID, future, BODY);
    expect(await verify({ signatureHeader: `v1,${futureSignature}`, timestamp: future })).toBe(false);
  });

  it('rejects missing headers and secrets', async () => {
    const signature = await sign(SECRET, ID, TIMESTAMP, BODY);
    expect(await verify({ signatureHeader: null })).toBe(false);
    expect(await verify({ signatureHeader: `v1,${signature}`, id: null })).toBe(false);
    expect(await verify({ signatureHeader: `v1,${signature}`, timestamp: null })).toBe(false);
    expect(await verify({ signatureHeader: `v1,${signature}`, secret: '' })).toBe(false);
  });

  it('accepts when only a later v1 signature matches', async () => {
    const good = await sign(SECRET, ID, TIMESTAMP, BODY);
    const bad = await sign(OTHER_SECRET, ID, TIMESTAMP, BODY);
    expect(await verify({ signatureHeader: `v1,${bad} v1,${good}` })).toBe(true);
  });

  it('ignores signatures of other versions', async () => {
    const good = await sign(SECRET, ID, TIMESTAMP, BODY);
    expect(await verify({ signatureHeader: `v2,${good}` })).toBe(false);
  });
});

describe('parseResendEvent', () => {
  it('reads a permanent bounce', () => {
    expect(parseResendEvent({
      type: 'email.bounced',
      data: { email_id: 're_1', to: ['A@Example.com'], bounce: { type: 'Permanent' } },
    })).toEqual({ kind: 'bounce', emailId: 're_1', recipients: ['A@Example.com'], eventId: null });
  });

  it('treats a transient bounce as a delay', () => {
    expect(parseResendEvent({
      type: 'email.bounced',
      data: { email_id: 're_1', to: 'a@example.com', bounce: { type: 'Transient' } },
    }).kind).toBe('delayed');
    expect(parseResendEvent({
      type: 'email.bounced',
      data: { email_id: 're_1', to: ['a@example.com'], bounce: { type: 'transient' } },
    }).kind).toBe('delayed');
  });

  it('reads a complaint, a delivery and a delay', () => {
    expect(parseResendEvent({ type: 'email.complained', data: { email_id: 're_2', to: ['b@example.com'] } }))
      .toEqual({ kind: 'complaint', emailId: 're_2', recipients: ['b@example.com'], eventId: null });
    expect(parseResendEvent({ type: 'email.delivered', data: { email_id: 're_3', to: ['c@example.com'] } }).kind)
      .toBe('delivered');
    expect(parseResendEvent({ type: 'email.delivery_delayed', data: { email_id: 're_4' } }).kind).toBe('delayed');
  });

  it('ignores unknown types and malformed payloads', () => {
    expect(parseResendEvent({ type: 'email.opened', data: { email_id: 're_5' } }).kind).toBe('ignored');
    expect(parseResendEvent(null).kind).toBe('ignored');
    expect(parseResendEvent('x').kind).toBe('ignored');
  });

  it('drops non-string recipients and over-long ids', () => {
    const event = parseResendEvent({ type: 'email.complained', data: { email_id: 'x'.repeat(300), to: [1, 'd@example.com'] } });
    expect(event.recipients).toEqual(['d@example.com']);
    expect(event.emailId).toBeNull();
  });
});

describe('lastEventFor', () => {
  it('maps event kinds to email_sends.last_event values', () => {
    expect(lastEventFor('bounce')).toBe('bounced');
    expect(lastEventFor('complaint')).toBe('complained');
    expect(lastEventFor('delivered')).toBe('delivered');
    expect(lastEventFor('delayed')).toBe('delivery_delayed');
    expect(lastEventFor('ignored')).toBeNull();
  });
});
