export const CONTENT_SCOPES = ['all', 'web3-incidents'] as const;

export type ContentScope = typeof CONTENT_SCOPES[number];

export interface DeliverableArticle {
  id: string;
  title: string;
  summary?: string | null;
  severity: string;
  category: string;
  link?: string | null;
  tags?: string[] | null;
  affected_technologies?: string[] | null;
  source_name?: string | null;
  cve_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface DeliveryPreferences {
  categories?: string[] | null;
  technologies?: string[] | null;
  severity_threshold?: string | null;
  content_scope?: ContentScope | string | null;
}

export const severityRank: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const QUILLMONITOR_URL = 'https://www.quillaudits.com/web3-hacks-database';
const LEGACY_INCIDENT_PROVIDERS = new Set(['quillmonitor', 'web3-incidents', 'web3']);
const LEGACY_WEB3_CATEGORIES = new Set(['web3-security', 'defi-exploits']);

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string): string {
  const value = metadata?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function isQuillMonitorArticle(article: DeliverableArticle): boolean {
  return metadataString(article.metadata, 'provider').toLowerCase() === 'quillmonitor' ||
    article.source_name?.trim().toLowerCase() === 'quillmonitor';
}

export function isWeb3IncidentArticle(article: DeliverableArticle): boolean {
  if (article.metadata?.is_web3_incident === true) return true;
  if (article.metadata?.is_web3_incident === false) return false;
  const provider = metadataString(article.metadata, 'provider').toLowerCase();
  return LEGACY_INCIDENT_PROVIDERS.has(provider) || isQuillMonitorArticle(article);
}

export function isWeb3DomainArticle(article: DeliverableArticle): boolean {
  const explicitDomain = metadataString(article.metadata, 'security_domain').toLowerCase();
  if (explicitDomain) return explicitDomain === 'web3';
  return isWeb3IncidentArticle(article) || LEGACY_WEB3_CATEGORIES.has(article.category);
}

function normalizePhrase(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function phraseContains(left: string, right: string): boolean {
  if (!left || !right) return false;
  if (left === right) return true;
  return ` ${left} `.includes(` ${right} `) || ` ${right} `.includes(` ${left} `);
}

export function technologyMatches(article: DeliverableArticle, technologies: string[] | null | undefined): boolean {
  const preferences = (technologies || []).map(normalizePhrase).filter(Boolean);
  if (preferences.length === 0) return true;

  const articleTerms = [...(article.tags || []), ...(article.affected_technologies || [])]
    .map(normalizePhrase)
    .filter(Boolean);
  return preferences.some((preference) =>
    articleTerms.some((articleTerm) => phraseContains(articleTerm, preference))
  );
}

export function categoryMatches(article: DeliverableArticle, categories: string[] | null | undefined): boolean {
  const selectedCategories = categories || [];
  if (selectedCategories.length === 0 || selectedCategories.includes(article.category)) return true;

  // In subscription language, Web3 Security is the umbrella choice. Incident
  // records retain a precise leaf category so feed filters and reporting remain
  // useful, but an umbrella subscriber must not miss a DeFi or OpSec incident.
  return selectedCategories.includes('web3-security') && isWeb3DomainArticle(article);
}

export function matchesDeliveryPreferences(
  article: DeliverableArticle,
  preferences: DeliveryPreferences,
): boolean {
  if (article.metadata?.classification_relevant === false) return false;

  const articleRank = severityRank[article.severity] ?? severityRank.info;
  const thresholdRank = severityRank[preferences.severity_threshold || 'medium'] ?? severityRank.medium;
  if (articleRank > thresholdRank) return false;

  if (preferences.content_scope === 'web3-incidents' && !isWeb3IncidentArticle(article)) return false;
  if (!categoryMatches(article, preferences.categories)) return false;

  // Technology selections prioritize personalized items. Critical and high
  // severity threats still pass, matching the promise made by the forms.
  if (!technologyMatches(article, preferences.technologies) && articleRank > severityRank.high) return false;
  return true;
}

export function stripHtml(text: string | null | undefined): string {
  if (!text) return '';
  let value = text;
  let previous = '';
  while (value !== previous) {
    previous = value;
    value = value.replace(/&#(\d+);/g, (_, code) => {
      const point = Number.parseInt(code, 10);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
    })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const point = Number.parseInt(hex, 16);
        return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
      })
      .replace(/&(amp|lt|gt|quot|apos|nbsp|mdash|ndash|hellip|rsquo|lsquo|rdquo|ldquo);/gi, (_, name) => {
        const entities: Record<string, string> = {
          amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–',
          hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
        };
        return entities[String(name).toLowerCase()] ?? '';
      });
    value = value.replace(/<[^>]*>/g, '');
  }
  return value.replace(/\s+/g, ' ').trim();
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function safeHttpUrl(value: string | null | undefined, fallback = ''): string {
  const candidates = [value, fallback];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
    } catch {
      // Try the fallback.
    }
  }
  return '';
}

