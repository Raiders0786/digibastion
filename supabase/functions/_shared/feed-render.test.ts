// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  FEED_CHANNEL, FEED_CONTENT_TYPES, incidentFeedItem, renderAtom, renderFeed, renderJsonFeed, renderRss, sortFeedItems, weeklyFeedItem,
} from './feed-render';
import { toNewsletterItem, type NewsletterSourceRow } from './newsletter-content';
import { weeklyPublicContent } from './weekly-test-fixtures';

const row: NewsletterSourceRow = {
  id: 'abc', uid: 'qm:1', title: 'Bridge & Co <exploit>', summary: 'Attackers drained the bridge.', severity: 'high',
  category: 'defi-exploits', link: 'https://www.quillaudits.com/web3-hacks-database/x', source_name: 'QuillMonitor',
  cve_id: null, tags: [], affected_technologies: [], created_at: '2026-10-11T02:20:00Z',
  metadata: { provider: 'quillmonitor', is_web3_incident: true, verification_status: 'unverified', project_name: 'Bridge & Co', amount_lost_usd: 4_200_000, incident_date: '2026-10-10' },
};
const item = incidentFeedItem(toNewsletterItem(row, 'https://www.digibastion.com'));
const parses = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml').getElementsByTagName('parsererror').length === 0;

