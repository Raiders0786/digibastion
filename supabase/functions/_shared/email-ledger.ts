// The email_sends ledger: one row per (subscription, kind, item). A sender
// claims the row before calling Resend and records the outcome after, so a
// retry or a concurrent run never emails the same person twice.
// Pure module: no Deno or URL imports, so vitest can import it.
import type { ResendOutcome } from './resend-client.ts';

export type EmailSendKind = 'alert' | 'alert_followup' | 'daily' | 'weekly';

export interface ExistingSend { status: string; attempts: number; created_at: string }
export type ClaimPlan = 'insert' | 'reclaim' | 'skip';

const MAX_ITEM_KEY_IN_IDEMPOTENCY_KEY = 150;
const MAX_ATTEMPTS = 3;
// Resend remembers an Idempotency-Key for 24 hours. Inside that window a
// re-send with the same key is deduplicated, so an unknown newsletter send can
// be retried safely; an hour of margin keeps us clear of the edge.
const UNKNOWN_RETRY_WINDOW_MS = 23 * 3_600_000;
const MAX_ERROR_LENGTH = 300;

// 64-bit FNV-1a over UTF-8 bytes: stable, dependency-free and synchronous.
function fnv1a64Hex(value: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
}

/** `${kind}/${itemKey}/${subscriptionId}`; item keys over 150 characters become `h<fnv1a-64 hex>`. */
export function emailIdempotencyKey(kind: EmailSendKind, itemKey: string, subscriptionId: string): string {
  const item = itemKey.length > MAX_ITEM_KEY_IN_IDEMPOTENCY_KEY ? `h${fnv1a64Hex(itemKey)}` : itemKey;
  return `${kind}/${item}/${subscriptionId}`;
}

/**
 * null -> insert; failed with fewer than 3 attempts -> reclaim; unknown daily
 * or weekly claimed within 23 hours -> reclaim (Resend dedupes the key);
 * everything else (sent, claimed, suppressed, skipped, unknown alerts) -> skip.
 */
export function planEmailClaim(existing: ExistingSend | null, kind: EmailSendKind, now: Date): ClaimPlan {
  if (!existing) return 'insert';
  if (existing.status === 'failed') return existing.attempts < MAX_ATTEMPTS ? 'reclaim' : 'skip';
  if (existing.status === 'unknown' && (kind === 'daily' || kind === 'weekly')) {
    const createdAt = Date.parse(existing.created_at);
    return Number.isFinite(createdAt) && createdAt > now.getTime() - UNKNOWN_RETRY_WINDOW_MS ? 'reclaim' : 'skip';
  }
  return 'skip';
}

// Structural subset of the supabase-js query builder the ledger uses, so this
// module needs no supabase-js import. Pass a client as `supabase as unknown as LedgerDb`
// if its generated types do not line up.
export interface LedgerResult<T> { data: T | null; error: { message: string } | null }
export interface LedgerFilter<T> extends PromiseLike<LedgerResult<T[]>> {
  eq(column: string, value: unknown): LedgerFilter<T>;
  select(columns: string): LedgerFilter<T>;
  maybeSingle(): PromiseLike<LedgerResult<T>>;
}
export interface LedgerDb {
  from(table: 'email_sends'): {
    upsert(values: Record<string, unknown>, options: { onConflict: string; ignoreDuplicates: boolean }): {
      select(columns: string): PromiseLike<LedgerResult<{ id: string }[]>>;
    };
    select(columns: string): LedgerFilter<Record<string, unknown>>;
    update(values: Record<string, unknown>): LedgerFilter<Record<string, unknown>>;
  };
}

export interface EmailClaimRow {
  subscription_id: string;
  kind: EmailSendKind;
  item_key: string;
  issue_id?: string;
  article_id?: string;
  article_uid?: string;
  snapshot?: Record<string, unknown>;
}

function check<T>(result: LedgerResult<T>, action: string): T | null {
  if (result.error) throw new Error(`email_sends ${action} failed: ${result.error.message}`.slice(0, MAX_ERROR_LENGTH));
  return result.data;
}

/**
 * Claims the send for this subscription and item. Returns the row id and the
 * Idempotency-Key to send with, or null when another run owns the row or it
 * must not be sent again.
 */
export async function claimEmailSend(db: LedgerDb, row: EmailClaimRow, now: Date = new Date()): Promise<{ id: string; idempotencyKey: string } | null> {
  const idempotencyKey = emailIdempotencyKey(row.kind, row.item_key, row.subscription_id);
  const inserted = check(await db.from('email_sends')
    .upsert({
      subscription_id: row.subscription_id,
      kind: row.kind,
      item_key: row.item_key,
      issue_id: row.issue_id ?? null,
      article_id: row.article_id ?? null,
      article_uid: row.article_uid ?? null,
      snapshot: row.snapshot ?? null,
      idempotency_key: idempotencyKey,
      status: 'claimed',
      attempts: 1,
    }, { onConflict: 'subscription_id,kind,item_key', ignoreDuplicates: true })
    .select('id'), 'claim');
  if (inserted && inserted.length > 0) return { id: inserted[0].id, idempotencyKey };

  const existing = check(await db.from('email_sends')
    .select('id, status, attempts, created_at, idempotency_key')
    .eq('subscription_id', row.subscription_id)
    .eq('kind', row.kind)
    .eq('item_key', row.item_key)
    .maybeSingle(), 'lookup');
  if (!existing) return null;
  const current: ExistingSend = {
    status: String(existing.status),
    attempts: Number(existing.attempts) || 0,
    created_at: String(existing.created_at),
  };
  if (planEmailClaim(current, row.kind, now) !== 'reclaim') return null;

  // Guarded by the status we read: of two concurrent runs, only one update
  // still finds the row failed or unknown.
  const reclaimed = check(await db.from('email_sends')
    .update({ status: 'claimed', attempts: current.attempts + 1, error: null, updated_at: now.toISOString() })
    .eq('id', existing.id)
    .eq('status', current.status)
    .select('id'), 'reclaim');
  if (!reclaimed || reclaimed.length === 0) return null;
  const key = typeof existing.idempotency_key === 'string' && existing.idempotency_key ? existing.idempotency_key : idempotencyKey;
  return { id: String(existing.id), idempotencyKey: key };
}

export async function finishEmailSend(
  db: LedgerDb,
  id: string,
  outcome: ResendOutcome | { status: 'suppressed' | 'skipped' },
  now: Date = new Date(),
): Promise<void> {
  const at = now.toISOString();
  let values: Record<string, unknown>;
  if (outcome.status === 'sent') {
    values = { status: 'sent', resend_id: outcome.id, sent_at: at, error: null };
  } else if (outcome.status === 'failed' || outcome.status === 'unknown') {
    values = { status: outcome.status, error: outcome.error.slice(0, MAX_ERROR_LENGTH) };
  } else {
    values = { status: outcome.status, error: null };
  }
  check(await db.from('email_sends').update({ ...values, updated_at: at }).eq('id', id), 'finish');
}
