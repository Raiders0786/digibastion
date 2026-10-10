// Cross-provider incident matcher shared by every Web3 importer and the
// dedupe-incidents backfill. Moved from the SlowMist importer so all
// providers agree on what "the same incident" means.
// Pure module: no Deno or URL imports, so vitest can import it.
import { isCalendarDate } from './incident-fields.ts';

export interface DuplicateCandidate {
  uid: string;
  provider: string;
  target: string;
  date: string;
  attackMethod: string | null;
  amountInUsd: number | null;
  reference: string | null;
}

export interface IncidentRow {
  uid: string;
  title: string;
  published_at: string | null;
  source_name?: string | null;
  metadata: unknown;
  // Optional: used only as a source URL fallback for rows without reference_url.
  link?: string | null;
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  };
  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, key: string) => {
    if (key[0] !== '#') return named[key.toLowerCase()] ?? entity;
    const hexadecimal = key[1]?.toLowerCase() === 'x';
    const parsed = Number.parseInt(key.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 0x10ffff
      ? String.fromCodePoint(parsed)
      : entity;
  });
}

function cleanTitle(value: unknown): string {
  return decodeHtmlEntities(String(value ?? '').replace(/<[^>]*>/g, ' '))
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

export function normalizeIncidentTarget(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Titles from older importers look like "Target: method", "Target - $2M" or
// "Target exploited for $2M"; the project name is the part before that.
export function incidentTargetFromTitle(title: unknown): string {
  const text = cleanTitle(title);
  if (!text) return '';
  const boundaries = [
    text.indexOf(':'),
    text.search(/\s[-–—]\s/),
    text.search(/\s+(?:(?:is|was)\s+)?(?:exploited|suffers?|loses?|hit\s+by)\b/i),
  ].filter((index) => index > 0);
  const boundary = boundaries.length ? Math.min(...boundaries) : -1;
  return (boundary > 0 ? text.slice(0, boundary) : text).trim();
}

export function rowProvider(row: IncidentRow): string {
  const provider = metadataRecord(row.metadata).provider;
  if (typeof provider === 'string') return provider.trim().toLowerCase();
  return row.source_name?.trim().toLowerCase() === 'slowmist hacked' ? 'slowmist' : '';
}

export function candidateFromRow(row: IncidentRow): DuplicateCandidate | null {
  const metadata = metadataRecord(row.metadata);
  const metadataTarget = typeof metadata.project_name === 'string' ? metadata.project_name.trim() : '';
  const target = metadataTarget || incidentTargetFromTitle(row.title);
  // When the importer could not parse a date, published_at is the ingestion
  // time, which says nothing about when the incident happened.
  const fallbackDate = metadata.incident_date_unknown === true || typeof row.published_at !== 'string'
    ? ''
    : row.published_at.slice(0, 10);
  const date = isCalendarDate(metadata.incident_date) ? metadata.incident_date : fallbackDate;
  if (!target || !isCalendarDate(date)) return null;
  return {
    uid: row.uid,
    provider: rowProvider(row),
    target,
    date,
    attackMethod: typeof metadata.attack_type === 'string' ? metadata.attack_type : null,
    amountInUsd: typeof metadata.amount_lost_usd === 'number' && Number.isFinite(metadata.amount_lost_usd)
      ? metadata.amount_lost_usd
      : null,
    reference: typeof metadata.reference_url === 'string' ? metadata.reference_url : null,
  };
}

// High confidence only: the same normalized project name, and either the same
// day or within two days with one more matching fact. Fuzzy name matching is
// deliberately out: a wrong merge hides a real incident, which is worse than
// showing a duplicate.
export function isHighConfidenceDuplicate(
  a: Omit<DuplicateCandidate, 'uid' | 'provider'>,
  b: Omit<DuplicateCandidate, 'uid' | 'provider'>,
): boolean {
  if (normalizeIncidentTarget(a.target) !== normalizeIncidentTarget(b.target)) return false;
  const aTime = new Date(`${a.date}T00:00:00.000Z`).getTime();
  const bTime = new Date(`${b.date}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) return false;
  const dayDifference = Math.abs(aTime - bTime) / 86_400_000;
  if (dayDifference === 0) return true;
  if (dayDifference > 2) return false;

  const sameAmount = a.amountInUsd !== null && b.amountInUsd !== null && a.amountInUsd === b.amountInUsd;
  const sameAttackMethod = Boolean(
    a.attackMethod && b.attackMethod &&
    normalizeIncidentTarget(a.attackMethod) === normalizeIncidentTarget(b.attackMethod),
  );
  const sameReference = Boolean(a.reference && b.reference && a.reference === b.reference);
  return sameAmount || sameAttackMethod || sameReference;
}

// QuillMonitor has stable IDs and verification status, so it is the primary
// record; SlowMist is fact-only and last. Unknown providers never win.
export function providerPriority(provider: string): number {
  if (provider === 'quillmonitor') return 0;
  if (provider === 'web3-incidents' || provider === 'web3') return 1;
  if (provider === 'slowmist') return 2;
  return 3;
}

export function pickCanonical<T extends { uid: string; provider: string }>(current: T | undefined, candidate: T): T {
  if (!current) return candidate;
  const priorityDifference = providerPriority(candidate.provider) - providerPriority(current.provider);
  if (priorityDifference < 0) return candidate;
  if (priorityDifference > 0) return current;
  return candidate.uid.localeCompare(current.uid) < 0 ? candidate : current;
}