describe('feed-render', () => {
  it('links to the canonical page with no tags and a permalink guid', () => {
    expect(item.url).toBe('https://www.digibastion.com/threat-intel/abc');
    const rss = renderRss(FEED_CHANNEL, [item]);
    expect(parses(rss)).toBe(true);
    expect(rss).toContain('<guid isPermaLink="true">https://www.digibastion.com/threat-intel/abc</guid>');
    // toNewsletterItem strips tags from titles; what is left is escaped.
    expect(rss).toContain('<title>Bridge &amp; Co</title>');
    expect(renderRss(FEED_CHANNEL, [{ ...item, title: 'A < B & "C" 🚨' }])).toContain('<title>A &lt; B &amp; &quot;C&quot; 🚨</title>');
    expect(rss).toContain('<pubDate>Sun, 11 Oct 2026 02:20:00 GMT</pubDate>');
    expect(rss).toContain('<atom:link href="https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=rss" rel="self" type="application/rss+xml"/>');
    expect(rss).not.toContain('utm_');
  });
  it('names the source, its status and QuillMonitor, never Digibastion as verifier', () => {
    expect(item.summaryText).toBe('Bridge & Co lost about $4.2M on 10 Oct 2026, according to QuillMonitor (unconfirmed).');
    expect(item.contentHtml).toContain('Source: <a href="https://www.quillaudits.com/web3-hacks-database/x">QuillMonitor</a> (unconfirmed, preliminary)');
    expect(item.contentHtml).toContain('Powered by <a href="https://www.quillaudits.com/web3-hacks-database">QuillMonitor</a>');
    expect(item.contentHtml).not.toMatch(/verified by digibastion/i);
    expect(item.authorName).toBe('QuillMonitor');
  });
  it('leaves out the QuillMonitor line and the link when they do not apply', () => {
    const other = incidentFeedItem(toNewsletterItem({
      ...row, id: 'def', link: null, source_name: 'Web3 Is Going Just Great',
      metadata: { provider: 'web3-incidents', project_name: 'Other' },
    }, 'https://www.digibastion.com'));
    expect(other.contentHtml).toContain('Source: Web3 Is Going Just Great</p>');
    expect(other.contentHtml).not.toContain('Powered by');
  });
  it('produces valid Atom and JSON Feed', () => {
    const atom = renderAtom(FEED_CHANNEL, [item]);
    expect(parses(atom)).toBe(true);
    expect(atom).toContain('<updated>2026-10-11T02:20:00.000Z</updated>');
    expect(atom).toContain('<content type="html">');
    // Each feed URL is its own feed id, so the all-items and incidents-only feeds never share one.
    expect(atom).toContain('<id>https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=atom</id>');
    const incidentsOnly = renderAtom(FEED_CHANNEL, [item], 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=atom&type=incidents');
    expect(incidentsOnly).toContain('<id>https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=atom&amp;type=incidents</id>');
    const json = JSON.parse(renderJsonFeed(FEED_CHANNEL, [item]));
    expect(json.version).toBe('https://jsonfeed.org/version/1.1');
    expect(json.feed_url).toBe('https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=json');
    expect(json.items[0]).toMatchObject({ id: item.url, url: item.url, date_published: '2026-10-11T02:20:00.000Z', authors: [{ name: 'QuillMonitor' }] });
  });
  it('renders valid empty feeds', () => {
    expect(parses(renderRss(FEED_CHANNEL, []))).toBe(true);
    const atom = renderAtom(FEED_CHANNEL, []);
    expect(parses(atom)).toBe(true);
    expect(atom).toContain('<updated>1970-01-01T00:00:00Z</updated>');
    expect(JSON.parse(renderJsonFeed(FEED_CHANNEL, [])).items).toEqual([]);
  });
  it('is deterministic: no build clock in the output', () => {
    expect(renderRss(FEED_CHANNEL, [item])).toBe(renderRss(FEED_CHANNEL, [item]));
    expect(renderRss(FEED_CHANNEL, [])).not.toContain('<lastBuildDate>');
    expect(renderRss(FEED_CHANNEL, [item])).toContain('<lastBuildDate>Sun, 11 Oct 2026 02:20:00 GMT</lastBuildDate>');
  });
  it('drops items whose date does not parse and characters XML cannot carry', () => {
    const broken = { ...item, url: 'https://www.digibastion.com/threat-intel/zzz', publishedAt: 'bad' };
    const odd = { ...item, title: 'Bad\u0001title' };
    const rss = renderRss(FEED_CHANNEL, [broken, odd]);
    expect(parses(rss)).toBe(true);
    expect(rss).not.toContain('threat-intel/zzz');
    expect(rss).toContain('<title>Badtitle</title>');
    expect(parses(renderAtom(FEED_CHANNEL, [broken, odd]))).toBe(true);
    expect(JSON.parse(renderJsonFeed(FEED_CHANNEL, [broken, odd])).items).toHaveLength(1);
  });
  it('adds the weekly issue, credited to Digibastion and linking each incident', () => {
    const weekly = weeklyFeedItem(weeklyPublicContent(), '2026-10-12T00:10:00Z');
    expect(weekly.url).toBe('https://www.digibastion.com/threat-intel/weekly/2026-10-05');
    expect(weekly.title).toBe('Weekly deep-dive, week of Oct 5: ~$12.3M reported across 9 incidents');
    expect(weekly.authorName).toBe('Digibastion');
    expect(weekly.publishedAt).toBe('2026-10-12T00:10:00.000Z');
    expect(weekly.contentHtml).toContain('href="https://www.digibastion.com/threat-intel/id-quillmonitor%3Atop1"');
    expect(weekly.contentHtml).not.toContain('reported a loss.'); // AI-written paragraphs stay on the page
    expect(parses(renderRss(FEED_CHANNEL, [weekly, item]))).toBe(true);
  });
  it('sorts newest first and picks the renderer by format', () => {
    const older = { ...item, url: 'https://www.digibastion.com/threat-intel/old', publishedAt: '2026-10-01T00:00:00.000Z' };
    expect(sortFeedItems([older, item]).map((entry) => entry.url)).toEqual([item.url, older.url]);
    expect(renderFeed('json', FEED_CHANNEL, [item])).toBe(renderJsonFeed(FEED_CHANNEL, [item]));
    expect(FEED_CONTENT_TYPES.atom).toBe('application/atom+xml; charset=utf-8');
  });
});
