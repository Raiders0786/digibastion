// Shared contract for the incident fields every Web3 importer, the page and the
// alert channels read from news_articles.metadata. Metadata is jsonb written by
// several importers over time, so every reader goes through this tolerant
// parser instead of trusting key shapes directly.
// Pure module: no Deno or URL imports, so vitest can import it.

export type IncidentSource = { provider: string; url: string | null; label: string; amount_usd: number | null };
export type AmountStatus = 'reported' | 'confirmed' | 'revised';
export type SummaryOrigin = 'ai' | 'publisher' | 'provider';

export interface IncidentFields {
  sources: IncidentSource[];
  duplicateOfUid: string | null;
  summaryOrigin: SummaryOrigin | null;
  amountStatus: AmountStatus | null;
  fundsReturned: boolean | null;
  incidentDate: string | null;
  incidentDateUnknown: boolean;
  verification: 'verified' | 'unverified' | null;
}

// Cards and alerts show every source; ten is far above what any incident has
// today and keeps a runaway merge from bloating the row.
export const MAX_INCIDENT_SOURCES = 10;

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 2_000) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function readSummaryOrigin(value: unknown): SummaryOrigin | null {
  if (value === 'ai' || value === 'publisher' || value === 'provider') return value;
  // SlowMist writes 'provider-template': a sentence built only from provider
  // facts. For the "AI Summary" badge it is provider text, not ours.
  if (value === 'provider-template') return 'provider';
  return null;
}

function readAmountStatus(value: unknown): AmountStatus | null {
  return value === 'reported' || value === 'confirmed' || value === 'revised' ? value : null;
}

function readSource(value: unknown): IncidentSource | null {
  const row = metadataRecord(value);
  const provider = typeof row.provider === 'string' ? row.provider.trim().toLowerCase().slice(0, 60) : '';
  if (!provider) return null;
  const label = typeof row.label === 'string' && row.label.trim()
    ? row.label.trim().slice(0, 120)
    : provider;
  const amount = row.amount_usd;
  return {
    provider,
    // A non-http(s) URL (javascript:, data:) is dropped but the attribution is kept.
    url: safeHttpUrl(row.url),
    label,
    amount_usd: typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 ? amount : null,
  };
}

export function readIncidentFields(metadata: unknown): IncidentFields {
  const meta = metadataRecord(metadata);
  const rawSources = Array.isArray(meta.sources) ? meta.sources : [];
  const parsedSources = rawSources
    .map(readSource)
    .filter((source): source is IncidentSource => source !== null);
  const duplicateOfUid = typeof meta.duplicate_of_uid === 'string' && meta.duplicate_of_uid.trim()
    ? meta.duplicate_of_uid.trim().slice(0, 200)
    : null;
  const verification = meta.verification_status === 'verified' || meta.verification_status === 'unverified'
    ? meta.verification_status
    : null;

  return {
    sources: mergeIncidentSources([], parsedSources),
    duplicateOfUid,
    summaryOrigin: readSummaryOrigin(meta.summary_origin),
    amountStatus: readAmountStatus(meta.amount_status),
    fundsReturned: typeof meta.funds_returned === 'boolean' ? meta.funds_returned : null,
    incidentDate: isCalendarDate(meta.incident_date) ? meta.incident_date : null,
    incidentDateUnknown: meta.incident_date_unknown === true,
    verification,
  };
}

// First occurrence wins so the canonical provider's own entry keeps its
// position and amount when duplicates contribute the same link again.
export function mergeIncidentSources(existing: IncidentSource[], incoming: IncidentSource[]): IncidentSource[] {
  const merged: IncidentSource[] = [];
  const seen = new Set<string>();
  for (const source of [...existing, ...incoming]) {
    const key = `${source.provider}|${source.url ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(source);
    if (merged.length >= MAX_INCIDENT_SOURCES) break;
  }
  return merged;
}
