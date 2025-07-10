import { NewsArticle, SecurityAlert, TechnologyCategory } from '@/types/news';

export const mockNewsArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Critical Vulnerability Found in Popular Wallet Extension',
    content: 'A critical security vulnerability has been discovered in a widely-used browser wallet extension that could allow attackers to drain user funds. The vulnerability affects versions 1.0 to 2.3 and has been assigned CVE-2024-0001.',
    summary: 'Critical wallet extension vulnerability could lead to fund drainage. Update immediately.',
    category: 'web3-security',
    tags: ['wallet', 'browser-extension', 'critical', 'cve'],
    severity: 'critical',
    sourceUrl: 'https://example.com/security-advisory',
    publishedAt: new Date('2024-01-15'),
    affectedTechnologies: ['MetaMask', 'Phantom', 'Wallet Extension'],
    author: 'Security Research Team'
  },
  {
    id: '2',
    title: 'Supply Chain Attack Targets Popular DeFi Protocol Dependencies',
    content: 'Multiple npm packages used by DeFi protocols have been compromised in a sophisticated supply chain attack. Developers are advised to audit their dependencies immediately.',
    summary: 'Supply chain attack compromises npm packages used in DeFi protocols.',
    category: 'supply-chain',
    tags: ['npm', 'defi', 'supply-chain', 'dependencies'],
    severity: 'high',
    publishedAt: new Date('2024-01-14'),
    affectedTechnologies: ['npm', 'Node.js', 'DeFi Protocols'],
    author: 'Blockchain Security Alliance'
  },
  {
    id: '3',
    title: 'New OPSEC Best Practices for Web3 Developers',
    content: 'Updated operational security guidelines for Web3 developers including secure key management, development environment isolation, and secure communication practices.',
    summary: 'New OPSEC guidelines for Web3 developers covering key management and secure practices.',
    category: 'operational-security',
    tags: ['opsec', 'developers', 'best-practices', 'keys'],
    severity: 'medium',
    publishedAt: new Date('2024-01-13'),
    affectedTechnologies: ['Development Tools', 'Git', 'IDE'],
    author: 'Web3 Security Foundation'
  }
];

export const mockSecurityAlerts: SecurityAlert[] = [
  {
    id: 'alert-1',
    title: 'Immediate Action Required: Wallet Extension Update',
    description: 'Update your wallet extension immediately to prevent potential fund loss.',
    affectedTechnologies: ['MetaMask', 'Phantom'],
    severity: 'critical',
    alertType: 'vulnerability',
    createdAt: new Date('2024-01-15'),
    actionRequired: true,
    cveId: 'CVE-2024-0001'
  },
  {
    id: 'alert-2',
    title: 'DeFi Protocol Dependency Audit Recommended',
    description: 'Audit your DeFi protocol dependencies for potential supply chain compromises.',
    affectedTechnologies: ['npm', 'Node.js'],
    severity: 'high',
    alertType: 'tool-update',
    createdAt: new Date('2024-01-14'),
    actionRequired: true
  }
];

