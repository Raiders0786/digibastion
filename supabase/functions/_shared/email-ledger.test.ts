import { describe, expect, it } from 'vitest';
import {
  claimEmailSend,
  emailIdempotencyKey,
  finishEmailSend,
  planEmailClaim,
  type EmailSendKind,
  type ExistingSend,
  type LedgerDb,
} from './email-ledger.ts';

const NOW = new Date('2026-10-12T12:00:00Z');
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString();
const existing = (status: string, attempts = 1, createdAt = hoursAgo(1)): ExistingSend => ({ status, attempts, created_at: createdAt });

describe('emailIdempotencyKey', () => {
  it('joins kind, item key and subscription id', () => {
    expect(emailIdempotencyKey('daily', '2026-10-12', 'sub-1')).toBe('daily/2026-10-12/sub-1');
    expect(emailIdempotencyKey('alert', 'quillmonitor:123', 'sub-1')).toBe('alert/quillmonitor:123/sub-1');
  });

  it('hashes long item keys into a stable short form that fits Resend’s 256-character limit', () => {
    const longKey = `rss:${'a'.repeat(200)}`;
    const key = emailIdempotencyKey('alert_followup', longKey, '00000000-0000-0000-0000-000000000001');
    expect(key).toBe(emailIdempotencyKey('alert_followup', longKey, '00000000-0000-0000-0000-000000000001'));
    expect(key).not.toContain(longKey);
    expect(key.length).toBeLessThanOrEqual(256);
    expect(key).toMatch(/^alert_followup\/h[0-9a-f]{16}\/00000000-0000-0000-0000-000000000001$/);
    expect(emailIdempotencyKey('alert', `${longKey}b`, 'sub')).not.toBe(emailIdempotencyKey('alert', longKey, 'sub'));
    expect(emailIdempotencyKey('alert', 'x'.repeat(150), 'sub')).toBe(`alert/${'x'.repeat(150)}/sub`);
  });
});

describe('planEmailClaim', () => {
  const cases: [string, ExistingSend | null, EmailSendKind, string][] = [
    ['no row', null, 'alert', 'insert'],
    ['failed, 1 attempt', existing('failed', 1), 'alert', 'reclaim'],
    ['failed, 2 attempts', existing('failed', 2), 'daily', 'reclaim'],
    ['failed, 3 attempts', existing('failed', 3), 'daily', 'skip'],
    ['unknown daily, recent', existing('unknown', 1, hoursAgo(22)), 'daily', 'reclaim'],
    ['unknown weekly, recent', existing('unknown', 1, hoursAgo(1)), 'weekly', 'reclaim'],
    ['unknown daily, older than 23h', existing('unknown', 1, hoursAgo(23.5)), 'daily', 'skip'],
    ['unknown alert', existing('unknown', 1), 'alert', 'skip'],
    ['unknown follow-up', existing('unknown', 1), 'alert_followup', 'skip'],
    ['sent', existing('sent'), 'daily', 'skip'],
    ['claimed', existing('claimed'), 'daily', 'skip'],
    ['suppressed', existing('suppressed'), 'weekly', 'skip'],
    ['skipped', existing('skipped'), 'alert', 'skip'],
  ];
  it.each(cases)('%s', (_, row, kind, plan) => {
    expect(planEmailClaim(row, kind, NOW)).toBe(plan);
  });
});

type Row = Record<string, unknown>;

