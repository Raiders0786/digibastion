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
  references?: string[];
}

export interface IncidentRow {
  uid: string;
  title: string;
  published_at: string | null;
  source_name?: string | null;
  metadata: unknown;
  // Optional: used only as a source URL fallback for rows without reference_url.
  link?: string | null;
  source_url?: string | null;
  // Optional: the exact string read, used to guard writes against concurrent changes.
  updated_at?: string | null;
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
  if (!normalizeIncidentTarget(target) || !isCalendarDate(date)) return null;
  let sourceLinks: unknown = [];
  try { sourceLinks = row.source_url ? JSON.parse(row.source_url) : []; } catch { /* legacy plain URL */ }
  const references = [metadata.reference_url, row.link, ...readIncidentFields(metadata).sources.map((source) => source.url),
    ...(Array.isArray(sourceLinks) ? sourceLinks.map((source) => metadataRecord(source).url) : [])]
    .map(incidentReferenceKey).filter((url): url is string => url !== null);
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
    ...(references.length ? { references: [...new Set(references)] } : {}),
  };
}

function incidentReferenceKey(value: unknown): string | null {
  const safe = safeHttpUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'x.com' && host !== 'twitter.com') return null;
  const status = url.pathname.match(/^\/[^/]+\/status\/(\d+)\/?$/);
  return status ? `https://x.com/i/status/${status[1]}` : null;
}