export const technologyCategories: TechnologyCategory[] = [
  {
    id: 'wallets',
    name: 'Wallets & Key Management',
    description: 'Cryptocurrency wallets and key management solutions',
    technologies: [
      { id: 'metamask', name: 'MetaMask', category: 'wallets', isPopular: true },
      { id: 'phantom', name: 'Phantom', category: 'wallets', isPopular: true },
      { id: 'ledger', name: 'Ledger Hardware Wallet', category: 'wallets', isPopular: true },
      { id: 'trezor', name: 'Trezor', category: 'wallets' },
      { id: 'coinbase-wallet', name: 'Coinbase Wallet', category: 'wallets', isPopular: true },
      { id: 'rainbow', name: 'Rainbow Wallet', category: 'wallets' },
      { id: 'trust-wallet', name: 'Trust Wallet', category: 'wallets' }
    ]
  },
  {
    id: 'defi-protocols',
    name: 'DeFi Protocols',
    description: 'Decentralized Finance protocols and platforms',
    technologies: [
      { id: 'uniswap', name: 'Uniswap', category: 'defi-protocols', isPopular: true },
      { id: 'aave', name: 'Aave', category: 'defi-protocols', isPopular: true },
      { id: 'compound', name: 'Compound', category: 'defi-protocols', isPopular: true },
      { id: 'makerdao', name: 'MakerDAO', category: 'defi-protocols' },
      { id: 'curve', name: 'Curve Finance', category: 'defi-protocols' },
      { id: 'yearn', name: 'Yearn Finance', category: 'defi-protocols' }
    ]
  },
  {
    id: 'development-tools',
    name: 'Development Tools',
    description: 'Development environments and tools',
    technologies: [
      { id: 'hardhat', name: 'Hardhat', category: 'development-tools', isPopular: true },
      { id: 'truffle', name: 'Truffle', category: 'development-tools' },
      { id: 'foundry', name: 'Foundry', category: 'development-tools', isPopular: true },
      { id: 'remix', name: 'Remix IDE', category: 'development-tools', isPopular: true },
      { id: 'vscode', name: 'Visual Studio Code', category: 'development-tools', isPopular: true },
      { id: 'git', name: 'Git', category: 'development-tools', isPopular: true }
    ]
  },
  {
    id: 'blockchains',
    name: 'Blockchains & Networks',
    description: 'Blockchain networks and layer 2 solutions',
    technologies: [
      { id: 'ethereum', name: 'Ethereum', category: 'blockchains', isPopular: true },
      { id: 'bitcoin', name: 'Bitcoin', category: 'blockchains', isPopular: true },
      { id: 'polygon', name: 'Polygon', category: 'blockchains', isPopular: true },
      { id: 'arbitrum', name: 'Arbitrum', category: 'blockchains', isPopular: true },
      { id: 'optimism', name: 'Optimism', category: 'blockchains' },
      { id: 'solana', name: 'Solana', category: 'blockchains', isPopular: true },
      { id: 'avalanche', name: 'Avalanche', category: 'blockchains' }
    ]
  },
  {
    id: 'third-party-services',
    name: 'Third Party Services',
    description: 'External services and APIs',
    technologies: [
      { id: 'infura', name: 'Infura', category: 'third-party-services', isPopular: true },
      { id: 'alchemy', name: 'Alchemy', category: 'third-party-services', isPopular: true },
      { id: 'opensea', name: 'OpenSea', category: 'third-party-services', isPopular: true },
      { id: 'coingecko', name: 'CoinGecko API', category: 'third-party-services' },
      { id: 'moralis', name: 'Moralis', category: 'third-party-services' },
      { id: 'the-graph', name: 'The Graph', category: 'third-party-services' }
    ]
  }
];

export const newsCategoryConfig = {
  'operational-security': {
    name: 'Operational Security',
    description: 'OPSEC best practices and privacy protection',
    color: 'text-red-400'
  },
  'supply-chain': {
    name: 'Supply Chain Security',
    description: 'Dependency and package security',
    color: 'text-orange-400'
  },
  'personal-protection': {
    name: 'Personal Protection',
    description: 'Individual security measures',
    color: 'text-blue-400'
  },
  'web3-security': {
    name: 'Web3 Security',
    description: 'Blockchain and crypto security',
    color: 'text-purple-400'
  },
  'defi-exploits': {
    name: 'DeFi Exploits',
    description: 'DeFi protocol vulnerabilities',
    color: 'text-pink-400'
  },
  'vulnerability-disclosure': {
    name: 'Vulnerability Disclosure',
    description: 'CVE announcements and patches',
    color: 'text-yellow-400'
  },
  'tools-reviews': {
    name: 'Tools & Reviews',
    description: 'Security tool analysis',
    color: 'text-green-400'
  }
};