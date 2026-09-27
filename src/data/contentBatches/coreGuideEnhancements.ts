import type { ArticleMeta } from '../articlesData';

export const coreGuideEnhancements: Record<string, Partial<ArticleMeta>> = {
  'privacy-security-web3-opsec': {
    title: 'Web3 OpSec Guide: A Practical Privacy and Security Playbook',
    description: 'Build a threat-model-driven Web3 privacy plan for wallets, identities, devices, RPC traffic, and public-chain activity without promises of perfect anonymity.',
    readTime: '8 min read',
    modifiedAt: '2026-09-27',
    summary: 'Web3 privacy depends on managing links across public transactions, applications, infrastructure, devices, and identity accounts. A useful plan starts with a threat model, applies purposeful compartmentalization, and treats privacy as an ongoing risk process rather than a feature one tool can guarantee.',
    keyTakeaways: [
      'A blockchain address is pseudonymous, and exchange records, public posts, RPC requests, and transaction patterns can reconnect it to an identity.',
      'Separate wallets and surrounding accounts according to a documented threat model, while assuming that transfers between compartments may reveal links.',
      'VPNs, private RPCs, and emerging protocol features each change specific trust relationships; none makes public transactions automatically anonymous.',
    ],
    sources: [
      {
        title: 'Your Security Plan',
        publisher: 'Electronic Frontier Foundation',
        url: 'https://ssd.eff.org/module/your-security-plan',
      },
      {
        title: 'The next great wallet will be private',
        publisher: 'Ethereum Foundation',
        url: 'https://ethereum.org/latest/next-great-wallet-private',
      },
      {
        title: 'Privacy roadmap',
        publisher: 'Ethereum Foundation',
        url: 'https://ethereum.org/roadmap/privacy/',
      },
    ],
  },
  'best-hardware-wallet-2025': {
    modifiedAt: '2026-09-27',
    sources: [
      {
        title: 'Ethereum security and scam prevention',
        publisher: 'Ethereum Foundation',
        url: 'https://ethereum.org/security/',
      },
      {
        title: 'Hardware wallet best practices',
        publisher: 'Ledger Academy',
        url: 'https://www.ledger.com/academy/hardwarewallet/best-practices-when-using-a-hardware-wallet',
      },
    ],
  },
};