// Minimal in-memory stand-in for the supabase-js calls the ledger makes.
function fakeDb(rows: Row[] = []) {
  const updates: Row[] = [];
  let nextId = rows.length + 1;
  const matches = (row: Row, filters: [string, unknown][]) => filters.every(([column, value]) => row[column] === value);

  function filterQuery(run: (filters: [string, unknown][]) => Row[]) {
    const filters: [string, unknown][] = [];
    const query = {
      eq(column: string, value: unknown) { filters.push([column, value]); return query; },
      select(_columns: string) { return query; },
      maybeSingle() { return Promise.resolve({ data: run(filters)[0] ?? null, error: null }); },
      then<T>(resolve: (value: { data: Row[]; error: null }) => T) { return Promise.resolve({ data: run(filters), error: null }).then(resolve); },
    };
    return query;
  }

  const db = {
    from(table: string) {
      expect(table).toBe('email_sends');
      return {
        upsert(values: Row, options: { onConflict: string; ignoreDuplicates: boolean }) {
          expect(options).toEqual({ onConflict: 'subscription_id,kind,item_key', ignoreDuplicates: true });
          return {
            select(_columns: string) {
              const clash = rows.find((row) => row.subscription_id === values.subscription_id
                && row.kind === values.kind && row.item_key === values.item_key);
              if (clash) return Promise.resolve({ data: [], error: null });
              const row = { id: `id-${nextId++}`, ...values };
              rows.push(row);
              return Promise.resolve({ data: [{ id: row.id }], error: null });
            },
          };
        },
        select(_columns: string) {
          return filterQuery((filters) => rows.filter((row) => matches(row, filters)));
        },
        update(values: Row) {
          return filterQuery((filters) => {
            const hit = rows.filter((row) => matches(row, filters));
            for (const row of hit) Object.assign(row, values);
            updates.push(values);
            return hit.map((row) => ({ id: row.id }));
          });
        },
      };
    },
  };
  return { db: db as unknown as LedgerDb, rows, updates };
}

describe('claimEmailSend and finishEmailSend', () => {
  const claim = { subscription_id: 'sub-1', kind: 'daily' as const, item_key: '2026-10-12', issue_id: 'issue-1' };

  it('inserts a claimed row and returns its idempotency key', async () => {
    const { db, rows } = fakeDb();
    const result = await claimEmailSend(db, claim, NOW);
    expect(result).toEqual({ id: 'id-1', idempotencyKey: 'daily/2026-10-12/sub-1' });
    expect(rows[0]).toMatchObject({ status: 'claimed', attempts: 1, idempotency_key: 'daily/2026-10-12/sub-1', issue_id: 'issue-1' });
  });

  it('skips a row that was already sent', async () => {
    const { db } = fakeDb([{ id: 'old', ...claim, status: 'sent', attempts: 1, created_at: hoursAgo(1), idempotency_key: 'k' }]);
    expect(await claimEmailSend(db, claim, NOW)).toBeNull();
  });

  it('reclaims a failed row with a status guard and keeps the original key', async () => {
    const { db, rows } = fakeDb([{
      id: 'old', ...claim, status: 'failed', attempts: 1, created_at: hoursAgo(1), idempotency_key: 'daily/2026-10-12/sub-1',
    }]);
    const result = await claimEmailSend(db, claim, NOW);
    expect(result).toEqual({ id: 'old', idempotencyKey: 'daily/2026-10-12/sub-1' });
    expect(rows[0]).toMatchObject({ status: 'claimed', attempts: 2 });
    // A second concurrent run sees the row as claimed and gets nothing.
    expect(await claimEmailSend(db, claim, NOW)).toBeNull();
  });

  it('records each outcome', async () => {
    const { db, rows } = fakeDb([{ id: 'a', status: 'claimed' }]);
    await finishEmailSend(db, 'a', { status: 'sent', id: 're_1' }, NOW);
    expect(rows[0]).toMatchObject({ status: 'sent', resend_id: 're_1', error: null, sent_at: NOW.toISOString() });
    await finishEmailSend(db, 'a', { status: 'failed', retryable: true, error: 'x'.repeat(400) }, NOW);
    expect(rows[0]).toMatchObject({ status: 'failed' });
    expect(String(rows[0].error).length).toBeLessThanOrEqual(300);
    await finishEmailSend(db, 'a', { status: 'unknown', error: 'timeout' }, NOW);
    expect(rows[0]).toMatchObject({ status: 'unknown', error: 'timeout' });
    await finishEmailSend(db, 'a', { status: 'suppressed' }, NOW);
    expect(rows[0]).toMatchObject({ status: 'suppressed' });
  });
});
