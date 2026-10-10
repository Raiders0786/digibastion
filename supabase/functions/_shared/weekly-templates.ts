// Deterministic weekly paragraphs: the fallback whenever the model is off,
// fails, or writes a paragraph the validator rejects. Each template is written
// in placeholder form (the *Raw functions) and filled from the same values the
// model's paragraphs use, so the tests can run every template through
// validateAndFill.
// Pure module: no Deno or URL imports, so vitest can import it.
import { shortIssueDate } from './daily-brief.ts';
import { formatLossReported, type NewsletterItem, type WeeklyBreakdown, type WeeklyTotals } from './newsletter-content.ts';
import { pickSecurityAction } from './security-actions.ts';
import { fillPlaceholders } from './weekly-validator.ts';

export const WEEKLY_MAX_LENGTH = { item: 450, trends: 700, vulnerabilities: 400 } as const;

type Values = Record<string, string | null>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function clean(value: string | null | undefined): string | null {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  return text || null;
}

/** "Bridge Exploit" -> "bridge exploit"; acronyms such as "DNS" stay. */
export function proseLabel(value: string | null | undefined): string | null {
  const text = clean(value);
  if (!text) return null;
  return text.split(' ').map((word) => (/^\p{Lu}\p{Ll}+$/u.test(word) ? word.toLowerCase() : word)).join(' ');
}

const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');
const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

export function itemPlaceholderValues(item: NewsletterItem): Values {
  const date = item.incidentDate?.slice(0, 10) ?? '';
  return {
    project: clean(item.projectName),
    loss: formatLossReported(item.amountUsd),
    chain: clean(item.chain),
    attack: proseLabel(item.attackType),
    date: ISO_DATE.test(date) ? shortIssueDate(date) : null,
    status: item.status,
    source: clean(item.sourceName),
  };
}

function leading(entries: WeeklyBreakdown[]): WeeklyBreakdown | null {
  return entries.find((entry) => entry.key !== 'other' && entry.key !== 'unknown' && entry.count > 0) ?? null;
}

export function trendsPlaceholderValues(t: WeeklyTotals): Values {
  const attack = leading(t.byAttackType);
  const chain = leading(t.byChain);
  return {
    week_loss: t.lossUsd > 0 ? formatLossReported(t.lossUsd) : null,
    previous_week_loss: t.previousLossUsd > 0 ? formatLossReported(t.previousLossUsd) : null,
    incident_count: String(t.incidentCount),
    unconfirmed_count: String(t.unconfirmedCount),
    top_attack: attack ? proseLabel(attack.label) : null,
    top_chain: chain ? clean(chain.label) : null,
    funds_returned_count: String(t.fundsReturnedCount),
  };
}

export function vulnerabilityPlaceholderValues(items: NewsletterItem[]): Values {
  return { vuln_count: String(items.length) };
}

// ---------------------------------------------------------------------------
// What happened
// ---------------------------------------------------------------------------

export function templateWhatRaw(item: NewsletterItem): string {
  const v = itemPlaceholderValues(item);
  const unconfirmed = item.status === 'unconfirmed';
  const prefix = unconfirmed ? 'Unconfirmed report: ' : '';
  const subject = v.project ? '{project}' : unconfirmed ? 'an unnamed project' : 'An unnamed project';
  const chain = v.chain ? ' on {chain}' : '';
  let verb: string;
  if (v.loss) verb = ` lost {loss}${v.attack ? ` in ${article(v.attack)} {attack}` : ''}`;
  else verb = v.attack ? ` reported ${article(v.attack)} {attack}` : ' reported a security incident';
  const source = v.source ? ', according to {source}' : ', according to its source';
  const date = v.date ? ' ({date})' : '';
  const status = item.status === 'confirmed' ? ' The source lists it as {status}.' : '';
  return `${prefix}${subject}${chain}${verb}${source}${date}.${status}`;
}

export function templateWhat(item: NewsletterItem): string {
  return fillPlaceholders(templateWhatRaw(item), itemPlaceholderValues(item));
}

// ---------------------------------------------------------------------------
// What to do
// ---------------------------------------------------------------------------

