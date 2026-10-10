import { describe, expect, it } from 'vitest';
import type { NewsletterItem, WeeklyTotals } from './newsletter-content.ts';
import { SECURITY_ACTIONS } from './security-actions.ts';
import {
  itemPlaceholderValues,
  templateAction,
  templateActionRaw,
  templateTrends,
  templateTrendsRaw,
  templateVulnerabilities,
  templateVulnerabilitiesRaw,
  templateWhat,
  templateWhatRaw,
  trendsPlaceholderValues,
  vulnerabilityPlaceholderValues,
  WEEKLY_MAX_LENGTH,
} from './weekly-templates.ts';
import { STATIC_ALLOWED_TERMS, validateAndFill, type ValidationContext } from './weekly-validator.ts';
import { weeklyItem as item, weeklyVulnerability as vuln } from './weekly-test-fixtures.ts';

const KNOWN = ['Example Protocol', 'Other Finance', 'Curve'];

function itemCtx(entry: NewsletterItem): ValidationContext {
  return {
    section: 'item',
    values: itemPlaceholderValues(entry),
    allowedTerms: [...STATIC_ALLOWED_TERMS],
    knownProjectNames: KNOWN,
    inputProjectNames: entry.projectName ? [entry.projectName] : [],
    isUnconfirmed: entry.status === 'unconfirmed',
    maxLength: WEEKLY_MAX_LENGTH.item,
  };
}

function totals(overrides: Partial<WeeklyTotals> = {}): WeeklyTotals {
  return {
    lossUsd: 12_300_000,
    previousLossUsd: 8_000_000,
    unconfirmedLossUsd: 2_000_000,
    incidentCount: 9,
    unconfirmedCount: 2,
    fundsReturnedCount: 1,
    lateReportCount: 0,
    byAttackType: [{ key: 'phishing', label: 'Phishing', count: 4, lossUsd: 6_000_000 }],
    byChain: [{ key: 'ethereum', label: 'Ethereum', count: 5, lossUsd: 9_000_000 }],
    ...overrides,
  };
}

const trendsCtx = (t: WeeklyTotals): ValidationContext => ({
  section: 'trends',
  values: trendsPlaceholderValues(t),
  allowedTerms: [...STATIC_ALLOWED_TERMS],
  knownProjectNames: KNOWN,
  inputProjectNames: [],
  isUnconfirmed: false,
  maxLength: WEEKLY_MAX_LENGTH.trends,
});

const ITEMS: NewsletterItem[] = [
  item(),
  item({ uid: 'u', status: 'unconfirmed' }),
  item({ uid: 'n', status: null }),
  item({ uid: 'bare', projectName: null, chain: null, attackType: null, amountUsd: null, incidentDate: null, sourceName: null }),
  item({ uid: 'bare-u', status: 'unconfirmed', projectName: null, chain: null, attackType: null, amountUsd: null, incidentDate: null }),
  item({ uid: 'access', attackType: 'Access Control', amountUsd: 3.8e12 }),
  item({ uid: 'npm', attackType: 'Supply Chain', category: 'supply-chain' }),
  item({ uid: 'oracle', attackType: 'Oracle Manipulation' }),
  item({ uid: 'rug', attackType: 'Rug Pull' }),
];

