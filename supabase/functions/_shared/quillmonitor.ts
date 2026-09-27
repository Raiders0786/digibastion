import { classifyWeb3Incident } from './web3-taxonomy.ts';

export interface QuillMonitorIncident {
  id: string;
  target: string;
  date: string;
  chain: string;
  category: string;
  attackedMethod: string;
  amountInUsd: number | null;
  description: string;
  reference: string;
}

export interface NormalizedQuillMonitorArticle {
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
  raw_content: string;
  is_processed: boolean;
  metadata: Record<string, unknown>;
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function includesAny(value: string, signals: string[]): boolean {
  return signals.some((signal) => value.includes(signal));
}

function normalizeIncidentDate(value: unknown): string | null {
  const date = cleanText(value, 40);
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(date)) return null;

  const calendarDate = date.slice(0, 10);
  const parsedCalendarDate = new Date(`${calendarDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedCalendarDate.getTime()) || parsedCalendarDate.toISOString().slice(0, 10) !== calendarDate) {
    return null;
  }

  const parsed = new Date(date.length === 10 ? `${date}T00:00:00.000Z` : date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export interface QuillMonitorRunHealth {
  success: boolean;
  invalidRatio: number;
  errorSummary?: string;
}

export function assessQuillMonitorRunHealth(
  recordsFound: number,
  recordsInvalid: number,
  persistenceErrors: number,
): QuillMonitorRunHealth {
  const invalidRatio = recordsFound > 0 ? recordsInvalid / recordsFound : 1;
  const unhealthyValidation = recordsFound === 0 || invalidRatio > 0.1;
  const success = persistenceErrors === 0 && !unhealthyValidation;
  const summaries: string[] = [];

  if (recordsFound === 0) summaries.push('Provider returned no incident records');
  else if (unhealthyValidation) {
    summaries.push(
      `Provider validation rejected ${recordsInvalid} of ${recordsFound} records (${(invalidRatio * 100).toFixed(1)}%)`,
    );
  }
  if (persistenceErrors > 0) summaries.push(`${persistenceErrors} incident persistence operations failed`);

  return {
    success,
    invalidRatio,
    errorSummary: summaries.length > 0 ? summaries.join('; ') : undefined,
  };
}

export function mapQuillMonitorCategory(incident: QuillMonitorIncident): NormalizedQuillMonitorArticle['category'] {
  return classifyWeb3Incident({
    title: incident.target,
    description: incident.description,
    projectCategory: incident.category,
    attackType: incident.attackedMethod,
  }).category;
}

export function mapQuillMonitorSeverity(incident: QuillMonitorIncident): NormalizedQuillMonitorArticle['severity'] {
  const amount = incident.amountInUsd;
  if (typeof amount === 'number' && amount >= 50_000_000) return 'critical';
  if (typeof amount === 'number' && amount >= 10_000_000) return 'high';
  if (typeof amount === 'number' && amount >= 1_000_000) return 'medium';

  const attack = incident.attackedMethod.toLowerCase();
  if (includesAny(attack, ['private key', 'access control', 'oracle', 'reentrancy', 'flash loan'])) return 'high';
  if (typeof amount === 'number' && amount > 0) return 'medium';
  return 'low';
}

export function formatUsd(amount: number | null): string | null {
  if (amount === null || !Number.isFinite(amount) || amount < 0) return null;
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(amount >= 10_000_000_000 ? 0 : 1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(amount >= 10_000 ? 0 : 1)}K`;
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function parseQuillMonitorIncident(value: unknown): QuillMonitorIncident | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = cleanText(row.id, 200);
  const target = cleanText(row.target, 200);
  const date = normalizeIncidentDate(row.date);
  if (!id || !target || !date) return null;

  const rawAmount = row.amountInUsd;
  const amount = rawAmount === null || rawAmount === undefined || rawAmount === ''
    ? null
    : Number(rawAmount);
  const reference = cleanText(row.reference, 2_000);
  let safeReference = '';
  try {
    const url = new URL(reference);
    if (url.protocol === 'https:' || url.protocol === 'http:') safeReference = url.toString();
  } catch {
    safeReference = '';
  }

  return {
    id,
    target,
    date,
    chain: cleanText(row.chain, 120),
    category: cleanText(row.category, 120),
    attackedMethod: cleanText(row.attackedMethod, 160),
    amountInUsd: amount !== null && Number.isFinite(amount) && amount >= 0 ? amount : null,
    description: cleanText(row.description, 4_000),
    reference: safeReference,
  };
}

export function normalizeQuillMonitorIncident(incident: QuillMonitorIncident): NormalizedQuillMonitorArticle {
  const classification = classifyWeb3Incident({
    title: incident.target,
    description: incident.description,
    projectCategory: incident.category,
    attackType: incident.attackedMethod,
  });
  const category = classification.category;
  const severity = mapQuillMonitorSeverity(incident);
  const amountDisplay = formatUsd(incident.amountInUsd);
  const attackMethod = incident.attackedMethod || 'Security incident';
  const chain = incident.chain || 'Blockchain';
  const title = `${incident.target}: ${attackMethod}${amountDisplay ? ` (${amountDisplay} loss)` : ''}`;
  const summary = incident.description || `${incident.target} was affected by a ${attackMethod.toLowerCase()} incident on ${chain}.`;
  const quillMonitorUrl = 'https://www.quillaudits.com/web3-hacks-database';
  const referenceUrl = incident.reference || quillMonitorUrl;
  const sourceLinks = [
    { url: referenceUrl, label: incident.reference ? 'Incident reference' : 'QuillMonitor database' },
    ...(incident.reference ? [{ url: quillMonitorUrl, label: 'QuillMonitor database' }] : []),
  ];
  const tags = [
    'quillmonitor',
    slug(incident.category),
    slug(attackMethod),
    slug(chain),
  ].filter((tag, index, all) => tag && all.indexOf(tag) === index).slice(0, 10);
  const technologies = [chain, incident.target]
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, 5);
  const content = [
    `Affected project: ${incident.target}`,
    `Chain: ${chain}`,
    `Attack method: ${attackMethod}`,
    incident.category ? `Project category: ${incident.category}` : '',
    amountDisplay ? `Reported loss: ${amountDisplay}` : 'Reported loss: Not disclosed',
    '',
    summary,
  ].filter((line) => line !== '').join('\n');

  return {
    uid: `quillmonitor:${incident.id}`,
    title,
    summary: summary.slice(0, 500),
    content: content.slice(0, 4_000),
    link: referenceUrl,
    source_url: JSON.stringify(sourceLinks),
    source_name: 'QuillMonitor',
    author: 'QuillAudits',
    category,
    severity,
    tags,
    affected_technologies: technologies,
    cve_id: null,
    published_at: new Date(`${incident.date}T00:00:00.000Z`).toISOString(),
    raw_content: JSON.stringify(incident),
    is_processed: true,
    metadata: {
      provider: 'quillmonitor',
      security_domain: classification.securityDomain,
      is_web3_incident: true,
      taxonomy_version: classification.taxonomyVersion,
      classification_reasons: classification.reasons,
      provider_incident_id: incident.id,
      project_name: incident.target,
      chain: incident.chain || null,
      project_category: incident.category || null,
      attack_type: incident.attackedMethod || null,
      amount_lost_usd: incident.amountInUsd,
      amount_display: amountDisplay,
      reference_url: incident.reference || null,
      incident_date: incident.date,
      attribution_url: quillMonitorUrl,
      synced_at: new Date().toISOString(),
    },
  };
}
