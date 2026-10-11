// Subscription preferences shared by the subscribe and manage endpoints, the
// senders and the tests. During the Phase 3 transition `frequency` and the
// wants_* columns coexist; the database trigger
// sync_subscription_delivery_channels (migration 20261013100000) keeps them in
// step, and these helpers use the same priority order.
// Pure module: no Deno or URL imports, so vitest can import it.
import { VALID_NEWS_CATEGORIES } from './news-categories.ts';

export interface DeliveryChannels { realtime: boolean; daily: boolean; weekly: boolean }

export type LegacyFrequency = 'immediate' | 'daily' | 'weekly';

export const CONSENT_SOURCES = ['threat-intel-form', 'quick-subscribe', 'manage', 'resubscribe', 'legacy'] as const;
export type ConsentSource = typeof CONSENT_SOURCES[number];

export const MAX_SUBSCRIPTION_CHAINS = 10;

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;
const CONTENT_SCOPES = ['all', 'web3-incidents'] as const;
const FREQUENCIES: readonly LegacyFrequency[] = ['immediate', 'daily', 'weekly'];
const MAX_CATEGORIES = 10;
const MAX_TECHNOLOGIES = 20;
const MAX_TECHNOLOGY_LENGTH = 50;
const MAX_TIMEZONE_LENGTH = 64;
// Matches the subscriptions.timezone CHECK constraint, so a name Intl accepts
// but the column rejects (EST5EDT, GMT+5) never reaches the database.
const TIMEZONE_PATTERN = /^[A-Za-z]+(\/[A-Za-z0-9_+-]+){0,2}$/;
// Same rule as src/lib/threatIntel/query.ts normalizeFacetValue: letters,
// digits, spaces and . & ( ) + ' / -, at most 64 characters.
const MAX_CHAIN_LENGTH = 64;
const CHAIN_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .&()+'/-]*$/u;
// A payload far over the cap is rejected before normalizing every entry.
const MAX_RAW_CHAINS = 50;

const DEFAULT_PREFERRED_HOUR = 9;
const DEFAULT_TIMEZONE_OFFSET = 0;

export function channelsFromFrequency(frequency: unknown): DeliveryChannels {
  return {
    realtime: frequency === 'immediate',
    daily: frequency === 'daily',
    weekly: frequency === 'weekly',
  };
}

/** Legacy frequency for a channel set: immediate, then daily, then weekly. */
export function frequencyFromChannels(c: DeliveryChannels): LegacyFrequency | null {
  if (c.realtime) return 'immediate';
  if (c.daily) return 'daily';
  if (c.weekly) return 'weekly';
  return null;
}

/**
 * Channels for a subscriptions row. Once the wants_* columns exist they are
 * the truth (all false means no email type); rows read without them fall back
 * to the legacy frequency.
 */
export function readDeliveryChannels(row: { wants_realtime?: unknown; wants_daily?: unknown; wants_weekly?: unknown; frequency?: unknown }): DeliveryChannels {
  const hasChannels = typeof row.wants_realtime === 'boolean' ||
    typeof row.wants_daily === 'boolean' ||
    typeof row.wants_weekly === 'boolean';
  if (!hasChannels) return channelsFromFrequency(row.frequency);
  return {
    realtime: row.wants_realtime === true,
    daily: row.wants_daily === true,
    weekly: row.wants_weekly === true,
  };
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.length > MAX_TIMEZONE_LENGTH || !TIMEZONE_PATTERN.test(value)) return false;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Trim and lower-case a chain name; null when it is not acceptable. */
export function normalizeChain(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === '' || normalized.length > MAX_CHAIN_LENGTH) return null;
  return CHAIN_PATTERN.test(normalized) ? normalized : null;
}

export interface SubscriptionPreferences {
  categories: string[];
  technologies: string[];
  content_scope: 'all' | 'web3-incidents';
  severity_threshold: 'critical' | 'high' | 'medium' | 'low' | 'info';
  channels: DeliveryChannels;
  include_preliminary: boolean;
  chains: string[];
  timezone: string | null;
  timezone_offset: number;
  preferred_hour: number;
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseChannels(input: Record<string, unknown>): ParseResult<DeliveryChannels> {
  const keys = ['wants_realtime', 'wants_daily', 'wants_weekly'] as const;
  const present = keys.filter((key) => input[key] !== undefined);
  if (present.length > 0) {
    if (!present.every((key) => typeof input[key] === 'boolean')) return fail('Invalid email type selection');
    return {
      ok: true,
      value: {
        realtime: input.wants_realtime === true,
        daily: input.wants_daily === true,
        weekly: input.wants_weekly === true,
      },
    };
  }
  // Legacy payload. The old endpoints stored 'daily' when no frequency came in.
  const frequency = input.frequency ?? 'daily';
  if (typeof frequency !== 'string' || !FREQUENCIES.includes(frequency as LegacyFrequency)) {
    return fail('Invalid frequency value');
  }
  return { ok: true, value: channelsFromFrequency(frequency) };
}

function parseChains(raw: unknown): ParseResult<string[]> {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw) || raw.length > MAX_RAW_CHAINS) return fail('Invalid chain selection');
  const chains: string[] = [];
  for (const entry of raw) {
    const chain = normalizeChain(entry);
    if (!chain) return fail('Invalid chain selection');
    if (!chains.includes(chain)) chains.push(chain);
  }
  if (chains.length > MAX_SUBSCRIPTION_CHAINS) return fail(`Choose at most ${MAX_SUBSCRIPTION_CHAINS} chains`);
  return { ok: true, value: chains };
}

