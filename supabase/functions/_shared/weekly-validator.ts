// Guardrail for model-written weekly paragraphs. The model writes prose
// around placeholders such as {loss} and {chain}; code fills them from the
// database. Anything that could carry an invented fact (an amount, a number,
// a name, a link, a status claim) is rejected, and the caller falls back to a
// deterministic template. Do not loosen the number, URL or unconfirmed rules.
// Pure module: no Deno or URL imports, so vitest can import it.

export const WEEKLY_PLACEHOLDERS = {
  item: ['project', 'loss', 'chain', 'attack', 'date', 'status', 'source'],
  trends: ['week_loss', 'previous_week_loss', 'incident_count', 'unconfirmed_count', 'top_attack', 'top_chain', 'funds_returned_count'],
  vulnerabilities: ['vuln_count'],
} as const satisfies Record<string, readonly string[]>;

export type WeeklySection = keyof typeof WEEKLY_PLACEHOLDERS;

/** Terms with digits or capitals that carry no invented fact. Tune from archive.validation, never with names or figures. */
export const STATIC_ALLOWED_TERMS: readonly string[] = [
  'Web3', 'ERC-20', 'ERC-721', 'ERC-1155', 'ERC-4626', 'EIP-712', 'EIP-2612', '2FA', 'L1', 'L2',
  'DeFi', 'NFT', 'NFTs', 'DAO', 'DAOs', 'DEX', 'DEXs', 'CEX', 'EVM', 'MEV', 'RPC', 'API', 'APIs',
  'DNS', 'URL', 'URLs', 'CVE', 'CVEs', 'OTC', 'KYC', 'GitHub', 'npm', 'Chainabuse',
];

export interface ValidationContext {
  section: WeeklySection;
  values: Record<string, string | null>;
  allowedTerms: string[];
  knownProjectNames: string[];
  inputProjectNames: string[];
  isUnconfirmed: boolean;
  maxLength: number;
}

export type ValidationResult = { ok: true; text: string } | { ok: false; reasons: string[] };

