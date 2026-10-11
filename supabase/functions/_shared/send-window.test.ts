import { describe, expect, it } from 'vitest';
import {
  NEWSLETTER_GRACE_MINUTES,
  dailyIssueDateFor,
  isNewsletterDue,
  localClock,
  recentlyNotified,
  resolveZone,
  weeklyDayOf,
  weeklyIssueDateFor,
  zonedInstant,
  type Zone,
} from './send-window.ts';

const at = (iso: string) => new Date(iso);
const kolkata: Zone = { kind: 'iana', timeZone: 'Asia/Kolkata' };
const newYork: Zone = { kind: 'iana', timeZone: 'America/New_York' };

describe('resolveZone', () => {
  it('prefers a valid IANA name', () => {
    expect(resolveZone('Asia/Kolkata', 0)).toEqual(kolkata);
  });

  it('falls back to the offset when the IANA name is invalid or missing', () => {
    expect(resolveZone('Mars/Base', 5.5)).toEqual({ kind: 'offset', offsetMinutes: 330 });
    expect(resolveZone(null, -3.5)).toEqual({ kind: 'offset', offsetMinutes: -210 });
    expect(resolveZone(undefined, 5.75)).toEqual({ kind: 'offset', offsetMinutes: 345 });
  });

  it('uses UTC when neither is usable', () => {
    expect(resolveZone(null, null)).toEqual({ kind: 'offset', offsetMinutes: 0 });
    expect(resolveZone('', 99)).toEqual({ kind: 'offset', offsetMinutes: 0 });
  });
});

