import { describe, expect, it } from 'vitest';
import {
  buildIncidentUrl,
  buildRetractionMessage,
  buildWeeklyPostUrl,
  buildTelegramIncidentMessage,
  buildWeeklyLinkMessage,
  escapeTelegramHtml,
  incidentLinkPreview,
  NO_LINK_PREVIEW,
  isEligibleForTelegram,
  isIncidentPostUid,
  planTelegramPostUpdate,
  TELEGRAM_MESSAGE_LIMIT,
  WEEKLY_LINK_MESSAGE_LIMIT,
  WEEKLY_POST_UID_PREFIX,
  type TelegramAlertArticle,
} from '../../../supabase/functions/_shared/telegram-alerts';
import {
  finalizeQuillMonitorArticle,
  normalizeQuillMonitorIncident,
} from '../../../supabase/functions/_shared/quillmonitor';
import { weeklyItem, weeklyPublicContent } from '../../../supabase/functions/_shared/weekly-test-fixtures';

const NOW = new Date('2026-10-10T12:00:00.000Z');
const SITE = 'https://www.digibastion.com';

function incident(overrides: Partial<TelegramAlertArticle> = {}, metadata: Record<string, unknown> = {}): TelegramAlertArticle {
  return {
    id: '7f1c2a4e-1111-4222-8333-944455556666',
    uid: 'quillmonitor:abc123',
    title: 'Example Protocol: Private key compromise ($4.2M loss)',
    summary: 'Attacker drained the bridge hot wallet after compromising a signer key.',
    severity: 'high',
    created_at: '2026-10-10T11:50:00.000Z',
    metadata: {
      provider: 'quillmonitor',
      is_web3_incident: true,
      project_name: 'Example Protocol',
      chain: 'Ethereum',
      attack_type: 'Private key compromise',
      amount_display: '$4.2M',
      incident_date: '2026-10-09',
      verification_status: 'unverified',
      ...metadata,
    },
    ...overrides,
  };
}

describe('Telegram eligibility', () => {
  it('accepts a fresh QuillMonitor incident at or above the minimum severity', () => {
    expect(isEligibleForTelegram(incident(), NOW, { minSeverity: 'medium' })).toBe(true);
    expect(isEligibleForTelegram(incident({ severity: 'low' }), NOW, { minSeverity: 'medium' })).toBe(false);
    expect(isEligibleForTelegram(incident({ severity: 'low' }), NOW, { minSeverity: 'low' })).toBe(true);
  });

  it('rejects other providers until cross-provider dedup ships', () => {
    expect(isEligibleForTelegram(incident({}, { provider: 'slowmist' }), NOW, { minSeverity: 'low' })).toBe(false);
    expect(isEligibleForTelegram(incident({}, { provider: 'web3-incidents' }), NOW, { minSeverity: 'low' })).toBe(false);
  });

  it('rejects duplicates and records marked irrelevant', () => {
    expect(isEligibleForTelegram(incident({}, { duplicate_of_uid: 'quillmonitor:1' }), NOW, { minSeverity: 'low' })).toBe(false);
    expect(isEligibleForTelegram(incident({}, { classification_relevant: false }), NOW, { minSeverity: 'low' })).toBe(false);
  });

  it('rejects backfilled history even when it was ingested just now', () => {
    expect(isEligibleForTelegram(incident({}, { incident_date: '2026-08-01' }), NOW, { minSeverity: 'low' })).toBe(false);
    expect(isEligibleForTelegram(incident({}, { incident_date: undefined }), NOW, { minSeverity: 'low' })).toBe(false);
  });

  it('rejects records ingested more than a day ago', () => {
    expect(isEligibleForTelegram(incident({ created_at: '2026-10-09T10:00:00.000Z' }), NOW, { minSeverity: 'low' })).toBe(false);
  });
});

