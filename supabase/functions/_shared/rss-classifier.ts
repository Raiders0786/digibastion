import {
  classifyWeb3Incident,
  detectWeb3Context,
  WEB3_TAXONOMY_VERSION,
} from './web3-taxonomy.ts';

export interface KeywordEntry {
  keyword: string;
  category: string;
  weight: number;
}

export interface RelevanceResult {
  relevant: boolean;
  matchedKeywords: string[];
  category: string;
  weight: number;
  securityDomain: 'web3' | null;
  taxonomyVersion: string;
  classificationReasons: string[];
}

interface Token {
  original: string;
  lower: string;
}

type TermKind = 'apt' | 'strict' | 'inflected';

interface TermToken extends Token {
  kind: TermKind;
}

const STRICT_SECURITY_TOKENS = new Set([
  'apt', 'cve', 'rce', 'lpe', 'xss', 'csrf', 'sqli', 'mitm', 'ddos',
  'npm', 'pypi', 'dprk', 'vpn', 'tor', '2fa', 'mfa', '0day', 'defi', 'cisa',
]);

const TOKEN_ALIASES: Record<string, Set<string>> = {
  exploit: new Set(['exploitation', 'exploitations', 'exploitable', 'exploitability']),
  hack: new Set(['hacker', 'hackers']),
  attack: new Set(['attacker', 'attackers']),
  drain: new Set(['drainer', 'drainers']),
};

const AMBIGUOUS_STANDALONE_KEYWORDS = new Set([
  'package', 'dependency', 'github', 'npm', 'pypi',
  'wallet', 'metamask', 'ledger', 'trezor', 'phantom',
  'defi', 'smart contract', 'solidity', 'ethereum', 'bitcoin', 'solana',
]);

// Lowercasing uses the locale-independent mapping; en-US locale lowercasing is
// identical but many times slower, and it ran once per token per keyword.
function tokenize(value: string): Token[] {
  const normalized = value.normalize('NFKC');
  return (normalized.match(/[\p{L}\p{N}]+/gu) || []).map((original) => ({
    original,
    lower: original.toLowerCase(),
  }));
}

// Keywords and indicator lists repeat on every item, so their tokens are
// computed once per isolate rather than once per item.
const termTokenCache = new Map<string, TermToken[]>();

function termTokens(term: string): TermToken[] {
  let cached = termTokenCache.get(term);
  if (!cached) {
    cached = tokenize(term).map((token) => ({
      ...token,
      kind: token.lower === 'apt'
        ? 'apt'
        : /^\d+$/.test(token.lower) || STRICT_SECURITY_TOKENS.has(token.lower)
          ? 'strict'
          : 'inflected',
    }));
    termTokenCache.set(term, cached);
  }
  return cached;
}

function matchesInflection(contentToken: string, termToken: string): boolean {
  if (contentToken === termToken) return true;
  if (TOKEN_ALIASES[termToken]?.has(contentToken)) return true;
  if (contentToken === `${termToken}s` || contentToken === `${termToken}es`) return true;

  if (termToken.endsWith('y')) {
    return contentToken === `${termToken.slice(0, -1)}ies`;
  }

  if (termToken.endsWith('e')) {
    return contentToken === `${termToken}d` ||
      contentToken === `${termToken.slice(0, -1)}ing`;
  }

  return contentToken === `${termToken}ed` || contentToken === `${termToken}ing`;
}

function tokenMatches(contentToken: Token, termToken: TermToken, isLastToken: boolean): boolean {
  if (termToken.kind === 'apt') {
    // Preserve the uppercase threat-group acronym while rejecting Debian's
    // lowercase `apt` package manager and embedded words such as adaptations.
    return /^APT(?:\d+|s)?$/.test(contentToken.original);
  }

  if (termToken.kind === 'strict') {
    return contentToken.lower === termToken.lower || contentToken.lower === `${termToken.lower}s`;
  }

  return isLastToken
    ? matchesInflection(contentToken.lower, termToken.lower)
    : contentToken.lower === termToken.lower;
}

