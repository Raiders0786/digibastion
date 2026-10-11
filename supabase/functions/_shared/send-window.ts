// When a subscriber's daily brief or weekly deep-dive is due, in their own
// time zone. IANA names follow daylight-saving changes; the legacy
// timezone_offset (hours, quarter-hour steps) is the fallback.
// Pure module: no Deno or URL imports, so vitest can import it.
//
// Issue keys:
// - the daily issue for date D covers [D-1 00:00Z, D 00:00Z), period_end = D;
// - the weekly issue for Monday M covers [M-7d, M), period_end = M, and its
//   public URL date is period_start.
// A subscriber whose local date is D gets the daily issue with period_end D,
// and on their weekly day (preferred_day, Monday when unset) the weekly issue
// of the Monday on or before that date.
import { isValidTimeZone } from './subscription-preferences.ts';

export type Zone = { kind: 'iana'; timeZone: string } | { kind: 'offset'; offsetMinutes: number };

export interface LocalClock { date: string; weekday: number; minutes: number } // date YYYY-MM-DD, 0=Sunday

export const NEWSLETTER_GRACE_MINUTES = 180;

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
const UTC: Zone = { kind: 'offset', offsetMinutes: 0 };

/** Valid IANA name, else the legacy offset, else UTC. */
export function resolveZone(timezone: string | null | undefined, offsetHours: number | null | undefined): Zone {
  if (isValidTimeZone(timezone)) return { kind: 'iana', timeZone: timezone };
  if (typeof offsetHours === 'number' && Number.isFinite(offsetHours) && offsetHours >= -12 && offsetHours <= 14) {
    return { kind: 'offset', offsetMinutes: Math.round(offsetHours * 60) };
  }
  return UTC;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** The wall-clock time at `instantMs`, expressed as if it were a UTC timestamp. */
function wallClockMs(instantMs: number, zone: Zone): number {
  if (zone.kind === 'offset') return instantMs + zone.offsetMinutes * MINUTE_MS;
  const parts: Record<string, number> = {};
  for (const part of formatterFor(zone.timeZone).formatToParts(new Date(instantMs))) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  // Some engines print midnight as 24 even with h23.
  const hour = parts.hour === 24 ? 0 : parts.hour;
  return Date.UTC(parts.year, parts.month - 1, parts.day, hour, parts.minute, parts.second);
}

function offsetMs(instantMs: number, zone: Zone): number {
  const wholeSecond = Math.floor(instantMs / 1000) * 1000;
  return wallClockMs(wholeSecond, zone) - wholeSecond;
}

export function localClock(now: Date, zone: Zone): LocalClock {
  const wall = new Date(wallClockMs(now.getTime(), zone));
  return {
    date: wall.toISOString().slice(0, 10),
    weekday: wall.getUTCDay(),
    minutes: wall.getUTCHours() * 60 + wall.getUTCMinutes(),
  };
}

/**
 * The instant at which the local clock reads `hour`:00 on `localDate`. A time
 * skipped by a spring-forward change resolves to the first valid instant
 * after it; a repeated fall-back hour resolves to its first occurrence.
 */
export function zonedInstant(localDate: string, hour: number, zone: Zone): Date {
  const [year, month, day] = localDate.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, 0, 0);
  if (zone.kind === 'offset') return new Date(target - zone.offsetMinutes * MINUTE_MS);

  // Offsets a day either side cover any single transition near the target.
  const offsets = [...new Set([offsetMs(target - DAY_MS, zone), offsetMs(target, zone), offsetMs(target + DAY_MS, zone)])];
  const candidates = offsets.map((offset) => target - offset).sort((a, b) => a - b);
  const exact = candidates.find((candidate) => wallClockMs(candidate, zone) === target);
  if (exact !== undefined) return new Date(exact);

  // In a gap: find the first minute whose wall clock is at or past the target.
  let low = candidates[0];
  let high = candidates[candidates.length - 1];
  while (high - low > MINUTE_MS) {
    const mid = low + Math.floor((high - low) / 2 / MINUTE_MS) * MINUTE_MS;
    if (wallClockMs(mid, zone) >= target) high = mid;
    else low = mid;
  }
  return new Date(wallClockMs(low, zone) >= target ? low : high);
}

/** The subscriber's local date: the daily issue whose period_end is this date. */
export function dailyIssueDateFor(now: Date, zone: Zone): string {
  return localClock(now, zone).date;
}

export const DEFAULT_WEEKLY_DAY = 1; // Monday, the day the weekly issue is built

/** 0 (Sunday) to 6, as stored in subscriptions.preferred_day; Monday when unset or invalid. */
export function weeklyDayOf(preferredDay: number | string | null | undefined): number {
  const day = Number(preferredDay);
  return preferredDay !== null && preferredDay !== undefined && preferredDay !== '' && Number.isInteger(day) && day >= 0 && day <= 6
    ? day
    : DEFAULT_WEEKLY_DAY;
}

/**
 * On the subscriber's weekly day, the weekly issue's period_end: the Monday on
 * or before the local date. null on any other day.
 */
export function weeklyIssueDateFor(now: Date, zone: Zone, weeklyDay: number = DEFAULT_WEEKLY_DAY): string | null {
  const clock = localClock(now, zone);
  if (clock.weekday !== weeklyDay) return null;
  const daysSinceMonday = (clock.weekday + 6) % 7;
  return new Date(Date.parse(`${clock.date}T00:00:00.000Z`) - daysSinceMonday * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Due when the local date is the send date (the issue date unless given), the
 * preferred local hour has arrived, the issue is ready, and the grace window
 * (measured from the later of the two) has not run out.
 */
export function isNewsletterDue(o: { now: Date; zone: Zone; preferredHour: number; issueDate: string; issueReadyAt: Date; sendDate?: string }): boolean {
  const sendDate = o.sendDate ?? o.issueDate;
  if (localClock(o.now, o.zone).date !== sendDate) return false;
  const preferred = zonedInstant(sendDate, o.preferredHour, o.zone).getTime();
  const now = o.now.getTime();
  const ready = o.issueReadyAt.getTime();
  if (now < preferred || now < ready) return false;
  return now < Math.max(preferred, ready) + NEWSLETTER_GRACE_MINUTES * MINUTE_MS;
}
