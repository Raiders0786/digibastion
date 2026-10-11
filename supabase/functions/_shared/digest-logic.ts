export const severityRank: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export const MAX_DIGEST_ARTICLES = 20;

export function normalizeUtcMinuteToQuarterHour(minute: number): number {
  return Math.floor(minute / 15) * 15;
}

interface DigestArticle {
  title: string;
  severity: string;
  link: string;
  published_at: string;
  cve_id?: string | null;
}

interface DigestSchedule {
  frequency: string;
  preferred_hour: number;
  timezone_offset: number;
  preferred_day: number;
}

export function prepareDigestArticles<T extends DigestArticle>(articles: T[], limit = MAX_DIGEST_ARTICLES): T[] {
  const seen = new Set<string>();
  return [...articles]
    .sort((left, right) => {
      const severityDifference = (severityRank[left.severity] ?? 4) - (severityRank[right.severity] ?? 4);
      return severityDifference || new Date(right.published_at).getTime() - new Date(left.published_at).getTime();
    })
    .filter((article) => {
      const normalizedCve = article.cve_id?.trim().toUpperCase();
      const normalizedLink = article.link?.trim().replace(/\/$/, '').toLowerCase();
      const normalizedTitle = article.title.replace(/<[^>]*>/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const key = normalizedCve ? `cve:${normalizedCve}` : normalizedLink ? `url:${normalizedLink}` : `title:${normalizedTitle}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function shouldSendToSubscriber(
  sub: DigestSchedule,
  currentUtcHour: number,
  currentUtcMinute: number,
  currentUtcDay: number,
): boolean {
  const preferredHour = sub.preferred_hour ?? 9;
  const timezoneOffset = sub.timezone_offset ?? 0;
  const preferredDay = sub.preferred_day ?? 0;
  const utcMinutes = currentUtcHour * 60 + currentUtcMinute;
  const unwrappedLocalMinutes = utcMinutes + Math.round(timezoneOffset * 60);
  const localMinutes = ((unwrappedLocalMinutes % 1440) + 1440) % 1440;

  if (Math.floor(localMinutes / 60) !== preferredHour || localMinutes % 60 !== 0) return false;
  if (sub.frequency !== 'weekly') return true;

  const dayDelta = Math.floor(unwrappedLocalMinutes / 1440);
  const subscriberLocalDay = ((currentUtcDay + dayDelta) % 7 + 7) % 7;
  return subscriberLocalDay === preferredDay;
}

const DAY_MS = 86_400_000;

/** How many other updates a quiet-day digest shows. */
export const QUIET_DAY_HIGHLIGHTS = 3;

/**
 * Earliest published_at a digest accepts. Articles are picked by when we
 * ingested them, so a report that arrives late (after a feed outage, say)
 * still goes out once; this floor only keeps very old backfills out.
 */
export function digestPublishedFloor(now: Date, frequency: string): Date {
  return new Date(now.getTime() - (frequency === 'weekly' ? 14 : 7) * DAY_MS);
}

const SEVERITY_FILTER_LABELS: Record<string, string> = {
  critical: 'critical severity only',
  high: 'high severity and above',
  medium: 'medium severity and above',
};

const CATEGORY_LABELS: Record<string, string> = {
  'web3-security': 'Web3 security',
  'defi-exploits': 'DeFi exploits',
  'operational-security': 'OpSec',
  'supply-chain': 'supply chain',
  'personal-protection': 'personal security',
  'vulnerability-disclosure': 'vulnerabilities',
  'tools-reviews': 'tools',
};

/** "high severity and above in DeFi exploits, Web3 security and vulnerabilities", for the quiet-day note. */
export function describeDigestFilters(sub: {
  severity_threshold?: string | null;
  categories?: string[] | null;
  content_scope?: string | null;
}): string {
  const severity = SEVERITY_FILTER_LABELS[sub.severity_threshold || 'medium'] ?? 'all severities';
  if (sub.content_scope === 'web3-incidents') return `${severity}, Web3 incidents only`;
  const labels = [...new Set((sub.categories || []).map((category) => CATEGORY_LABELS[category] ?? category))];
  if (labels.length === 0) return `${severity} in every category`;
  const list = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  return `${severity} in ${list}`;
}
