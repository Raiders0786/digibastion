// One registry of page metadata. The React pages, the build-time prerender,
// the static sitemap, llms.txt and the Cloudflare Worker all read it, so a
// title or description is written once.
// Pure module (boundary rule): relative imports and _shared modules only, no
// '@/' alias, no React, no window, no data modules. Builders take data as
// arguments so pages do not pull articlesData into the main bundle.
import { SITE_URL, absoluteSiteUrl, canonicalizeUrl } from '../../supabase/functions/_shared/site-urls';
import { truncateAtWord } from '../../supabase/functions/_shared/summary-text';
import { METHODOLOGY_PATH, TELEGRAM_CHANNEL_URL } from '../lib/threatIntel/officialLinks';
import {
  weeklyDescription,
  weeklyPagePath,
  weeklySeoTitle,
  type WeeklyPublicContent,
} from '../lib/threatIntel/weekly';
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildChecklistSchema,
  buildFaqSchema,
  buildThreatIntelCollectionSchema,
  buildWebPageSchema,
  buildWeeklySchema,
  type WebPageType,
} from '../utils/seo';
import type { MetaTagsProps, PrerenderBody, PrerenderLink, RobotsDirective, RouteMeta } from './routeTypes';
import { faqEntries, methodologyFaqEntries, SITE_DEFINITION } from './siteFacts';

/** The day this branch rewrote the copy. Bump it when a static page's copy changes. */
export const STATIC_LASTMOD = '2026-10-11';
export const TITLE_LIMIT = 70;
export const DESCRIPTION_LIMIT = 160;
const BRAND_SUFFIX = ' | Digibastion';

export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
export const THREAT_INTEL_IMAGE = `${SITE_URL}/og-threat-intel.png`;
const TOOLS_IMAGE = `${SITE_URL}/og-tools.png`;
const QUIZ_IMAGE = `${SITE_URL}/og-quiz.png`;

const HOME: PrerenderLink = { href: '/', label: 'Home' };
const THREAT_INTEL: PrerenderLink = { href: '/threat-intel', label: 'Threat Intel' };
const GUIDES: PrerenderLink = { href: '/articles', label: 'Guides' };
const SERVICES: PrerenderLink = { href: '/services', label: 'Services' };

/** Every prerendered body ends with these, so crawlers can reach the whole site from any page. */
export const SITE_LINKS: readonly PrerenderLink[] = [
  THREAT_INTEL,
  { href: '/threat-intel/weekly', label: 'Weekly reports' },
  GUIDES,
  { href: '/category/opsec', label: 'Checklists' },
  { href: '/quiz', label: 'OpSec self-check' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: TELEGRAM_CHANNEL_URL, label: 'Telegram alerts' },
];

/** Never prerendered, listed or indexed. */
export const NOINDEX_PATHS: readonly string[] = [
  '/manage-subscription',
  '/unsubscribe',
  '/verify-email',
  '/quiz-result',
  '/admin',
  '/admin/analytics',
  '/admin/cron',
  '/admin/api-keys',
  '/news',
  '/present',
];

const canonicalFor = (path: string): string => canonicalizeUrl(path) ?? absoluteSiteUrl(path);

/** Page links first, then the shared site links; no duplicates and no link to the page itself. */
function withSiteLinks(path: string, links: readonly PrerenderLink[]): PrerenderLink[] {
  const seen = new Set<string>([path]);
  const result: PrerenderLink[] = [];
  for (const link of [...links, ...SITE_LINKS]) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    result.push(link);
  }
  return result;
}

const fit = (text: string, limit: number): string => truncateAtWord(text.replace(/\s+/g, ' ').trim(), limit);

/** "<title> | Digibastion", shortening the title at a word so the whole fits. */
export function brandedTitle(title: string): string {
  return `${fit(title, TITLE_LIMIT - BRAND_SUFFIX.length)}${BRAND_SUFFIX}`;
}

interface PageInput {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro?: string;
  items?: string[];
  links?: PrerenderLink[];
  breadcrumbs?: PrerenderLink[];
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  robots?: RobotsDirective;
  lastmod?: string;
  pageType?: WebPageType;
  extraJsonLd?: object[];
  jsonLd?: object[];
}

