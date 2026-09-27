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

function tokenize(value: string): Token[] {
  const normalized = value.normalize('NFKC');
  return (normalized.match(/[\p{L}\p{N}]+/gu) || []).map((original) => ({
    original,
    lower: original.toLocaleLowerCase('en-US'),
  }));
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

function tokenMatches(contentToken: Token, termToken: Token, isLastToken: boolean): boolean {
  if (termToken.lower === 'apt') {
    // Preserve the uppercase threat-group acronym while rejecting Debian's
    // lowercase `apt` package manager and embedded words such as adaptations.
    return /^APT(?:\d+|s)?$/.test(contentToken.original);
  }

  if (/^\d+$/.test(termToken.lower) || STRICT_SECURITY_TOKENS.has(termToken.lower)) {
    return contentToken.lower === termToken.lower || contentToken.lower === `${termToken.lower}s`;
  }

  return isLastToken
    ? matchesInflection(contentToken.lower, termToken.lower)
    : contentToken.lower === termToken.lower;
}

/**
 * Matches a security term on token boundaries and only permits known/common
 * inflections. Punctuation is normalized, so `zero-day` matches `zero day`,
 * while `apt`, `tor`, `rce`, and `defi` cannot match inside ordinary words.
 */
export function containsSecurityTerm(content: string, term: string): boolean {
  const contentTokens = tokenize(content);
  const termTokens = tokenize(term);
  if (contentTokens.length === 0 || termTokens.length === 0) return false;

  for (let start = 0; start <= contentTokens.length - termTokens.length; start++) {
    const matches = termTokens.every((termToken, offset) =>
      tokenMatches(
        contentTokens[start + offset],
        termToken,
        offset === termTokens.length - 1,
      )
    );
    if (matches) return true;
  }

  return false;
}

export function matchingSecurityKeywords<T extends { keyword: string }>(
  content: string,
  keywords: T[],
): T[] {
  return keywords.filter(({ keyword }) => containsSecurityTerm(content, keyword));
}

/** Determines whether an RSS item is security-relevant and assigns a category. */
export function classifyRssRelevance(
  title: string,
  summary: string,
  keywords: KeywordEntry[],
  feedCategory: string,
): RelevanceResult {
  const content = `${title} ${summary}`;
  const matchedKeywords: string[] = [];
  const matchedEntries = matchingSecurityKeywords(content, keywords);
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
  ].some((signal) => containsSecurityTerm(content, signal));

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
    if (containsSecurityTerm(title, indicator) || keywordsLower.includes(indicator)) return 'critical';
  }
  for (const indicator of highIndicators) {
    if (containsSecurityTerm(title, indicator) || keywordsLower.includes(indicator)) return 'high';
  }
  for (const indicator of mediumIndicators) {
    if (containsSecurityTerm(title, indicator) || keywordsLower.includes(indicator)) return 'medium';
  }
  return 'low';
}
