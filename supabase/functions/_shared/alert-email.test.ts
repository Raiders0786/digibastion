import { describe, expect, it } from 'vitest';
import {
  ALERT_SUBJECT_MAX_LENGTH,
  alertBatchKey,
  buildAlertSubject,
  buildFollowUpSubject,
  planAlertFollowUp,
  renderAlertEmail,
  renderFollowUpEmail,
} from './alert-email.ts';
import { buildUnsubscribeLinks } from './email-compliance.ts';
import type { NewsletterItem } from './newsletter-content.ts';

const SITE = 'https://www.digibastion.com';

function item(overrides: Partial<NewsletterItem> = {}): NewsletterItem {
  return {
    uid: 'quillmonitor:abc123',
    articleId: '6f1c2c58-6a39-4c55-9d2f-0f0e4b3a9a11',
    title: 'Example Protocol loses funds in bridge attack',
    incidentUrl: `${SITE}/threat-intel/6f1c2c58-6a39-4c55-9d2f-0f0e4b3a9a11`,
    sourceName: 'QuillMonitor',
    sourceUrl: 'https://x.com/quillaudits/status/1',
    providers: ['quillmonitor'],
    severity: 'high',
    category: 'defi-exploits',
    isWeb3Incident: true,
    status: 'confirmed',
    projectName: 'Example Protocol',
    chain: 'Ethereum',
    attackType: 'Bridge Exploit',
    amountUsd: 4_200_000,
    amountDisplay: '$4.2M',
    fundsReturned: null,
    incidentDate: '2026-10-10',
    cveId: null,
    tags: [],
    technologies: [],
    summary: 'Attackers drained the bridge contract after a signature check was skipped.',
    createdAt: '2026-10-11T08:00:00.000Z',
    ...overrides,
  };
}

const vulnerability = item({
  uid: 'rss:cve',
  articleId: 'b1',
  title: 'CVE-2026-1234 in OpenSSL',
  sourceName: 'The Hacker News',
  providers: [],
  severity: 'critical',
  category: 'vulnerabilities',
  isWeb3Incident: false,
  status: null,
  projectName: null,
  chain: null,
  attackType: null,
  amountUsd: null,
  amountDisplay: null,
  cveId: 'CVE-2026-1234',
});

const links = buildUnsubscribeLinks({
  siteUrl: SITE,
  functionsBaseUrl: 'https://example.supabase.co/functions/v1',
  email: 'reader@example.com',
  token: '11111111-2222-3333-4444-555555555555',
});

const EMOJI = /\p{Extended_Pictographic}/u;

describe('buildAlertSubject', () => {
  it('names severity, project, attack and the reported loss for one incident', () => {
    expect(buildAlertSubject([item()])).toBe('High: Example Protocol bridge exploit, ~$4.2M reported');
  });

  it('prefixes unconfirmed records', () => {
    expect(buildAlertSubject([item({ status: 'unconfirmed' })]))
      .toBe('[Unconfirmed] High: Example Protocol bridge exploit, ~$4.2M reported');
  });

  it('keeps acronyms in the attack type and omits a missing loss', () => {
    expect(buildAlertSubject([item({ attackType: 'DNS Hijack', amountUsd: null })]))
      .toBe('High: Example Protocol DNS hijack');
  });

  it('falls back to "incident" without an attack type and to the title without a project', () => {
    expect(buildAlertSubject([item({ attackType: null, amountUsd: null })])).toBe('High: Example Protocol incident');
    expect(buildAlertSubject([item({ projectName: null, amountUsd: null })]))
      .toBe('High: Example Protocol loses funds in bridge attack');
  });

  it('uses the title for a non-incident', () => {
    expect(buildAlertSubject([vulnerability])).toBe('Critical: CVE-2026-1234 in OpenSSL');
  });

  it('cuts a long non-incident title at a word within 90 characters', () => {
    const subject = buildAlertSubject([item({ ...vulnerability, title: `${'word '.repeat(40)}end` })]);
    const title = subject.slice('Critical: '.length);
    expect(Array.from(title).length).toBeLessThanOrEqual(90);
    expect(title.endsWith('…')).toBe(true);
  });

  it('leads with the most severe item and counts the rest', () => {
    expect(buildAlertSubject([item(), vulnerability, item({ uid: 'x', severity: 'high' })]))
      .toBe('Critical: CVE-2026-1234 in OpenSSL (+2 more)');
  });

  it('caps the subject at 120 characters and keeps the count', () => {
    const long = item({ severity: 'critical', projectName: 'Protocol '.repeat(20).trim() });
    const subject = buildAlertSubject([long, vulnerability, item({ uid: 'y', severity: 'medium' })]);
    expect(Array.from(subject).length).toBeLessThanOrEqual(ALERT_SUBJECT_MAX_LENGTH);
    expect(subject.endsWith('(+2 more)')).toBe(true);
  });

  it('never carries newlines, emoji or alarm phrases', () => {
    const noisy = item({ projectName: 'Rocket 🚀\nProtocol', attackType: 'Immediate Action Required' });
    const subject = buildAlertSubject([noisy]);
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).not.toMatch(EMOJI);
    expect(subject).not.toMatch(/Immediate Action Required/i);
    expect(subject).toBe('High: Rocket Protocol incident, ~$4.2M reported');
  });
});

