import { describe, expect, it } from 'vitest';
import {
  buildIncidentUrl,
  buildRetractionMessage,
  buildTelegramIncidentMessage,
  escapeTelegramHtml,
  isEligibleForTelegram,
  planTelegramPostUpdate,
  TELEGRAM_MESSAGE_LIMIT,
  type TelegramAlertArticle,
} from '../../../supabase/functions/_shared/telegram-alerts';

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

  it('links to the DigiBastion incident page with campaign tags', () => {
    const text = buildTelegramIncidentMessage(incident(), SITE);
    expect(text).toContain(
      'href="https://www.digibastion.com/threat-intel/7f1c2a4e-1111-4222-8333-944455556666?utm_source=telegram&amp;utm_medium=social&amp;utm_campaign=incident_alerts"',
    );
    expect(buildIncidentUrl(SITE, 'a/b')).toBe(
      'https://www.digibastion.com/threat-intel/a%2Fb?utm_source=telegram&utm_medium=social&utm_campaign=incident_alerts',
    );
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

  it('does not retract twice', () => {
    const retracted = { posted_text: buildRetractionMessage('Example Protocol', SITE), posted_verification: 'retracted' };
    expect(planTelegramPostUpdate(retracted, null, SITE, NOW)).toEqual({ action: 'none' });
  });
});
