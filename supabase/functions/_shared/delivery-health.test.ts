import { describe, expect, it } from 'vitest';
import { alertIsDue, deliveryAlerts, type DeliveryHealth } from './delivery-health';

const healthy: DeliveryHealth = {
  rss_last_inserted_at: '2026-10-08T10:00:00Z',
  active_digest_subscriptions: 13,
  overdue_count: 0,
  overdue: [],
};

describe('deliveryAlerts', () => {
  it('stays quiet when RSS is fresh and nobody is overdue', () => {
    expect(deliveryAlerts(healthy, new Date('2026-10-08T12:00:00Z'))).toEqual([]);
  });

  it('flags RSS after 8 hours on a weekday', () => {
    // Thursday 2026-10-08: the outage that started this check.
    const alerts = deliveryAlerts({ ...healthy, rss_last_inserted_at: '2026-10-08T17:00:00Z' }, new Date('2026-10-09T01:00:00Z'));
    expect(alerts.map((alert) => alert.kind)).toEqual(['rss-stale']);
    expect(alerts[0].summary).toBe('No new RSS article for 8 hours (limit 8).');
  });

  it('allows a quiet weekend up to 30 hours', () => {
    // Saturday 15:15 to Sunday 13:00 is under 30 hours.
    const quietWeekend = { ...healthy, rss_last_inserted_at: '2026-10-10T15:15:00Z' };
    expect(deliveryAlerts(quietWeekend, new Date('2026-10-11T13:00:00Z'))).toEqual([]);
    expect(deliveryAlerts(quietWeekend, new Date('2026-10-11T21:15:00Z')).map((alert) => alert.kind)).toEqual(['rss-stale']);
  });

  it('flags RSS that never inserted anything', () => {
    expect(deliveryAlerts({ ...healthy, rss_last_inserted_at: null }, new Date('2026-10-08T12:00:00Z'))[0].summary)
      .toBe('No RSS article has ever been inserted.');
  });

  it('lists overdue subscriptions by id', () => {
    const alerts = deliveryAlerts({
      ...healthy,
      overdue_count: 2,
      overdue: [
        { id: 'a1', frequency: 'daily', last_notified_at: '2026-10-09T03:00:00Z' },
        { id: 'b2', frequency: 'weekly', last_notified_at: null },
      ],
    }, new Date('2026-10-08T12:00:00Z'));
    expect(alerts).toEqual([{
      kind: 'digest-overdue',
      summary: '2 of 13 digest subscribers got no digest on time.',
      lines: ['a1 · daily · last digest 2026-10-09T03:00:00Z', 'b2 · weekly · last digest never'],
    }]);
  });
});

describe('alertIsDue', () => {
  const now = new Date('2026-10-11T12:00:00Z');
  it('sends the first alert and repeats after 12 hours', () => {
    expect(alertIsDue(null, now)).toBe(true);
    expect(alertIsDue('2026-10-11T01:00:00Z', now)).toBe(false);
    expect(alertIsDue('2026-10-11T00:00:00Z', now)).toBe(true);
  });
});
