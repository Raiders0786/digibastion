import { classifyWeb3Incident } from './web3-taxonomy.ts';

export const SLOWMIST_PAGE_URL = 'https://hacked.slowmist.io/en/';
export const SLOWMIST_EXPECTED_PAGE_SIZE = 20;

export interface SlowMistIncident {
  target: string;
  date: string;
  attackMethod: string;
  amountInUsd: number | null;
  reference: string;
}

export interface ParsedSlowMistPage {
  recordsFound: number;
  invalidRecords: number;
  incidents: SlowMistIncident[];
}

export interface SlowMistDuplicateCandidate {
  target: string;
  date: string;
  attackMethod: string | null;
  amountInUsd: number | null;
  reference: string | null;
}

export interface NormalizedSlowMistArticle {
  uid: string;
  title: string;
  summary: string;
  content: string;
  link: string;
  source_url: string;
  source_name: string;
  author: string;
  category: 'web3-security' | 'defi-exploits' | 'operational-security' | 'supply-chain';
  severity: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  affected_technologies: string[];
  cve_id: null;
  published_at: string;
  raw_content: null;
  is_processed: boolean;
  metadata: Record<string, unknown>;
}

export function hasCompleteSlowMistPage(parsed: ParsedSlowMistPage | null): parsed is ParsedSlowMistPage {
  return Boolean(
    parsed &&
    parsed.recordsFound === SLOWMIST_EXPECTED_PAGE_SIZE &&
    parsed.invalidRecords === 0 &&
    parsed.incidents.length === SLOWMIST_EXPECTED_PAGE_SIZE,
  );
}

