import { describe, expect, it } from 'vitest';
import type { NewsArticle } from '@/types/news';
import { incidentRouteMeta, incidentSeoInputFromArticle, isUsableSummary } from '../incidentMeta';

const qmSources = [
  { provider: 'quillmonitor', url: 'https://www.quillaudits.com/web3-hacks-database/example', label: 'QuillMonitor' },
  { provider: 'web3-incidents', url: 'https://www.web3isgoinggreat.com/?id=example', label: 'Web3 Is Going Just Great' },
];

const quillMonitor: NewsArticle = {
  id: 'qm-123',
  title: 'Example Protocol bridge exploit',
  summary: 'Summary pending',
  content: '',
  category: 'defi-exploits',
  tags: ['bridge'],
  severity: 'high',
  link: 'https://www.quillaudits.com/web3-hacks-database/example',
  publishedAt: new Date('2012-05-01T00:00:00Z'),
  createdAt: new Date('2026-09-29T10:00:00Z'),
  sourceName: 'QuillMonitor',
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    project_name: 'Example Protocol',
    chain: 'Ethereum',
    attack_type: 'Bridge Exploit',
    amount_lost_usd: 4_200_000,
    incident_date: '2026-09-28',
    verification_status: 'verified',
    sources: qmSources,
  },
};

const rss: NewsArticle = {
  id: 'rss-9',
  title: 'Vendor patches remote code execution bug in popular router firmware',
  summary: 'The vendor shipped fixes for a remote code execution flaw that attackers are already exploiting in the wild.',
  content: '',
  category: 'vulnerability-disclosure',
  tags: [],
  severity: 'critical',
  link: 'https://www.bleepingcomputer.com/news/security/example/',
  publishedAt: new Date('2026-10-01T08:00:00Z'),
  createdAt: new Date('2026-10-01T09:00:00Z'),
  sourceName: 'BleepingComputer',
  metadata: { provider: 'rss', is_web3_incident: false },
};

describe('incident route meta', () => {
  it('uses the answer sentence for a Web3 incident and indexes it', () => {
    const meta = incidentRouteMeta(incidentSeoInputFromArticle(quillMonitor));
    expect(meta.description).toBe(
      'Example Protocol on Ethereum lost about $4.2M in a bridge exploit on 28 Sep 2026, according to QuillMonitor (confirmed).',
    );
    expect(meta.body.intro).toBe(meta.description);
    expect(meta.robots).toBe('index');
    expect(meta.type).toBe('article');
    expect(meta.title.length).toBeLessThanOrEqual(70);
    expect(meta.title.endsWith(' | Digibastion')).toBe(true);
    expect(meta.canonical).toBe('https://www.digibastion.com/threat-intel/qm-123');
    expect(meta.publishedTime).toBe('2026-09-29T10:00:00.000Z');
  });

  it('keeps RSS relays out of the index but lets crawlers follow links', () => {
    const meta = incidentRouteMeta(incidentSeoInputFromArticle(rss));
    expect(meta.robots).toBe('noindex,follow');
    expect(meta.description).toBe(rss.summary);
  });

  it('never uses "Summary pending" as the description', () => {
    const input = incidentSeoInputFromArticle({ ...rss, summary: 'Summary pending' });
    const meta = incidentRouteMeta(input);
    expect(meta.description).not.toMatch(/pending/i);
    expect(meta.description).toBe(`${rss.title}. Source: BleepingComputer.`);
  });

  it('truncates a long title at a word', () => {
    const title = `${'Very long incident headline words '.repeat(6)}end`;
    const meta = incidentRouteMeta(incidentSeoInputFromArticle({ ...quillMonitor, title }));
    expect(meta.title.length).toBeLessThanOrEqual(70);
    expect(meta.title).toMatch(/…\s\|\sDigibastion$/);
    expect(meta.title).not.toMatch(/\s…/);
  });

  it('names the source, credits QuillMonitor and links back to its pages', () => {
    const meta = incidentRouteMeta(incidentSeoInputFromArticle(quillMonitor));
    expect(meta.body.items).toEqual(expect.arrayContaining([
      'Severity: High',
      'Reported loss: about $4.2M',
      'Chain: Ethereum',
      'Attack type: Bridge Exploit',
      'Source: QuillMonitor (confirmed)',
    ]));
    expect(meta.body.links[0]).toEqual({ href: 'https://www.quillaudits.com/web3-hacks-database/example', label: 'Original report (quillaudits.com)' });
    const hrefs = meta.body.links.map((l) => l.href);
    expect(hrefs).toEqual(expect.arrayContaining([
      'https://www.quillaudits.com/web3-hacks-database/example',
      '/threat-intel/methodology',
      '/threat-intel',
      '/threat-intel/weekly',
    ]));
    // Two sources were merged, so QuillMonitor is not the only provider.
    expect(meta.body.links.some((l) => /Powered by QuillMonitor/.test(l.label))).toBe(false);
    expect(JSON.stringify(meta)).not.toMatch(/verified by digibastion/i);
  });

  it('shows "Powered by QuillMonitor" on a QuillMonitor-only record', () => {
    const only: NewsArticle = { ...quillMonitor, metadata: { ...quillMonitor.metadata, sources: [qmSources[0]] } };
    const meta = incidentRouteMeta(incidentSeoInputFromArticle(only));
    expect(meta.body.links).toContainEqual({ href: 'https://www.quillaudits.com/web3-hacks-database', label: 'Powered by QuillMonitor' });
  });

  it('builds an honest NewsArticle schema', () => {
    const meta = incidentRouteMeta(incidentSeoInputFromArticle(quillMonitor));
    const article = meta.jsonLd.find((node) => (node as { '@type'?: string })['@type'] === 'NewsArticle') as Record<string, unknown>;
    expect(article.datePublished).toBe('2026-09-29T10:00:00.000Z');
    expect(article.author).toEqual({ '@type': 'Organization', name: 'QuillMonitor' });
    expect(article.citation).toEqual([
      'https://www.quillaudits.com/web3-hacks-database/example',
      'https://www.web3isgoinggreat.com/?id=example',
    ]);
    expect(article.about).toEqual([{ '@type': 'Thing', name: 'Example Protocol' }, { '@type': 'Thing', name: 'Ethereum' }]);
  });

  it('reads the stored date when createdAt is missing', () => {
    const input = incidentSeoInputFromArticle({ ...rss, createdAt: undefined });
    expect(input.createdAt).toBe('2026-10-01T08:00:00.000Z');
  });
});

describe('isUsableSummary', () => {
  it('rejects empty, short and pending summaries', () => {
    expect(isUsableSummary(null)).toBe(false);
    expect(isUsableSummary('   ')).toBe(false);
    expect(isUsableSummary('Too short to help.')).toBe(false);
    expect(isUsableSummary('Summary pending. The provider has not written one yet, check back later.')).toBe(false);
    expect(isUsableSummary('pending review by the provider, more details to follow shortly')).toBe(false);
    expect(isUsableSummary(rss.summary)).toBe(true);
  });
});
