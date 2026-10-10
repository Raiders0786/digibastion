import { AlertTriangle, Info, Zap, type LucideIcon } from 'lucide-react';
import type { NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';

/**
 * Single source for Threat Intel categories, severities and scopes.
 * The server copy of the category list lives in
 * supabase/functions/_shared/news-categories.ts; threatIntelTaxonomy.test.ts
 * fails if the two drift.
 */

export interface CategoryConfig {
  name: string;
  description: string;
  color: string;
}

// Record<NewsCategory, ...> makes the compiler reject a missing category.
// Key order is the display order for filter chips and subscription options.
export const NEWS_CATEGORY_CONFIG: Readonly<Record<NewsCategory, CategoryConfig>> = {
  'operational-security': {
    name: 'Operational Security',
    description: 'OPSEC best practices and privacy protection',
    color: 'text-red-400',
  },
  'supply-chain': {
    name: 'Supply Chain Security',
    description: 'Dependency and package security',
    color: 'text-orange-400',
  },
  'personal-protection': {
    name: 'Personal Protection',
    description: 'Individual security measures',
    color: 'text-blue-400',
  },
  'web3-security': {
    name: 'Web3 Security',
    description: 'All Web3 and blockchain security, including DeFi incidents',
    color: 'text-purple-400',
  },
  'defi-exploits': {
    name: 'DeFi Exploits',
    description: 'DeFi protocol vulnerabilities',
    color: 'text-pink-400',
  },
  'vulnerability-disclosure': {
    name: 'Vulnerability Disclosure',
    description: 'CVE announcements and patches',
    color: 'text-yellow-400',
  },
  'tools-reviews': {
    name: 'Tools & Reviews',
    description: 'Security tool analysis',
    color: 'text-green-400',
  },
};

export const NEWS_CATEGORIES: readonly NewsCategory[] = Object.freeze(
  Object.keys(NEWS_CATEGORY_CONFIG) as NewsCategory[],
);

export const SEVERITY_LEVELS: readonly SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'info'];

/** URL values for the top-level view. No `scope` param means DEFAULT_SCOPE. */
export const THREAT_INTEL_SCOPES = ['web3-incidents', 'all'] as const satisfies readonly ThreatIntelScope[];

export const DEFAULT_SCOPE: ThreatIntelScope = 'web3-incidents';

const hasOwn = (record: object, key: string): boolean => Object.prototype.hasOwnProperty.call(record, key);

export function isNewsCategory(value: unknown): value is NewsCategory {
  return typeof value === 'string' && hasOwn(NEWS_CATEGORY_CONFIG, value);
}

export function isSeverityLevel(value: unknown): value is SeverityLevel {
  return typeof value === 'string' && (SEVERITY_LEVELS as readonly string[]).includes(value);
}

/** `?scope=all` shows all security news; anything else (or nothing) is the Web3 incidents view. */
export function parseScope(value: string | null): ThreatIntelScope {
  return value !== null && (THREAT_INTEL_SCOPES as readonly string[]).includes(value)
    ? (value as ThreatIntelScope)
    : DEFAULT_SCOPE;
}

/** Parse a comma-separated URL param, keeping allowed values once, in URL order. */
export function parseListParam<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  if (!value) return [];
  const allowedValues = new Set<string>(allowed);
  const result: T[] = [];
  for (const raw of value.split(',')) {
    const item = raw.trim();
    if (allowedValues.has(item) && !result.includes(item as T)) result.push(item as T);
  }
  return result;
}

function humanizeSlug(value: string): string {
  return value
    .slice(0, 40)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Display config for any category string. Rows from older importers can carry
 * categories outside NewsCategory; they get a neutral badge instead of
 * crashing the card (previously NewsCard.tsx:80 and NewsDetail.tsx:180).
 */
export function getCategoryConfig(category: string): CategoryConfig {
  if (isNewsCategory(category)) return NEWS_CATEGORY_CONFIG[category];
  const name = typeof category === 'string' ? humanizeSlug(category) : '';
  return {
    name: name || 'Uncategorized',
    description: 'Security news outside the standard categories',
    color: 'text-muted-foreground',
  };
}

export interface SeverityStyle {
  label: string;
  /** 0 = most severe. Mirrors the ORDER BY in search_news_articles(sort_by => 'severity'). */
  rank: number;
  icon: LucideIcon;
  /** Icon colour. */
  iconClass: string;
  /** Plain text colour (stat tiles, select items). */
  textClass: string;
  /** Soft outlined badge (cards, filter chips). */
  badgeClass: string;
  /** Filled badge (alerts list). */
  solidBadgeClass: string;
  /** Border and text only (related articles). */
  outlineClass: string;
  /** Card accent class defined in src/index.css. */
  cardClass: string;
}

export const SEVERITY_STYLES: Readonly<Record<SeverityLevel, SeverityStyle>> = {
  critical: {
    label: 'Critical',
    rank: 0,
    icon: AlertTriangle,
    iconClass: 'text-red-500',
    textClass: 'text-red-400',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    solidBadgeClass: 'bg-red-500 text-white',
    outlineClass: 'border-red-500/50 text-red-400',
    cardClass: 'severity-critical',
  },
  high: {
    label: 'High',
    rank: 1,
    icon: Zap,
    iconClass: 'text-orange-500',
    textClass: 'text-orange-400',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    solidBadgeClass: 'bg-orange-500 text-white',
    outlineClass: 'border-orange-500/50 text-orange-400',
    cardClass: 'severity-high',
  },
  medium: {
    label: 'Medium',
    rank: 2,
    icon: Info,
    iconClass: 'text-yellow-500',
    textClass: 'text-yellow-400',
    badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    solidBadgeClass: 'bg-yellow-500 text-black',
    outlineClass: 'border-yellow-500/50 text-yellow-400',
    cardClass: 'severity-medium',
  },
  low: {
    label: 'Low',
    rank: 3,
    icon: Info,
    iconClass: 'text-blue-500',
    textClass: 'text-blue-400',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    solidBadgeClass: 'bg-blue-500 text-white',
    outlineClass: 'border-blue-500/50 text-blue-400',
    cardClass: 'severity-low',
  },
  info: {
    label: 'Info',
    rank: 4,
    icon: Info,
    iconClass: 'text-blue-500',
    textClass: 'text-muted-foreground',
    badgeClass: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    solidBadgeClass: 'bg-gray-500 text-white',
    outlineClass: 'border-muted text-muted-foreground',
    cardClass: 'glass-card',
  },
};

export function getSeverityStyle(severity: string): SeverityStyle {
  return isSeverityLevel(severity) ? SEVERITY_STYLES[severity] : SEVERITY_STYLES.info;
}