function containsTermTokens(contentTokens: Token[], term: string): boolean {
  const termTokenList = termTokens(term);
  if (contentTokens.length === 0 || termTokenList.length === 0) return false;

  // Every accepted form (exact, inflection, alias, APT acronym) shares the
  // term's first character, so most positions are rejected by one comparison.
  const firstChar = termTokenList[0].lower[0];
  const lastOffset = termTokenList.length - 1;
  for (let start = 0; start <= contentTokens.length - termTokenList.length; start++) {
    if (contentTokens[start].lower[0] !== firstChar) continue;
    let offset = 0;
    while (
      offset <= lastOffset &&
      tokenMatches(contentTokens[start + offset], termTokenList[offset], offset === lastOffset)
    ) offset++;
    if (offset > lastOffset) return true;
  }

  return false;
}

/**
 * Matches a security term on token boundaries and only permits known/common
 * inflections. Punctuation is normalized, so `zero-day` matches `zero day`,
 * while `apt`, `tor`, `rce`, and `defi` cannot match inside ordinary words.
 */
export function containsSecurityTerm(content: string, term: string): boolean {
  return containsTermTokens(tokenize(content), term);
}

export function matchingSecurityKeywords<T extends { keyword: string }>(
  content: string,
  keywords: T[],
): T[] {
  const contentTokens = tokenize(content);
  return keywords.filter(({ keyword }) => containsTermTokens(contentTokens, keyword));
}

// Security signals sit in an advisory's opening text. Capping what is classified
// bounds per-item CPU so one oversized feed entry cannot exhaust the edge
// function's CPU limit for the whole sync.
const MAX_CLASSIFIED_SUMMARY_CHARS = 20_000;

