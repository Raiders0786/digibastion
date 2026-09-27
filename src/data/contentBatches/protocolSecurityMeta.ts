import type { ArticleMeta } from '../articlesData';

export const protocolSecurityMeta: ArticleMeta[] = [
  {
    slug: 'eip-7702-wallet-delegation-security',
    title: 'EIP-7702 Wallet Delegation Security: A Practical Guide',
    description:
      'Understand what EIP-7702 delegation changes for Ethereum wallets, what users should verify, and how developers can avoid initialization, replay, storage, and integration failures.',
    category: 'Wallet Security',
    readTime: '14 min read',
    publishedAt: '2026-09-27',
    modifiedAt: '2026-09-27',
    author: 'Digibastion Security Team',
    tags: ['EIP-7702', 'wallet delegation', 'Pectra', 'account abstraction', 'Ethereum security'],
    difficulty: 'advanced',
    status: 'published',
    summary:
      'EIP-7702 lets an externally owned account point to smart-contract code while keeping its address and original key. The capability enables batching, sponsorship, and account policies, but a malicious or flawed delegate can exercise broad control. Users should delegate only through a trusted wallet flow; developers must bind every authority-sensitive input, secure initialization, and treat delegated accounts as contracts.',
    keyTakeaways: [
      'A delegation changes how an address executes, but the original EOA key retains ultimate authority and can replace or clear the delegation.',
      'Never approve a delegation you cannot attribute to a reviewed implementation, chain scope, and wallet-generated purpose.',
      'Delegate implementations must protect initialization and replay, sign over target, calldata, value, and relevant execution limits, and plan storage-safe upgrades.',
    ],
    sources: [
      {
        title: 'EIP-7702: Set Code for EOAs',
        publisher: 'Ethereum Improvement Proposals',
        url: 'https://eips.ethereum.org/EIPS/eip-7702',
      },
      {
        title: 'Pectra EIP-7702 Guidelines',
        publisher: 'ethereum.org',
        url: 'https://ethereum.org/roadmap/pectra/7702/',
      },
      {
        title: 'Pectra Mainnet Announcement',
        publisher: 'Ethereum Foundation',
        url: 'https://blog.ethereum.org/2025/04/23/pectra-mainnet',
      },
    ],
  },
  {
    slug: 'clear-signing-erc-7730-guide',
    title: 'Clear Signing and ERC-7730: What Users and Dapp Teams Need to Know',
    description:
      'Learn how ERC-7730 turns opaque Ethereum signing data into human-readable intent, what users can verify, and how dapp teams can publish safer transaction descriptors.',
    category: 'Wallet Security',
    readTime: '13 min read',
    publishedAt: '2026-09-27',
    modifiedAt: '2026-09-27',
    author: 'Digibastion Security Team',
    tags: ['ERC-7730', 'clear signing', 'blind signing', 'transaction security', 'dapp security'],
    difficulty: 'intermediate',
    status: 'published',
    summary:
      'Clear signing aims to show the actual human meaning of transaction fields before approval. ERC-7730 provides an open JSON descriptor format that wallets can use to format contract calls and typed messages. It is a major usability and verification improvement, but users still need to validate the wallet display and teams must keep descriptors accurate, deployment-specific, reviewed, and current.',
    keyTakeaways: [
      'Clear signing should expose the action, assets, amounts, counterparties, limits, deadlines, and permissions that determine transaction intent.',
      'ERC-7730 descriptors add presentation context alongside the signed data; they do not change contract behavior or make a transaction safe by themselves.',
      'Dapp teams should create deployment-bound descriptors, validate them, submit them to the registry, and update them with every relevant contract change.',
    ],
    sources: [
      {
        title: 'Clear Signing: Making Transaction Approvals Safer on Ethereum',
        publisher: 'Ethereum Foundation',
        url: 'https://blog.ethereum.org/2026/05/12/clear-signing-announcement',
      },
      {
        title: 'ERC-7730: Structured Data Clear Signing Format',
        publisher: 'Ethereum Improvement Proposals',
        url: 'https://eips.ethereum.org/EIPS/eip-7730',
      },
      {
        title: 'Add Clear Signing to Your Protocol with ERC-7730',
        publisher: 'ethereum.org',
        url: 'https://ethereum.org/developers/tutorials/clear-signing',
      },
    ],
  },
  {
    slug: 'dns-domain-security-web3-dapps',
    title: 'DNS and Domain Security for Web3 Frontends and Dapps',
    description:
      'Protect a Web3 frontend from registrar takeover, DNS tampering, rogue certificates, and unsafe changes with a practical prevention, monitoring, and response plan.',
    category: 'Application Security',
    readTime: '14 min read',
    publishedAt: '2026-09-27',
    modifiedAt: '2026-09-27',
    author: 'Digibastion Security Team',
    tags: ['DNS security', 'domain hijacking', 'Web3 frontend', 'DNSSEC', 'dapp security'],
    difficulty: 'intermediate',
    status: 'published',
    summary:
      'A smart contract can be correct while its official domain sends users to a hostile frontend. Web3 teams should protect registrar and DNS access with strong authentication and change controls, verify records continuously, monitor Certificate Transparency logs, use appropriate domain locks and DNSSEC, and rehearse a domain-compromise response that warns users before investigating attribution.',
    keyTakeaways: [
      'Registrar, DNS provider, certificate, hosting, and release access all belong inside the dapp transaction-approval trust boundary.',
      'Use phishing-resistant MFA where supported, least privilege, domain locks, record monitoring, Certificate Transparency alerts, and carefully operated DNSSEC.',
      'If records or ownership may be compromised, preserve evidence, freeze changes, restore from a verified baseline, and warn users through independent channels.',
    ],
    sources: [
      {
        title: 'Mitigate DNS Infrastructure Tampering',
        publisher: 'Cybersecurity and Infrastructure Security Agency',
        url: 'https://www.cisa.gov/sites/default/files/publications/CISAInsights-Cyber-MitigateDNSInfrastructureTampering_S508C.pdf',
      },
      {
        title: 'A Registrant’s Guide to Protecting Domain Name Registration Accounts',
        publisher: 'ICANN Security and Stability Advisory Committee',
        url: 'https://www.icann.org/en/groups/ssac/documents/sac-044-en.pdf',
      },
      {
        title: 'DNSSEC',
        publisher: 'ICANN',
        url: 'https://www.icann.org/resources/pages/dnssec-2012-02-25-en',
      },
    ],
  },
];