// First matching rule wins; signals are the item's attack type and category.
const BUILDER_ACTIONS: { pattern: RegExp; text: string }[] = [
  {
    pattern: /private key|key compromise|compromised key|access control|admin key/,
    text: 'hold admin and deployer keys on dedicated hardware, put privileged roles behind a multisig with a timelock, and rotate keys after any suspected exposure.',
  },
  {
    pattern: /phish|drain|approv|permit|signature|front[- ]?end|dns/,
    text: 'keep front-end, domain and DNS accounts behind hardware-key sign-in and alert on approval requests your app does not normally make.',
  },
  {
    pattern: /supply[ -]chain|\bnpm\b|package|dependenc/,
    text: 'commit a lockfile, pin dependency versions and review package updates before they ship.',
  },
  {
    pattern: /oracle|price manipulation|flash ?loan/,
    text: 'use time-weighted or multi-source price feeds and test for price manipulation within a single transaction.',
  },
  {
    pattern: /bridge|cross[- ]chain/,
    text: 'cap how much a bridge can release in a period and alert on withdrawals that have no matching deposit on the source chain.',
  },
  {
    pattern: /reentran|logic|smart contract|overflow|rounding|precision|governance/,
    text: 'add invariant tests for this class of bug and have upgrades reviewed before deployment.',
  },
  {
    pattern: /rug|exit scam|insider/,
    text: 'publish who controls contract upgrades and liquidity, and put those controls behind a timelock.',
  },
];
const DEFAULT_BUILDER_ACTION = 'review access controls and monitoring for the affected components, and keep an incident response plan ready.';

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export function templateActionRaw(item: NewsletterItem): string {
  const signals = [item.attackType ?? '', item.category].join(' | ').toLowerCase();
  const users = pickSecurityAction({
    seed: item.uid,
    attackTypes: item.attackType ? [item.attackType] : [],
    categories: item.category ? [item.category] : [],
  });
  const builders = BUILDER_ACTIONS.find((rule) => rule.pattern.test(signals))?.text ?? DEFAULT_BUILDER_ACTION;
  // Every paragraph about an unconfirmed item says so (validator rule).
  const lead = item.status === 'unconfirmed' ? 'The report is unconfirmed, but this advice holds either way. ' : '';
  return `${lead}For users: ${lowerFirst(users.text)} For builders: ${builders}`;
}

export function templateAction(item: NewsletterItem): string {
  return fillPlaceholders(templateActionRaw(item), itemPlaceholderValues(item));
}

// ---------------------------------------------------------------------------
// Trends and vulnerabilities
// ---------------------------------------------------------------------------

export function templateTrendsRaw(t: WeeklyTotals): string {
  if (t.incidentCount === 0 && t.unconfirmedCount === 0) return 'No new Web3 incidents were recorded this week.';
  const v = trendsPlaceholderValues(t);
  const sentences: string[] = [];

  if (t.incidentCount > 0) {
    const counted = `This week {incident_count} ${plural(t.incidentCount, 'incident', 'incidents')}`;
    const loss = v.week_loss
      ? ' added up to {week_loss} in losses'
      : ` ${plural(t.incidentCount, 'was', 'were')} recorded with no loss amount reported`;
    const previous = v.previous_week_loss
      ? ', against {previous_week_loss} the week before.'
      : v.week_loss ? ', with no losses reported the week before.' : '.';
    sentences.push(`${counted}${loss}${previous}`);
  } else {
    sentences.push('Only unconfirmed reports were recorded this week.');
  }

  if (v.top_attack && v.top_chain) sentences.push('The leading attack type was {top_attack}, and the most affected chain was {top_chain}.');
  else if (v.top_attack) sentences.push('The leading attack type was {top_attack}.');
  else if (v.top_chain) sentences.push('The most affected chain was {top_chain}.');

  if (t.unconfirmedCount > 0) {
    sentences.push(`{unconfirmed_count} more unconfirmed ${plural(t.unconfirmedCount, 'report is', 'reports are')} not counted in these totals.`);
  }
  if (t.fundsReturnedCount > 0) {
    sentences.push(`Funds were returned in {funds_returned_count} ${plural(t.fundsReturnedCount, 'incident', 'incidents')}.`);
  }
  return sentences.join(' ');
}

export function templateTrends(t: WeeklyTotals): string {
  return fillPlaceholders(templateTrendsRaw(t), trendsPlaceholderValues(t));
}

export function templateVulnerabilitiesRaw(items: NewsletterItem[]): string {
  if (items.length === 0) return 'No critical or high-severity vulnerability or supply-chain reports were added this week.';
  return `This week {vuln_count} critical or high-severity ${plural(items.length, 'report was', 'reports were')} added on vulnerabilities and supply-chain risks; each is listed below with its source.`;
}

export function templateVulnerabilities(items: NewsletterItem[]): string {
  return fillPlaceholders(templateVulnerabilitiesRaw(items), vulnerabilityPlaceholderValues(items));
}
