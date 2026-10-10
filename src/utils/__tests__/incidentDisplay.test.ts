import { describe, expect, it } from 'vitest';
import type { NewsArticle } from '@/types/news';
import { getIncidentDisplay } from '@/lib/threatIntel/incidentDisplay';

const NOW = new Date('2026-10-10T12:00:00.000Z');
const OPTIONS = { now: NOW, timeZone: 'UTC' } as const;
const QM_DATABASE = 'https://www.quillaudits.com/web3-hacks-database';
const QM_REFERENCE = 'https://x.com/peckshield/status/1975000000000000001';

const base = (overrides: Partial<NewsArticle> = {}): NewsArticle => ({
  id: 'article-1',
  title: 'Incident',
  content: 'Details',
  summary: 'Summary',
  category: 'defi-exploits',
  tags: [],
  severity: 'high',
  publishedAt: new Date('2026-09-30T00:00:00.000Z'),
  ...overrides,
});

const quillMonitor = (
  metadata: NonNullable<NewsArticle['metadata']>,
  overrides: Partial<NewsArticle> = {},
): NewsArticle => base({
  id: 'quillmonitor:near-intents',
  title: 'NEAR Intents: Bridge exploit ($3.8M loss)',
  summary: 'Summary pending',
  sourceName: 'QuillMonitor',
  author: 'QuillAudits',
  isProcessed: true,
  createdAt: new Date('2026-10-09T14:05:00.000Z'),
  link: QM_REFERENCE,
  sourceUrl: JSON.stringify([
    { url: QM_REFERENCE, label: 'Incident reference' },
    { url: QM_DATABASE, label: 'QuillMonitor database' },
  ]),
  ...overrides,
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    incident_date: '2026-09-30',
    amount_lost_usd: 3_800_000,
    amount_display: '$3.8M',
    reference_url: QM_REFERENCE,
    attribution_url: QM_DATABASE,
    summary_origin: 'provider',
    ...metadata,
  },
});