export interface DeliveryPresentation {
  isWeb3Incident: boolean;
  isQuillMonitor: boolean;
  incidentFacts: string[];
  articleUrl: string;
  attributionUrl: string;
}

export function getDeliveryPresentation(article: DeliverableArticle, fallbackArticleUrl = ''): DeliveryPresentation {
  const isQuillMonitor = isQuillMonitorArticle(article);
  const isWeb3Incident = isWeb3IncidentArticle(article);
  const incidentFacts = isWeb3Incident
    ? ['project_name', 'chain', 'attack_type', 'amount_display']
        .map((key) => metadataString(article.metadata, key))
        .filter(Boolean)
    : [];
  const rawAttribution = metadataString(article.metadata, 'attribution_url');

  return {
    isWeb3Incident,
    isQuillMonitor,
    incidentFacts,
    articleUrl: safeHttpUrl(article.link, fallbackArticleUrl),
    attributionUrl: isQuillMonitor ? safeHttpUrl(rawAttribution, QUILLMONITOR_URL) : '',
  };
}

export function renderIncidentContextHtml(article: DeliverableArticle): string {
  const presentation = getDeliveryPresentation(article);
  if (!presentation.isWeb3Incident) return '';
  const facts = presentation.incidentFacts.length > 0
    ? `<p style="margin:6px 0 0;color:#d1d5db;font-size:12px;line-height:1.4;">${presentation.incidentFacts.map(escapeHtml).join(' · ')}</p>`
    : '';
  const attribution = presentation.isQuillMonitor
    ? `<p style="margin:6px 0 0;"><a href="${escapeHtml(presentation.attributionUrl)}" style="color:#93c5fd;font-size:12px;text-decoration:underline;">Powered by QuillMonitor</a></p>`
    : '';
  return `<p style="margin:6px 0 0;color:#60a5fa;font-size:11px;font-weight:700;">Web3 Incident</p>${facts}${attribution}`;
}

export function formatDeliveryArticleText(article: DeliverableArticle, fallbackArticleUrl = ''): string {
  const presentation = getDeliveryPresentation(article, fallbackArticleUrl);
  const labels = [article.severity.toUpperCase()];
  if (presentation.isWeb3Incident) labels.push('WEB3 INCIDENT');
  const source = article.source_name ? ` · ${stripHtml(article.source_name)}` : '';
  const cve = article.cve_id ? ` · ${stripHtml(article.cve_id)}` : '';
  const facts = presentation.incidentFacts.length > 0
    ? `\n${presentation.incidentFacts.map(stripHtml).join(' · ')}`
    : '';
  const attribution = presentation.isQuillMonitor
    ? `\nPowered by QuillMonitor: ${presentation.attributionUrl}`
    : '';
  const summary = stripHtml(article.summary);

  return `[${labels.join(' · ')}] ${stripHtml(article.title)}${cve}${source}` +
    `${summary ? `\n${summary}` : ''}${facts}${attribution}\n${presentation.articleUrl}`;
}
