import type { NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';
import { MAX_FACET_SELECTIONS, normalizeFacetValue, type VerificationFilter } from '@/lib/threatIntel/query';
import { SEVERITY_LEVELS, isNewsCategory } from '@/lib/threatIntel/taxonomy';
import { getBrowserTimeZone, getDefaultTimezoneOffset } from '@/lib/digestSchedule';

/** What the subscribe form, the quick card and the manage page edit. */
export interface SubscriptionFormState {
  categories: string[];
  technologies: string[];
  scope: ThreatIntelScope;
  severity: SeverityLevel;
  realtime: boolean;
  daily: boolean;
  weekly: boolean;
  includePreliminary: boolean;
  chains: string[];
  preferredHour: number;
  timezone: string | null;
  timezoneOffset: number;
}

export type SubscriptionConsentSource = 'threat-intel-form' | 'quick-subscribe' | 'manage';

/** Same cap as the subscriptions.chains CHECK and MAX_SUBSCRIPTION_CHAINS. */
export const MAX_SUBSCRIPTION_CHAINS = 10;
const DEFAULT_PREFERRED_HOUR = 9;

export const DEFAULT_SUBSCRIPTION_FORM_STATE: Readonly<SubscriptionFormState> = Object.freeze({
  categories: [],
  technologies: [],
  scope: 'all',
  severity: 'medium',
  realtime: false,
  daily: true,
  weekly: false,
  includePreliminary: true,
  chains: [],
  preferredHour: DEFAULT_PREFERRED_HOUR,
  timezone: null,
  timezoneOffset: 0,
});

/** The defaults with the viewer's detected timezone filled in. */
export function defaultFormStateForBrowser(): SubscriptionFormState {
  return {
    ...DEFAULT_SUBSCRIPTION_FORM_STATE,
    categories: [],
    technologies: [],
    chains: [],
    timezone: getBrowserTimeZone(),
    timezoneOffset: getDefaultTimezoneOffset(),
  };
}

/** Same wording as the API (parseSubscriptionPreferences). */
export const CHANNEL_REQUIRED_MESSAGE = 'Choose at least one email type';

type ChannelChoice = Pick<SubscriptionFormState, 'realtime' | 'daily' | 'weekly'>;

export function hasDeliveryChannel(s: ChannelChoice): boolean {
  return s.realtime || s.daily || s.weekly;
}

/** Names of the chosen email types, in a fixed order. */
export function describeFormChannels(s: ChannelChoice): string[] {
  const names: string[] = [];
  if (s.realtime) names.push('Real-time alerts');
  if (s.daily) names.push('Daily brief');
  if (s.weekly) names.push('Weekly deep-dive');
  return names;
}

/**
 * Body for submit-form (inside `data`) or update-subscription. Chains only
 * filter the Web3 incidents view, so other scopes send none.
 */
export function buildSubscriptionPayload(
  s: SubscriptionFormState,
  consentSource: SubscriptionConsentSource,
): Record<string, unknown> {
  return {
    categories: s.categories,
    technologies: s.technologies,
    content_scope: s.scope,
    severity_threshold: s.severity,
    wants_realtime: s.realtime,
    wants_daily: s.daily,
    wants_weekly: s.weekly,
    include_preliminary: s.includePreliminary,
    chains: s.scope === 'web3-incidents' ? s.chains : [],
    timezone: s.timezone,
    timezone_offset: s.timezoneOffset,
    preferred_hour: s.preferredHour,
    ...(consentSource === 'manage' ? {} : { consent_source: consentSource }),
  };
}

function normalizeChains(values: readonly unknown[] | null | undefined): string[] {
  const chains: string[] = [];
  for (const value of values ?? []) {
    const chain = normalizeFacetValue(value);
    if (chain && !chains.includes(chain)) chains.push(chain);
    if (chains.length === MAX_SUBSCRIPTION_CHAINS) break;
  }
  return chains;
}

/**
 * Form defaults for "Subscribe to this view". The confirmed-only view turns
 * unconfirmed reports off; a link from the weekly page checks only the weekly.
 */
export function initialStateFromView(o: {
  categories?: string[];
  scope?: ThreatIntelScope;
  chains?: string[];
  verification?: VerificationFilter;
  weekly?: boolean;
}): Partial<SubscriptionFormState> {
  const state: Partial<SubscriptionFormState> = {};
  if (o.scope) state.scope = o.scope;
  if (o.categories) state.categories = [...o.categories];
  if (o.chains) state.chains = normalizeChains(o.chains);
  if (o.verification === 'confirmed') state.includePreliminary = false;
  if (o.verification === 'unconfirmed') state.includePreliminary = true;
  if (o.weekly) Object.assign(state, { realtime: false, daily: false, weekly: true });
  return state;
}

const bool = (value: unknown): value is boolean => typeof value === 'boolean';

/** Form state for a get-subscription row; wants_* win over the legacy frequency. */
export function stateFromSubscription(row: Record<string, unknown>): SubscriptionFormState {
  const hasChannels = bool(row.wants_realtime) || bool(row.wants_daily) || bool(row.wants_weekly);
  const severity = SEVERITY_LEVELS.find((level) => level === row.severity_threshold) ?? 'medium';
  const categories = Array.isArray(row.categories) ? row.categories.filter(isNewsCategory) : [];
  const technologies = Array.isArray(row.technologies)
    ? row.technologies.filter((value): value is string => typeof value === 'string')
    : [];
  return {
    categories: categories as NewsCategory[],
    technologies,
    scope: row.content_scope === 'web3-incidents' ? 'web3-incidents' : 'all',
    severity,
    realtime: hasChannels ? row.wants_realtime === true : row.frequency === 'immediate',
    daily: hasChannels ? row.wants_daily === true : row.frequency === 'daily',
    weekly: hasChannels ? row.wants_weekly === true : row.frequency === 'weekly',
    includePreliminary: row.include_preliminary !== false,
    chains: Array.isArray(row.chains) ? normalizeChains(row.chains) : [],
    preferredHour: typeof row.preferred_hour === 'number' ? row.preferred_hour : DEFAULT_PREFERRED_HOUR,
    timezone: typeof row.timezone === 'string' && row.timezone ? row.timezone : null,
    timezoneOffset: typeof row.timezone_offset === 'number' ? row.timezone_offset : 0,
  };
}
