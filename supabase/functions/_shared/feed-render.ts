// RSS 2.0, Atom 1.0 and JSON Feed 1.1 for the threat-intel feed. Every item
// links to its canonical Digibastion page (no tracking tags), names its source
// and that source's status, and keeps "Powered by QuillMonitor" on
// QuillMonitor-only records. Output depends only on the items, never on the
// clock, so an unchanged feed renders byte for byte the same.
// Pure module: no Deno or URL imports, no replaceAll.
import { isQuillMonitorOnly, QUILLMONITOR_DATABASE_URL, sourceLabelFor, sourceLinkFor } from './attribution.ts';
import { buildIncidentAnswer } from './incident-answer.ts';
import { formatLossReported, type NewsletterItem, type WeeklyPublicContent } from './newsletter-content.ts';
import { buildWeeklySubject } from './weekly-render.ts';
import { canonicalIncidentUrl, canonicalWeeklyUrl, FEED_URLS, SITE_URL } from './site-urls.ts';
import { xmlText } from './xml.ts';

export interface FeedItem {
  url: string;
  title: string;
  summaryText: string;
  contentHtml: string;
  publishedAt: string;
  categories: string[];
  authorName: string;
}
export interface FeedChannel { title: string; description: string; homePageUrl: string }
export type FeedFormat = 'rss' | 'atom' | 'json';

export const FEED_CHANNEL: FeedChannel = {
  title: 'Digibastion Threat Intel',
  description: 'Crypto and Web3 security incidents from QuillMonitor and other public trackers, one record per incident, each linked to its source.',
  homePageUrl: `${SITE_URL}/threat-intel`,
};

export const FEED_CONTENT_TYPES: Record<FeedFormat, string> = {
  rss: 'application/rss+xml; charset=utf-8',
  atom: 'application/atom+xml; charset=utf-8',
  json: 'application/feed+json; charset=utf-8',
};

const STATUS_WORDS = { confirmed: 'confirmed', unconfirmed: 'unconfirmed, preliminary' } as const;
const EPOCH = '1970-01-01T00:00:00Z';

/** ISO 8601 in UTC, or '' when the value is not a date (such items are dropped). */
function isoOrEmpty(value: string): string {
  const time = Date.parse(value);
  return Number.isNaN(time) ? '' : new Date(time).toISOString();
}

// HTML inside the feed is escaped the same way as XML text.
const html = xmlText;

export function incidentFeedItem(item: NewsletterItem): FeedItem {
  const url = canonicalIncidentUrl(item.articleId ?? item.uid);
  const answer = buildIncidentAnswer(item);
  const name = sourceLabelFor(item);
  const link = sourceLinkFor(item);
  const status = item.status ? ` (${STATUS_WORDS[item.status]})` : '';
  const source = link ? `<a href="${html(link)}">${html(name)}</a>` : html(name);
  const parts = [
    `<p>${html(answer)}</p>`,
    item.summary ? `<p>${html(item.summary)}</p>` : '',
    `<p>Source: ${source}${status}</p>`,
    isQuillMonitorOnly(item.providers) ? `<p>Powered by <a href="${QUILLMONITOR_DATABASE_URL}">QuillMonitor</a></p>` : '',
  ];
  return {
    url,
    title: item.title,
    summaryText: answer,
    contentHtml: parts.join(''),
    publishedAt: isoOrEmpty(item.createdAt),
    categories: item.category ? [item.category] : [],
    authorName: name,
  };
}

/**
 * The weekly deep-dive as one item. Digibastion writes the weekly, so it is
 * the author; each listed incident still names its own source. AI-written
 * paragraphs stay on the page, where they carry their label.
 */
export function weeklyFeedItem(c: WeeklyPublicContent, generatedAt: string): FeedItem {
  const url = canonicalWeeklyUrl(c.weekStart);
  const title = buildWeeklySubject(c);
  const loss = c.totals.lossUsd > 0 ? formatLossReported(c.totals.lossUsd) : null;
  const count = c.totals.incidentCount;
  const summary = `Web3 incidents added in the week starting ${c.weekStart} (UTC): ${count} ${count === 1 ? 'incident' : 'incidents'}` +
    `${loss ? `, ${loss}` : ''}. Each item names its source.`;
  const top = c.top.map(({ item }) => {
    const label = item.articleId
      ? `<a href="${html(canonicalIncidentUrl(item.articleId))}">${html(item.title)}</a>`
      : html(item.title);
    return `<li>${label}: ${html(buildIncidentAnswer(item))}</li>`;
  });
  const parts = [
    `<p>${html(summary)}</p>`,
    top.length > 0 ? `<ul>${top.join('')}</ul>` : '',
    `<p><a href="${html(url)}">Read the full weekly report</a></p>`,
  ];
  return {
    url,
    title,
    summaryText: summary,
    contentHtml: parts.join(''),
    publishedAt: isoOrEmpty(generatedAt),
    categories: ['weekly'],
    authorName: 'Digibastion',
  };
}

