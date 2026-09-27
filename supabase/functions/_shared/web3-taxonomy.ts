export const WEB3_TAXONOMY_VERSION = '2026-09-27.1';

export type Web3IncidentCategory =
  | 'web3-security'
  | 'defi-exploits'
  | 'operational-security'
  | 'supply-chain';

export interface Web3Context {
  isWeb3: boolean;
  isDefi: boolean;
  hasSecuritySignal: boolean;
  reasons: string[];
}

export interface Web3IncidentClassification {
  category: Web3IncidentCategory;
  securityDomain: 'web3';
  taxonomyVersion: string;
  reasons: string[];
}

interface Web3IncidentInput {
  title?: string;
  description?: string;
  projectCategory?: string;
  attackType?: string;
}

const WEB3_DOMAIN_SIGNALS = [
  'blockchain', 'web3', 'crypto', 'cryptocurrency', 'defi', 'decentralized finance',
  'decentralized exchange', 'dex', 'ethereum', 'solana',
  'bitcoin', 'smart contract', 'wallet', 'seed phrase', 'private key', 'token',
  'nft', 'layer 1', 'layer 2', 'l1', 'l2', 'on chain', 'crypto exchange',
];

const SECURITY_SIGNALS = [
  'hack', 'hacks', 'hacked', 'hacker', 'hackers', 'exploit', 'exploits', 'exploited',
  'exploitation', 'vulnerability', 'vulnerabilities', 'attack', 'attacks', 'attacked',
  'attacker', 'attackers', 'stolen', 'theft',
  'drain', 'drained', 'drainer', 'drainers', 'compromise', 'compromised', 'breach',
  'breaches', 'phishing', 'scam', 'scams', 'rug pull', 'malicious', 'incident',
  'incidents', 'zero day', 'cve',
  'unauthorized', 'takeover',
];

// These signals intentionally exclude generic words such as `protocol`,
// `smart contract`, `governance`, and `oracle`. Those terms occur throughout
// Web3 but do not, on their own, establish that an incident is a DeFi exploit.
const DEFI_TEXT_SIGNALS = [
  'defi', 'decentralized finance', 'decentralized exchange', 'dex',
  'liquidity pool', 'flash loan', 'lending protocol', 'yield farming',
  'staking protocol', 'liquid staking', 'cross chain bridge', 'bridge exploit',
  'blockchain bridge', 'crypto bridge', 'oracle manipulation', 'stablecoin protocol',
];

const DEFI_PROJECT_CATEGORIES = new Set([
  'amm', 'bridge', 'cross chain bridge', 'defi', 'derivatives', 'dex',
  'decentralized exchange', 'lending', 'lending and borrowing', 'liquidity',
  'liquid staking', 'staking', 'stablecoin', 'yield', 'yield farming',
]);

const SUPPLY_CHAIN_SIGNALS = [
  'supply chain', 'dependency confusion', 'dependency compromise',
  'malicious dependency', 'malicious library', 'malicious npm', 'malicious package',
  'frontend compromise', 'dns hijack', 'domain hijack',
];

const OPSEC_SIGNALS = [
  'private key compromise', 'compromised private key', 'key compromise',
  'seed phrase compromise', 'credential compromise', 'wallet drainer', 'phishing',
  'social engineering', 'sim swap', 'account takeover', 'insider attack',
  'private key theft', 'stolen private key', 'seed phrase theft', 'stolen seed phrase',
  'credential theft', 'stolen credentials', 'rug pull', 'exit scam',
];

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findSignals(value: string, signals: string[]): string[] {
  const normalized = ` ${normalize(value)} `;
  return signals.filter((signal) => normalized.includes(` ${normalize(signal)} `));
}

/**
 * Detects the Web3 domain separately from an article's primary category.
 * A generic domain word (for example, "Ethereum") is insufficient without a
 * security signal, which keeps ordinary market and product news out.
 */
export function detectWeb3Context(value: string): Web3Context {
  const domainSignals = findSignals(value, WEB3_DOMAIN_SIGNALS);
  const securitySignals = findSignals(value, SECURITY_SIGNALS);
  const defiSignals = findSignals(value, DEFI_TEXT_SIGNALS);
  const isWeb3 = domainSignals.length > 0 && securitySignals.length > 0;

  return {
    isWeb3,
    isDefi: isWeb3 && defiSignals.length > 0,
    hasSecuritySignal: securitySignals.length > 0,
    reasons: [
      ...domainSignals.map((signal) => `web3:${signal}`),
      ...securitySignals.map((signal) => `security:${signal}`),
      ...defiSignals.map((signal) => `defi:${signal}`),
    ].slice(0, 12),
  };
}

/** Classifies records from protected Web3 incident providers. */
export function classifyWeb3Incident(input: Web3IncidentInput): Web3IncidentClassification {
  const projectCategory = normalize(input.projectCategory || '');
  const descriptiveText = [input.title, input.description, input.attackType]
    .filter(Boolean)
    .join(' ');
  const supplySignals = findSignals(descriptiveText, SUPPLY_CHAIN_SIGNALS);
  const opsecSignals = findSignals(descriptiveText, OPSEC_SIGNALS);
  const defiSignals = findSignals(descriptiveText, DEFI_TEXT_SIGNALS);
  const projectCategorySignals = findSignals(projectCategory, [...DEFI_PROJECT_CATEGORIES]);
  const projectIsDefi = DEFI_PROJECT_CATEGORIES.has(projectCategory) || projectCategorySignals.length > 0;

  let category: Web3IncidentCategory = 'web3-security';
  let categoryReasons: string[] = ['provider:web3-incident'];

  if (supplySignals.length > 0) {
    category = 'supply-chain';
    categoryReasons = supplySignals.map((signal) => `supply-chain:${signal}`);
  } else if (opsecSignals.length > 0) {
    category = 'operational-security';
    categoryReasons = opsecSignals.map((signal) => `operational-security:${signal}`);
  } else if (projectIsDefi || defiSignals.length > 0) {
    category = 'defi-exploits';
    categoryReasons = [
      ...(projectIsDefi ? [`defi-project-category:${projectCategory}`] : []),
      ...defiSignals.map((signal) => `defi:${signal}`),
    ];
  }

  return {
    category,
    securityDomain: 'web3',
    taxonomyVersion: WEB3_TAXONOMY_VERSION,
    reasons: categoryReasons.slice(0, 10),
  };
}