function page(input: PageInput): RouteMeta {
  const breadcrumbs = input.breadcrumbs ?? (input.path === '/' ? [] : [HOME]);
  const body: PrerenderBody = {
    breadcrumbs,
    h1: input.h1,
    intro: input.intro ?? input.description,
    ...(input.items?.length ? { items: input.items } : {}),
    links: withSiteLinks(input.path, input.links ?? []),
  };
  const jsonLd = input.jsonLd ?? [
    buildWebPageSchema({ type: input.pageType, path: input.path, name: input.title, description: input.description, aboutOrganization: input.pageType === 'AboutPage' }),
    ...(breadcrumbs.length ? [buildBreadcrumbSchema([...breadcrumbs, { href: input.path, label: input.h1 }])] : []),
    ...(input.extraJsonLd ?? []),
  ];
  return {
    path: input.path,
    title: input.title,
    description: input.description,
    image: input.image ?? DEFAULT_IMAGE,
    imageAlt: input.imageAlt ?? 'Digibastion: Web3 security alerts, checklists and guides',
    type: input.type ?? 'website',
    robots: input.robots ?? 'index',
    canonical: canonicalFor(input.path),
    lastmod: input.lastmod ?? STATIC_LASTMOD,
    jsonLd,
    body,
  };
}

const HOME_TITLE = 'Digibastion: Web3 Security Alerts, Checklists and Guides';
const HOME_DESCRIPTION = 'Free Web3 security help: a crypto hack tracker with email and Telegram alerts, security checklists, an OpSec self-check and practical guides.';

/**
 * The neutral shell served for /, unknown routes and incidents newer than the
 * last build. No canonical: a wrong canonical on an unknown URL would point
 * Google at the home page.
 */
export const SITE_FALLBACK_META: RouteMeta = {
  path: '/',
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  image: DEFAULT_IMAGE,
  imageAlt: 'Digibastion: Web3 security alerts, checklists and guides',
  type: 'website',
  robots: 'index',
  canonical: null,
  jsonLd: [],
  body: {
    breadcrumbs: [],
    h1: 'Digibastion: Web3 security alerts, checklists and guides',
    intro: SITE_DEFINITION,
    links: [...SITE_LINKS, { href: '/tools', label: 'Tools' }, SERVICES],
  },
};

const THREAT_INTEL_DESCRIPTION = 'Crypto hacks, DeFi exploits and phishing from QuillMonitor and other public trackers, one record per incident, each linked to its source. Free alerts.';
const FAQ_URL = `${SITE_URL}/faq`;

