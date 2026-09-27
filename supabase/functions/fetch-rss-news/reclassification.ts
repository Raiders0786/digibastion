import type { RelevanceResult } from '../_shared/rss-classifier.ts';

export interface RssIngestionRequest {
  mode: 'sync' | 'reclassify';
  dryRun: boolean;
  batchSize: number;
  offset: number;
}

interface ReclassificationRow {
  category: string;
  tags: string[] | null;
  metadata: unknown;
}

const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 250;
const MAX_OFFSET = 100_000;

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function parseRssIngestionRequest(value: unknown): RssIngestionRequest {
  const body = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const mode = body.mode === 'reclassify' ? 'reclassify' : 'sync';

  return {
    mode,
    // Reclassification is deliberately opt-in for writes. Missing, invalid,
    // or true values all remain a dry run.
    dryRun: mode === 'reclassify' ? (body.dryRun ?? body.dry_run) !== false : false,
    batchSize: boundedInteger(body.batchSize ?? body.batch_size, DEFAULT_BATCH_SIZE, 1, MAX_BATCH_SIZE),
    offset: boundedInteger(body.offset, 0, 0, MAX_OFFSET),
  };
}

export function buildRssReclassificationPatch(
  row: ReclassificationRow,
  result: RelevanceResult,
) {
  const oldMetadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : {};
  const tags = result.matchedKeywords.slice(0, 10);
  const category = result.relevant ? result.category : row.category;
  const metadata = {
    ...oldMetadata,
    provider: 'rss',
    security_domain: result.securityDomain,
    is_web3_incident: false,
    matched_keywords: tags,
    classification_weight: result.weight,
    classification_relevant: result.relevant,
    taxonomy_version: result.taxonomyVersion,
    classification_reasons: result.classificationReasons,
  };

  const categoryChanged = category !== row.category;
  const tagsChanged = JSON.stringify(tags) !== JSON.stringify(row.tags || []);
  const metadataChanged = JSON.stringify(metadata) !== JSON.stringify(oldMetadata);

  return {
    changed: categoryChanged || tagsChanged || metadataChanged,
    categoryChanged,
    tagsChanged,
    metadataChanged,
    patch: { category, tags, metadata },
  };
}