describe('Telegram message', () => {
  it('escapes provider text for HTML parse mode', () => {
    expect(escapeTelegramHtml('<b>A & B</b>')).toBe('&lt;b&gt;A &amp; B&lt;/b&gt;');
  });

  it('labels preliminary incidents as unconfirmed and reported', () => {
    const text = buildTelegramIncidentMessage(incident(), SITE);
    expect(text).toContain('UNCONFIRMED');
    expect(text).toContain('~$4.2M reported lost');
    expect(text).not.toContain('<b>CONFIRMED</b>');
    expect(text).toContain('Unconfirmed report. Details may change.');
  });

  it('labels verified incidents as confirmed', () => {
    const text = buildTelegramIncidentMessage(incident({}, { verification_status: 'verified' }), SITE);
    expect(text).toContain('<b>CONFIRMED</b>');
    expect(text).toContain('~$4.2M lost');
    expect(text).not.toContain('UNCONFIRMED');
  });

  it('links to the Digibastion incident page with campaign tags', () => {
    const text = buildTelegramIncidentMessage(incident(), SITE);
    expect(text).toContain(
      'href="https://www.digibastion.com/threat-intel/7f1c2a4e-1111-4222-8333-944455556666?utm_source=telegram&amp;utm_medium=social&amp;utm_campaign=incident_alerts"',
    );
    expect(buildIncidentUrl(SITE, 'a/b')).toBe(
      'https://www.digibastion.com/threat-intel/a%2Fb?utm_source=telegram&utm_medium=social&utm_campaign=incident_alerts',
    );
  });

  it('links the source record and credits QuillMonitor', () => {
    const text = buildTelegramIncidentMessage(incident({ link: 'https://x.com/Phalcon_xyz/status/1?a=1&b=2' }), SITE);
    expect(text).toContain('Source: <a href="https://x.com/Phalcon_xyz/status/1?a=1&amp;b=2">QuillMonitor</a>');
    expect(text).toContain('Powered by <a href="https://www.quillaudits.com/web3-hacks-database">QuillMonitor</a>');
    expect(text).toContain('>Full details on Digibastion</a>');
    expect(text).not.toContain('DigiBastion');
    // Our page stays the first link in the post.
    expect(text.indexOf('www.digibastion.com/threat-intel/')).toBeLessThan(text.indexOf('x.com/Phalcon_xyz'));
  });

  it('prints the source name unlinked when the link is missing, unsafe or our own page', () => {
    for (const link of [null, undefined, 'javascript:alert(1)', 'ftp://example.com/a', `${SITE}/threat-intel/7f1c2a4e-1111-4222-8333-944455556666`]) {
      const text = buildTelegramIncidentMessage(incident({ link }), SITE);
      expect(text).toContain('Source: QuillMonitor\n');
      expect(text).not.toContain('javascript:');
    }
  });

  it('stays within the limit with a 400-character summary and a long source URL', () => {
    const text = buildTelegramIncidentMessage(
      incident({ summary: 'a'.repeat(400), link: `https://example.com/${'p'.repeat(3_000)}` }, { project_name: 'P'.repeat(300) }),
      SITE,
    );
    expect(text.length).toBeLessThanOrEqual(TELEGRAM_MESSAGE_LIMIT);
    expect(text).toContain('Full details on Digibastion');
  });

  it('never lets provider text inject markup', () => {
    const text = buildTelegramIncidentMessage(
      incident({ summary: '<a href="https://evil.example">claim</a>' }, { project_name: '<script>x</script>' }),
      SITE,
    );
    expect(text).not.toContain('evil.example">');
    expect(text).not.toContain('<script>');
  });

  it('handles undisclosed losses and pending summaries', () => {
    const text = buildTelegramIncidentMessage(
      incident({ summary: 'Summary pending' }, { amount_display: null }),
      SITE,
    );
    expect(text).toContain('loss not disclosed yet');
    expect(text).not.toContain('Summary pending');
  });

  it('stays within the Telegram message limit for very long summaries', () => {
    const text = buildTelegramIncidentMessage(incident({ summary: 'word '.repeat(5_000) }), SITE);
    expect(text.length).toBeLessThanOrEqual(TELEGRAM_MESSAGE_LIMIT);
  });

  it('never splits an emoji when truncating a summary', () => {
    const summary = `${'a'.repeat(399)}🚨 rest of the summary`;
    const text = buildTelegramIncidentMessage(incident({ summary }), SITE);
    expect(text).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
    expect(text).toContain('…');
  });

  it('labels AI-written summaries and keeps the labelled paragraph within the cap', () => {
    const labelled = buildTelegramIncidentMessage(incident({ summary: 'A & B drained.' }, { summary_origin: 'ai' }), SITE);
    expect(labelled).toContain('\n<i>AI summary:</i> A &amp; B drained.\n');

    for (const origin of ['provider', 'publisher', undefined]) {
      const text = buildTelegramIncidentMessage(incident({}, { summary_origin: origin }), SITE);
      expect(text).not.toContain('AI summary');
      expect(text).toContain('\nAttacker drained the bridge hot wallet');
    }

    const long = buildTelegramIncidentMessage(incident({ summary: 'word '.repeat(200) }, { summary_origin: 'ai' }), SITE);
    const paragraph = long.split('\n').find((line) => line.startsWith('<i>AI summary:</i> ')) ?? '';
    // Same budget as an unlabelled summary: 400 code points before the ellipsis.
    const visible = paragraph.replace(/<\/?i>/g, '');
    expect(visible.startsWith('AI summary: word')).toBe(true);
    expect(visible.endsWith('…')).toBe(true);
    expect(Array.from(visible.slice(0, -1)).length).toBeLessThanOrEqual(400);

    const pending = buildTelegramIncidentMessage(incident({ summary: 'Summary pending' }, { summary_origin: 'ai' }), SITE);
    expect(pending).not.toContain('AI summary');
  });

  it('adds a dated note when an update is applied', () => {
    const text = buildTelegramIncidentMessage(incident({}, { verification_status: 'verified' }), SITE, 'confirmed by QuillMonitor', NOW);
    expect(text).toContain('Updated 12:00 UTC: confirmed by QuillMonitor.');
  });
});

