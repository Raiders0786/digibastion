import { describe, expect, it } from 'vitest';
import { STATIC_ALLOWED_TERMS, validateAndFill, WEEKLY_PLACEHOLDERS, type ValidationContext } from './weekly-validator.ts';

function ctx(overrides: Partial<ValidationContext> = {}): ValidationContext {
  return {
    section: 'item',
    values: {
      project: 'Example Protocol',
      loss: '~$4.2M reported',
      chain: 'Ethereum',
      attack: 'bridge exploit',
      date: 'Oct 7',
      status: 'confirmed',
      source: 'QuillMonitor',
    },
    allowedTerms: [...STATIC_ALLOWED_TERMS, 'Ethereum'],
    knownProjectNames: ['Example Protocol', 'Other Finance', 'Curve'],
    inputProjectNames: ['Example Protocol'],
    isUnconfirmed: false,
    maxLength: 400,
    ...overrides,
  };
}

const unconfirmedCtx = () => ctx({ isUnconfirmed: true, values: { ...ctx().values, status: 'unconfirmed' } });

function reasonsOf(raw: string, context = ctx()): string[] {
  const result = validateAndFill(raw, context);
  return result.ok ? [] : result.reasons;
}

const has = (reasons: string[], prefix: string) => reasons.some((reason) => reason.startsWith(prefix));

describe('validateAndFill rejections', () => {
  it('rejects a dollar amount', () => {
    expect(has(reasonsOf('{project} on {chain} lost $4.2M in a {attack}.'), 'currency')).toBe(true);
  });

  it('rejects an amount in words', () => {
    expect(has(reasonsOf('{project} on {chain} lost 4.2 million in a {attack}.'), 'currency')).toBe(true);
  });

  it('rejects a bare number', () => {
    expect(has(reasonsOf('{project} was hit 12 times on {chain}, according to {source}.'), 'digits')).toBe(true);
  });

  it('rejects a number written as a word', () => {
    expect(has(reasonsOf('{project} was hit three times on {chain}, according to {source}.'), 'number_word')).toBe(true);
  });

  it('rejects a URL', () => {
    expect(has(reasonsOf('{project} lost {loss}; details at https://x.io for readers.'), 'url')).toBe(true);
  });

  it('rejects a domain', () => {
    expect(has(reasonsOf('{project} lost {loss}, as x.finance first noted on {date}.'), 'url')).toBe(true);
  });

  it('rejects a known project that is not in the input', () => {
    expect(has(reasonsOf('{project} lost {loss}, much like other finance did on {chain}.'), 'unknown_project')).toBe(true);
  });

  it('rejects a capitalised name the input does not contain', () => {
    expect(has(reasonsOf('{project} lost {loss} after Lazarus targeted its bridge on {chain}.'), 'capitalised')).toBe(true);
  });

  it('rejects an unknown placeholder', () => {
    expect(has(reasonsOf('{project} lost {loss} to {attacker} on {chain}.'), 'unknown_placeholder')).toBe(true);
  });

  it('rejects a placeholder whose value is missing', () => {
    const context = ctx({ values: { ...ctx().values, loss: null } });
    expect(has(reasonsOf('{project} on {chain} lost {loss} in a {attack}.', context), 'null_placeholder')).toBe(true);
  });

  it('rejects an unconfirmed item without unconfirmed or reported wording', () => {
    expect(has(reasonsOf('{project} on {chain} suffered a {attack}, according to {source}.', unconfirmedCtx()), 'missing_unconfirmed_wording')).toBe(true);
  });

  it('rejects an unconfirmed item described as confirmed', () => {
    expect(has(reasonsOf('{project} on {chain} lost {loss}; the loss is confirmed by {source}.', unconfirmedCtx()), 'claims_confirmed')).toBe(true);
  });

  it('rejects a confirmed claim on an item whose source has no status', () => {
    const context = ctx({ values: { ...ctx().values, status: null } });
    expect(has(reasonsOf('{project} on {chain} lost {loss}, a confirmed {attack}.', context), 'claims_confirmed')).toBe(true);
  });

  it('rejects "verified by"', () => {
    expect(has(reasonsOf('{project} lost {loss} on {chain}, verified by Digibastion.'), 'verified_by')).toBe(true);
  });

  it('rejects hype words', () => {
    expect(has(reasonsOf('{project} suffered a massive {attack} on {chain}, according to {source}.'), 'hype')).toBe(true);
  });

  it('rejects markdown', () => {
    expect(has(reasonsOf('**{project}** lost {loss} in a {attack} on {chain}.'), 'markup')).toBe(true);
    expect(has(reasonsOf('{project} lost {loss} in a `{attack}` on {chain}.'), 'markup')).toBe(true);
  });

  it('rejects text that is too short or too long', () => {
    expect(has(reasonsOf('{project}.'), 'length')).toBe(true);
    expect(has(reasonsOf(`{project} ${'lost funds '.repeat(60)}.`), 'length')).toBe(true);
  });
});