export const MIN_PARAGRAPH_LENGTH = 20;
const PLACEHOLDER = /\{([^{}]*)\}/g;
// Lower-case sentinel that stands in for a placeholder during the checks, so
// a capital after it is not mistaken for a sentence start.
const SENTINEL = 'zzph';
const CURRENCY_SYMBOL = /[$€£¥₿]/u;
const CURRENCY_WORD = /\b(usd|usdc|usdt|dollars?|euros?|eth|btc|wei|gwei)\b/i;
const MAGNITUDE_WORD = /\b(millions?|billions?|thousands?|trillions?|bn|mn)\b/i;
const NUMBER_WORD = /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundreds?|dozens?)\b(?!-factor)/i;
const URL_LIKE = /\b(?:https?:\/\/|www\.)|\b[\w-]+\.(?:com|io|xyz|org|net|finance|fi|app|dev|co|cash|exchange|network|gg|ai)\b|@\w/i;
const MARKUP = /[<>*#[\]`{}|_]/;
const HYPE = /\b(massive|devastating|urgent(?:ly)?|shocking|catastrophic|unprecedented|alarming|staggering|whopping|huge|enormous|insane|crazy|explosive|skyrocket(?:s|ed|ing)?|terrifying|nightmare|bloodbath|game[- ]?changer|act now|immediate action required|mind[- ]blowing)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;
const VERIFIED_BY = /\bverified\s+by\b/i;
const CONFIRMED_CLAIM = /\b(confirmed|verified)\b/i;
const UNCONFIRMED_WORD = /\bunconfirmed\b/i;
const UNCONFIRMED_WORDING = /\b(unconfirmed|reported)\b/i;
const SENTENCE_END = /[.!?]["')\]’”]*$/u;
const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

function normalizeWords(value: string): string {
  return ` ${value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
}

function allowedSet(terms: string[]): Set<string> {
  const set = new Set<string>();
  for (const term of terms) {
    const lower = term.trim().toLowerCase();
    if (!lower) continue;
    set.add(lower);
    for (const part of lower.split(/\s+/)) set.add(part.replace(EDGE_PUNCTUATION, ''));
  }
  return set;
}

function tokenReasons(stripped: string, allowed: Set<string>): string[] {
  const reasons: string[] = [];
  const tokens = stripped.split(/\s+/).filter(Boolean);
  tokens.forEach((raw, index) => {
    const sentenceStart = index === 0 || SENTENCE_END.test(tokens[index - 1]);
    const token = raw.replace(/['’]s$/u, '').replace(EDGE_PUNCTUATION, '');
    if (!token || allowed.has(token.toLowerCase())) return;
    token.split(/[-/]/).forEach((part, partIndex) => {
      if (!part || allowed.has(part.toLowerCase())) return;
      if (/\d/.test(part)) {
        reasons.push(`digits:${token}`);
      } else if (/\p{Lu}/u.test(part)) {
        const sentenceCase = sentenceStart && partIndex === 0 && /^\p{Lu}[^\p{Lu}]*$/u.test(part);
        if (!sentenceCase) reasons.push(`capitalised:${token}`);
      }
    });
  });
  return reasons;
}

function projectReasons(stripped: string, ctx: ValidationContext): string[] {
  let text = normalizeWords(stripped);
  // Remove the input's own names first, so a known name inside one of them
  // ("Example" inside "Example Protocol") is not reported.
  for (const name of ctx.inputProjectNames) {
    const normalized = normalizeWords(name);
    if (normalized.trim()) text = text.split(normalized).join(' ');
  }
  const input = new Set(ctx.inputProjectNames.map((name) => normalizeWords(name)));
  const allowed = new Set(ctx.allowedTerms.map((term) => normalizeWords(term)));
  const reasons: string[] = [];
  for (const name of ctx.knownProjectNames) {
    const normalized = normalizeWords(name);
    if (normalized.trim().length < 3 || input.has(normalized) || allowed.has(normalized)) continue;
    if (text.includes(normalized)) reasons.push(`unknown_project:${name.trim()}`);
  }
  return reasons;
}

export function validateAndFill(raw: string, ctx: ValidationContext): ValidationResult {
  const reasons: string[] = [];
  const allowedNames = WEEKLY_PLACEHOLDERS[ctx.section] as readonly string[];
  const source = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';

  for (const match of source.matchAll(PLACEHOLDER)) {
    const name = match[1];
    if (!allowedNames.includes(name)) reasons.push(`unknown_placeholder:${name}`);
    else if (ctx.values[name] === null || ctx.values[name] === undefined || ctx.values[name] === '') reasons.push(`null_placeholder:${name}`);
  }

  const stripped = source.replace(PLACEHOLDER, SENTINEL);
  if (CURRENCY_SYMBOL.test(stripped) || CURRENCY_WORD.test(stripped) || MAGNITUDE_WORD.test(stripped)) reasons.push('currency');
  if (NUMBER_WORD.test(stripped)) reasons.push('number_word');
  if (URL_LIKE.test(stripped)) reasons.push('url');
  if (MARKUP.test(stripped)) reasons.push('markup');
  const hype = HYPE.exec(stripped);
  if (hype) reasons.push(`hype:${hype[1].toLowerCase()}`);
  if (EMOJI.test(stripped)) reasons.push('emoji');
  if (VERIFIED_BY.test(stripped)) reasons.push('verified_by');
  reasons.push(...projectReasons(stripped, ctx));
  reasons.push(...tokenReasons(stripped, allowedSet(ctx.allowedTerms)));

  if (ctx.section === 'item') {
    // Status words come from the source through {status}; prose may only
    // repeat a status the source actually gives.
    if (ctx.values.status !== 'confirmed' && CONFIRMED_CLAIM.test(stripped)) reasons.push('claims_confirmed');
    if (!ctx.isUnconfirmed && UNCONFIRMED_WORD.test(stripped)) reasons.push('claims_unconfirmed');
  }

  const filled = source.replace(PLACEHOLDER, (_whole, name: string) => ctx.values[name] ?? '').replace(/\s+/g, ' ').trim();
  if (filled.length < MIN_PARAGRAPH_LENGTH || filled.length > ctx.maxLength) reasons.push('length');
  if (ctx.isUnconfirmed) {
    if (!UNCONFIRMED_WORDING.test(filled)) reasons.push('missing_unconfirmed_wording');
    if (CONFIRMED_CLAIM.test(filled)) reasons.push('claims_confirmed');
  }

  const unique = [...new Set(reasons)];
  return unique.length > 0 ? { ok: false, reasons: unique } : { ok: true, text: filled };
}

/** Fills placeholders without checks; for code-written templates only. */
export function fillPlaceholders(template: string, values: Record<string, string | null>): string {
  return template.replace(PLACEHOLDER, (_whole, name: string) => values[name] ?? '').replace(/\s+/g, ' ').trim();
}