function isValidOffset(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -12 && value <= 14 && Number.isInteger(value * 4);
}

/**
 * Validates a subscribe or update payload. Accepts the new shape (wants_*,
 * include_preliminary, chains, timezone) and the legacy one (frequency, plus
 * severity or severity_threshold) so old frontends keep working.
 * preferred_day is not set here: new subscriptions get the column default,
 * Monday, and older ones keep the day they chose on the old form.
 */
export function parseSubscriptionPreferences(input: unknown): ParseResult<SubscriptionPreferences> {
  if (!isRecord(input)) return fail('Invalid request');

  const { categories } = input;
  if (!Array.isArray(categories) || categories.length === 0) return fail('At least one category is required');
  if (categories.length > MAX_CATEGORIES ||
    !categories.every((category) => typeof category === 'string' && VALID_NEWS_CATEGORIES.has(category))) {
    return fail('Invalid security category');
  }

  const technologies = input.technologies ?? [];
  if (!Array.isArray(technologies) || technologies.length > MAX_TECHNOLOGIES ||
    !technologies.every((technology) => typeof technology === 'string' && technology.length <= MAX_TECHNOLOGY_LENGTH)) {
    return fail('Invalid technology preference');
  }

  const severity = input.severity_threshold ?? input.severity ?? 'medium';
  if (typeof severity !== 'string' || !(SEVERITIES as readonly string[]).includes(severity)) {
    return fail('Invalid severity value');
  }

  const scope = input.content_scope ?? 'all';
  if (typeof scope !== 'string' || !(CONTENT_SCOPES as readonly string[]).includes(scope)) {
    return fail('Invalid content scope');
  }

  const channels = parseChannels(input);
  if ('error' in channels) return fail(channels.error);
  if (frequencyFromChannels(channels.value) === null) return fail('Choose at least one email type');

  const includePreliminary = input.include_preliminary ?? true;
  if (typeof includePreliminary !== 'boolean') return fail('Invalid preliminary report preference');

  const chains = parseChains(input.chains);
  if ('error' in chains) return fail(chains.error);

  let timezone: string | null = null;
  if (input.timezone !== undefined && input.timezone !== null && input.timezone !== '') {
    const candidate = typeof input.timezone === 'string' ? input.timezone.trim() : input.timezone;
    if (!isValidTimeZone(candidate)) return fail('Invalid time zone');
    timezone = candidate;
  }

  const preferredHour = input.preferred_hour ?? DEFAULT_PREFERRED_HOUR;
  const timezoneOffset = input.timezone_offset ?? DEFAULT_TIMEZONE_OFFSET;
  if (typeof preferredHour !== 'number' || !Number.isInteger(preferredHour) || preferredHour < 0 || preferredHour > 23 ||
    !isValidOffset(timezoneOffset)) {
    return fail('Invalid delivery schedule');
  }

  return {
    ok: true,
    value: {
      categories: [...categories] as string[],
      technologies: [...technologies] as string[],
      content_scope: scope as SubscriptionPreferences['content_scope'],
      severity_threshold: severity as SubscriptionPreferences['severity_threshold'],
      channels: channels.value,
      include_preliminary: includePreliminary,
      chains: chains.value,
      timezone,
      timezone_offset: timezoneOffset,
      preferred_hour: preferredHour,
    },
  };
}

/** Column values for a subscriptions insert or update, frequency included. */
export function preferencesToColumns(p: SubscriptionPreferences): Record<string, unknown> {
  return {
    categories: p.categories,
    technologies: p.technologies,
    content_scope: p.content_scope,
    severity_threshold: p.severity_threshold,
    wants_realtime: p.channels.realtime,
    wants_daily: p.channels.daily,
    wants_weekly: p.channels.weekly,
    // Never null for parsed preferences: parsing requires one channel.
    frequency: frequencyFromChannels(p.channels) ?? 'daily',
    include_preliminary: p.include_preliminary,
    chains: p.chains,
    timezone: p.timezone,
    timezone_offset: p.timezone_offset,
    preferred_hour: p.preferred_hour,
  };
}
