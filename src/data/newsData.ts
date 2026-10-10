import { TechnologyCategory } from '@/types/news';

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

// Kept as an alias for EmailPreview and ManageSubscription. New code should
// import NEWS_CATEGORY_CONFIG or getCategoryConfig from the taxonomy module.
export { NEWS_CATEGORY_CONFIG as newsCategoryConfig } from '@/lib/threatIntel/taxonomy';
