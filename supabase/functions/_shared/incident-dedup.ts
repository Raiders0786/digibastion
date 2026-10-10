// Cross-provider incident matcher shared by every Web3 importer and the
// dedupe-incidents backfill. Moved from the SlowMist importer so all
// providers agree on what "the same incident" means.
// Pure module: no Deno or URL imports, so vitest can import it.
import {
  isCalendarDate,
  mergeIncidentSources,
  readIncidentFields,
  safeHttpUrl,
  type IncidentSource,
} from './incident-fields.ts';

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

// Labels for rows whose source_name is empty (web3-incidents stores null).
const PROVIDER_LABELS: Record<string, string> = {
  quillmonitor: 'QuillMonitor',
  'web3-incidents': 'Web3 incident tracker',
  web3: 'Web3 incident tracker',
  slowmist: 'SlowMist Hacked',
};

// Legacy web3-incidents rows stored some amounts a million times too large;
// never copy those into another record's sources.
const MAX_PLAUSIBLE_USD = 100_000_000_000;

// The sources a row contributes when it is merged into another record: its
// own metadata.sources when present, otherwise one entry built from its fields.
export function incidentSourcesFromRow(row: IncidentRow): IncidentSource[] {
  const fields = readIncidentFields(row.metadata);
  if (fields.sources.length > 0) {
    return fields.sources.map((source) => ({
      ...source,
      amount_usd: source.amount_usd !== null && source.amount_usd <= MAX_PLAUSIBLE_USD ? source.amount_usd : null,
    }));
  }
  const metadata = metadataRecord(row.metadata);
  const provider = rowProvider(row) || 'unknown';
  const amount = metadata.amount_lost_usd;
  return [{
    provider,
    url: safeHttpUrl(metadata.reference_url) ?? safeHttpUrl(row.link),
    label: row.source_name?.trim() || PROVIDER_LABELS[provider] || provider,
    amount_usd: typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 && amount <= MAX_PLAUSIBLE_USD
      ? amount
      : null,
  }];
}

// Rows that some other rule already hid (classification_relevant=false with
// no duplicate_of_uid) are not incidents we show, so they never take part.
function isHiddenForOtherReasons(row: IncidentRow): boolean {
  const metadata = metadataRecord(row.metadata);
  return metadata.classification_relevant === false && typeof metadata.duplicate_of_uid !== 'string';
}

export interface DuplicateMark {
  uid: string;
  duplicateOfUid: string;
  // Full metadata to write: the row's own metadata plus the duplicate fields.
  metadata: Record<string, unknown>;
  // False when the row is already marked exactly this way.
  needsWrite: boolean;
}

export interface CanonicalMergePlan {
  marks: DuplicateMark[];
  sourcesByCanonical: Record<string, IncidentSource[]>;
}

export function duplicateMetadata(metadata: unknown, duplicateOfUid: string): Record<string, unknown> {
  return { ...metadataRecord(metadata), classification_relevant: false, duplicate_of_uid: duplicateOfUid };
}

/**
 * For a batch of canonical rows (QuillMonitor), finds lower-priority rows that
 * describe the same incident. Returns the marks to write on those rows and the
 * sources each canonical row should carry. Rows already marked as a duplicate
 * of a record outside this batch are left alone.
 */
export function planCanonicalMerges(canonicalRows: IncidentRow[], candidateRows: IncidentRow[]): CanonicalMergePlan {
  const canonicals = canonicalRows
    .map(candidateFromRow)
    .filter((candidate): candidate is DuplicateCandidate => candidate !== null);
  const canonicalUids = new Set(canonicals.map((candidate) => candidate.uid));
  const marks: DuplicateMark[] = [];
  const sourcesByCanonical: Record<string, IncidentSource[]> = {};

  for (const row of candidateRows) {
    if (canonicalUids.has(row.uid) || isHiddenForOtherReasons(row)) continue;
    const existingMark = readIncidentFields(row.metadata).duplicateOfUid;
    if (existingMark && !canonicalUids.has(existingMark)) continue;
    const candidate = candidateFromRow(row);
    if (!candidate) continue;

    let canonical: DuplicateCandidate | undefined;
    for (const option of canonicals) {
      if (providerPriority(option.provider) >= providerPriority(candidate.provider)) continue;
      if (isHighConfidenceDuplicate(option, candidate)) canonical = pickCanonical(canonical, option);
    }
    if (!canonical) continue;

    const metadata = metadataRecord(row.metadata);
    marks.push({
      uid: row.uid,
      duplicateOfUid: canonical.uid,
      metadata: duplicateMetadata(row.metadata, canonical.uid),
      needsWrite: metadata.classification_relevant !== false || metadata.duplicate_of_uid !== canonical.uid,
    });
    sourcesByCanonical[canonical.uid] = mergeIncidentSources(
      sourcesByCanonical[canonical.uid] ?? [],
      incidentSourcesFromRow(row),
    );
  }

  return { marks, sourcesByCanonical };
}

/**
 * Returns the uid of an existing record that already describes this incident
 * and comes from the same or a higher-priority provider, or null. Importers
 * skip the insert when this returns a uid. Rows hidden for other reasons and
 * the incident's own uid never count.
 */
export function matchExistingIncident(incident: IncidentRow, existingRows: IncidentRow[]): string | null {
  const candidate = candidateFromRow(incident);
  if (!candidate) return null;
  const ownPriority = providerPriority(candidate.provider);
  let best: DuplicateCandidate | undefined;
  for (const row of existingRows) {
    if (row.uid === incident.uid || isHiddenForOtherReasons(row)) continue;
    const existing = candidateFromRow(row);
    if (!existing || providerPriority(existing.provider) > ownPriority) continue;
    if (isHighConfidenceDuplicate(existing, candidate)) best = pickCanonical(best, existing);
  }
  return best?.uid ?? null;
}

export function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString();
}

/**
 * Turns incident dates into the published_at ranges ([from, to), ISO) that can
 * hold a match: two days either side, overlapping ranges merged. Lets a batch
 * spanning months query a few narrow windows instead of everything between.
 */
export function incidentDateWindows(dates: string[]): { from: string; to: string }[] {
  const sorted = [...new Set(dates.filter(isCalendarDate))].sort();
  const windows: { from: string; to: string }[] = [];
  for (const date of sorted) {
    const from = shiftDate(date, -2);
    const to = shiftDate(date, 3);
    const last = windows[windows.length - 1];
    if (last && from <= last.to) last.to = to;
    else windows.push({ from, to });
  }
  return windows;
}