// High confidence only: the same normalized project name, and either the same
// day or within two days with one more matching fact. Fuzzy name matching is
// deliberately out: a wrong merge hides a real incident, which is worse than
// showing a duplicate.
export function isHighConfidenceDuplicate(
  a: Omit<DuplicateCandidate, 'uid' | 'provider'>,
  b: Omit<DuplicateCandidate, 'uid' | 'provider'>,
): boolean {
  const normalizedTarget = normalizeIncidentTarget(a.target);
  if (!normalizedTarget || !normalizeIncidentTarget(b.target)) return false;
  const aTime = new Date(`${a.date}T00:00:00.000Z`).getTime();
  const bTime = new Date(`${b.date}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) return false;
  const dayDifference = Math.abs(aTime - bTime) / 86_400_000;
  if (normalizedTarget !== normalizeIncidentTarget(b.target)) {
    const aReferences = [...(a.references ?? []), incidentReferenceKey(a.reference)].filter(Boolean);
    const bReferences = [...(b.references ?? []), incidentReferenceKey(b.reference)].filter(Boolean);
    return dayDifference === 0 && typeof a.amountInUsd === 'number' && Number.isFinite(a.amountInUsd)
      && a.amountInUsd > 0 && a.amountInUsd <= MAX_PLAUSIBLE_USD && a.amountInUsd === b.amountInUsd
      && aReferences.some((reference) => bReferences.includes(reference));
  }
  if (dayDifference === 0) return true;
  if (dayDifference > 2) return false;

  // A zero or non-finite amount means "no loss reported", not evidence.
  const reported = (amount: number | null): amount is number =>
    typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
  const sameAmount = reported(a.amountInUsd) && reported(b.amountInUsd) && a.amountInUsd === b.amountInUsd;
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

export function isQuillMonitorUid(uid: string | null | undefined): boolean {
  return typeof uid === 'string' && uid.startsWith('quillmonitor:');
}

// Two QuillMonitor rows are one incident only on the exact facts: the same
// project name, the same incident date and the same reported loss. Stricter
// than the cross-provider rule (no nearby days, no shared-post shortcut),
// because one source listing an incident twice is rare and a wrong merge
// hides a real incident. Rows without a usable name, date or loss never match.
function quillMonitorDuplicateKey(row: IncidentRow): string | null {
  if (rowProvider(row) !== 'quillmonitor') return null;
  const candidate = candidateFromRow(row);
  const incidentDate = readIncidentFields(row.metadata).incidentDate;
  if (!candidate || !incidentDate) return null;
  const target = normalizeIncidentTarget(candidate.target);
  const amount = candidate.amountInUsd;
  if (!target || amount === null || !(amount > 0) || amount > MAX_PLAUSIBLE_USD) return null;
  return JSON.stringify([target, incidentDate, amount]);
}

export function isQuillMonitorDuplicate(a: IncidentRow, b: IncidentRow): boolean {
  const key = quillMonitorDuplicateKey(a);
  return key !== null && a.uid !== b.uid && key === quillMonitorDuplicateKey(b);
}

/**
 * Maps each losing QuillMonitor row to the canonical row of its incident.
 * The verified record wins, then the smallest uid, so every run makes the
 * same choice. Rows hidden for other reasons, or marked as a duplicate of a
 * non-QuillMonitor record, take no part.
 */
export function quillMonitorCanonicalOf(rows: IncidentRow[]): Map<string, string> {
  const incidents = new Map<string, IncidentRow[]>();
  for (const row of rows) {
    if (isHiddenForOtherReasons(row)) continue;
    const mark = readIncidentFields(row.metadata).duplicateOfUid;
    if (mark && !isQuillMonitorUid(mark)) continue;
    const key = quillMonitorDuplicateKey(row);
    if (key !== null) incidents.set(key, [...(incidents.get(key) ?? []), row]);
  }
  const rank = (row: IncidentRow) => readIncidentFields(row.metadata).verification === 'verified' ? 0 : 1;
  const canonicalOf = new Map<string, string>();
  for (const members of incidents.values()) {
    if (members.length < 2) continue;
    const [canonical, ...losers] = [...members].sort((a, b) =>
      rank(a) - rank(b) || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
    for (const loser of losers) canonicalOf.set(loser.uid, canonical.uid);
  }
  return canonicalOf;
}

export interface QuillMonitorDuplicatePlan {
  // Every batch uid: the QuillMonitor record its upsert marks it a duplicate
  // of, or null for no mark.
  duplicateOfByUid: Record<string, string | null>;
  // Sources each canonical row in the batch gains from its losing rows.
  sourcesByCanonical: Record<string, IncidentSource[]>;
  // Stored rows outside the batch whose metadata must change: a new or
  // re-pointed mark, a mark that no longer holds, or sources for a canonical
  // row. Write each only after the batch rows in dependsOn are stored.
  // updatedAt is the row's updated_at as read, for a compare-and-swap write.
  updates: { uid: string; metadata: Record<string, unknown>; dependsOn: string[]; updatedAt: string | null }[];
}

/**
 * Same-provider duplicates for one QuillMonitor sync, recomputed on every
 * run from the batch (fresh rows) and the stored QuillMonitor rows in the
 * same date windows, so marks follow QuillMonitor's revisions instead of
 * sticking. Marks on batch rows go into their upsert; stored rows outside the
 * batch get a separate write only when they need one.
 */
export function planQuillMonitorDuplicates(batchRows: IncidentRow[], storedRows: IncidentRow[]): QuillMonitorDuplicatePlan {
  const batchUids = new Set(batchRows.map((row) => row.uid));
  const outside = storedRows.filter((row) => !batchUids.has(row.uid) && rowProvider(row) === 'quillmonitor');
  const rows = [...batchRows, ...outside];
  const loadedUids = new Set(rows.map((row) => row.uid));
  const canonicalOf = quillMonitorCanonicalOf(rows);

  const losersByCanonical = new Map<string, IncidentRow[]>();
  for (const row of rows) {
    const canonical = canonicalOf.get(row.uid);
    if (canonical) losersByCanonical.set(canonical, [...(losersByCanonical.get(canonical) ?? []), row]);
  }
  const loserSources = (uid: string) => (losersByCanonical.get(uid) ?? [])
    .reduce((sources: IncidentSource[], row) => mergeIncidentSources(sources, incidentSourcesFromRow(row)), []);

  const duplicateOfByUid: Record<string, string | null> = {};
  const sourcesByCanonical: Record<string, IncidentSource[]> = {};
  for (const row of batchRows) {
    duplicateOfByUid[row.uid] = canonicalOf.get(row.uid) ?? null;
    if (losersByCanonical.has(row.uid)) sourcesByCanonical[row.uid] = loserSources(row.uid);
  }

  const updates: QuillMonitorDuplicatePlan['updates'] = [];
  for (const row of outside) {
    const metadata = metadataRecord(row.metadata);
    const currentMark = readIncidentFields(metadata).duplicateOfUid;
    // Marks pointing outside QuillMonitor belong to the cross-provider rule.
    if (currentMark && !isQuillMonitorUid(currentMark)) continue;
    const canonical = canonicalOf.get(row.uid);
    const related: string[] = [];
    let next = metadata;
    if (canonical) {
      if (metadata.classification_relevant !== false || metadata.duplicate_of_uid !== canonical) {
        next = duplicateMetadata(metadata, canonical);
        related.push(canonical);
      }
    } else if (currentMark && loadedUids.has(currentMark)) {
      // The marked canonical was loaded and no longer matches. A mark whose
      // canonical was not loaded waits for the sync of that row.
      next = { ...metadata };
      delete next.classification_relevant;
      delete next.duplicate_of_uid;
      related.push(currentMark);
    }
    if (losersByCanonical.has(row.uid)) {
      const merged = mergeIncidentSources(incidentSourcesFromRow(row), loserSources(row.uid));
      if (JSON.stringify(merged) !== JSON.stringify(readIncidentFields(metadata).sources)) {
        next = { ...next, sources: merged };
        related.push(...(losersByCanonical.get(row.uid) ?? []).map((loser) => loser.uid));
      }
    }
    if (next === metadata) continue;
    updates.push({
      uid: row.uid,
      metadata: next,
      dependsOn: [...new Set(related)].filter((uid) => batchUids.has(uid)).sort(),
      updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
    });
  }

  return { duplicateOfByUid, sourcesByCanonical, updates };
}

/**
 * Upsert order for a sync: rows that stay visible first, losing rows last,
 * otherwise as given. With the upsert split into chunks, a canonical row is
 * then written no later than the chunk of any of its losers.
 */
export function orderCanonicalsFirst<T extends { uid: string }>(
  rows: T[],
  duplicateOfByUid: Record<string, string | null>,
): T[] {
  return [
    ...rows.filter((row) => !duplicateOfByUid[row.uid]),
    ...rows.filter((row) => duplicateOfByUid[row.uid]),
  ];
}

/**
 * The QuillMonitor duplicate decision for one row as its chunk is written:
 * the canonical uid once that record exists (availableUids: stored before
 * this sync, written earlier in it, or in the same upsert statement), 'keep'
 * to leave the row's stored mark as it is when the canonical does not exist
 * yet, or null for no mark.
 */
export function quillMonitorMarkForWrite(
  uid: string,
  duplicateOfByUid: Record<string, string | null>,
  availableUids: Set<string>,
): string | null | 'keep' {
  const canonical = duplicateOfByUid[uid];
  if (!canonical) return null;
  return availableUids.has(canonical) ? canonical : 'keep';
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

/**
 * Groups rows into incidents. Each duplicate matches its canonical row
 * directly; there is no chaining (A~B and B~C does not pull in C unless C~A),
 * so repeated incidents at one project a few days apart stay separate.
 * Two QuillMonitor rows merge only under the strict same-provider rule
 * (quillMonitorCanonicalOf), the same one the QuillMonitor sync applies, so
 * the sync keeps the mark instead of overwriting it. A losing QuillMonitor
 * row never heads a group; it joins its canonical row's group.
 */
export function groupDuplicates(rows: IncidentRow[]): { canonical: string; duplicates: string[] }[] {
  const candidates = rows
    .filter((row) => !isHiddenForOtherReasons(row))
    .map(candidateFromRow)
    .filter((candidate): candidate is DuplicateCandidate => candidate !== null)
    .sort((a, b) =>
      providerPriority(a.provider) - providerPriority(b.provider) || a.uid.localeCompare(b.uid));

  // A row already marked as a duplicate may join a group as a duplicate but
  // never heads one. If its marked canonical is outside the loaded set it is
  // left untouched: not a head, not re-pointed, no source updates.
  const loadedUids = new Set(rows.map((row) => row.uid));
  const markedTo = new Map<string, string>();
  for (const row of rows) {
    const duplicateOf = readIncidentFields(row.metadata).duplicateOfUid;
    if (duplicateOf) markedTo.set(row.uid, duplicateOf);
  }
  // QuillMonitor rows are marked only by the same-provider rule; a marked
  // QuillMonitor row that is not a loser under it is left untouched.
  const quillMonitorCanonical = quillMonitorCanonicalOf(rows);
  const heads = candidates.filter((candidate) => !markedTo.has(candidate.uid) && !quillMonitorCanonical.has(candidate.uid));
  const marked = candidates.filter((candidate) => candidate.provider !== 'quillmonitor' &&
    markedTo.has(candidate.uid) && loadedUids.has(markedTo.get(candidate.uid) as string));

  const groups: { canonical: DuplicateCandidate; duplicates: string[] }[] = [];
  const matchingGroup = (candidate: DuplicateCandidate) => groups.find((existing) =>
    !(existing.canonical.provider === 'quillmonitor' && candidate.provider === 'quillmonitor') &&
    isHighConfidenceDuplicate(existing.canonical, candidate));
  for (const candidate of heads) {
    // Sorted by priority then uid, so the first match is also what
    // pickCanonical would choose among the matching groups.
    const group = matchingGroup(candidate);
    if (group) group.duplicates.push(candidate.uid);
    else groups.push({ canonical: candidate, duplicates: [] });
  }
  // A loser whose canonical cannot head a group (it is marked itself) waits
  // for the next QuillMonitor sync, which recomputes both rows.
  for (const [loser, canonical] of quillMonitorCanonical) {
    groups.find((group) => group.canonical.uid === canonical)?.duplicates.push(loser);
  }
  for (const candidate of marked) matchingGroup(candidate)?.duplicates.push(candidate.uid);

  return groups
    .filter((group) => group.duplicates.length > 0)
    .map((group) => ({ canonical: group.canonical.uid, duplicates: [...group.duplicates].sort() }))
    .sort((a, b) => a.canonical.localeCompare(b.canonical));
}

export const MAX_BACKFILL_SAMPLES = 50;

export interface DuplicateBackfillPlan {
  groups: { canonical: string; duplicates: string[] }[];
  marks: DuplicateMark[];
  // Canonical rows whose metadata.sources gain entries from their duplicates.
  canonicalUpdates: { uid: string; metadata: Record<string, unknown> }[];
  samples: { canonical: { uid: string; title: string }; duplicate: { uid: string; title: string } }[];
}

/**
 * Everything the dedupe-incidents backfill would write, computed without
 * touching the database so a dry run can show it for review first.
 */
export function planDuplicateBackfill(rows: IncidentRow[]): DuplicateBackfillPlan {
  const byUid = new Map(rows.map((row) => [row.uid, row]));
  const groups = groupDuplicates(rows);
  const marks: DuplicateMark[] = [];
  const canonicalUpdates: DuplicateBackfillPlan['canonicalUpdates'] = [];
  const samples: DuplicateBackfillPlan['samples'] = [];

  for (const group of groups) {
    const canonical = byUid.get(group.canonical);
    if (!canonical) continue;
    // Start from the canonical row's own source so it stays first.
    let sources = incidentSourcesFromRow(canonical);
    for (const uid of group.duplicates) {
      const row = byUid.get(uid);
      if (!row) continue;
      const metadata = metadataRecord(row.metadata);
      marks.push({
        uid,
        duplicateOfUid: canonical.uid,
        metadata: duplicateMetadata(row.metadata, canonical.uid),
        needsWrite: metadata.classification_relevant !== false || metadata.duplicate_of_uid !== canonical.uid,
      });
      sources = mergeIncidentSources(sources, incidentSourcesFromRow(row));
      if (samples.length < MAX_BACKFILL_SAMPLES) {
        samples.push({
          canonical: { uid: canonical.uid, title: canonical.title },
          duplicate: { uid: row.uid, title: row.title },
        });
      }
    }
    const storedSources = readIncidentFields(canonical.metadata).sources;
    if (JSON.stringify(sources) !== JSON.stringify(storedSources)) {
      canonicalUpdates.push({ uid: canonical.uid, metadata: { ...metadataRecord(canonical.metadata), sources } });
    }
  }

  return { groups, marks, canonicalUpdates, samples };
}
