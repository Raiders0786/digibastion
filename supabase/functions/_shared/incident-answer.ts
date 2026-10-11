// One plain sentence that answers "what happened?" for an incident. Feeds,
// meta descriptions, prerendered pages, share text and the Worker reuse it.
// Rules: name the source, use the source's own status word, write "about"
// for amounts, leave out missing fields, no hype words.
// Pure module: no Deno or URL imports.
import { sourceLabelFor } from './attribution.ts';
import type { NewsletterItem } from './newsletter-content.ts';
import { formatCompactUsd } from './usd-amount.ts';

export type AnswerInput = Pick<NewsletterItem, 'title' | 'projectName' | 'chain' | 'attackType' | 'amountUsd'
  | 'amountDisplay' | 'incidentDate' | 'fundsReturned' | 'sourceName' | 'providers' | 'status'>;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Attack types that already name the kind of event read wrong with "attack" after them.
const NAMES_AN_EVENT = /\b(attack|exploit|hack|compromise|scam|phishing|drain|theft|breach|leak|rug ?pull)$/i;

/** '2026-09-30' -> '30 Sep 2026'; anything else comes back unchanged. */
export function formatAnswerDate(isoDay: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${Number(match[3])} ${month} ${match[1]}` : isoDay;
}

const withArticle = (phrase: string) => (/^[aeiou]/i.test(phrase) ? `an ${phrase}` : `a ${phrase}`);

/** Lower-case for mid-sentence use, keeping acronyms such as DNS or MEV. */
function midSentence(value: string): string {
  return value.trim().split(/\s+/).map((word) => (/^[A-Z0-9]{2,}$/.test(word) ? word : word.toLowerCase())).join(' ');
}

function attackPhrase(attackType: string | null): string | null {
  if (!attackType || !attackType.trim()) return null;
  const attack = midSentence(attackType);
  return NAMES_AN_EVENT.test(attack) ? attack : `${attack} attack`;
}

export function buildIncidentAnswer(input: AnswerInput): string {
  const subject = (input.projectName || input.title).trim();
  const chain = input.chain ? ` on ${input.chain}` : '';
  const amount = input.amountDisplay || (input.amountUsd && input.amountUsd > 0 ? formatCompactUsd(input.amountUsd) : null);
  const attack = attackPhrase(input.attackType);
  const date = input.incidentDate ? ` on ${formatAnswerDate(input.incidentDate)}` : '';
  const status = input.status ? ` (${input.status})` : '';
  const source = `, according to ${sourceLabelFor(input)}${status}.`;
  const core = amount
    ? `${subject}${chain} lost about ${amount}${attack ? ` in ${withArticle(attack)}` : ''}${date}${source}`
    : `${subject}${chain} was hit by ${withArticle(attack ?? 'security incident')}${date}${source} No loss figure has been reported.`;
  return input.fundsReturned === true ? `${core} The funds were later reported returned.` : core;
}