const routes: RouteMeta[] = [
  page({
    path: '/',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    h1: 'Know what to protect. Fix what matters.',
    intro: SITE_DEFINITION,
    links: [{ href: '/tools', label: 'Tools' }, SERVICES],
    jsonLd: [],
  }),
  page({
    path: '/threat-intel',
    title: 'Crypto Hack and Web3 Exploit Tracker | Digibastion',
    description: THREAT_INTEL_DESCRIPTION,
    h1: 'Crypto and Web3 security incidents, tracked every 30 minutes',
    image: THREAT_INTEL_IMAGE,
    imageAlt: 'Digibastion Threat Intel: crypto hacks and Web3 exploits',
    links: [
      { href: METHODOLOGY_PATH, label: 'How we track incidents' },
      { href: '/threat-intel/weekly', label: 'Weekly reports' },
      { href: '/faq', label: 'FAQ' },
      { href: TELEGRAM_CHANNEL_URL, label: 'Telegram alerts' },
      { href: '/threat-intel?tab=subscribe', label: 'Email alerts' },
    ],
    jsonLd: [
      buildThreatIntelCollectionSchema(THREAT_INTEL_DESCRIPTION),
      buildBreadcrumbSchema([HOME, { href: '/threat-intel', label: 'Threat Intel' }]),
    ],
  }),
  page({
    path: METHODOLOGY_PATH,
    title: 'How Digibastion Tracks Crypto Incidents: Sources and Severity',
    description: 'Where Digibastion\'s incident records come from, how severity is set, what confirmed and unconfirmed mean, how duplicates merge and how to report a mistake.',
    h1: 'How we track security incidents',
    intro: 'Digibastion collects security incidents and news from the sources below, merges reports of the same incident into one record, and shows the status each source gives. We do not investigate or verify incidents ourselves, so every record links back to where it came from.',
    image: THREAT_INTEL_IMAGE,
    breadcrumbs: [HOME, THREAT_INTEL],
    links: [THREAT_INTEL, { href: '/threat-intel/weekly', label: 'Weekly reports' }, { href: '/faq', label: 'FAQ' }],
    items: methodologyFaqEntries().map((entry) => `${entry.question} ${entry.answer}`),
    extraJsonLd: [buildFaqSchema(methodologyFaqEntries(), `${SITE_URL}${METHODOLOGY_PATH}`)],
  }),
  page({
    path: '/threat-intel/weekly',
    title: 'Weekly Web3 Hack Reports | Digibastion',
    description: 'Every weekly deep-dive in one list: reported losses, incident counts and the top incidents of each week, with every item linked to its source.',
    h1: 'Weekly Web3 hack reports',
    image: THREAT_INTEL_IMAGE,
    breadcrumbs: [HOME, THREAT_INTEL],
    pageType: 'CollectionPage',
    links: [THREAT_INTEL, { href: METHODOLOGY_PATH, label: 'How we track incidents' }, { href: TELEGRAM_CHANNEL_URL, label: 'Telegram alerts' }],
  }),
  page({
    path: '/faq',
    title: 'Digibastion FAQ: Threat Intel, Alerts and Checklists',
    description: 'Plain answers about Digibastion: where incident data comes from, how severity and duplicates work, how to get alerts and what is free.',
    h1: 'Frequently asked questions',
    links: [THREAT_INTEL, { href: METHODOLOGY_PATH, label: 'How we track incidents' }, { href: '/about', label: 'About' }],
    // Prerendered visible text and JSON-LD come from the same entries.
    items: faqEntries().map((entry) => `${entry.question} ${entry.answer}`),
    extraJsonLd: [buildFaqSchema(faqEntries(), FAQ_URL)],
  }),
  page({
    path: '/about',
    title: 'About Digibastion: Free Web3 Security Tools and Alerts',
    description: 'Digibastion is a free Web3 security site: an incident tracker with alerts, checklists, an OpSec self-check and guides, plus paid reviews for teams.',
    h1: 'Turn security information into better decisions.',
    intro: SITE_DEFINITION,
    pageType: 'AboutPage',
    links: [THREAT_INTEL, SERVICES, { href: '/contact', label: 'Contact' }, { href: '/license', label: 'License' }],
  }),
  page({
    path: '/articles',
    title: 'Web3 and Crypto Security Guides | Digibastion',
    description: 'Practical guides to keeping crypto safe: seed phrases, phishing, token approvals, wallet drainers and what to do in the first hour after a hack.',
    h1: 'Cybersecurity & Crypto Security Guides',
    pageType: 'CollectionPage',
    links: [{ href: '/category/opsec', label: 'Checklists' }, THREAT_INTEL],
  }),
  page({
    path: '/links',
    title: 'Web3 Security Resources and Reading List | Digibastion',
    description: 'Links to security guides, tools and references for Web3 users and developers, grouped by topic: wallets, smart contracts, cloud, on-chain and private keys.',
    h1: 'Security Resources',
    links: [{ href: '/tools', label: 'Tools' }, GUIDES],
  }),
  page({
    path: '/quiz',
    title: 'Crypto OpSec Self-Check: 8 Scenarios, 2 Minutes | Digibastion',
    description: 'Eight questions drawn from 20 real scenarios show where your crypto OpSec is weak, with a breakdown and next steps. No wallet or account needed.',
    h1: 'How secure is your crypto OpSec?',
    image: QUIZ_IMAGE,
    imageAlt: 'Digibastion crypto OpSec self-check',
    links: [{ href: '/leaderboard', label: 'Leaderboard' }, { href: '/category/opsec', label: 'OpSec checklist' }],
  }),
  page({
    path: '/leaderboard',
    title: 'OpSec Self-Check Leaderboard | Digibastion',
    description: 'The top 50 public scores from Digibastion\'s crypto OpSec self-check. A light-hearted ranking, not a credential. Take the self-check to see your own result.',
    h1: 'OpSec Hall of Fame',
    image: QUIZ_IMAGE,
    imageAlt: 'Digibastion crypto OpSec self-check',
    links: [{ href: '/quiz', label: 'Take the self-check' }],
  }),
  page({
    path: '/services',
    title: 'Web3 Security Services | Digibastion',
    description: 'OpSec consulting for founders and funds, and full-stack security reviews for Web3 teams, from the people who run Digibastion\'s free tools and alerts.',
    h1: 'The security work most teams keep putting off.',
    links: [
      { href: '/services/opsec-consulting', label: 'OpSec consulting' },
      { href: '/services/full-stack-review', label: 'Full-stack security review' },
      { href: '/contact', label: 'Contact' },
    ],
  }),
  page({
    path: '/services/opsec-consulting',
    title: 'Web3 OpSec Consulting for Founders and Funds | Digibastion',
    description: 'Hands-on OpSec for founders, funds and large holders. We review your wallets, devices and daily habits, then tell you what to change first. Book a free call.',
    h1: 'OpSec for people who already know what is at stake.',
    breadcrumbs: [HOME, SERVICES],
    links: [SERVICES, { href: '/services/full-stack-review', label: 'Full-stack security review' }, { href: '/contact', label: 'Contact' }],
  }),
  page({
    path: '/services/full-stack-review',
    title: 'Full-Stack Web3 Security Review | Digibastion',
    description: 'A senior review across your crypto product: smart contracts, offchain services, dApp, cloud, identity and compliance readiness. Flat fee, named team.',
    h1: 'One review, across the whole surface.',
    breadcrumbs: [HOME, SERVICES],
    links: [SERVICES, { href: '/services/opsec-consulting', label: 'OpSec consulting' }, { href: '/contact', label: 'Contact' }],
  }),
  page({
    path: '/contact',
    title: 'Contact: Services, Vantage, Research, Contributions | Digibastion',
    description: 'Contact Digibastion about security services, Vantage, partnerships, research corrections, responsible disclosure, or contributions.',
    h1: 'Start with the problem.',
    pageType: 'ContactPage',
    links: [SERVICES, { href: '/support', label: 'Support' }],
  }),
  page({
    path: '/support',
    title: 'Support: Contribute, Sponsor or Work With Us | Digibastion',
    description: 'Support Digibastion by improving security guidance, contributing code, sponsoring public resources, or hiring the team for security work.',
    h1: 'Support can be time, evidence, reach or funding.',
    links: [{ href: '/contact', label: 'Contact' }, { href: '/share', label: 'Share' }],
  }),
  page({
    path: '/share',
    title: 'Share Practical Web3 Security Resources | Digibastion',
    description: 'Share a relevant Digibastion security checkup, threat-intelligence feed, or Vantage domain-security resource with your community or team.',
    h1: 'Send the right resource, not a generic pitch.',
    links: [{ href: '/support', label: 'Support' }],
  }),
  page({
    path: '/license',
    title: 'License and Terms | Digibastion',
    description: 'Read the Digibastion repository license: MIT terms with an additional Commons Clause restriction on commercial use.',
    h1: 'License',
    links: [{ href: '/about', label: 'About' }],
  }),
];

