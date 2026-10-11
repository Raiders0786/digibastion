// Page metadata for one Threat Intel record. The SPA, the prerender and the
// Worker read metadata exactly as the emails do, through toNewsletterItem.
// Pure module (boundary rule): relative imports and _shared modules only.
import {
  isQuillMonitorOnly,
  QUILLMONITOR_DATABASE_URL,
  sourceLabelFor,
  sourceLinkFor,
} from '../../supabase/functions/_shared/attribution';
import {
  buildIncidentAnswer,
  displayChain,
  stripZeroLossSuffix,
  type AnswerInput,
} from '../../supabase/functions/_shared/incident-answer';
import {
  toNewsletterItem,
  type NewsletterSourceRow,
} from '../../supabase/functions/_shared/newsletter-content';
import { incidentOgImageUrl } from '../../supabase/functions/_shared/share-links';
import { SITE_URL, canonicalIncidentUrl, incidentPath } from '../../supabase/functions/_shared/site-urls';
import { truncateAtWord } from '../../supabase/functions/_shared/summary-text';
import { METHODOLOGY_PATH } from '../lib/threatIntel/officialLinks';
import type { NewsArticle } from '../types/news';
import { buildBreadcrumbSchema, buildItemListSchema, buildNewsArticleSchema } from '../utils/seo';
import { brandedTitle, DESCRIPTION_LIMIT, SITE_LINKS, STATIC_ROUTES, THREAT_INTEL_IMAGE } from './routeMeta';
import type { PrerenderLink, RouteMeta } from './routeTypes';

export interface IncidentSeoInput extends AnswerInput {
  id: string;
  summary: string;
  /** When Digibastion stored the record (ISO). */
  createdAt: string;
  category: string;
  severity: string;
  isWeb3Incident: boolean;
  /** The original report, or null when it is missing or one of our own pages. */
  sourceUrl: string | null;
  /** Every source URL on the record, for citation. */
  citations: string[];
  tags: string[];
}

const PENDING = /^(summary pending|pending|no summary)/i;
const MIN_SUMMARY = 40;

/** A summary worth showing as a description: long enough and not a placeholder. */
export function isUsableSummary(summary: string | null | undefined): boolean {
  if (typeof summary !== 'string') return false;
  const trimmed = summary.trim();
  return trimmed.length >= MIN_SUMMARY && !PENDING.test(trimmed);
}

function metadataSourceUrls(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== 'object') return [];
  const sources = (metadata as { sources?: unknown }).sources;
  if (!Array.isArray(sources)) return [];
  return sources
    .map((source) => (source && typeof source === 'object' ? (source as { url?: unknown }).url : null))
    .filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url.trim()))
    .map((url) => url.trim());
}

export function incidentSeoInputFromArticle(a: NewsArticle): IncidentSeoInput {
  const row: NewsletterSourceRow = {
    id: a.id,
    uid: a.id,
    title: a.title,
    summary: a.summary ?? null,
    severity: a.severity,
    category: a.category,
    link: a.link ?? null,
    source_name: a.sourceName ?? null,
    cve_id: a.cveId ?? null,
    tags: a.tags ?? [],
    affected_technologies: a.affectedTechnologies ?? [],
    created_at: (a.createdAt ?? a.publishedAt).toISOString(),
    metadata: a.metadata ?? null,
  };
  const item = toNewsletterItem(row, SITE_URL);
  const sourceUrl = sourceLinkFor({ sourceUrl: item.sourceUrl, incidentUrl: item.incidentUrl });
  return {
    id: a.id,
    // Importers append "($0 loss)" when no loss is known; the page says that in words.
    title: stripZeroLossSuffix(item.title) || item.title,
    summary: item.summary,
    createdAt: item.createdAt,
    category: item.category,
    severity: item.severity,
    isWeb3Incident: item.isWeb3Incident,
    sourceUrl,
    citations: [...new Set([...(sourceUrl ? [sourceUrl] : []), ...metadataSourceUrls(a.metadata)])],
    tags: item.tags,
    projectName: item.projectName,
    // "Other" and "Centralized" are placeholders, not chains to name.
    chain: displayChain(item.chain),
    attackType: item.attackType,
    amountUsd: item.amountUsd,
    amountDisplay: item.amountDisplay,
    incidentDate: item.incidentDate,
    fundsReturned: item.fundsReturned,
    sourceName: item.sourceName,
    providers: item.providers,
    status: item.status,
  };
}