describe('Telegram post updates', () => {
  const posted = {
    posted_text: buildTelegramIncidentMessage(incident(), SITE),
    posted_verification: 'unverified',
  };

  it('does nothing when the message would be identical', () => {
    expect(planTelegramPostUpdate(posted, incident(), SITE, NOW)).toEqual({ action: 'none' });
  });

  it('edits with a confirmation note when an incident is verified', () => {
    const plan = planTelegramPostUpdate(posted, incident({}, { verification_status: 'verified' }), SITE, NOW);
    expect(plan.action).toBe('edit');
    if (plan.action === 'edit') {
      expect(plan.text).toContain('<b>CONFIRMED</b>');
      expect(plan.text).toContain('Updated 12:00 UTC: confirmed by QuillMonitor.');
    }
  });

  it('edits without a note when only details change', () => {
    const plan = planTelegramPostUpdate(posted, incident({}, { amount_display: '$5M' }), SITE, NOW);
    expect(plan.action).toBe('edit');
    if (plan.action === 'edit') expect(plan.text).not.toContain('Updated');
  });

  it('retracts when the incident disappears, is merged, or is marked irrelevant', () => {
    expect(planTelegramPostUpdate(posted, null, SITE, NOW).action).toBe('retract');
    expect(planTelegramPostUpdate(posted, incident({}, { duplicate_of_uid: 'quillmonitor:2' }), SITE, NOW).action).toBe('retract');
    expect(planTelegramPostUpdate(posted, incident({}, { classification_relevant: false }), SITE, NOW).action).toBe('retract');
  });

  it('drops and retracts a QuillMonitor record merged into another QuillMonitor record', () => {
    // Built the way the QuillMonitor sync writes the losing row of a
    // same-provider pair, so this follows the real metadata shape.
    const loser = normalizeQuillMonitorIncident({
      id: '6abe7cb74bf2b9001882e340', target: 'NEAR Intents', date: '2026-10-09', chain: 'NEAR', category: 'Bridge',
      attackedMethod: 'Private Key Compromise', amountInUsd: 3_800_000, description: 'Solver drained.',
      reference: 'https://x.com/Phalcon_xyz/status/1', verificationStatus: 'unverified',
      createdAt: '2026-10-09T10:00:00.000Z', updatedAt: '2026-10-09T10:00:00.000Z',
    });
    const written = finalizeQuillMonitorArticle(loser, undefined, [], 'quillmonitor:6abf52e051c7780018c8e336');
    const article = incident({ uid: written.uid }, written.metadata);
    expect(isEligibleForTelegram(article, NOW, { minSeverity: 'low' })).toBe(false);
    expect(isEligibleForTelegram(incident({ uid: written.uid }, loser.metadata), NOW, { minSeverity: 'low' })).toBe(true);
    const plan = planTelegramPostUpdate({ ...posted, project_name: 'NEAR Intents' }, article, SITE, NOW);
    expect(plan.action).toBe('retract');
    if (plan.action === 'retract') expect(plan.text).toContain('RETRACTED</b> · NEAR Intents');
  });

  it('links the retraction to the incident feed with a retraction tag', () => {
    const text = buildRetractionMessage('Example Protocol', SITE);
    expect(text).toContain(
      'href="https://www.digibastion.com/threat-intel?scope=web3-incidents&amp;utm_source=telegram&amp;utm_medium=social&amp;utm_campaign=incident_alerts&amp;utm_content=retraction"',
    );
    expect(text).toContain('Latest incidents on Digibastion');
  });

  it('does not retract twice', () => {
    const retracted = { posted_text: buildRetractionMessage('Example Protocol', SITE), posted_verification: 'retracted' };
    expect(planTelegramPostUpdate(retracted, null, SITE, NOW)).toEqual({ action: 'none' });
  });
});