/** Determines whether an RSS item is security-relevant and assigns a category. */
export function classifyRssRelevance(
  title: string,
  fullSummary: string,
  keywords: KeywordEntry[],
  feedCategory: string,
): RelevanceResult {
  const summary = fullSummary.slice(0, MAX_CLASSIFIED_SUMMARY_CHARS);
  const content = `${title} ${summary}`;
  const matchedKeywords: string[] = [];
  const contentTokens = tokenize(content);
  const matchedEntries = keywords.filter(({ keyword }) => containsTermTokens(contentTokens, keyword));
  let totalWeight = 0;
  const categoryWeights: Record<string, number> = {};

  for (const { keyword, category, weight } of matchedEntries) {
    matchedKeywords.push(keyword);
    totalWeight += weight;
    categoryWeights[category] = (categoryWeights[category] || 0) + weight;
  }

  let keywordCategory = '';
  let maxWeight = 0;
  for (const [category, weight] of Object.entries(categoryWeights)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      keywordCategory = category;
    }
  }

  const categoryMap: Record<string, string> = {
    vulnerability: 'vulnerability-disclosure',
    breach: 'operational-security',
    malware: 'operational-security',
    threat: 'operational-security',
    attack: 'operational-security',
    'supply-chain': 'supply-chain',
    web3: 'web3-security',
    defi: 'defi-exploits',
    opsec: 'operational-security',
    patch: 'vulnerability-disclosure',
    cloud: 'vulnerability-disclosure',
    infrastructure: 'vulnerability-disclosure',
    advisory: 'vulnerability-disclosure',
    general: 'vulnerability-disclosure',
  };

  const feedHasCategory = Boolean(feedCategory && feedCategory !== 'general');
  let finalCategory: string;
  if (feedHasCategory && (!keywordCategory || maxWeight < 6)) {
    finalCategory = feedCategory;
  } else if (keywordCategory) {
    finalCategory = categoryMap[keywordCategory] || 'vulnerability-disclosure';
  } else {
    finalCategory = feedHasCategory ? feedCategory : 'vulnerability-disclosure';
  }

  const web3Context = detectWeb3Context(content);
  const web3Classification = classifyWeb3Incident({ title, description: summary });
  const hasWeb3Keyword = matchedEntries.some(({ category }) => category === 'web3' || category === 'defi');
  const feedIsWeb3 = ['web3', 'defi', 'web3-security', 'defi-exploits'].includes(feedCategory);
  const isWeb3Domain = web3Context.isWeb3 || ((hasWeb3Keyword || feedIsWeb3) && web3Context.hasSecuritySignal);
  const isDefiDomain = web3Context.isDefi ||
    matchedEntries.some(({ category }) => category === 'defi') ||
    feedCategory === 'defi' || feedCategory === 'defi-exploits';
  const explicitDisclosure = [
    'cve', 'security advisory', 'patch released', 'security update', 'cvss',
  ].some((signal) => containsTermTokens(contentTokens, signal));

  if (isWeb3Domain) {
    // Supply-chain and operational-security remain useful primary labels while
    // securityDomain keeps them discoverable through the Web3 umbrella. A
    // confirmed DeFi attack outranks generic exploit/vulnerability wording;
    // explicit advisories and CVEs remain vulnerability disclosures.
    if (web3Classification.category === 'supply-chain' || web3Classification.category === 'operational-security') {
      finalCategory = web3Classification.category;
    } else if (explicitDisclosure) {
      finalCategory = 'vulnerability-disclosure';
    } else if (isDefiDomain && !explicitDisclosure) {
      finalCategory = 'defi-exploits';
    } else {
      finalCategory = 'web3-security';
    }
  }

  const isVendorFeed = feedCategory === 'vulnerability-disclosure';
  const onlyGenericWeb3Keywords = matchedEntries.length > 0 && matchedEntries.every(({ category }) =>
    category === 'web3' || category === 'defi'
  );
  const onlyAmbiguousKeywords = matchedEntries.length > 0 && matchedEntries.every(({ keyword }) =>
    AMBIGUOUS_STANDALONE_KEYWORDS.has(keyword.trim().toLocaleLowerCase('en-US'))
  );
  const relevant = isVendorFeed || (
    matchedKeywords.length > 0 &&
    (!onlyGenericWeb3Keywords || isWeb3Domain) &&
    (!onlyAmbiguousKeywords || web3Context.hasSecuritySignal)
  );
  return {
    relevant,
    matchedKeywords,
    category: finalCategory,
    weight: totalWeight,
    securityDomain: isWeb3Domain ? 'web3' : null,
    taxonomyVersion: WEB3_TAXONOMY_VERSION,
    classificationReasons: [
      ...web3Context.reasons,
      ...(!web3Context.isWeb3 && isWeb3Domain && feedIsWeb3 ? ['web3:feed-category'] : []),
      ...(!web3Context.isWeb3 && isWeb3Domain && hasWeb3Keyword ? ['web3:keyword-category'] : []),
      ...(explicitDisclosure ? ['primary:explicit-disclosure'] : []),
      `primary:${finalCategory}`,
    ].slice(0, 12),
  };
}

export function determineRssSeverity(matchedKeywords: string[], title: string): string {
  const keywordsLower = matchedKeywords.map((keyword) => keyword.toLocaleLowerCase('en-US'));
  const titleTokens = tokenize(title);
  const criticalIndicators = [
    'critical', 'zero-day', 'zero day', '0day', '0-day', 'rce',
    'remote code execution', 'actively exploited', 'emergency', 'cvss 9', 'cvss 10',
  ];
  const highIndicators = [
    'high severity', 'high-risk', 'exploit', 'breach', 'ransomware', 'malware',
    'backdoor', 'lazarus', 'north korea', 'apt', 'privilege escalation',
    'authentication bypass', 'code execution',
  ];
  const mediumIndicators = [
    'medium', 'vulnerability', 'patch', 'update', 'advisory',
    'security bulletin', 'security notice', 'moderate',
  ];

  for (const indicator of criticalIndicators) {
    if (containsTermTokens(titleTokens, indicator) || keywordsLower.includes(indicator)) return 'critical';
  }
  for (const indicator of highIndicators) {
    if (containsTermTokens(titleTokens, indicator) || keywordsLower.includes(indicator)) return 'high';
  }
  for (const indicator of mediumIndicators) {
    if (containsTermTokens(titleTokens, indicator) || keywordsLower.includes(indicator)) return 'medium';
  }
  return 'low';
}