describe('buildFollowUpSubject', () => {
  it('words a retraction with the source', () => {
    expect(buildFollowUpSubject('retracted', item()))
      .toBe('Retracted: Example Protocol incident report withdrawn by QuillMonitor');
  });

  it('words an upgrade with the loss', () => {
    expect(buildFollowUpSubject('upgraded_critical', item({ severity: 'critical', amountUsd: 40_000_000 })))
      .toBe('Now critical: Example Protocol bridge exploit, ~$40M reported');
  });

  it('omits the source when unknown', () => {
    expect(buildFollowUpSubject('retracted', item({ sourceName: null, providers: [] })))
      .toBe('Retracted: Example Protocol incident report withdrawn');
  });
});

describe('alertBatchKey', () => {
  it('is stable regardless of order and differs per set', () => {
    expect(alertBatchKey(['b', 'a'])).toBe(alertBatchKey(['a', 'b']));
    expect(alertBatchKey(['a', 'b'])).not.toBe(alertBatchKey(['a', 'c']));
    expect(alertBatchKey(['a'])).toMatch(/^g[0-9a-f]{16}$/);
  });
});

describe('planAlertFollowUp', () => {
  const sent = { sent_severity: 'high', sent_verification: 'unverified' };

  it('retracts a deleted record', () => {
    expect(planAlertFollowUp(sent, null)).toEqual({ kind: 'retracted' });
  });

  it('retracts a record marked not relevant', () => {
    expect(planAlertFollowUp(sent, { severity: 'high', metadata: { classification_relevant: false } }))
      .toEqual({ kind: 'retracted' });
  });

  it('sends nothing for a duplicate merge', () => {
    expect(planAlertFollowUp(sent, { severity: 'critical', metadata: { duplicate_of_uid: 'slowmist:1' } })).toBeNull();
  });

  it('announces an upgrade to critical', () => {
    expect(planAlertFollowUp(sent, { severity: 'critical', metadata: {} })).toEqual({ kind: 'upgraded_critical' });
  });

  it('sends nothing when it was already critical', () => {
    expect(planAlertFollowUp({ sent_severity: 'critical' }, { severity: 'critical', metadata: {} })).toBeNull();
  });

  it('sends nothing for a verification change', () => {
    expect(planAlertFollowUp(sent, { severity: 'high', metadata: { verification_status: 'verified' } })).toBeNull();
  });

  it('sends no upgrade when the sent severity is unknown', () => {
    expect(planAlertFollowUp({}, { severity: 'critical', metadata: {} })).toBeNull();
  });
});

describe('renderAlertEmail', () => {
  it('names the source, the loss and carries the compliance footer', () => {
    const { html, text } = renderAlertEmail({
      items: [item({ status: 'unconfirmed' }), vulnerability],
      links,
      postalAddress: '1 Example Street, Springfield 12345',
    });
    expect(html).toContain('QuillMonitor');
    expect(html).toContain('The Hacker News');
    expect(html).toContain('~$4.2M reported');
    expect(html).toContain('Unconfirmed');
    expect(html).toContain(links.unsubscribePageUrl.replace(/&/g, '&amp;'));
    expect(html).toContain(links.manageUrl.replace(/&/g, '&amp;'));
    expect(html).toContain('1 Example Street, Springfield 12345');
    expect(html).not.toMatch(/verified by digibastion/i);
    expect(html).not.toMatch(EMOJI);
    expect(text).toContain('Source: QuillMonitor');
    expect(text).toContain('~$4.2M reported');
    expect(text).toContain(links.unsubscribePageUrl);
    expect(text).toContain('1 Example Street, Springfield 12345');
  });

  it('has no address line without a postal address', () => {
    const { html } = renderAlertEmail({ items: [item()], links, postalAddress: null });
    expect(html).not.toContain('data-postal-address');
  });

  it('escapes item text', () => {
    const { html } = renderAlertEmail({ items: [item({ title: '<script>x</script>', projectName: null })], links, postalAddress: null });
    expect(html).not.toContain('<script>');
  });
});

