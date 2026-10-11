// Decides which delivery problems cron-monitor emails the admins about.
// Pure module: no Deno or URL imports, so vitest can import it.
//
// - rss-stale: no RSS article inserted for 8 hours on a weekday (UTC), or 30
//   hours on a weekend, when the feeds publish less. The RSS job can succeed
//   every hour and still insert nothing, so job health alone misses this.
// - digest-overdue: an active daily subscriber has had no digest for 36
//   hours (8 days for weekly). Quiet days still send, so this is a failure.
// Each problem is emailed at most once every 12 hours.

export type DeliveryAlertKind = 'rss-stale' | 'digest-overdue';

export interface DeliveryHealth {
  rss_last_inserted_at: string | null;
  active_digest_subscriptions: number;
  overdue_count: number;
  overdue: { id: string; frequency: string; last_notified_at: string | null }[];
}

export interface DeliveryAlert {
  kind: DeliveryAlertKind;
  summary: string;
  lines: string[];
}

const HOUR_MS = 3_600_000;
export const RSS_STALE_WEEKDAY_HOURS = 8;
export const RSS_STALE_WEEKEND_HOURS = 30;
export const DELIVERY_ALERT_REPEAT_HOURS = 12;

function hoursSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  return Number.isNaN(at) ? null : (now.getTime() - at) / HOUR_MS;
}

/** The problems present right now, before the 12-hour repeat limit is applied. */
export function deliveryAlerts(health: DeliveryHealth, now: Date): DeliveryAlert[] {
  const alerts: DeliveryAlert[] = [];

  const weekday = now.getUTCDay();
  const limit = weekday === 0 || weekday === 6 ? RSS_STALE_WEEKEND_HOURS : RSS_STALE_WEEKDAY_HOURS;
  const rssAge = hoursSince(health.rss_last_inserted_at, now);
  if (rssAge === null || rssAge >= limit) {
    alerts.push({
      kind: 'rss-stale',
      summary: rssAge === null
        ? 'No RSS article has ever been inserted.'
        : `No new RSS article for ${Math.floor(rssAge)} hours (limit ${limit}).`,
      lines: [
        `Last RSS insert: ${health.rss_last_inserted_at ?? 'never'}`,
        'The fetch-rss-news job may still report success: check its records_inserted and errors in the cron monitor.',
      ],
    });
  }

  if (health.overdue_count > 0) {
    alerts.push({
      kind: 'digest-overdue',
      summary: `${health.overdue_count} of ${health.active_digest_subscriptions} digest subscriber${health.active_digest_subscriptions === 1 ? '' : 's'} got no digest on time.`,
      lines: health.overdue.map((row) => `${row.id} · ${row.frequency} · last digest ${row.last_notified_at ?? 'never'}`),
    });
  }
  return alerts;
}

/** True when this kind was not emailed within the repeat window. */
export function alertIsDue(lastSentAt: string | null | undefined, now: Date): boolean {
  const age = hoursSince(lastSentAt ?? null, now);
  return age === null || age >= DELIVERY_ALERT_REPEAT_HOURS;
}
