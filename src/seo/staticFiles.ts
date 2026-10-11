// Builders for the generated files in public/: sitemap.xml, sitemap-index.xml,
// llms.txt and llms-full.txt. `npm run seo:generate` writes them and
// generatedFilesInSync.test.ts fails when a committed copy drifts.
// Pure module: data comes in through `deps`.
import { FEED_URLS, SITE_URL, absoluteSiteUrl } from '../../supabase/functions/_shared/site-urls';
import { renderUrlset, type SitemapEntry } from '../../supabase/functions/_shared/sitemap-render';
import { xmlText } from '../../supabase/functions/_shared/xml';
import { METHODOLOGY_PATH, TELEGRAM_CHANNEL_HANDLE, TELEGRAM_CHANNEL_URL } from '../lib/threatIntel/officialLinks';
import { htmlToText } from './htmlText';
import {
  categoryRouteMeta,
  guideRouteMeta,
  STATIC_LASTMOD,
  STATIC_ROUTES,
  toolsRouteMeta,
  type CategoryInput,
  type GuideInput,
} from './routeMeta';
import type { RouteMeta } from './routeTypes';
import {
  faqEntries,
  GITHUB_REPO_URL,
  GITHUB_ROADMAP_URL,
  NEWSLETTERS_LIVE,
  SITE_DEFINITION,
  VANTAGE_URL,
} from './siteFacts';

export interface StaticFileGuide extends GuideInput {
  summary?: string;
  keyTakeaways?: string[];
  sources?: ReadonlyArray<{ title?: string; publisher?: string; url: string }>;
}

export interface StaticFileDeps {
  articles: readonly StaticFileGuide[];
  categories: readonly CategoryInput[];
  toolCount: number;
  /** Rendered guide body, or null when the guide has none (and so no page). */
  guideHtml: (slug: string) => string | null;
}

const url = (path: string): string => absoluteSiteUrl(path);

/** Guides that have a body; the others render "not found" and are never listed. */
const publishedGuides = (deps: StaticFileDeps) => deps.articles.filter((guide) => deps.guideHtml(guide.slug) !== null);

function allStaticMeta(deps: StaticFileDeps): RouteMeta[] {
  return [
    ...Object.values(STATIC_ROUTES),
    toolsRouteMeta(deps.toolCount),
    ...deps.categories.map((category, index, all) => categoryRouteMeta(category, index, all)),
    ...publishedGuides(deps).map((guide) => guideRouteMeta(guide)),
  ];
}

export function buildStaticSitemapXml(deps: StaticFileDeps): string {
  const entries: SitemapEntry[] = allStaticMeta(deps)
    .filter((meta) => meta.robots === 'index' && meta.canonical)
    .map((meta) => ({ loc: meta.canonical as string, lastmod: meta.lastmod ?? STATIC_LASTMOD }));
  return renderUrlset(entries);
}