/** Static routes keyed by canonical path. /tools is built by toolsRouteMeta because its count comes from data. */
export const STATIC_ROUTES: Readonly<Record<string, RouteMeta>> = Object.freeze(
  Object.fromEntries(routes.map((meta) => [meta.path, meta])),
);

export function staticRouteMeta(path: string): RouteMeta {
  const meta = STATIC_ROUTES[path];
  if (!meta) throw new Error(`No route metadata for ${path}`);
  return meta;
}

export function toolsRouteMeta(toolCount: number): RouteMeta {
  return page({
    path: '/tools',
    title: 'Web3 Security Tools Directory | Digibastion',
    description: `${toolCount} Web3 security tools we link to, grouped by job: on-chain analytics, investigation, wallet protection, monitoring, hardware keys and secure messaging.`,
    h1: 'Web3 Security Tools',
    image: TOOLS_IMAGE,
    imageAlt: 'Digibastion Web3 security tools directory',
    pageType: 'CollectionPage',
    links: [{ href: '/links', label: 'Security resources' }, GUIDES],
  });
}

export interface CategoryInput {
  id: string;
  title: string;
  description: string;
  items: ReadonlyArray<{ title: string; description?: string }>;
}

function checklistName(title: string): string {
  if (title === 'OS Hardening') return 'OS Hardening Checklist';
  if (title === 'Operational Security (OpSec)') return 'OpSec Checklist';
  return `${title.replace(/ Security$/, '')} Security Checklist`;
}

/**
 * Checklist page metadata. The signature matches Array.prototype.map, so
 * `categories.map(categoryRouteMeta)` passes the whole list and each body
 * links the other checklists.
 */
export function categoryRouteMeta(c: CategoryInput, _index?: number, all?: readonly CategoryInput[]): RouteMeta {
  const name = checklistName(c.title);
  const path = `/category/${encodeURIComponent(c.id)}`;
  const description = fit(
    `A ${c.items.length}-item ${c.title} checklist: ${c.description.trim().replace(/\.?$/, '.')} Tick items off and your progress saves in your browser. No account needed.`,
    DESCRIPTION_LIMIT,
  );
  const others = (all ?? []).filter((other) => other.id !== c.id)
    .map((other) => ({ href: `/category/${encodeURIComponent(other.id)}`, label: checklistName(other.title) }));
  return page({
    path,
    title: brandedTitle(name),
    description,
    h1: name,
    intro: description,
    items: c.items.map((item) => item.title),
    links: [HOME, ...others],
    extraJsonLd: [buildChecklistSchema(c)],
  });
}

