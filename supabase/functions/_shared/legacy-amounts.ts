// Repair plan for loss figures written by the old web3-incidents importer.
// That importer read "$50,000" as 50,000 million dollars ("$50000M") and rated
// the row critical. The dedupe-incidents function runs this plan on request.
// Pure module: no Deno or URL imports, so vitest can import it.
import { severityFromLoss, type IncidentSeverity } from './incident-severity.ts';
import { formatUsd } from './quillmonitor.ts';
import { parseUsdAmount } from './usd-amount.ts';

/** Stamped on a row once its amount has been read by the current parser. */
export const AMOUNT_PARSER_VERSION = 'v2';
export const MAX_LEGACY_AMOUNT_SAMPLES = 20;

const LEGACY_PROVIDERS = new Set(['web3-incidents', 'web3']);

function metadataRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/**
 * True for a web3-incidents row whose loss figure came from the old parser.
 * The new importer always writes incident_date_unknown, and the repair stamps
 * amount_parser 'v2', so either one marks the figure as trustworthy.
 */
export function isLegacyAmountMetadata(value: unknown): boolean {
  const metadata = metadataRecord(value);
  if (!metadata) return false;
  return typeof metadata.provider === 'string'
    && LEGACY_PROVIDERS.has(metadata.provider)
    && !('incident_date_unknown' in metadata)
    && metadata.amount_parser !== AMOUNT_PARSER_VERSION;
}

export interface LegacyAmountRow {
  uid: string;
  title: string | null;
  summary?: string | null;
  content?: string | null;
  tags?: string[] | null;
  severity?: string | null;
  metadata: unknown;
}

export interface LegacyAmountRepair {
  uid: string;
  /** The row's full metadata with the re-parsed amount and the v2 stamp. */
  metadata: Record<string, unknown>;
  severity: IncidentSeverity;
}

interface AmountSnapshot {
  amountUsd: number | null;
  amountDisplay: string | null;
  severity: string | null;
}

export interface LegacyAmountSample {
  uid: string;
  title: string;
  before: AmountSnapshot;
  after: AmountSnapshot;
}

export interface LegacyAmountPlan {
  /** Legacy rows found. Every one gets a repair so a rerun finds none. */
  legacyRows: number;
  /** Repairs that change the loss figure or the severity. */
  changed: number;
  repairs: LegacyAmountRepair[];
  /** Up to MAX_LEGACY_AMOUNT_SAMPLES of the changed rows, for review. */
  samples: LegacyAmountSample[];
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const finiteOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export function planLegacyAmountRepairs(rows: readonly LegacyAmountRow[]): LegacyAmountPlan {
  const plan: LegacyAmountPlan = { legacyRows: 0, changed: 0, repairs: [], samples: [] };

  for (const row of rows) {
    if (!isLegacyAmountMetadata(row.metadata)) continue;
    plan.legacyRows++;
    const original = metadataRecord(row.metadata) ?? {};

    // Title first: it usually carries the headline figure. The summary and
    // content are read separately so a later figure never wins over an earlier one.
    const amount = parseUsdAmount(text(row.title))
      ?? parseUsdAmount(text(row.summary))
      ?? parseUsdAmount(text(row.content));
    const tags = Array.isArray(row.tags) ? row.tags.filter((tag) => typeof tag === 'string') : [];
    const attackText = [text(original.attack_type), ...tags].filter(Boolean).join(' ');
    const severity = severityFromLoss(amount, attackText);

    const metadata: Record<string, unknown> = { ...original };
    if (amount === null) {
      delete metadata.amount_lost_usd;
      delete metadata.amount_display;
    } else {
      metadata.amount_lost_usd = amount;
      metadata.amount_display = formatUsd(amount);
    }
    metadata.amount_parser = AMOUNT_PARSER_VERSION;
    plan.repairs.push({ uid: row.uid, metadata, severity });

    const before: AmountSnapshot = {
      amountUsd: finiteOrNull(original.amount_lost_usd),
      amountDisplay: typeof original.amount_display === 'string' ? original.amount_display : null,
      severity: typeof row.severity === 'string' ? row.severity : null,
    };
    const after: AmountSnapshot = {
      amountUsd: amount,
      amountDisplay: amount === null ? null : formatUsd(amount),
      severity,
    };
    const changed = before.amountUsd !== after.amountUsd
      || before.amountDisplay !== after.amountDisplay
      || before.severity !== after.severity;
    if (!changed) continue;
    plan.changed++;
    if (plan.samples.length < MAX_LEGACY_AMOUNT_SAMPLES) {
      plan.samples.push({ uid: row.uid, title: text(row.title), before, after });
    }
  }

  return plan;
}
