// Which news_articles rows may be listed, fed or pinged. Mirrors
// src/utils/newsIncident.ts and isPublishable() in src/lib/threatIntel/articleRow.ts;
// src/utils/__tests__/publishableParity.test.ts keeps them identical.
// Pure module: no Deno or URL imports.

/** Not rejected by the classifier and not merged into another record. */
export const PUBLISHABLE_POSTGREST_FILTER =
  'and(or(metadata->>classification_relevant.is.null,metadata->>classification_relevant.neq.false),metadata->>duplicate_of_uid.is.null)';

/** A Web3 incident, including legacy rows written before the flag existed. */
export const WEB3_INCIDENT_POSTGREST_FILTER = [
  'metadata->>is_web3_incident.eq.true',
  'and(metadata->>is_web3_incident.is.null,metadata->>provider.in.(quillmonitor,web3-incidents,web3))',
].join(',');

/** Publishable AND a Web3 incident, as one group: use `.or(INDEXABLE_INCIDENT_POSTGREST_FILTER)`. */
export const INDEXABLE_INCIDENT_POSTGREST_FILTER =
  'and(or(metadata->>classification_relevant.is.null,metadata->>classification_relevant.neq.false),' +
  `metadata->>duplicate_of_uid.is.null,or(${WEB3_INCIDENT_POSTGREST_FILTER}))`;

/** Article ids that are safe in a URL path and a file name. */
export const SAFE_ARTICLE_ID = /^[A-Za-z0-9_-]{1,128}$/;
/** A weekly issue's Monday, YYYY-MM-DD. */
export const WEEK_START = /^\d{4}-\d{2}-\d{2}$/;

const LEGACY_INCIDENT_PROVIDERS = new Set(['quillmonitor', 'web3-incidents', 'web3']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPublishableMetadata(metadata: unknown): boolean {
  if (!isRecord(metadata)) return true;
  if (metadata.classification_relevant === false || metadata.classification_relevant === 'false') return false;
  return metadata.duplicate_of_uid === undefined || metadata.duplicate_of_uid === null;
}

/** Second guard after INDEXABLE_INCIDENT_POSTGREST_FILTER: same rule, in code. */
export function isIndexableIncidentMetadata(metadata: unknown): boolean {
  if (!isRecord(metadata) || !isPublishableMetadata(metadata)) return false;
  const flag = metadata.is_web3_incident;
  if (flag === true || flag === 'true') return true;
  if (flag === undefined || flag === null) return LEGACY_INCIDENT_PROVIDERS.has(String(metadata.provider ?? ''));
  return false;
}