describe('item templates', () => {
  it('match the plan example wording', () => {
    expect(templateWhat(item({ status: 'unconfirmed' }))).toBe(
      'Unconfirmed report: Example Protocol on Ethereum lost ~$4.2M reported in a bridge exploit, according to QuillMonitor (Oct 7).',
    );
    expect(templateWhat(item())).toBe(
      'Example Protocol on Ethereum lost ~$4.2M reported in a bridge exploit, according to QuillMonitor (Oct 7). The source lists it as confirmed.',
    );
  });

  it('pass validateAndFill with their own context', () => {
    for (const entry of ITEMS) {
      const what = validateAndFill(templateWhatRaw(entry), itemCtx(entry));
      expect(what, `${entry.uid} what`).toEqual({ ok: true, text: templateWhat(entry) });
      const action = validateAndFill(templateActionRaw(entry), itemCtx(entry));
      expect(action, `${entry.uid} action`).toEqual({ ok: true, text: templateAction(entry) });
    }
  });

  it('say unconfirmed for unconfirmed items', () => {
    for (const entry of ITEMS.filter((candidate) => candidate.status === 'unconfirmed')) {
      expect(templateWhat(entry)).toMatch(/\bunconfirmed\b/i);
    }
  });

  it('produce clean sentences when loss, chain and other fields are unknown', () => {
    const text = templateWhat(item({ projectName: null, chain: null, attackType: null, amountUsd: null, incidentDate: null, sourceName: null, status: null }));
    expect(text).toBe('An unnamed project reported a security incident, according to its source.');
    for (const entry of ITEMS) {
      const what = templateWhat(entry);
      expect(what).not.toMatch(/null|undefined| {2}| ,|\(\)|\{|\}/);
      expect(what).toMatch(/^[A-Z].*\.$/);
    }
  });

  it('give users and builders an action that fits the attack type', () => {
    expect(templateAction(item({ attackType: 'Access Control' }))).toMatch(/For users: .+ For builders: .*keys/);
    expect(templateAction(item({ attackType: 'Supply Chain', category: 'supply-chain' }))).toMatch(/For builders: .*(lockfile|dependenc)/);
    expect(templateAction(item({ attackType: 'Phishing' }))).toMatch(/approv/);
  });

  it('every security action reads cleanly through the validator', () => {
    for (const action of SECURITY_ACTIONS) {
      const result = validateAndFill(`For users: ${action.text.charAt(0).toLowerCase()}${action.text.slice(1)}`, itemCtx(item()));
      expect(result, action.id).toMatchObject({ ok: true });
    }
  });
});

describe('trends template', () => {
  it('passes the validator and states the figures from code', () => {
    const t = totals();
    expect(validateAndFill(templateTrendsRaw(t), trendsCtx(t))).toEqual({ ok: true, text: templateTrends(t) });
    expect(templateTrends(t)).toContain('~$12.3M reported');
    expect(templateTrends(t)).toContain('~$8M reported');
    expect(templateTrends(t)).toContain('phishing');
  });

  it('handles an empty week and singular counts', () => {
    const empty = totals({ lossUsd: 0, previousLossUsd: 0, unconfirmedLossUsd: 0, incidentCount: 0, unconfirmedCount: 0, fundsReturnedCount: 0, byAttackType: [], byChain: [] });
    expect(validateAndFill(templateTrendsRaw(empty), trendsCtx(empty))).toMatchObject({ ok: true });
    expect(templateTrends(empty)).toBe('No new Web3 incidents were recorded this week.');
    const one = totals({ incidentCount: 1, unconfirmedCount: 1, fundsReturnedCount: 0, previousLossUsd: 0, byAttackType: [{ key: 'unknown', label: 'Unknown', count: 1, lossUsd: 0 }] });
    expect(validateAndFill(templateTrendsRaw(one), trendsCtx(one))).toMatchObject({ ok: true });
    expect(templateTrends(one)).toContain('1 incident ');
    expect(templateTrends(one)).toContain('1 more unconfirmed report is');
    expect(templateTrends(one)).not.toMatch(/unknown/i);
  });
});

describe('vulnerabilities template', () => {
  it('passes the validator for zero, one and many items', () => {
    for (const items of [[], [vuln()], [vuln(), vuln({ uid: 'v2' })]]) {
      const result = validateAndFill(templateVulnerabilitiesRaw(items), {
        ...trendsCtx(totals()),
        section: 'vulnerabilities',
        values: vulnerabilityPlaceholderValues(items),
        maxLength: WEEKLY_MAX_LENGTH.vulnerabilities,
      });
      expect(result).toEqual({ ok: true, text: templateVulnerabilities(items) });
    }
    expect(templateVulnerabilities([vuln()])).toMatch(/^This week 1 critical or high-severity report was added/);
  });
});
