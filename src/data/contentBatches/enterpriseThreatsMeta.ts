import type { ArticleMeta } from '@/data/articlesData';

export const enterpriseThreatsMeta: ArticleMeta[] = [
  {
    slug: 'dprk-remote-it-worker-risk-crypto-web3',
    title: 'DPRK Remote IT Worker Risk: A Defense Guide for Crypto and Web3 Teams',
    description:
      'How crypto and Web3 teams can detect, prevent, and respond to fraudulent DPRK remote IT workers without turning hiring into guesswork.',
    category: 'Enterprise Security',
    readTime: '13 min read',
    publishedAt: '2026-09-27',
    modifiedAt: '2026-09-27',
    author: 'Digibastion Security Team',
    tags: ['DPRK IT workers', 'remote hiring', 'insider risk', 'Web3 security', 'identity verification'],
    difficulty: 'advanced',
    status: 'published',
    summary:
      'Treat fraudulent remote-worker activity as a combined identity, endpoint, access, and insider-risk problem. Verify identity throughout employment, constrain access by role, watch for remote-access and exfiltration signals, and prepare a lawful containment process before suspicion arises.',
    keyTakeaways: [
      'Identity verification is a continuing control, not a one-time video interview or document check.',
      'Company-managed endpoints, least privilege, and monitoring reduce the damage any remote worker can cause.',
      'If indicators emerge, preserve evidence, contain access through the incident-response process, and report promptly.',
    ],
    sources: [
      {
        title: 'North Korean IT Workers Conducting Data Extortion',
        publisher: 'Federal Bureau of Investigation',
        url: 'https://www.fbi.gov/investigate/cyber/alerts/2025/north-korean-it-workers-conducting-data-extortion',
      },
      {
        title: 'Justice Department Announces Coordinated, Nationwide Actions to Combat North Korean Remote Information Technology Workers’ Illicit Revenue Generation Schemes',
        publisher: 'U.S. Department of Justice',
        url: 'https://www.justice.gov/opa/pr/justice-department-announces-coordinated-nationwide-actions-combat-north-korean-remote',
      },
      {
        title: 'Department Files Civil Forfeiture Complaint Against Over $7.74M Laundered on Behalf of the North Korean Government',
        publisher: 'U.S. Department of Justice',
        url: 'https://www.justice.gov/opa/pr/department-files-civil-forfeiture-complaint-against-over-774m-laundered-behalf-north-korean',
      },
    ],
  },
  {
    slug: 'browser-wallet-infostealer-malware-response',
    title: 'Browser Wallet Infostealer Defense and Infection Response',
    description:
      'Protect browser wallets from credential-stealing malware, recognize an exposure, and respond safely from a clean device when compromise is suspected.',
    category: 'Wallet Security',
    readTime: '12 min read',
    publishedAt: '2026-09-27',
    modifiedAt: '2026-09-27',
    author: 'Digibastion Security Team',
    tags: ['infostealer malware', 'browser wallet', 'wallet incident response', 'LummaC2', 'seed phrase security'],
    difficulty: 'intermediate',
    status: 'published',
    summary:
      'An infostealer can expose browser data, extensions, credentials, session material, and wallet-related information. Prevention depends on reducing what the everyday browser and device can reach; response begins on a known-clean device and treats any digitally exposed recovery phrase or private key as compromised.',
    keyTakeaways: [
      'Keep high-value keys off the everyday browsing device and never store recovery phrases in screenshots or cloud-synced files.',
      'A password change alone is insufficient when sessions, browser data, extensions, or wallet secrets may be exposed.',
      'Contain the host, use a clean device for account and wallet recovery, and preserve evidence for investigation.',
    ],
    sources: [
      {
        title: 'Threat Actors Deploy LummaC2 Malware to Exfiltrate Sensitive Data from Organizations (AA25-141B)',
        publisher: 'Cybersecurity and Infrastructure Security Agency and Federal Bureau of Investigation',
        url: 'https://www.cisa.gov/sites/default/files/2025-05/aa25-141b-threat-actors-deploy-lummac2-malware-to-exfiltrate-sensitive-data-from-organizations.pdf',
      },
      {
        title: 'Ethereum Security and Scam Prevention',
        publisher: 'ethereum.org',
        url: 'https://ethereum.org/security/',
      },
    ],
  },
  {
    slug: 'exchange-api-key-security-trading-bots',
    title: 'Exchange API Key Security for Trading Bots and Automation',
    description:
      'A practical design for securing exchange API keys with least privilege, IP restrictions, secret isolation, monitoring, rotation, and incident response.',
    category: 'Enterprise Security',
    readTime: '12 min read',
    publishedAt: '2026-09-27',
    modifiedAt: '2026-09-27',
    author: 'Digibastion Security Team',
    tags: ['API key security', 'trading bots', 'exchange security', 'secret management', 'crypto automation'],
    difficulty: 'advanced',
    status: 'published',
    summary:
      'Treat every trading-bot credential as a bearer secret with a deliberately narrow blast radius. Give each workload its own key, remove withdrawal rights unless truly required, restrict origin where supported, keep secrets out of code, monitor use, and rehearse revocation.',
    keyTakeaways: [
      'Use one narrowly scoped key per bot, environment, and account boundary; avoid shared all-powerful credentials.',
      'Apply exchange-supported permission and IP restrictions, and keep withdrawal capability separate from trading automation.',
      'Inventory, monitor, rotate, and revoke keys through a tested process that does not depend on the affected bot host.',
    ],
    sources: [
      {
        title: 'Best Practices for Managing API Keys',
        publisher: 'Google Cloud',
        url: 'https://docs.cloud.google.com/docs/authentication/api-keys-best-practices',
      },
      {
        title: 'How to Create an API Key',
        publisher: 'Coinbase Help',
        url: 'https://help.coinbase.com/en/exchange/managing-my-account/how-to-create-an-api-key',
      },
      {
        title: 'OKX API Guide: API Key Permissions and Security',
        publisher: 'OKX',
        url: 'https://www.okx.com/docs-v5/en/',
      },
    ],
  },
];