describe('validateAndFill rejects invented names, quantities and claims', () => {
  const trendsValues = { week_loss: '~$12M reported', previous_week_loss: null, incident_count: '9', unconfirmed_count: '2', top_attack: 'phishing', top_chain: 'Ethereum', funds_returned_count: '1' };
  const trendsCtx = (values: Record<string, string | null> = trendsValues) => ctx({ section: 'trends', values });

  it('rejects a sentence-initial name that is not in the input', () => {
    expect(has(reasonsOf('{project} lost {loss} on {chain}. Lazarus is believed to be behind the attack, according to {source}.'), 'capitalised:Lazarus')).toBe(true);
    expect(has(reasonsOf('{project} lost {loss} on {chain}. Binance froze part of the stolen funds.'), 'capitalised:Binance')).toBe(true);
  });

  it('rejects attribution and third-party actions written in lower case', () => {
    expect(has(reasonsOf('{project} lost {loss} on {chain}, and the attacker moved the funds through tornado cash.'), 'attribution')).toBe(true);
    expect(has(reasonsOf('{project} lost {loss} on {chain}; the attack is linked to a hacker group.'), 'attribution')).toBe(true);
    expect(has(reasonsOf('{project} lost {loss} on {chain}, and an exchange froze part of it.'), 'attribution')).toBe(true);
  });

  it('accepts common sentence openers and allowed terms at the start of a sentence', () => {
    const raw = '{project} lost {loss} on {chain}. The source lists it as {status}. Ethereum users should revoke stale approvals. Builders should review access controls.';
    expect(validateAndFill(raw, ctx())).toMatchObject({ ok: true });
  });

  it('rejects fractions, multiples and small counts written as words', () => {
    expect(has(reasonsOf('{project} lost {loss} on {chain}; roughly half of it was later recovered.'), 'number_word')).toBe(true);
    expect(has(reasonsOf('{project} lost {loss} on {chain} within one hour, according to {source}.'), 'number_word')).toBe(true);
    expect(has(reasonsOf('Losses doubled compared with the week before, reaching {week_loss}.', trendsCtx()), 'number_word')).toBe(true);
    expect(has(reasonsOf('{project} lost a quarter of its reserves on {chain}, according to {source}.'), 'number_word')).toBe(true);
  });

  it('allows "each one" and "no one", which carry no count', () => {
    expect(validateAndFill('Remove browser extensions you do not use on {chain}; each one can read pages, and no one should keep them.', ctx())).toMatchObject({ ok: true });
  });

  it('rejects a confirmed or verified claim in trends and vulnerabilities', () => {
    expect(has(reasonsOf('All {incident_count} incidents this week were confirmed and verified, with {week_loss} lost.', trendsCtx()), 'claims_confirmed')).toBe(true);
    const vulns = ctx({ section: 'vulnerabilities', values: { vuln_count: '4' } });
    expect(has(reasonsOf('{vuln_count} confirmed critical reports were added; patch the affected packages.', vulns), 'claims_confirmed')).toBe(true);
  });

  it('rejects a week-on-week comparison unless both weeks have a loss value', () => {
    expect(has(reasonsOf('Losses rose compared with the week before, reaching {week_loss}.', trendsCtx()), 'comparison')).toBe(true);
    expect(has(reasonsOf('This week saw more than the usual {top_attack} reports, with {week_loss} lost.', trendsCtx()), 'comparison')).toBe(true);
    const both = trendsCtx({ ...trendsValues, previous_week_loss: '~$8M reported' });
    expect(validateAndFill('Losses rose to {week_loss} this week, against {previous_week_loss} the week before.', both)).toMatchObject({ ok: true });
  });
});

describe('validateAndFill accepts grounded prose', () => {
  it('fills placeholders from values', () => {
    const result = validateAndFill('{project} on {chain} lost {loss} in a {attack}, according to {source} ({date}).', ctx());
    expect(result).toEqual({
      ok: true,
      text: 'Example Protocol on Ethereum lost ~$4.2M reported in a bridge exploit, according to QuillMonitor (Oct 7).',
    });
  });

  it('accepts allowed terms such as Web3 and ERC-20, sentence-initial capitals and an allowed chain', () => {
    const raw = 'Attackers abused an ERC-20 approval on Ethereum. Web3 users should revoke stale approvals after reading about {project}.';
    expect(validateAndFill(raw, ctx())).toMatchObject({ ok: true });
  });

  it('accepts an unconfirmed item that says reported', () => {
    expect(validateAndFill('{project} on {chain} reported a {attack}; the figure of {loss} is {status}.', unconfirmedCtx())).toMatchObject({ ok: true });
  });

  it('accepts a project name from the input', () => {
    expect(validateAndFill('Users of {project} should check approvals they granted on {chain} before {date}.', ctx())).toMatchObject({ ok: true });
  });

  it('checks trends and vulnerabilities against their own placeholder lists', () => {
    const trends = ctx({
      section: 'trends',
      values: { week_loss: '~$12M reported', previous_week_loss: null, incident_count: '9', unconfirmed_count: '2', top_attack: 'phishing', top_chain: 'Ethereum', funds_returned_count: '1' },
    });
    expect(validateAndFill('This week {incident_count} incidents added up to {week_loss}, led by {top_attack}.', trends)).toMatchObject({ ok: true });
    expect(has(reasonsOf('This week {project} led {incident_count} incidents with {week_loss}.', trends), 'unknown_placeholder')).toBe(true);
    const vulns = ctx({ section: 'vulnerabilities', values: { vuln_count: '4' } });
    expect(validateAndFill('{vuln_count} critical or high-severity reports were added; patch the affected packages.', vulns)).toMatchObject({ ok: true });
  });

  it('exposes the placeholder lists from the plan', () => {
    expect(WEEKLY_PLACEHOLDERS.item).toEqual(['project', 'loss', 'chain', 'attack', 'date', 'status', 'source']);
    expect(WEEKLY_PLACEHOLDERS.vulnerabilities).toEqual(['vuln_count']);
  });
});
