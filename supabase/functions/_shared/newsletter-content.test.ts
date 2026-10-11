import { describe, expect, it } from 'vitest';
import {
  DAILY_CAPS,
  MAX_PLAUSIBLE_LOSS_USD,
  NEWSLETTER_CONTENT_VERSION,
  compareItems,
  formatLossReported,
  newsletterItemToDeliverable,
  statusChangeItem,
  toNewsletterItem,
  type NewsletterItem,
} from './newsletter-content.ts';
import { matchesDeliveryPreferences } from './subscription-delivery.ts';

const SITE = 'https://www.digibastion.com';

const quillRow = {
  id: '6f1c2c58-6a39-4c55-9d2f-0f0e4b3a9a11',
  uid: 'quillmonitor:abc123',
  title: 'Example Protocol bridge exploit',
  summary: '<p>Attackers drained the <b>bridge</b> contract after a signature check was skipped.</p>',
  severity: 'critical',
  category: 'defi-exploits',
  link: 'https://x.com/quillaudits/status/1',
  source_name: 'QuillMonitor',
  cve_id: null,
  tags: ['bridge', 'signature'],
  affected_technologies: ['Ethereum'],
  created_at: '2026-10-11T08:00:00.000Z',
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    project_name: 'Example Protocol',
    chain: 'Ethereum',
    attack_type: 'Signature Verification',
    amount_lost_usd: 4_200_000,
    amount_display: '$4.2M',
    incident_date: '2026-10-10',
    verification_status: 'unverified',
    funds_returned: false,
    sources: [
      { provider: 'quillmonitor', url: 'https://x.com/quillaudits/status/1', label: 'QuillMonitor', amount_usd: 4_200_000 },
      { provider: 'slowmist', url: 'https://hacked.slowmist.io/', label: 'SlowMist', amount_usd: 4_100_000 },
    ],
  },
};

describe('toNewsletterItem', () => {
  it('maps a QuillMonitor row', () => {
    expect(toNewsletterItem(quillRow, `${SITE}/`)).toEqual({
      uid: 'quillmonitor:abc123',
      articleId: quillRow.id,
      title: 'Example Protocol bridge exploit',
      incidentUrl: `${SITE}/threat-intel/${quillRow.id}`,
      sourceName: 'QuillMonitor',
      sourceUrl: 'https://x.com/quillaudits/status/1',
      providers: ['quillmonitor', 'slowmist'],
      severity: 'critical',
      category: 'defi-exploits',
      isWeb3Incident: true,
      status: 'unconfirmed',
      projectName: 'Example Protocol',
      chain: 'Ethereum',
      attackType: 'Signature Verification',
      amountUsd: 4_200_000,
      amountDisplay: '$4.2M',
      fundsReturned: false,
      incidentDate: '2026-10-10',
      cveId: null,
      tags: ['bridge', 'signature'],
      technologies: ['Ethereum'],
      summary: 'Attackers drained the bridge contract after a signature check was skipped.',
      createdAt: '2026-10-11T08:00:00.000Z',
      securityDomain: null,
    } satisfies NewsletterItem);
  });

  it('carries the security domain so the Web3 umbrella category matches as in the legacy digest', () => {
    const rss = toNewsletterItem({ ...quillRow, category: 'operational-security', metadata: { provider: 'rss', is_web3_incident: false, security_domain: 'Web3' } }, SITE);
    expect(rss.securityDomain).toBe('web3');
    expect(newsletterItemToDeliverable(rss).metadata?.security_domain).toBe('web3');
  });

  it('maps verification to source status words', () => {
    const verified = toNewsletterItem({ ...quillRow, metadata: { ...quillRow.metadata, verification_status: 'verified' } }, SITE);
    expect(verified.status).toBe('confirmed');
    const rss = toNewsletterItem({ ...quillRow, metadata: { provider: 'rss', is_web3_incident: false } }, SITE);
    expect(rss.status).toBeNull();
    expect(rss.providers).toEqual(['rss']);
    expect(rss.isWeb3Incident).toBe(false);
  });

  it('drops an implausible legacy amount', () => {
    const item = toNewsletterItem({
      ...quillRow,
      metadata: { ...quillRow.metadata, amount_lost_usd: 3.8e12, amount_display: '$3800000M' },
    }, SITE);
    expect(item.amountUsd).toBeNull();
    expect(item.amountDisplay).toBeNull();
  });

  it('falls back to the incident page when the link is missing or unsafe', () => {
    expect(toNewsletterItem({ ...quillRow, link: null }, SITE).sourceUrl).toBe(`${SITE}/threat-intel/${quillRow.id}`);
    expect(toNewsletterItem({ ...quillRow, link: 'javascript:alert(1)' }, SITE).sourceUrl)
      .toBe(`${SITE}/threat-intel/${quillRow.id}`);
  });

  it('cuts long summaries at a word boundary', () => {
    const long = toNewsletterItem({ ...quillRow, summary: 'word '.repeat(100) }, SITE);
    expect(Array.from(long.summary).length).toBeLessThanOrEqual(280);
    expect(long.summary.endsWith('…')).toBe(true);
    expect(toNewsletterItem({ ...quillRow, summary: null }, SITE).summary).toBe('');
  });

  it('falls back to info for an unknown severity', () => {
    expect(toNewsletterItem({ ...quillRow, severity: 'extreme' }, SITE).severity).toBe('info');
  });
});