describe('buildWeeklyLinkMessage', () => {
  const URL = `${SITE}/threat-intel/weekly/2026-10-05`;

  it('states the week, the reported totals, the top items with their sources and the link', () => {
    const message = buildWeeklyLinkMessage(weeklyPublicContent(), URL);
    expect(message).toContain('<b>Weekly deep-dive: Web3 security week of Oct 5, 2026</b>');
    expect(message).toContain('~$12.3M reported across 9 incidents');
    expect(message).toContain('2 unconfirmed reports (~$3M reported) not included');
    expect(message).toContain('Example Protocol: ~$5M reported (QuillMonitor)');
    expect(message).toContain('Third Pool: unconfirmed, ~$3M reported (QuillMonitor)');
    expect(message).toContain('Sources: QuillMonitor, SlowMist, Web3 Is Going Great, The Hacker News');
    expect(message).toContain(`<a href="${URL}">Read the weekly deep-dive</a>`);
    expect(message).not.toMatch(/verified by digibastion|massive|devastating|urgent/i);
    expect(message).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('builds the weekly page URL with the existing campaign tags', () => {
    expect(buildWeeklyPostUrl(SITE, '2026-10-05')).toBe(
      'https://www.digibastion.com/threat-intel/weekly/2026-10-05?utm_source=telegram&utm_medium=social&utm_campaign=weekly_deep_dive',
    );
    expect(buildWeeklyPostUrl(`${SITE}/`, '2026-10-05')).toBe(buildWeeklyPostUrl(SITE, '2026-10-05'));
  });

  it('escapes HTML from titles, sources and the URL', () => {
    const content = weeklyPublicContent();
    content.top = [{ ...content.top[0], item: weeklyItem({ projectName: '<script>x</script> & Co', sourceName: 'A<b>' }) }];
    content.sources = ['A<b>'];
    const message = buildWeeklyLinkMessage(content, `${URL}?a=1&b="2"`);
    expect(message).toContain('&lt;script&gt;x&lt;/script&gt; &amp; Co');
    expect(message).toContain('(A&lt;b&gt;)');
    expect(message).toContain('href="https://www.digibastion.com/threat-intel/weekly/2026-10-05?a=1&amp;b=&quot;2&quot;"');
    expect(message).not.toContain('<script>');
  });

  it('stays within the length limit and keeps the link when content is long', () => {
    const content = weeklyPublicContent();
    content.top = content.top.map((entry, index) => ({
      ...entry,
      item: weeklyItem({ uid: `u${index}`, projectName: `${'Long name '.repeat(40)}${index}`, sourceName: 'S'.repeat(300) }),
    }));
    content.sources = Array.from({ length: 60 }, (_, index) => `Source number ${index} with a long name`);
    const message = buildWeeklyLinkMessage(content, URL);
    expect(message.length).toBeLessThanOrEqual(WEEKLY_LINK_MESSAGE_LIMIT);
    expect(WEEKLY_LINK_MESSAGE_LIMIT).toBe(1024);
    expect(message).toContain(`<a href="${URL}">Read the weekly deep-dive</a>`);
    expect(message).toContain('reported');
  });

  it('handles a week with no incidents', () => {
    const content = weeklyPublicContent({ top: [], sources: [] });
    content.totals = { ...content.totals, lossUsd: 0, incidentCount: 0, unconfirmedCount: 0, unconfirmedLossUsd: 0 };
    const message = buildWeeklyLinkMessage(content, URL);
    expect(message).toContain('No incidents recorded this week.');
    expect(message).not.toContain('Top incidents');
    expect(message).not.toContain('Sources:');
  });
});

describe('isIncidentPostUid', () => {
  it('keeps incident posts and skips weekly link posts in the sync pass', () => {
    expect(WEEKLY_POST_UID_PREFIX).toBe('weekly:');
    expect(isIncidentPostUid('quillmonitor:abc123')).toBe(true);
    expect(isIncidentPostUid('weekly:2026-10-05')).toBe(false);
    const rows = [{ article_uid: 'quillmonitor:1' }, { article_uid: 'weekly:2026-10-05' }];
    expect(rows.filter((row) => isIncidentPostUid(row.article_uid))).toEqual([{ article_uid: 'quillmonitor:1' }]);
  });
});

describe('incidentLinkPreview', () => {
  it('previews the incident card, large and below the text', () => {
    expect(incidentLinkPreview('7f1c2a4e-1111-4222-8333-944455556666')).toEqual({
      url: 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/og-image?kind=incident&id=7f1c2a4e-1111-4222-8333-944455556666',
      prefer_large_media: true,
      show_above_text: false,
    });
  });
  it('turns the preview off without a safe id', () => {
    expect(incidentLinkPreview(null)).toEqual(NO_LINK_PREVIEW);
    expect(incidentLinkPreview('../x')).toEqual({ is_disabled: true });
  });
});