export function slowMistRecordNeedsWrite(
  existingMetadata: unknown,
  desiredMetadata: Record<string, unknown>,
  duplicateOfUid: string | null,
): boolean {
  if (!existingMetadata || typeof existingMetadata !== 'object' || Array.isArray(existingMetadata)) return true;
  const existing = existingMetadata as Record<string, unknown>;
  if (existing.provider_content_hash !== desiredMetadata.provider_content_hash) return true;
  return duplicateOfUid
    ? existing.classification_relevant !== false || existing.duplicate_of_uid !== duplicateOfUid
    : existing.classification_relevant === false || typeof existing.duplicate_of_uid === 'string';
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

function cleanText(value: unknown, maxLength: number): string {
  return decodeHtmlEntities(String(value ?? '').replace(/<[^>]*>/g, ' '))
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizeIncidentDate(value: unknown): string | null {
  const date = cleanText(value, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}

function safeHttpUrl(value: unknown): string {
  const candidate = cleanText(value, 2_000);
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function parseAmount(value: unknown): { valid: boolean; value: number | null } {
  const amount = cleanText(value, 80);
  if (amount === '-') return { valid: true, value: null };
  const match = amount.match(/^\$?\s*(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d+))?$/);
  if (!match) return { valid: false, value: null };
  const parsed = Number(`${match[1].replaceAll(',', '')}${match[2] ? `.${match[2]}` : ''}`);
  return Number.isFinite(parsed) && parsed >= 0
    ? { valid: true, value: parsed }
    : { valid: false, value: null };
}

function extractMatch(value: string, expression: RegExp): string {
  return expression.exec(value)?.[1] ?? '';
}

function parseIncidentItem(itemHtml: string): SlowMistIncident | null {
  // The provider description and image markup are intentionally never extracted.
  const date = normalizeIncidentDate(extractMatch(
    itemHtml,
    /<span\b[^>]*class=["'][^"']*\btime\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
  ));
  const target = cleanText(extractMatch(
    itemHtml,
    /<h3\b[^>]*>[\s\S]*?<em\b[^>]*>\s*Hacked target:\s*<\/em>([\s\S]*?)<\/h3>/i,
  ), 200);
  const attackMethod = cleanText(extractMatch(
    itemHtml,
    /<em\b[^>]*>\s*Attack method:\s*<\/em>([\s\S]*?)<\/span>/i,
  ), 160);
  const amountText = extractMatch(
    itemHtml,
    /<em\b[^>]*>\s*Amount of loss:\s*<\/em>([\s\S]*?)<\/span>/i,
  );
  const amount = parseAmount(amountText);
  const referenceBlock = extractMatch(
    itemHtml,
    /<p\b[^>]*class=["'][^"']*\blink-reference\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
  );
  const reference = safeHttpUrl(extractMatch(referenceBlock, /<a\b[^>]*href=["']([^"']+)["']/i));

  if (!date || !target || !attackMethod || !amount.valid) return null;
  return {
    target,
    date,
    attackMethod,
    amountInUsd: amount.value,
    reference,
  };
}

export function parseSlowMistPage(html: string): ParsedSlowMistPage | null {
  const list = /<div\b[^>]*class=["'](?:[^"']*\s)?case-content(?:\s[^"']*)?["'][^>]*>[\s\S]*?<ul\b[^>]*>([\s\S]*?)<\/ul>\s*<\/div>/i
    .exec(html)?.[1];
  if (!list) return null;

  const items = [...list.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => match[1]);
  if (items.length === 0) return null;

  const incidents: SlowMistIncident[] = [];
  let invalidRecords = 0;
  for (const item of items) {
    const incident = parseIncidentItem(item);
    if (incident) incidents.push(incident);
    else invalidRecords++;
  }
  return { recordsFound: items.length, invalidRecords, incidents };
}

export function normalizeSlowMistTarget(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slowMistTargetFromTitle(value: unknown): string {
  const title = cleanText(value, 300);
  if (!title) return '';
  const boundaries = [
    title.indexOf(':'),
    title.search(/\s[-–—]\s/),
    title.search(/\s+(?:(?:is|was)\s+)?(?:exploited|suffers?|loses?|hit\s+by)\b/i),
  ].filter((index) => index > 0);
  const boundary = boundaries.length ? Math.min(...boundaries) : -1;
  return (boundary > 0 ? title.slice(0, boundary) : title).trim();
}

export function isHighConfidenceSlowMistDuplicate(
  incident: SlowMistIncident,
  candidate: SlowMistDuplicateCandidate,
): boolean {
  if (normalizeSlowMistTarget(incident.target) !== normalizeSlowMistTarget(candidate.target)) return false;
  const incidentTime = new Date(`${incident.date}T00:00:00.000Z`).getTime();
  const candidateTime = new Date(`${candidate.date}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(incidentTime) || !Number.isFinite(candidateTime)) return false;
  const dayDifference = Math.abs(incidentTime - candidateTime) / 86_400_000;
  if (dayDifference === 0) return true;
  if (dayDifference > 2) return false;

  const sameAmount = incident.amountInUsd !== null && candidate.amountInUsd !== null &&
    incident.amountInUsd === candidate.amountInUsd;
  const sameAttackMethod = Boolean(
    incident.attackMethod && candidate.attackMethod &&
    normalizeSlowMistTarget(incident.attackMethod) === normalizeSlowMistTarget(candidate.attackMethod),
  );
  const sameReference = Boolean(
    incident.reference && candidate.reference && incident.reference === candidate.reference,
  );
  return sameAmount || sameAttackMethod || sameReference;
}

function slug(value: string): string {
  return normalizeSlowMistTarget(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function formatUsd(amount: number | null): string | null {
  if (amount === null || !Number.isFinite(amount) || amount < 0) return null;
  const compact = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (amount >= 1_000_000_000) return `$${compact(amount / 1_000_000_000)}B`;
  if (amount >= 1_000_000) return `$${compact(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `$${compact(amount / 1_000)}K`;
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function mapSeverity(incident: SlowMistIncident): NormalizedSlowMistArticle['severity'] {
  const amount = incident.amountInUsd;
  if (amount !== null && amount >= 50_000_000) return 'critical';
  if (amount !== null && amount >= 10_000_000) return 'high';
  if (amount !== null && amount >= 1_000_000) return 'medium';
  const attack = normalizeSlowMistTarget(incident.attackMethod);
  if (['private key', 'access control', 'oracle', 'reentrancy', 'flash loan']
    .some((signal) => attack.includes(signal))) return 'high';
  if (amount !== null && amount > 0) return 'medium';
  return 'low';
}

async function digestValue(value: string, length = 24): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
}

export async function slowMistUid(incident: Pick<SlowMistIncident, 'date' | 'target'>): Promise<string> {
  const identity = `${incident.date}|${normalizeSlowMistTarget(incident.target)}`;
  return `slowmist:${incident.date}:${await digestValue(identity)}`;
}

export async function normalizeSlowMistIncident(
  incident: SlowMistIncident,
  syncedAt = new Date().toISOString(),
): Promise<NormalizedSlowMistArticle> {
  const classification = classifyWeb3Incident({
    title: incident.target,
    attackType: incident.attackMethod,
  });
  const amountDisplay = formatUsd(incident.amountInUsd);
  const attributionUrl = SLOWMIST_PAGE_URL;
  // Prefer the cited incident reference for navigation while retaining the
  // SlowMist listing as an explicit attribution link in source_url.
  const primaryUrl = incident.reference || attributionUrl;
  const summary = `SlowMist Hacked lists an incident affecting ${incident.target} on ${incident.date}. The reported attack method is ${incident.attackMethod}${amountDisplay ? `, with a reported loss of ${amountDisplay}` : ''}.`;
  const sourceLinks = [
    ...(incident.reference ? [{ url: incident.reference, label: 'Incident reference' }] : []),
    { url: attributionUrl, label: 'SlowMist Hacked database' },
  ];
  const tags = ['slowmist', slug(incident.attackMethod)]
    .filter((tag, index, all) => tag && all.indexOf(tag) === index);
  const uid = await slowMistUid(incident);
  const providerContentHash = await digestValue(JSON.stringify([
    'slowmist-normalization-v1',
    classification.taxonomyVersion,
    incident.date,
    normalizeSlowMistTarget(incident.target),
    incident.attackMethod,
    incident.amountInUsd,
    incident.reference,
  ]), 32);

  return {
    uid,
    title: `${incident.target}: ${incident.attackMethod}${amountDisplay ? ` (${amountDisplay} loss)` : ''}`,
    summary: summary.slice(0, 500),
    content: [
      `Affected project: ${incident.target}`,
      `Incident date: ${incident.date}`,
      `Attack method: ${incident.attackMethod}`,
      amountDisplay ? `Reported loss: ${amountDisplay}` : 'Reported loss: Not disclosed',
      '',
      summary,
    ].join('\n').slice(0, 4_000),
    link: primaryUrl,
    source_url: JSON.stringify(sourceLinks),
    source_name: 'SlowMist Hacked',
    author: 'SlowMist',
    category: classification.category,
    severity: mapSeverity(incident),
    tags,
    affected_technologies: [incident.target],
    cve_id: null,
    published_at: new Date(`${incident.date}T00:00:00.000Z`).toISOString(),
    raw_content: null,
    is_processed: true,
    metadata: {
      provider: 'slowmist',
      security_domain: classification.securityDomain,
      is_web3_incident: true,
      taxonomy_version: classification.taxonomyVersion,
      classification_reasons: classification.reasons,
      provider_incident_id: uid.slice('slowmist:'.length),
      provider_incident_id_is_synthetic: true,
      provider_content_hash: providerContentHash,
      project_name: incident.target,
      attack_type: incident.attackMethod,
      amount_lost_usd: incident.amountInUsd,
      amount_display: amountDisplay,
      reference_url: incident.reference || null,
      incident_date: incident.date,
      attribution_url: attributionUrl,
      summary_origin: 'provider-template',
      summary_template: 'slowmist-facts-v1',
      suppress_realtime_alert: true,
      synced_at: syncedAt,
    },
  };
}