describe('stored URLs stay clean', () => {
  it('never stores UTM tags in incidentUrl or sourceUrl, because the public weekly page renders the same JSON', () => {
    for (const row of [quillRow, { ...quillRow, link: null }]) {
      const stored = toNewsletterItem(row, SITE);
      expect(stored.incidentUrl).toBe(`${SITE}/threat-intel/${quillRow.id}`);
      expect(`${stored.incidentUrl} ${stored.sourceUrl}`).not.toContain('utm_');
    }
    expect(statusChangeItem({ id: quillRow.id, title: 't' }, quillRow.uid, SITE).incidentUrl).not.toContain('utm_');
  });
});

describe('statusChangeItem', () => {
  it('builds an item from an incident_status_events snapshot', () => {
    const snapshot = {
      id: quillRow.id,
      title: quillRow.title,
      severity: 'high',
      category: 'defi-exploits',
      link: quillRow.link,
      source_name: 'QuillMonitor',
      tags: ['bridge'],
      affected_technologies: ['Ethereum'],
      created_at: quillRow.created_at,
      metadata: {
        provider: 'quillmonitor', project_name: 'Example Protocol', chain: 'Ethereum', attack_type: 'Signature Verification',
        amount_lost_usd: 4_200_000, amount_display: '$4.2M', verification_status: 'verified', is_web3_incident: true,
        incident_date: '2026-10-10', sources: quillRow.metadata.sources,
      },
    };
    const item = statusChangeItem(snapshot, quillRow.uid, SITE);
    expect(item).toMatchObject({
      uid: quillRow.uid,
      articleId: quillRow.id,
      incidentUrl: `${SITE}/threat-intel/${quillRow.id}`,
      severity: 'high',
      status: 'confirmed',
      projectName: 'Example Protocol',
      amountUsd: 4_200_000,
      summary: '',
    });
  });

  it('survives an empty snapshot', () => {
    const item = statusChangeItem(null, 'web3:1', SITE);
    expect(item.uid).toBe('web3:1');
    expect(item.articleId).toBeNull();
    expect(item.incidentUrl).toBe(`${SITE}/threat-intel`);
    expect(item.title).toBe('Untitled incident');
  });
});

describe('newsletterItemToDeliverable', () => {
  const item = toNewsletterItem(quillRow, SITE);
  const prefs = { categories: ['web3-security'], severity_threshold: 'medium' };

  it('round-trips through matchesDeliveryPreferences', () => {
    const deliverable = newsletterItemToDeliverable(item);
    expect(matchesDeliveryPreferences(deliverable, prefs)).toBe(true);
    expect(matchesDeliveryPreferences(deliverable, { ...prefs, content_scope: 'web3-incidents' })).toBe(true);
    expect(matchesDeliveryPreferences(deliverable, { ...prefs, categories: ['supply-chain'] })).toBe(false);
  });

  it('keeps the preliminary filter', () => {
    expect(matchesDeliveryPreferences(newsletterItemToDeliverable(item), { ...prefs, include_preliminary: false })).toBe(false);
    const confirmed = { ...item, status: 'confirmed' as const };
    expect(matchesDeliveryPreferences(newsletterItemToDeliverable(confirmed), { ...prefs, include_preliminary: false })).toBe(true);
  });

  it('keeps the chain filter', () => {
    expect(matchesDeliveryPreferences(newsletterItemToDeliverable(item), { ...prefs, chains: ['ethereum'] })).toBe(true);
    expect(matchesDeliveryPreferences(newsletterItemToDeliverable(item), { ...prefs, chains: ['solana'] })).toBe(false);
  });

  it('keeps the technology match', () => {
    const low = { ...item, severity: 'low' as const };
    expect(matchesDeliveryPreferences(newsletterItemToDeliverable(low), { ...prefs, severity_threshold: 'low', technologies: ['ethereum'] }))
      .toBe(true);
    expect(matchesDeliveryPreferences(newsletterItemToDeliverable(low), { ...prefs, severity_threshold: 'low', technologies: ['rust'] }))
      .toBe(false);
  });
});

describe('formatLossReported and compareItems', () => {
  it('formats a reported loss', () => {
    expect(formatLossReported(4_200_000)).toBe('~$4.2M reported');
    expect(formatLossReported(38_000)).toBe('~$38K reported');
    expect(formatLossReported(null)).toBeNull();
    expect(formatLossReported(0)).toBeNull();
    expect(formatLossReported(MAX_PLAUSIBLE_LOSS_USD + 1)).toBeNull();
  });

  it('orders by severity, then amount, then newest', () => {
    const base = toNewsletterItem(quillRow, SITE);
    const items: NewsletterItem[] = [
      { ...base, uid: 'high-small', severity: 'high', amountUsd: 10, createdAt: '2026-10-11T00:00:00Z' },
      { ...base, uid: 'critical-none', severity: 'critical', amountUsd: null, createdAt: '2026-10-11T00:00:00Z' },
      { ...base, uid: 'high-big-old', severity: 'high', amountUsd: 1_000, createdAt: '2026-10-10T00:00:00Z' },
      { ...base, uid: 'high-big-new', severity: 'high', amountUsd: 1_000, createdAt: '2026-10-11T00:00:00Z' },
    ];
    expect(items.sort(compareItems).map((entry) => entry.uid))
      .toEqual(['critical-none', 'high-big-new', 'high-big-old', 'high-small']);
  });

  it('exposes the contract constants', () => {
    expect(NEWSLETTER_CONTENT_VERSION).toBe(1);
    expect(DAILY_CAPS).toEqual({ incidents: 15, unconfirmed: 10, statusChanges: 15, vulnerabilities: 10, updates: 200 });
  });
});
