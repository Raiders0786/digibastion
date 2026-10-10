// Resend send with an Idempotency-Key, one retry on 429, and outcomes the
// email_sends ledger can act on. "unknown" means Resend may have sent the
// email (timeout, network error, 5xx, 409 for a concurrent request with the same
// key); callers must not re-send those blindly.
// Pure module: no Deno or URL imports, so vitest can import it.

export interface ResendEmail {
  from: string;
  to: [string];
  subject: string;
  html: string;
  text: string;
  reply_to: string;
  headers: Record<string, string>;
  tags?: { name: string; value: string }[];
}

export type ResendOutcome =
  | { status: 'sent'; id: string }
  | { status: 'failed'; retryable: boolean; error: string; httpStatus?: number }
  | { status: 'unknown'; error: string };

/** Resend's default limit is 2 requests per second; 550 ms keeps us under it. */
export const RESEND_MIN_INTERVAL_MS = 550;

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRY_AFTER_MS = 10_000;
const DEFAULT_RETRY_AFTER_MS = 1_000;
const MAX_ERROR_LENGTH = 300;

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Returns a gate that resolves no sooner than minIntervalMs after the previous
 * one. Concurrent callers queue in call order.
 */
export function createThrottle(
  minIntervalMs: number,
  deps: { now(): number; sleep(ms: number): Promise<void> } = { now: () => Date.now(), sleep: defaultSleep },
): () => Promise<void> {
  let nextSlot = Number.NEGATIVE_INFINITY;
  let queue: Promise<void> = Promise.resolve();
  return () => {
    const turn = queue.then(async () => {
      const now = deps.now();
      const start = Math.max(now, nextSlot);
      if (start > now) await deps.sleep(start - now);
      nextSlot = start + minIntervalMs;
    });
    queue = turn.catch(() => undefined);
    return turn;
  };
}

function sanitizeError(message: string, apiKey: string): string {
  const redacted = apiKey ? message.split(apiKey).join('[redacted]') : message;
  return redacted.replace(/\s+/g, ' ').trim().slice(0, MAX_ERROR_LENGTH) || 'Resend request failed';
}

function retryAfterMs(response: Response): number {
  const raw = response.headers.get('retry-after');
  const seconds = raw === null ? Number.NaN : Number(raw);
  if (!Number.isFinite(seconds) || seconds < 0) return DEFAULT_RETRY_AFTER_MS;
  return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
}

async function errorText(response: Response): Promise<string> {
  const body = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(body) as { message?: unknown; name?: unknown };
    if (typeof parsed?.message === 'string' && parsed.message) return parsed.message;
  } catch {
    // Not JSON: use the raw text.
  }
  return body || `HTTP ${response.status}`;
}

type Attempt = { response: Response } | { error: string };

async function postOnce(o: { fetchImpl: typeof fetch; apiKey: string; email: ResendEmail; idempotencyKey: string; timeoutMs: number }): Promise<Attempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), o.timeoutMs);
  try {
    const response = await o.fetchImpl(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${o.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': o.idempotencyKey,
      },
      body: JSON.stringify(o.email),
      signal: controller.signal,
    });
    return { response };
  } catch (error) {
    const aborted = controller.signal.aborted;
    return { error: aborted ? `Resend request timed out after ${o.timeoutMs} ms` : (error instanceof Error ? error.message : String(error)) };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendResendEmail(o: {
  fetchImpl: typeof fetch;
  apiKey: string;
  email: ResendEmail;
  idempotencyKey: string;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<ResendOutcome> {
  const sleep = o.sleep ?? defaultSleep;
  const request = { fetchImpl: o.fetchImpl, apiKey: o.apiKey, email: o.email, idempotencyKey: o.idempotencyKey, timeoutMs: o.timeoutMs ?? DEFAULT_TIMEOUT_MS };

  let attempt = await postOnce(request);
  if ('response' in attempt && attempt.response.status === 429) {
    await sleep(retryAfterMs(attempt.response));
    attempt = await postOnce(request);
  }

  if ('error' in attempt) return { status: 'unknown', error: sanitizeError(attempt.error, o.apiKey) };
  const { response } = attempt;

  if (response.ok) {
    const body = await response.json().catch(() => null) as { id?: unknown } | null;
    if (typeof body?.id === 'string' && body.id) return { status: 'sent', id: body.id };
    return { status: 'unknown', error: 'Resend accepted the request but returned no id' };
  }

  const error = sanitizeError(await errorText(response), o.apiKey);
  // A 5xx may still have been delivered; report unknown so no retry under a new key.
  if (response.status === 409 || response.status >= 500) return { status: 'unknown', error };
  if (response.status === 429) {
    return { status: 'failed', retryable: true, error, httpStatus: response.status };
  }
  return { status: 'failed', retryable: false, error, httpStatus: response.status };
}
