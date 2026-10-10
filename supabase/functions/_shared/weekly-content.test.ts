import { describe, expect, it } from 'vitest';
import { assembleWeeklyContent } from './weekly-content.ts';
import { toPublicWeekly } from './weekly-render.ts';
import { computeWeeklyTotals } from './weekly-stats.ts';
import { templateAction, templateTrends, templateVulnerabilities, templateWhat } from './weekly-templates.ts';
import { WEEK_START, weeklyItem as item, weeklyVulnerability as vuln } from './weekly-test-fixtures.ts';

const confirmed = item({ uid: 'a' });
const unconfirmed = item({ uid: 'b', status: 'unconfirmed', projectName: 'Second Vault', chain: 'BNB Chain', attackType: 'Phishing', amountUsd: 900_000 });
const top = [confirmed, unconfirmed];
const vulnerabilities = [vuln()];
const totals = computeWeeklyTotals({ weekStart: WEEK_START, thisWeek: top, previousWeek: [] });

const base = {
  weekStart: WEEK_START,
  totals,
  top,
  vulnerabilities,
  knownProjectNames: ['Example Protocol', 'Second Vault', 'Other Finance'],
};

describe('assembleWeeklyContent', () => {
  it('uses templates for every paragraph when AI is off', () => {
    const content = assembleWeeklyContent({ ...base, modelOutput: null, aiEnabled: false, model: null, prompt: null, rawOutput: null, error: null });
    expect(content).toMatchObject({ version: 1, kind: 'weekly', weekStart: '2026-10-05', weekEnd: '2026-10-11', issueDate: '2026-10-12' });
    const paragraphs = [...content.top.flatMap((entry) => [entry.what, entry.action]), content.trends, content.vulnerabilities.summary];
    expect(paragraphs.every((paragraph) => paragraph.origin === 'template')).toBe(true);
    expect(content.top[0].what.text).toBe(templateWhat(confirmed));
    expect(content.top[1].action.text).toBe(templateAction(unconfirmed));
    expect(content.trends.text).toBe(templateTrends(totals));
    expect(content.vulnerabilities.summary.text).toBe(templateVulnerabilities(vulnerabilities));
    expect(content.archive.aiEnabled).toBe(false);
    expect(content.archive.validation).toHaveLength(6);
    expect(content.archive.validation.every((entry) => !entry.accepted && entry.reasons[0] === 'ai_disabled')).toBe(true);
    expect(content.sources).toEqual(['QuillMonitor', 'The Hacker News']);
    expect(content.opsecTip.url).toMatch(/^https:\/\//);
    expect(content.archive.input).toMatchObject({ weekStart: WEEK_START });
  });

  it('keeps valid model paragraphs and falls back on invalid ones, archiving the reasons', () => {
    const modelOutput = {
      top: [
        { uid: 'a', what: '{project} on {chain} lost {loss} in a {attack}, according to {source}.', action: 'Users should revoke approvals; the attacker took $4.2M.' },
        { uid: 'b', what: '{project} on {chain} was drained by phishing, according to {source}.', action: 'The report is unconfirmed, but users should review approvals they granted to {project}.' },
      ],
      trends: 'This week {incident_count} incidents added up to {week_loss}, led by {top_attack}.',
      vulnerabilities: 'Patch now, see https://nvd.example.io for the list.',
    };
    const content = assembleWeeklyContent({
      ...base,
      modelOutput,
      aiEnabled: true,
      model: 'google/gemini-2.5-pro',
      prompt: { system: 's', user: 'u' },
      rawOutput: JSON.stringify(modelOutput),
      error: null,
    });
    expect(content.top[0].what).toEqual({ id: 'top:a:what', origin: 'ai', text: 'Example Protocol on Ethereum lost ~$4.2M reported in a bridge exploit, according to QuillMonitor.' });
    expect(content.top[0].action.origin).toBe('template');
    expect(content.top[1].what.origin).toBe('template');
    expect(content.top[1].action.origin).toBe('ai');
    expect(content.trends.origin).toBe('ai');
    expect(content.vulnerabilities.summary.origin).toBe('template');

    const byId = new Map(content.archive.validation.map((entry) => [entry.paragraphId, entry]));
    expect(byId.get('top:a:what')).toEqual({ paragraphId: 'top:a:what', accepted: true, reasons: [] });
    expect(byId.get('top:a:action')?.reasons).toContain('currency');
    expect(byId.get('top:b:what')?.reasons).toContain('missing_unconfirmed_wording');
    expect(byId.get('vulnerabilities')?.reasons).toContain('url');
    expect(content.archive).toMatchObject({ aiEnabled: true, model: 'google/gemini-2.5-pro', rawOutput: JSON.stringify(modelOutput), error: null });
  });

  it('falls back everywhere when the model call failed', () => {
    const content = assembleWeeklyContent({ ...base, modelOutput: null, aiEnabled: true, model: 'google/gemini-2.5-pro', prompt: { system: 's', user: 'u' }, rawOutput: null, error: 'ai_rate_limited' });
    expect(content.archive.error).toBe('ai_rate_limited');
    expect(content.archive.validation.every((entry) => entry.reasons[0] === 'no_model_output')).toBe(true);
    expect(content.top.every((entry) => entry.what.origin === 'template' && entry.action.origin === 'template')).toBe(true);
  });

  it('rejects a weekStart that is not a Monday', () => {
    expect(() => assembleWeeklyContent({ ...base, weekStart: '2026-10-06', modelOutput: null, aiEnabled: false, model: null, prompt: null, rawOutput: null, error: null }))
      .toThrow();
  });
});

describe('toPublicWeekly', () => {
  it('drops the archive', () => {
    const content = assembleWeeklyContent({ ...base, modelOutput: null, aiEnabled: false, model: null, prompt: null, rawOutput: null, error: null });
    const publicContent = toPublicWeekly(content);
    expect(publicContent).not.toHaveProperty('archive');
    expect(publicContent.top).toEqual(content.top);
  });
});