describe('renderFollowUpEmail', () => {
  it('explains a retraction and names the source', () => {
    const { html, text } = renderFollowUpEmail({ kind: 'retracted', item: item(), links, postalAddress: null });
    expect(html).toContain('Retracted');
    expect(html).toContain('QuillMonitor');
    expect(text).toContain('Retracted');
    expect(text).toContain(links.unsubscribePageUrl);
  });

  it('explains an upgrade to critical', () => {
    const { html } = renderFollowUpEmail({
      kind: 'upgraded_critical',
      item: item({ severity: 'critical' }),
      links,
      postalAddress: '1 Example Street, Springfield 12345',
    });
    expect(html).toContain('now rated critical');
    expect(html).toContain('1 Example Street, Springfield 12345');
  });
});

describe('alert email links and attribution', () => {
  const tag = (campaign: string, content: string) =>
    `utm_source=email&amp;utm_medium=email&amp;utm_campaign=${campaign}&amp;utm_content=${content}`;
  const textTag = (campaign: string, content: string) =>
    `utm_source=email&utm_medium=email&utm_campaign=${campaign}&utm_content=${content}`;

  it('tags our links and leaves the source link untagged', () => {
    const { html, text } = renderAlertEmail({ items: [item()], links, postalAddress: null });
    const incident = item().incidentUrl;
    expect(html).toContain(`href="${incident}?${tag('realtime_alert', 'title')}"`);
    expect(html).toContain(`href="${incident}?${tag('realtime_alert', 'details')}"`);
    expect(html).toContain('>Details on Digibastion</a>');
    expect(html).toContain(`href="${SITE}/threat-intel?${tag('realtime_alert', 'feed')}"`);
    expect(html).toContain('href="https://x.com/quillaudits/status/1"');
    expect(html).not.toMatch(/x\.com[^"]*utm_/);
    expect(text).toContain(`Details on Digibastion: ${incident}?${textTag('realtime_alert', 'details')}`);
    expect(text).toContain(`Threat Intel feed: ${SITE}/threat-intel?${textTag('realtime_alert', 'feed')}`);
    expect(`${html}${text}`).not.toMatch(/https:\/\/digibastion\.com/);
  });

  it('uses the caller site URL for the feed link', () => {
    const { html } = renderAlertEmail({ items: [item()], links, postalAddress: null, siteUrl: 'https://preview.example/' });
    expect(html).toContain('href="https://preview.example/threat-intel?');
  });

  it('credits QuillMonitor only on QuillMonitor-only items', () => {
    const quill = renderAlertEmail({ items: [item()], links, postalAddress: null });
    expect(quill.html).toContain('Powered by <a href="https://www.quillaudits.com/web3-hacks-database"');
    expect(quill.text).toContain('Powered by QuillMonitor: https://www.quillaudits.com/web3-hacks-database');
    const merged = renderAlertEmail({ items: [item({ providers: ['quillmonitor', 'web3-incidents'] })], links, postalAddress: null });
    expect(merged.html).not.toContain('Powered by');
    expect(renderAlertEmail({ items: [vulnerability], links, postalAddress: null }).html).not.toContain('Powered by');
  });

  it('prints the source name unlinked when the only link is our own page', () => {
    const own = item({ providers: [], sourceName: 'The Hacker News', sourceUrl: item().incidentUrl });
    const { html, text } = renderAlertEmail({ items: [own], links, postalAddress: null });
    expect(html).toContain('Source: The Hacker News</p>');
    expect(text).toContain('Source: The Hacker News\n');
  });

  it('never credits Digibastion as the source', () => {
    const unnamed = item({ providers: [], sourceName: null, sourceUrl: null });
    const { html, text } = renderAlertEmail({ items: [unnamed], links, postalAddress: null });
    expect(html).toContain('Source: Source not given');
    expect(text).not.toMatch(/Source: Digibastion/);
  });

  it('links a retraction to the feed, never to the removed record', () => {
    const { html, text } = renderFollowUpEmail({ kind: 'retracted', item: item(), links, postalAddress: null });
    expect(html).not.toContain(item().incidentUrl);
    expect(text).not.toContain(item().incidentUrl);
    expect(html).toContain(`href="${SITE}/threat-intel?${tag('alert_followup', 'feed')}"`);
    expect(text).toContain(`${SITE}/threat-intel?${textTag('alert_followup', 'feed')}`);
  });

  it('tags the follow-up for an upgrade and gives the text version the feed link', () => {
    const { html, text } = renderFollowUpEmail({ kind: 'upgraded_critical', item: item({ severity: 'critical' }), links, postalAddress: null });
    expect(html).toContain(`href="${item().incidentUrl}?${tag('alert_followup', 'title')}"`);
    expect(text).toContain(`Threat Intel feed: ${SITE}/threat-intel?${textTag('alert_followup', 'feed')}`);
  });
});