describe('getIncidentDisplay', () => {
  it('labels an unverified QuillMonitor record as unconfirmed with a reported loss and its reference link', () => {
    const display = getIncidentDisplay(quillMonitor({ verification_status: 'unverified' }), OPTIONS);

    expect(display.verification).toBe('unconfirmed');
    expect(display.verificationHelp).toBe(
      'QuillMonitor has not verified this report yet. Details and the loss figure may change.',
    );
    expect(display.incidentDateLabel).toBe('Exploited Sep 30, 2026');
    expect(display.addedDateLabel).toBe('Added Oct 9');
    expect(display.lossLabel).toBe('~$3.8M reported');
    expect(display.fundsReturned).toBe(false);
    expect(display.sources).toEqual([{ label: 'QuillMonitor', url: QM_REFERENCE }]);
    expect(display.summaryLabel).toBeNull();
  });

  it('labels a verified QuillMonitor record as confirmed and links the database page when there is no reference', () => {
    const display = getIncidentDisplay(quillMonitor(
      { verification_status: 'verified', reference_url: null, funds_returned: true },
      {
        summary: 'The bridge relayer key was compromised and funds were moved to a new address.',
        link: QM_DATABASE,
        sourceUrl: JSON.stringify([{ url: QM_DATABASE, label: 'QuillMonitor database' }]),
      },
    ), OPTIONS);

    expect(display.verification).toBe('confirmed');
    expect(display.verificationHelp).toBe(
      "QuillMonitor lists this incident as verified. Digibastion shows the source's status and does not verify incidents itself.",
    );
    expect(display.lossLabel).toBe('$3.8M');
    expect(display.fundsReturned).toBe(true);
    expect(display.sources).toEqual([{ label: 'QuillMonitor', url: QM_DATABASE }]);
    expect(display.summaryLabel).toBe('Provider summary');
  });

  it('follows the stored amount status over the verification status', () => {
    expect(getIncidentDisplay(
      quillMonitor({ verification_status: 'verified', amount_status: 'revised' }),
      OPTIONS,
    ).lossLabel).toBe('$3.8M (revised)');
    expect(getIncidentDisplay(
      quillMonitor({ verification_status: 'verified', amount_status: 'reported' }),
      OPTIONS,
    ).lossLabel).toBe('~$3.8M reported');
  });

  it('hides implausible legacy amounts instead of showing a wrong loss', () => {
    // The old web3-incidents importer stored "$3,800,000" as 3.8e12 USD with
    // the display text "$3800000M". Those rows are still in the database.
    expect(getIncidentDisplay(
      quillMonitor({ provider: 'web3-incidents', amount_lost_usd: 3_800_000_000_000, amount_display: '$3800000M' }),
      OPTIONS,
    ).lossLabel).toBeNull();
  });

  it('lists every merged source for a web3-incidents record', () => {
    const display = getIncidentDisplay(base({
      id: 'web3-incidents:meter',
      title: 'Meter bridge exploit',
      summary: 'Meter said an attacker drained about $1.2M from its bridge on October 1 before the contracts were paused.',
      link: 'https://x.com/meter_io/status/1975100000000000000',
      sourceUrl: JSON.stringify([
        { url: 'https://x.com/meter_io/status/1975100000000000000', label: 'Meter statement' },
      ]),
      createdAt: new Date('2026-10-02T09:00:00.000Z'),
      metadata: {
        provider: 'web3-incidents',
        data_source: 'feed-1',
        is_web3_incident: true,
        incident_date: '2026-10-01',
        amount_lost_usd: 1_200_000,
        amount_display: '$1.2M',
        amount_status: 'reported',
        summary_origin: 'publisher',
        sources: [
          { provider: 'quillmonitor', url: QM_REFERENCE, label: 'QuillMonitor', amount_usd: 1_200_000 },
          {
            provider: 'web3-incidents',
            url: 'https://www.web3isgoinggreat.com/single/meter-bridge',
            label: 'Web3 Is Going Just Great',
            amount_usd: 1_200_000,
          },
        ],
      },
    }), OPTIONS);

    expect(display.sources).toEqual([
      { label: 'QuillMonitor', url: QM_REFERENCE },
      { label: 'Web3 Is Going Just Great', url: 'https://www.web3isgoinggreat.com/single/meter-bridge' },
      { label: 'Meter statement', url: 'https://x.com/meter_io/status/1975100000000000000' },
    ]);
    expect(display.verification).toBeNull();
    expect(display.verificationHelp).toBe('');
    expect(display.incidentDateLabel).toBe('Exploited Oct 1, 2026');
    expect(display.addedDateLabel).toBe('Added Oct 2');
    expect(display.lossLabel).toBe('~$1.2M reported');
    expect(display.summaryLabel).toBe('Excerpt');
  });

  it('names the publisher and labels only AI-written summaries for RSS items', () => {
    const rss = base({
      id: 'rss-1',
      category: 'vulnerability-disclosure',
      severity: 'critical',
      title: 'Vendor patches actively exploited VPN flaw',
      summary: 'The vendor released fixes for a remote code execution flaw that attackers are already using against exposed gateways.',
      sourceName: 'BleepingComputer',
      link: 'https://www.bleepingcomputer.com/news/security/vendor-patches-vpn-flaw/',
      sourceUrl: 'https://www.bleepingcomputer.com/feed/',
      publishedAt: new Date('2025-12-30T10:00:00.000Z'),
      isProcessed: true,
    });

    const legacy = getIncidentDisplay(rss, OPTIONS);
    expect(legacy.sources).toEqual([
      { label: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/news/security/vendor-patches-vpn-flaw/' },
    ]);
    expect(legacy.summaryLabel).toBeNull();
    expect(legacy.verification).toBeNull();
    expect(legacy.incidentDateLabel).toBeNull();
    expect(legacy.lossLabel).toBeNull();
    expect(legacy.addedDateLabel).toBe('Added Dec 30, 2025');

    expect(getIncidentDisplay({ ...rss, metadata: { summary_origin: 'ai' } }, OPTIONS).summaryLabel).toBe('AI summary');
  });

  it('returns no incident date when the source date is unknown or malformed', () => {
    expect(getIncidentDisplay(base({
      metadata: {
        provider: 'web3-incidents',
        data_source: 'feed-1',
        is_web3_incident: true,
        incident_date: '2026-10-01',
        incident_date_unknown: true,
      },
    }), OPTIONS).incidentDateLabel).toBeNull();
    expect(getIncidentDisplay(base({
      metadata: { is_web3_incident: true, incident_date: 'last week' },
    }), OPTIONS).incidentDateLabel).toBeNull();
  });

  it('always names at least one source, even without a link', () => {
    const display = getIncidentDisplay(base({
      link: '',
      metadata: { provider: 'web3-incidents', data_source: 'feed-2', is_web3_incident: true },
    }), OPTIONS);
    expect(display.sources).toEqual([{ label: 'QuillAudits hacks list', url: null }]);
  });

  it('never returns an unsafe source URL', () => {
    const display = getIncidentDisplay(base({
      sourceName: 'Example Tracker',
      metadata: {
        is_web3_incident: true,
        sources: [{ provider: 'other', url: 'javascript:alert(1)', label: 'Bad link', amount_usd: null }],
      },
    }), OPTIONS);
    expect(display.sources.length).toBeGreaterThan(0);
    expect(display.sources.every((source) => source.url === null || source.url.startsWith('https://'))).toBe(true);
  });
});
