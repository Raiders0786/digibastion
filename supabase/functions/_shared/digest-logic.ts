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