describe('localClock and zonedInstant', () => {
  it('reads the local date, weekday and minutes', () => {
    expect(localClock(at('2026-10-11T20:00:00Z'), kolkata)).toEqual({ date: '2026-10-12', weekday: 1, minutes: 90 });
    expect(localClock(at('2026-10-11T20:00:00Z'), { kind: 'offset', offsetMinutes: 345 }))
      .toEqual({ date: '2026-10-12', weekday: 1, minutes: 105 });
    expect(localClock(at('2026-10-11T02:00:00Z'), { kind: 'offset', offsetMinutes: -300 }))
      .toEqual({ date: '2026-10-10', weekday: 6, minutes: 21 * 60 });
  });

  it('converts a local hour to an instant', () => {
    expect(zonedInstant('2026-10-12', 9, kolkata).toISOString()).toBe('2026-10-12T03:30:00.000Z');
    expect(zonedInstant('2026-10-12', 9, { kind: 'offset', offsetMinutes: 345 }).toISOString())
      .toBe('2026-10-12T03:15:00.000Z');
  });

  it('keeps 9:00 local across the New York DST changes', () => {
    expect(zonedInstant('2026-03-07', 9, newYork).toISOString()).toBe('2026-03-07T14:00:00.000Z');
    expect(zonedInstant('2026-03-09', 9, newYork).toISOString()).toBe('2026-03-09T13:00:00.000Z');
    expect(zonedInstant('2026-10-31', 9, newYork).toISOString()).toBe('2026-10-31T13:00:00.000Z');
    expect(zonedInstant('2026-11-02', 9, newYork).toISOString()).toBe('2026-11-02T14:00:00.000Z');
  });

  it('moves a time inside the spring-forward gap to the first valid instant after it', () => {
    // 02:00 on 2026-03-08 does not exist in New York; clocks jump to 03:00 EDT (07:00Z).
    expect(zonedInstant('2026-03-08', 2, newYork).toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });

  it('picks the first occurrence of a repeated fall-back hour', () => {
    expect(zonedInstant('2026-11-01', 1, newYork).toISOString()).toBe('2026-11-01T05:00:00.000Z');
  });
});

describe('issue dates', () => {
  it('uses the subscriber local date for the daily issue', () => {
    expect(dailyIssueDateFor(at('2026-10-11T20:00:00Z'), kolkata)).toBe('2026-10-12');
    expect(dailyIssueDateFor(at('2026-10-11T20:00:00Z'), newYork)).toBe('2026-10-11');
  });

  it('returns the weekly issue date only on the local Monday', () => {
    expect(weeklyIssueDateFor(at('2026-10-11T20:00:00Z'), kolkata)).toBe('2026-10-12');
    expect(weeklyIssueDateFor(at('2026-10-11T20:00:00Z'), newYork)).toBeNull();
    expect(weeklyIssueDateFor(at('2026-10-12T13:00:00Z'), newYork)).toBe('2026-10-12');
  });

  it("returns that week's Monday issue on the subscriber's weekly day", () => {
    // Sunday 2026-10-18 in New York: the issue built on Monday 2026-10-12.
    expect(weeklyIssueDateFor(at('2026-10-18T14:00:00Z'), newYork, 0)).toBe('2026-10-12');
    // Friday 2026-10-16.
    expect(weeklyIssueDateFor(at('2026-10-16T14:00:00Z'), newYork, 5)).toBe('2026-10-12');
    expect(weeklyIssueDateFor(at('2026-10-12T14:00:00Z'), newYork, 5)).toBeNull();
  });

  it('reads preferred_day, defaulting to Monday', () => {
    expect(weeklyDayOf(0)).toBe(0);
    expect(weeklyDayOf('6')).toBe(6);
    for (const value of [null, undefined, '', 7, -1, 2.5, 'x']) expect(weeklyDayOf(value as number | null)).toBe(1);
  });
});

describe('isNewsletterDue with a send date', () => {
  it('sends a Monday issue at the preferred hour of a later send date', () => {
    const base = { zone: newYork, preferredHour: 9, issueDate: '2026-10-12', sendDate: '2026-10-16', issueReadyAt: at('2026-10-12T00:10:00Z') };
    expect(isNewsletterDue({ ...base, now: at('2026-10-16T12:45:00Z') })).toBe(false);
    expect(isNewsletterDue({ ...base, now: at('2026-10-16T13:00:00Z') })).toBe(true);
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T13:00:00Z') })).toBe(false);
  });
});

describe('isNewsletterDue', () => {
  it('sends Asia/Kolkata at 9:00 from the 03:30Z slot, not the 03:15Z one', () => {
    const base = { zone: kolkata, preferredHour: 9, issueDate: '2026-10-12', issueReadyAt: at('2026-10-12T00:05:00Z') };
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T03:15:00Z') })).toBe(false);
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T03:30:00Z') })).toBe(true);
  });

  it('keeps New York at 9:00 local across both DST changes', () => {
    const ready = (date: string) => at(`${date}T00:05:00Z`);
    for (const [date, slot, early] of [
      ['2026-03-09', '2026-03-09T13:00:00Z', '2026-03-09T12:45:00Z'],
      ['2026-11-02', '2026-11-02T14:00:00Z', '2026-11-02T13:45:00Z'],
    ]) {
      const base = { zone: newYork, preferredHour: 9, issueDate: date, issueReadyAt: ready(date) };
      expect(isNewsletterDue({ ...base, now: at(slot) })).toBe(true);
      expect(isNewsletterDue({ ...base, now: at(early) })).toBe(false);
    }
  });

  it('waits for the issue: Asia/Tokyo at 9:00 with the issue ready at 00:05Z', () => {
    const base = {
      zone: { kind: 'iana', timeZone: 'Asia/Tokyo' } as Zone,
      preferredHour: 9,
      issueDate: '2026-10-12',
      issueReadyAt: at('2026-10-12T00:05:00Z'),
    };
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T00:00:00Z') })).toBe(false);
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T00:15:00Z') })).toBe(true);
  });

  it('sends the Kiritimati weekly on the local Monday only once the issue is ready', () => {
    const zone: Zone = { kind: 'iana', timeZone: 'Pacific/Kiritimati' };
    const now = at('2026-10-12T00:15:00Z');
    const issueDate = weeklyIssueDateFor(now, zone);
    expect(issueDate).toBe('2026-10-12');
    expect(localClock(now, zone).minutes).toBe(14 * 60 + 15);
    const base = { zone, preferredHour: 6, issueDate: '2026-10-12', issueReadyAt: at('2026-10-12T00:10:00Z') };
    // 06:00 local Monday is 16:00Z Sunday, before the Monday 00:00Z build.
    expect(isNewsletterDue({ ...base, now: at('2026-10-11T16:00:00Z') })).toBe(false);
    expect(isNewsletterDue({ ...base, now: at('2026-10-11T23:45:00Z') })).toBe(false);
    expect(isNewsletterDue({ ...base, now })).toBe(true);
  });

  it('stops once the grace window has passed', () => {
    const base = { zone: kolkata, preferredHour: 9, issueDate: '2026-10-12', issueReadyAt: at('2026-10-12T00:05:00Z') };
    expect(NEWSLETTER_GRACE_MINUTES).toBe(180);
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T06:15:00Z') })).toBe(true);
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T06:30:00Z') })).toBe(false);
  });

  it('measures the grace window from the ready time when the issue is late', () => {
    const base = { zone: kolkata, preferredHour: 9, issueDate: '2026-10-12', issueReadyAt: at('2026-10-12T05:00:00Z') };
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T07:45:00Z') })).toBe(true);
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T08:00:00Z') })).toBe(false);
  });

  it('is never due on another local date', () => {
    const base = { zone: kolkata, preferredHour: 9, issueDate: '2026-10-11', issueReadyAt: at('2026-10-11T00:05:00Z') };
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T03:30:00Z') })).toBe(false);
  });

  it('uses the offset when the IANA name is invalid', () => {
    const zone = resolveZone('Mars/Base', 5.5);
    const base = { zone, preferredHour: 9, issueDate: '2026-10-12', issueReadyAt: at('2026-10-12T00:05:00Z') };
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T03:30:00Z') })).toBe(true);
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T03:15:00Z') })).toBe(false);
  });

  it('handles a quarter-hour offset (+5.75)', () => {
    const zone = resolveZone(null, 5.75);
    const base = { zone, preferredHour: 9, issueDate: '2026-10-12', issueReadyAt: at('2026-10-12T00:05:00Z') };
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T03:15:00Z') })).toBe(true);
    expect(isNewsletterDue({ ...base, now: at('2026-10-12T03:00:00Z') })).toBe(false);
  });
});

describe('recentlyNotified', () => {
  const now = at('2026-10-12T09:00:00Z');
  it('holds a daily brief for 12 hours after any digest', () => {
    expect(recentlyNotified('2026-10-12T05:00:00Z', now)).toBe(true);
    expect(recentlyNotified('2026-10-11T21:00:01Z', now)).toBe(true);
    expect(recentlyNotified('2026-10-11T21:00:00Z', now)).toBe(false);
    expect(recentlyNotified('2026-10-11T09:00:00Z', now)).toBe(false);
  });
  it('ignores missing, malformed and future timestamps', () => {
    for (const value of [null, undefined, '', 'not a date', '2026-10-13T00:00:00Z']) expect(recentlyNotified(value, now)).toBe(false);
  });
});