/** "decrypt.co" from "https://www.decrypt.co/71458/..." */
function hostOf(url: string): string {
  const authority = url.replace(/^https?:\/\//i, '').split(/[/?#]/)[0];
  return authority.slice(authority.lastIndexOf('@') + 1).split(':')[0].toLowerCase().replace(/^www\./, '');
}

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

function incidentDescription(i: IncidentSeoInput): string {
  if (i.isWeb3Incident) return buildIncidentAnswer(i);
  if (isUsableSummary(i.summary)) return i.summary.trim();
  return `${i.title}. Source: ${sourceLabelFor(i)}.`;
}

function facts(i: IncidentSeoInput): string[] {
  const amount = i.amountDisplay ?? null;
  const source = sourceLabelFor(i);
  return [
    i.severity ? `Severity: ${capitalize(i.severity)}` : null,
    amount ? `Reported loss: about ${amount.replace(/^~\s*/, '')}` : null,
    displayChain(i.chain) ? `Chain: ${displayChain(i.chain)}` : null,
    i.attackType ? `Attack type: ${i.attackType}` : null,
    `Source: ${source}${i.status ? ` (${i.status})` : ''}`,
  ].filter((value): value is string => Boolean(value));
}

/** Metadata for /threat-intel/<id>. RSS relays get noindex,follow; Web3 incidents are indexed. */
export function incidentRouteMeta(i: IncidentSeoInput): RouteMeta {
  const path = incidentPath(i.id);
  const description = truncateAtWord(incidentDescription(i).replace(/\s+/g, ' ').trim(), DESCRIPTION_LIMIT);
  const intro = i.isWeb3Incident ? buildIncidentAnswer(i) : description;
  const source = sourceLabelFor(i);
  const links: PrerenderLink[] = [
    ...(i.sourceUrl ? [{ href: i.sourceUrl, label: `Original report (${hostOf(i.sourceUrl)})` }] : []),
    ...(isQuillMonitorOnly(i.providers) ? [{ href: QUILLMONITOR_DATABASE_URL, label: 'Powered by QuillMonitor' }] : []),
    { href: METHODOLOGY_PATH, label: 'How we track incidents' },
  ];
  const seen = new Set<string>();
  const allLinks = [...links, ...SITE_LINKS].filter((link) => (seen.has(link.href) ? false : (seen.add(link.href), true)));
  const breadcrumbs: PrerenderLink[] = [{ href: '/', label: 'Home' }, { href: '/threat-intel', label: 'Threat Intel' }];
  const about = [i.projectName, displayChain(i.chain)].filter((value): value is string => Boolean(value));
  const cardImage = i.isWeb3Incident ? incidentOgImageUrl(i.id) : null;

  return {
    path,
    title: brandedTitle(i.title),
    description,
    // Web3 incidents get their own card; news relays keep the generic image.
    ...(cardImage
      ? { image: cardImage, imageWidth: 1200, imageHeight: 630 }
      : { image: THREAT_INTEL_IMAGE }),
    imageAlt: `${truncateAtWord(i.title, 100)}: Digibastion Threat Intel`,
    type: 'article',
    robots: i.isWeb3Incident ? 'index' : 'noindex,follow',
    canonical: canonicalIncidentUrl(i.id),
    publishedTime: i.createdAt,
    lastmod: i.createdAt.slice(0, 10),
    section: i.category,
    tags: i.tags,
    jsonLd: [
      buildNewsArticleSchema({
        id: i.id,
        title: i.title,
        description,
        category: i.category,
        createdAt: i.createdAt,
        sourceLabel: source,
        citations: i.citations,
        about,
        tags: i.tags,
        // Same image as og:image, so structured-data readers get the incident's card.
        ...(cardImage ? { image: cardImage, imageWidth: 1200, imageHeight: 630 } : {}),
      }),
      buildBreadcrumbSchema([...breadcrumbs, { href: path, label: i.title }]),
    ],
    body: {
      breadcrumbs,
      h1: i.title,
      intro,
      items: facts(i),
      links: allLinks,
    },
  };
}

/** How many of the newest incidents the prerendered /threat-intel page links. */
export const HUB_INCIDENT_LIMIT = 100;

/**
 * /threat-intel with links to the newest indexable incidents and one answer
 * sentence each. AI crawlers that do not run JavaScript find pages by
 * following links, so without this the incident pages would be orphans for
 * them. With no incidents it returns the static entry unchanged.
 */
export function threatIntelRouteMeta(latest: readonly IncidentSeoInput[]): RouteMeta {
  const base = STATIC_ROUTES['/threat-intel'];
  const listed = latest.filter((i) => i.isWeb3Incident).slice(0, HUB_INCIDENT_LIMIT);
  if (listed.length === 0) return base;
  const seen = new Set(base.body.links.map((link) => link.href));
  const incidentLinks = listed
    .map((i) => ({ href: incidentPath(i.id), label: i.title }))
    .filter((link) => (seen.has(link.href) ? false : (seen.add(link.href), true)));
  return {
    ...base,
    jsonLd: [
      ...base.jsonLd,
      buildItemListSchema('Latest Web3 incidents', listed.map((i) => ({ url: canonicalIncidentUrl(i.id), name: i.title }))),
    ],
    body: {
      ...base.body,
      items: listed.map((i) => buildIncidentAnswer(i)),
      links: [...base.body.links, ...incidentLinks],
    },
  };
}