export interface GuideInput {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  modifiedAt: string;
  author: string;
  tags: string[];
  summary?: string;
  keyTakeaways?: string[];
  sources?: ReadonlyArray<{ url: string; title?: string; publisher?: string }>;
}

const isoDay = (value: string): string => value.slice(0, 10);

/** Guide page metadata. Pass `all` (every guide) to link three guides from the same category. */
export function guideRouteMeta(a: GuideInput, html?: string, all: readonly GuideInput[] = []): RouteMeta {
  const path = `/articles/${encodeURIComponent(a.slug)}`;
  const neighbours = all.filter((other) => other.category === a.category && other.slug !== a.slug).slice(0, 3)
    .map((other) => ({ href: `/articles/${encodeURIComponent(other.slug)}`, label: other.title }));
  const description = fit(a.description, DESCRIPTION_LIMIT);
  const meta = page({
    path,
    title: brandedTitle(a.title),
    description,
    h1: a.title,
    intro: a.summary?.trim() || description,
    items: a.keyTakeaways,
    type: 'article',
    breadcrumbs: [HOME, { href: '/articles', label: 'Security Guides' }],
    links: [{ href: '/articles', label: 'All security guides' }, ...neighbours],
    lastmod: isoDay(a.modifiedAt),
    jsonLd: [
      buildArticleSchema(a),
      buildBreadcrumbSchema([HOME, { href: '/articles', label: 'Security Guides' }, { href: path, label: a.title }]),
    ],
  });
  return {
    ...meta,
    imageAlt: `${a.title}: Digibastion security guide`,
    publishedTime: a.publishedAt,
    modifiedTime: a.modifiedAt,
    section: a.category,
    tags: a.tags,
    body: { ...meta.body, ...(html ? { html } : {}) },
  };
}

/** Weekly deep-dive page metadata. `generatedAt` is when the issue was built (falls back to the issue date). */
export function weeklyRouteMeta(c: WeeklyPublicContent, generatedAt: string): RouteMeta {
  const path = weeklyPagePath(c.weekStart);
  const seoTitle = weeklySeoTitle(c);
  const title = seoTitle.length + BRAND_SUFFIX.length <= TITLE_LIMIT ? `${seoTitle}${BRAND_SUFFIX}` : fit(seoTitle, TITLE_LIMIT);
  const items = c.top.map(({ item }) => `${item.title}${item.sourceName ? ` (source: ${item.sourceName})` : ''}`);
  const meta = page({
    path,
    title,
    description: fit(weeklyDescription(c), DESCRIPTION_LIMIT),
    h1: seoTitle,
    intro: weeklyDescription(c),
    items,
    image: THREAT_INTEL_IMAGE,
    imageAlt: `Digibastion weekly Web3 security report, week of ${c.weekStart}`,
    type: 'article',
    breadcrumbs: [HOME, THREAT_INTEL, { href: '/threat-intel/weekly', label: 'Weekly reports' }],
    links: [
      { href: '/threat-intel/weekly', label: 'All weekly reports' },
      ...c.top.flatMap(({ item }) => {
        const href = item.articleId ? `/threat-intel/${encodeURIComponent(item.articleId)}` : null;
        return href ? [{ href, label: item.title }] : [];
      }),
      { href: METHODOLOGY_PATH, label: 'How we track incidents' },
    ],
    lastmod: isoDay(generatedAt) || c.issueDate,
    jsonLd: [
      buildWeeklySchema(c, generatedAt),
      buildBreadcrumbSchema([HOME, THREAT_INTEL, { href: '/threat-intel/weekly', label: 'Weekly reports' }, { href: path, label: seoTitle }]),
    ],
  });
  return { ...meta, publishedTime: generatedAt };
}

/** Props for <MetaTags>. The fallback shell has no canonical, so MetaTags derives one from the path. */
export function toMetaTagsProps(meta: RouteMeta): MetaTagsProps {
  return {
    title: meta.title,
    description: meta.description,
    image: meta.image,
    imageAlt: meta.imageAlt,
    ...(meta.imageWidth ? { imageWidth: meta.imageWidth } : {}),
    ...(meta.imageHeight ? { imageHeight: meta.imageHeight } : {}),
    type: meta.type,
    robots: meta.robots,
    ...(meta.canonical ? { canonical: meta.canonical } : {}),
    ...(meta.publishedTime ? { publishedTime: meta.publishedTime } : {}),
    ...(meta.modifiedTime ? { modifiedTime: meta.modifiedTime } : {}),
    ...(meta.section ? { section: meta.section } : {}),
    ...(meta.tags?.length ? { tags: meta.tags } : {}),
  };
}