/** Newest first; items with no usable date are dropped. */
export function sortFeedItems(items: readonly FeedItem[]): FeedItem[] {
  return items
    .filter((item) => item.publishedAt && !Number.isNaN(Date.parse(item.publishedAt)))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
}

function newest(items: readonly FeedItem[]): string | null {
  const times = items.map((item) => Date.parse(item.publishedAt));
  return times.length > 0 ? new Date(Math.max(...times)).toISOString() : null;
}

export function renderRss(ch: FeedChannel, items: readonly FeedItem[], selfUrl: string = FEED_URLS.rss): string {
  const valid = sortFeedItems(items);
  const latest = newest(valid);
  const entries = valid.map((item) => [
    '<item>',
    `  <title>${xmlText(item.title)}</title>`,
    `  <link>${xmlText(item.url)}</link>`,
    `  <guid isPermaLink="true">${xmlText(item.url)}</guid>`,
    `  <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>`,
    `  <dc:creator>${xmlText(item.authorName)}</dc:creator>`,
    ...item.categories.map((category) => `  <category>${xmlText(category)}</category>`),
    `  <description>${xmlText(item.contentHtml)}</description>`,
    '</item>',
  ].join('\n'));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '<channel>',
    `<title>${xmlText(ch.title)}</title>`,
    `<link>${xmlText(ch.homePageUrl)}</link>`,
    `<description>${xmlText(ch.description)}</description>`,
    '<language>en</language>',
    `<atom:link href="${xmlText(selfUrl)}" rel="self" type="application/rss+xml"/>`,
    ...(latest ? [`<lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>`] : []),
    ...entries,
    '</channel>',
    '</rss>',
    '',
  ].join('\n');
}

export function renderAtom(ch: FeedChannel, items: readonly FeedItem[], selfUrl: string = FEED_URLS.atom): string {
  const valid = sortFeedItems(items);
  const entries = valid.map((item) => [
    '<entry>',
    `  <id>${xmlText(item.url)}</id>`,
    `  <title>${xmlText(item.title)}</title>`,
    `  <link rel="alternate" type="text/html" href="${xmlText(item.url)}"/>`,
    `  <published>${item.publishedAt}</published>`,
    `  <updated>${item.publishedAt}</updated>`,
    `  <author><name>${xmlText(item.authorName)}</name></author>`,
    ...item.categories.map((category) => `  <category term="${xmlText(category)}"/>`),
    `  <summary>${xmlText(item.summaryText)}</summary>`,
    `  <content type="html">${xmlText(item.contentHtml)}</content>`,
    '</entry>',
  ].join('\n'));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">',
    // The feed URL, not the home page: the all-items and incidents-only feeds share a home page.
    `<id>${xmlText(selfUrl)}</id>`,
    `<title>${xmlText(ch.title)}</title>`,
    `<subtitle>${xmlText(ch.description)}</subtitle>`,
    `<link rel="self" type="application/atom+xml" href="${xmlText(selfUrl)}"/>`,
    `<link rel="alternate" type="text/html" href="${xmlText(ch.homePageUrl)}"/>`,
    `<updated>${newest(valid) ?? EPOCH}</updated>`,
    '<author><name>Digibastion</name></author>',
    ...entries,
    '</feed>',
    '',
  ].join('\n');
}

export function renderJsonFeed(ch: FeedChannel, items: readonly FeedItem[], selfUrl: string = FEED_URLS.json): string {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: ch.title,
    home_page_url: ch.homePageUrl,
    feed_url: selfUrl,
    description: ch.description,
    language: 'en',
    items: sortFeedItems(items).map((item) => ({
      id: item.url,
      url: item.url,
      title: item.title,
      content_html: item.contentHtml,
      summary: item.summaryText,
      date_published: item.publishedAt,
      tags: item.categories,
      authors: [{ name: item.authorName }],
    })),
  }, null, 2);
}

export function renderFeed(format: FeedFormat, ch: FeedChannel, items: readonly FeedItem[], selfUrl?: string): string {
  if (format === 'atom') return renderAtom(ch, items, selfUrl);
  if (format === 'json') return renderJsonFeed(ch, items, selfUrl);
  return renderRss(ch, items, selfUrl);
}
