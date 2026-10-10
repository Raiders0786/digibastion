import { describe, expect, it } from 'vitest';
import {
  RESEND_MIN_INTERVAL_MS,
  createThrottle,
  sendResendEmail,
  type ResendEmail,
} from './resend-client.ts';

const API_KEY = 're_test_secret_key';
const email: ResendEmail = {
  from: 'Digibastion <alerts@digibastion.com>',
  to: ['reader@example.com'],
  subject: 'Daily brief',
  html: '<p>Hi</p>',
  text: 'Hi',
  reply_to: 'support@digibastion.com',
  headers: { 'List-Unsubscribe': '<https://example.com/u>' },
};

type Step = Response | Error | 'hang';

function fakeFetch(steps: Step[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const step = steps.shift();
    if (!step) throw new Error('unexpected call');
    if (step === 'hang') {
      return await new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    }
    if (step instanceof Error) throw step;
    return step;
  }) as typeof fetch;
  return { impl, calls };
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

function recorder() {
  const sleeps: number[] = [];
  return { sleeps, sleep: async (ms: number) => { sleeps.push(ms); } };
}

describe('sendResendEmail', () => {
  it('posts to Resend with the idempotency key and returns the id', async () => {
    const { impl, calls } = fakeFetch([json(200, { id: 'email_1' })]);
    const outcome = await sendResendEmail({ fetchImpl: impl, apiKey: API_KEY, email, idempotencyKey: 'daily/2026-10-12/sub-1' });
    expect(outcome).toEqual({ status: 'sent', id: 'email_1' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.resend.com/emails');
    expect(calls[0].init.method).toBe('POST');
    const headers = new Headers(calls[0].init.headers);
    expect(headers.get('Idempotency-Key')).toBe('daily/2026-10-12/sub-1');
    expect(headers.get('Authorization')).toBe(`Bearer ${API_KEY}`);
    expect(JSON.parse(String(calls[0].init.body))).toEqual(email);
  });

  it('waits for retry-after on 429 and retries once with the same key', async () => {
    const { impl, calls } = fakeFetch([json(429, { message: 'slow down' }, { 'retry-after': '2' }), json(200, { id: 'email_2' })]);
    const { sleeps, sleep } = recorder();
    const outcome = await sendResendEmail({ fetchImpl: impl, apiKey: API_KEY, email, idempotencyKey: 'k', sleep });
    expect(outcome).toEqual({ status: 'sent', id: 'email_2' });
    expect(sleeps).toEqual([2000]);
    expect(calls.map((call) => new Headers(call.init.headers).get('Idempotency-Key'))).toEqual(['k', 'k']);
  });

  it('caps the retry-after wait at ten seconds and reports a second 429 as retryable', async () => {
    const { impl, calls } = fakeFetch([json(429, {}, { 'retry-after': '120' }), json(429, { message: 'rate limited' })]);
    const { sleeps, sleep } = recorder();
    const outcome = await sendResendEmail({ fetchImpl: impl, apiKey: API_KEY, email, idempotencyKey: 'k', sleep });
    expect(sleeps).toEqual([10_000]);
    expect(calls).toHaveLength(2);
    expect(outcome).toMatchObject({ status: 'failed', retryable: true, httpStatus: 429 });
  });

  it('treats 409 as unknown so the email is not sent twice', async () => {
    const { impl } = fakeFetch([json(409, { message: 'concurrent idempotent request' })]);
    const outcome = await sendResendEmail({ fetchImpl: impl, apiKey: API_KEY, email, idempotencyKey: 'k' });
    expect(outcome.status).toBe('unknown');
  });

  it('does not retry other 4xx responses', async () => {
    const { impl } = fakeFetch([json(422, { message: 'Invalid `to` field' })]);
    const outcome = await sendResendEmail({ fetchImpl: impl, apiKey: API_KEY, email, idempotencyKey: 'k' });
    expect(outcome).toEqual({ status: 'failed', retryable: false, error: 'Invalid `to` field', httpStatus: 422 });
  });

  it('treats 5xx as unknown, since Resend may have delivered it', async () => {
    const { impl } = fakeFetch([new Response('upstream down', { status: 503 })]);
    const outcome = await sendResendEmail({ fetchImpl: impl, apiKey: API_KEY, email, idempotencyKey: 'k' });
    expect(outcome).toEqual({ status: 'unknown', error: 'upstream down' });
  });

  it('reports a network error as unknown', async () => {
    const { impl } = fakeFetch([new TypeError('connection reset')]);
    const outcome = await sendResendEmail({ fetchImpl: impl, apiKey: API_KEY, email, idempotencyKey: 'k' });
    expect(outcome).toEqual({ status: 'unknown', error: 'connection reset' });
  });

  it('reports a timeout as unknown', async () => {
    const { impl } = fakeFetch(['hang']);
    const outcome = await sendResendEmail({ fetchImpl: impl, apiKey: API_KEY, email, idempotencyKey: 'k', timeoutMs: 5 });
    expect(outcome.status).toBe('unknown');
  });

  it('reports a 200 without an id as unknown', async () => {
    const { impl } = fakeFetch([json(200, {})]);
    const outcome = await sendResendEmail({ fetchImpl: impl, apiKey: API_KEY, email, idempotencyKey: 'k' });
    expect(outcome.status).toBe('unknown');
  });

  it('truncates error text to 300 characters and never includes the API key', async () => {
    const { impl } = fakeFetch([json(400, { message: `bad key ${API_KEY} ${'x'.repeat(400)}` })]);
    const outcome = await sendResendEmail({ fetchImpl: impl, apiKey: API_KEY, email, idempotencyKey: 'k' });
    expect(outcome.status).toBe('failed');
    if (outcome.status !== 'failed') return;
    expect(outcome.error.length).toBeLessThanOrEqual(300);
    expect(outcome.error).not.toContain(API_KEY);
  });
});

describe('createThrottle', () => {
  it('spaces calls at least minIntervalMs apart', async () => {
    let clock = 1_000;
    const starts: number[] = [];
    const throttle = createThrottle(RESEND_MIN_INTERVAL_MS, {
      now: () => clock,
      sleep: async (ms) => { clock += ms; },
    });
    await Promise.all([1, 2, 3].map(async () => {
      await throttle();
      starts.push(clock);
    }));
    await throttle();
    starts.push(clock);
    expect(starts).toHaveLength(4);
    for (let index = 1; index < starts.length; index += 1) {
      expect(starts[index] - starts[index - 1]).toBeGreaterThanOrEqual(RESEND_MIN_INTERVAL_MS);
    }
    expect(RESEND_MIN_INTERVAL_MS).toBe(550);
  });

  it('does not wait when calls are already far apart', async () => {
    let clock = 0;
    const sleeps: number[] = [];
    const throttle = createThrottle(100, { now: () => clock, sleep: async (ms) => { sleeps.push(ms); clock += ms; } });
    await throttle();
    clock += 500;
    await throttle();
    expect(sleeps).toEqual([]);
  });
});