export function buildSitemapIndexXml(deps: StaticFileDeps): string {
  const newest = allStaticMeta(deps).map((meta) => meta.lastmod ?? STATIC_LASTMOD).sort().pop() ?? STATIC_LASTMOD;
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap>
  <loc>${xmlText(`${SITE_URL}/sitemap.xml`)}</loc>
  <lastmod>${xmlText(newest)}</lastmod>
</sitemap>
</sitemapindex>
`;
}

const oneLine = (text: string): string => text.replace(/\s+/g, ' ').trim();
const faqAnswer = (id: string): string => faqEntries().find((entry) => entry.id === id)?.answer ?? '';
const linkLine = (label: string, href: string, note: string) => `- [${label}](${href}): ${oneLine(note)}`;

function checklistTitle(category: CategoryInput): string {
  return categoryRouteMeta(category).body.h1;
}

function guidesByCategory(guides: readonly StaticFileGuide[]): Map<string, StaticFileGuide[]> {
  const groups = new Map<string, StaticFileGuide[]>();
  for (const guide of guides) groups.set(guide.category, [...(groups.get(guide.category) ?? []), guide]);
  return groups;
}

export function buildLlmsTxt(deps: StaticFileDeps): string {
  const route = (path: string) => STATIC_ROUTES[path];
  const lines: string[] = [
    '# Digibastion',
    '',
    `> ${SITE_DEFINITION}`,
    '',
    'Incident records come from the sources each one names (QuillMonitor, Web3 Is Going Just Great, SlowMist and security news sites). ' +
      'Digibastion does not check incidents itself; each record shows the status its source gives and links back to it. ' +
      'Everything listed here is free unless marked as a service.',
    '',
    '## Threat intelligence',
    '',
    linkLine('Threat Intel feed', url('/threat-intel'), route('/threat-intel').description),
    linkLine('How we track incidents', url(METHODOLOGY_PATH), route(METHODOLOGY_PATH).description),
    linkLine('Weekly reports', url('/threat-intel/weekly'), route('/threat-intel/weekly').description),
    linkLine('FAQ', url('/faq'), route('/faq').description),
    linkLine('RSS feed', FEED_URLS.rss, 'New Web3 incidents as RSS 2.0, each naming its source.'),
    linkLine('Atom feed', FEED_URLS.atom, 'The same incidents as Atom 1.0.'),
    linkLine('JSON Feed', FEED_URLS.json, 'The same incidents as JSON Feed 1.1.'),
    linkLine(`Telegram channel ${TELEGRAM_CHANNEL_HANDLE}`, TELEGRAM_CHANNEL_URL,
      'Posts new Web3 incidents from QuillMonitor, plus a link to the weekly report every Monday.'),
    linkLine('Email alerts', url('/threat-intel?tab=subscribe'), NEWSLETTERS_LIVE
      ? 'Alerts on critical and high incidents, checked every 30 minutes, plus an optional daily brief and weekly deep-dive email.'
      : 'Alerts on critical and high incidents, checked every 30 minutes. Free, double opt-in.'),
    `- Severity: ${faqAnswer('severity')}`,
    `- Duplicates: ${faqAnswer('duplicates')}`,
    '',
    '## Guides',
    '',
  ];
  for (const [category, guides] of guidesByCategory(publishedGuides(deps))) {
    lines.push(`### ${category}`, '');
    for (const guide of guides) lines.push(linkLine(guide.title, url(`/articles/${guide.slug}`), guide.description));
    lines.push('');
  }
  lines.push('## Checklists', '');
  for (const category of deps.categories) {
    lines.push(linkLine(checklistTitle(category), url(`/category/${category.id}`), `${category.items.length} items. ${category.description}`));
  }
  lines.push(
    '',
    '## Tools and services',
    '',
    linkLine('OpSec self-check', url('/quiz'), route('/quiz').description),
    linkLine('Web3 security tools directory', url('/tools'), toolsRouteMeta(deps.toolCount).description),
    linkLine('Security resources', url('/links'), route('/links').description),
    linkLine('Services', url('/services'), route('/services').description),
    linkLine('OpSec consulting', url('/services/opsec-consulting'), route('/services/opsec-consulting').description),
    linkLine('Full-stack security review', url('/services/full-stack-review'), route('/services/full-stack-review').description),
    linkLine('Vantage (beta)', VANTAGE_URL, 'Reviews a domain\'s DNS, email, TLS, frontend and Web3 trust evidence in one place.'),
    '',
    '## About',
    '',
    linkLine('About', url('/about'), route('/about').description),
    linkLine('License', url('/license'), route('/license').description),
    linkLine('Source code on GitHub', GITHUB_REPO_URL, 'The site, the ingestion functions and the database migrations.'),
    linkLine('Roadmap', GITHUB_ROADMAP_URL, 'What is live, what is in progress and what comes next.'),
    linkLine('Full text for language models', url('/llms-full.txt'), 'The FAQ, every guide and every checklist in plain text.'),
    '',
  );
  return lines.join('\n');
}

/** Shifts Markdown-style headings down one level so a guide's own h2s sit under its "## title". */
const demoteHeadings = (text: string): string => text.replace(/^(#{1,5}) /gm, '#$1 ');

export function buildLlmsFullTxt(deps: StaticFileDeps): string {
  const lines: string[] = [
    '# Digibastion: full text',
    '',
    `> ${SITE_DEFINITION}`,
    '',
    'This file holds the FAQ, every security guide and every checklist on www.digibastion.com as plain text. ' +
      'Live incident records are not included because they change; read them from the feeds instead:',
    `RSS ${FEED_URLS.rss}, Atom ${FEED_URLS.atom}, JSON Feed ${FEED_URLS.json}.`,
    'Incident records come from the sources each one names. Digibastion does not check incidents itself; each record shows the status its source gives and links back to it.',
    '',
    '# Frequently asked questions',
    '',
  ];
  for (const entry of faqEntries()) lines.push(`## ${entry.question}`, '', entry.answer, '');

  lines.push('# Guides', '');
  for (const guide of publishedGuides(deps)) {
    lines.push(`## ${guide.title}`, '', `URL: ${url(`/articles/${guide.slug}`)}`, `Updated: ${guide.modifiedAt.slice(0, 10)}`, '');
    lines.push(oneLine(guide.summary || guide.description), '');
    if (guide.keyTakeaways?.length) {
      lines.push('Key takeaways:', ...guide.keyTakeaways.map((item) => `- ${oneLine(item)}`), '');
    }
    if (guide.sources?.length) {
      lines.push('Sources:', ...guide.sources.map((source) => {
        const name = [source.title, source.publisher].filter(Boolean).join(', ');
        return `- ${name ? `${oneLine(name)}: ` : ''}${source.url}`;
      }), '');
    }
    const body = htmlToText(deps.guideHtml(guide.slug) ?? '');
    if (body) lines.push(demoteHeadings(body), '');
  }

  lines.push('# Checklists', '');
  for (const category of deps.categories) {
    lines.push(`## ${checklistTitle(category)}`, '', `URL: ${url(`/category/${category.id}`)}`, '', oneLine(category.description), '');
    for (const item of category.items) {
      lines.push(`- ${oneLine(item.title)}${item.description ? `: ${oneLine(item.description)}` : ''}`);
    }
    lines.push('');
  }
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}
