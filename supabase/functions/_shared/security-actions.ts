// "One action to take today" (daily brief) and the weekly opsec tip. Reviewed,
// plain-language entries; each links a Digibastion guide or an outside tool
// the Threat Intel pages already reference.
// Pure module: no Deno or URL imports, so vitest can import it.
import type { SecurityAction } from './newsletter-content.ts';
import { SITE_URL } from './site-urls.ts';

const guide = (id: string) => `${SITE_URL}/category/${id}`;

export const SECURITY_ACTIONS: readonly SecurityAction[] = [
  {
    id: 'revoke-approvals',
    text: 'Check the token approvals on your main wallet and revoke the ones you no longer use.',
    url: 'https://revoke.cash',
    guideTitle: 'Revoke.cash',
  },
  {
    id: 'read-before-signing',
    text: 'Before you sign, read what the wallet prompt asks for and decline any permit or approval you did not expect.',
    url: guide('wallet'),
    guideTitle: 'Crypto Wallet Security',
  },
  {
    id: 'hardware-wallet',
    text: 'Keep long-term holdings in a hardware wallet and use a separate wallet for everyday signing.',
    url: guide('wallet'),
    guideTitle: 'Crypto Wallet Security',
  },
  {
    id: 'separate-admin-keys',
    text: 'Keep deployer and admin keys on dedicated hardware, away from the device you browse and read email on.',
    url: guide('opsec'),
    guideTitle: 'Operational Security (OpSec)',
  },
  {
    id: 'offline-recovery-phrase',
    text: 'Store recovery phrases offline and never type them into a website or share them in a chat.',
    url: guide('opsec'),
    guideTitle: 'Operational Security (OpSec)',
  },
  {
    id: 'pin-dependencies',
    text: 'Commit a lockfile, pin package versions and review dependency updates before you merge them.',
    url: guide('developers'),
    guideTitle: 'Developer Security',
  },
  {
    id: 'hardware-2fa',
    text: 'Use an authenticator app or a hardware key for two-factor sign-in on exchange and email accounts.',
    url: guide('authentication'),
    guideTitle: 'Authentication',
  },
  {
    id: 'email-links',
    text: 'When an email asks you to act on your wallet or account, open the site yourself instead of using the link.',
    url: guide('email'),
    guideTitle: 'Email Security',
  },
  {
    id: 'defi-due-diligence',
    text: 'Before depositing into a new DeFi protocol, check its audits and how long its contracts have been live.',
    url: guide('defi'),
    guideTitle: 'DeFi Security',
  },
  {
    id: 'browser-extensions',
    text: 'Remove browser extensions you do not use; each one can read the pages you visit.',
    url: guide('browsing'),
    guideTitle: 'Browsing Security',
  },
  {
    id: 'report-scam-addresses',
    text: 'If you find a scam address, report it on Chainabuse so others can check it before sending funds.',
    url: 'https://www.chainabuse.com',
    guideTitle: 'Chainabuse',
  },
];

const byId = (id: string): SecurityAction => {
  const action = SECURITY_ACTIONS.find((entry) => entry.id === id);
  if (!action) throw new Error(`Unknown security action ${id}`);
  return action;
};

// First matching rule wins. Signals are the week's or day's attack types and
// categories, lower-cased.
const RULES: { pattern: RegExp; actions: string[] }[] = [
  { pattern: /phish|drain|approv|permit|signature/, actions: ['revoke-approvals', 'read-before-signing'] },
  { pattern: /private key|key compromise|compromised key|access control|admin key/, actions: ['separate-admin-keys', 'offline-recovery-phrase'] },
  { pattern: /supply[ -]chain|\bnpm\b|package|dependenc/, actions: ['pin-dependencies'] },
];

// 32-bit FNV-1a: a stable index from the seed (the issue date).
function seedIndex(seed: string, length: number): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % length;
}

export function pickSecurityAction(o: { seed: string; attackTypes: string[]; categories: string[] }): SecurityAction {
  const signals = [...o.attackTypes, ...o.categories].join(' | ').toLowerCase();
  for (const rule of RULES) {
    if (rule.pattern.test(signals)) return byId(rule.actions[seedIndex(o.seed, rule.actions.length)]);
  }
  return SECURITY_ACTIONS[seedIndex(o.seed, SECURITY_ACTIONS.length)];
}
