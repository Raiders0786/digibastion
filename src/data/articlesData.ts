// Article metadata for SEO - content is rendered separately
export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  featured?: boolean;
  publishedAt: string;
  modifiedAt: string;
  author: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// 50+ SEO-optimized articles targeting high-volume keywords
export const articlesMeta: ArticleMeta[] = [
  // Featured/Comprehensive Guides
  {
    slug: "privacy-security-web3-opsec",
    title: "Web3 OpSec Guide: Complete Privacy & Security Playbook for Crypto Users",
    description: "Master operational security (OpSec) for Web3. Learn to protect your identity, secure wallets, avoid doxxing, and maintain privacy in blockchain transactions. Essential reading for DeFi users and NFT collectors.",
    category: "OpSec",
    readTime: "18 min read",
    featured: true,
    publishedAt: "2024-06-15",
    modifiedAt: "2025-01-15",
    author: "Digibastion Security Team",
    tags: ["opsec", "privacy", "web3", "anonymity", "blockchain privacy"],
    difficulty: "intermediate"
  },
  
  // Wallet Security (High Search Volume: 90k-300k)
  {
    slug: "best-hardware-wallet-2025",
    title: "Best Hardware Wallets 2025: Ledger vs Trezor vs GridPlus Comparison",
    description: "Comprehensive comparison of the best hardware wallets for cryptocurrency in 2025. We analyze Ledger Nano X, Trezor Model T, GridPlus Lattice, and Keystone Pro for security, features, and supported coins.",
    category: "Wallet Security",
    readTime: "15 min read",
    featured: true,
    publishedAt: "2025-01-01",
    modifiedAt: "2025-01-18",
    author: "Digibastion Security Team",
    tags: ["hardware wallet", "ledger", "trezor", "cold storage", "best crypto wallet"],
    difficulty: "beginner"
  },
  {
    slug: "seed-phrase-security-guide",
    title: "Seed Phrase Security: How to Store & Protect Your Recovery Phrase",
    description: "Learn the best practices for securing your 12 or 24-word seed phrase. Covers metal backups, multi-location storage, Shamir secret sharing, and common mistakes that lead to loss of funds.",
    category: "Wallet Security",
    readTime: "12 min read",
    publishedAt: "2024-09-20",
    modifiedAt: "2025-01-10",
    author: "Digibastion Security Team",
    tags: ["seed phrase", "recovery phrase", "backup", "private key security"],
    difficulty: "beginner"
  },
  {
    slug: "hot-wallet-vs-cold-wallet",
    title: "Hot Wallet vs Cold Wallet: Which Is Safer for Your Crypto?",
    description: "Understand the key differences between hot wallets (MetaMask, Phantom) and cold wallets (Ledger, Trezor). Learn when to use each type and how to set up a secure multi-wallet strategy.",
    category: "Wallet Security",
    readTime: "10 min read",
    publishedAt: "2024-08-15",
    modifiedAt: "2025-01-05",
    author: "Digibastion Security Team",
    tags: ["hot wallet", "cold wallet", "metamask", "ledger", "wallet security"],
    difficulty: "beginner"
  },
  {
    slug: "metamask-security-settings",
    title: "MetaMask Security Settings: Complete Hardening Guide",
    description: "Optimize your MetaMask wallet security with advanced settings. Learn to enable hardware wallet connection, manage connected sites, revoke permissions, and protect against common attacks.",
    category: "Wallet Security",
    readTime: "14 min read",
    publishedAt: "2024-10-05",
    modifiedAt: "2025-01-12",
    author: "Digibastion Security Team",
    tags: ["metamask", "wallet security", "browser extension", "ethereum wallet"],
    difficulty: "intermediate"
  },
  {
    slug: "revoke-token-approvals-guide",
    title: "How to Revoke Token Approvals: Protect Yourself from Wallet Drainers",
    description: "Step-by-step guide to finding and revoking dangerous token approvals. Learn to use Revoke.cash, Etherscan, and other tools to remove unlimited allowances that hackers exploit.",
    category: "Wallet Security",
    readTime: "8 min read",
    publishedAt: "2024-11-10",
    modifiedAt: "2025-01-15",
    author: "Digibastion Security Team",
    tags: ["token approval", "revoke", "wallet drainer", "allowance", "erc20"],
    difficulty: "beginner"
  },
  {
    slug: "multi-signature-wallet-setup",
    title: "Multi-Signature Wallet Guide: Setup Safe, Gnosis & Multisig Security",
    description: "Learn how to set up and use multi-signature wallets like Safe (formerly Gnosis Safe). Covers M-of-N setups, key management, and best practices for DAOs and high-value holdings.",
    category: "Wallet Security",
    readTime: "16 min read",
    publishedAt: "2024-07-20",
    modifiedAt: "2025-01-08",
    author: "Digibastion Security Team",
    tags: ["multisig", "gnosis safe", "safe wallet", "multi-signature"],
    difficulty: "advanced"
  },

  // Phishing & Scams (High Search Volume: 60k-135k)
  {
    slug: "crypto-phishing-attacks-prevention",
    title: "Crypto Phishing Attacks: How to Identify & Prevent Wallet Drains",
    description: "Comprehensive guide to recognizing cryptocurrency phishing attacks. Learn about fake airdrops, malicious signatures, Discord scams, and Twitter impersonation tactics used to steal crypto.",
    category: "Phishing",
    readTime: "14 min read",
    featured: true,
    publishedAt: "2024-12-01",
    modifiedAt: "2025-01-17",
    author: "Digibastion Security Team",
    tags: ["phishing", "wallet drainer", "scam", "social engineering", "crypto scam"],
    difficulty: "beginner"
  },
  {
    slug: "ice-phishing-explained",
    title: "Ice Phishing in Crypto: The Silent Wallet Drainer You Need to Know",
    description: "Understand ice phishing attacks where hackers trick you into signing malicious approvals. Learn how setApprovalForAll and permit signatures can drain your wallet without sending transactions.",
    category: "Phishing",
    readTime: "11 min read",
    publishedAt: "2024-10-25",
    modifiedAt: "2025-01-14",
    author: "Digibastion Security Team",
    tags: ["ice phishing", "permit", "approval", "signature phishing", "wallet attack"],
    difficulty: "intermediate"
  },
  {
    slug: "fake-airdrop-scams",
    title: "Fake Airdrop Scams: How to Spot & Avoid Crypto Giveaway Frauds",
    description: "Learn to identify fake cryptocurrency airdrops and giveaway scams. Covers red flags, verification methods, and safe practices for claiming legitimate token distributions.",
    category: "Phishing",
    readTime: "9 min read",
    publishedAt: "2024-09-15",
    modifiedAt: "2025-01-11",
    author: "Digibastion Security Team",
    tags: ["airdrop scam", "fake airdrop", "giveaway scam", "token scam"],
    difficulty: "beginner"
  },
  {
    slug: "discord-crypto-scams",
    title: "Discord Crypto Scams: Protect Yourself from Server Hacks & DM Attacks",
    description: "Complete guide to Discord security for crypto users. Learn about compromised servers, fake mod DMs, malicious bots, and phishing links targeting NFT and DeFi communities.",
    category: "Phishing",
    readTime: "12 min read",
    publishedAt: "2024-08-20",
    modifiedAt: "2025-01-09",
    author: "Digibastion Security Team",
    tags: ["discord", "crypto scam", "nft scam", "social engineering", "discord security"],
    difficulty: "beginner"
  },
  {
    slug: "twitter-crypto-impersonation",
    title: "Twitter/X Crypto Impersonation Scams: Fake Influencers & Blue Check Fraud",
    description: "How scammers impersonate crypto influencers, projects, and even Elon Musk on Twitter/X. Learn verification techniques and how to report fake accounts promoting scam links.",
    category: "Phishing",
    readTime: "10 min read",
    publishedAt: "2024-11-05",
    modifiedAt: "2025-01-16",
    author: "Digibastion Security Team",
    tags: ["twitter scam", "impersonation", "fake account", "crypto fraud", "x scam"],
    difficulty: "beginner"
  },
  {
    slug: "honeypot-tokens-detection",
    title: "Honeypot Tokens: How to Detect Scam Coins You Can't Sell",
    description: "Learn to identify honeypot tokens that allow buying but prevent selling. Covers contract analysis tools, red flags in tokenomics, and how to verify token legitimacy before trading.",
    category: "Phishing",
    readTime: "13 min read",
    publishedAt: "2024-10-10",
    modifiedAt: "2025-01-13",
    author: "Digibastion Security Team",
    tags: ["honeypot", "scam token", "rug pull", "token scanner", "dex trading"],
    difficulty: "intermediate"
  },

  // Rug Pulls & Exit Scams
  {
    slug: "rug-pull-warning-signs",
    title: "Rug Pull Warning Signs: How to Identify Crypto Scam Projects Early",
    description: "Learn the red flags that indicate a crypto project might rug pull. Covers anonymous teams, locked liquidity checks, smart contract analysis, and social proof verification.",
    category: "Scams",
    readTime: "14 min read",
    publishedAt: "2024-07-15",
    modifiedAt: "2025-01-10",
    author: "Digibastion Security Team",
    tags: ["rug pull", "crypto scam", "red flags", "dyor", "scam detection"],
    difficulty: "beginner"
  },
  {
    slug: "soft-rug-vs-hard-rug",
    title: "Soft Rug vs Hard Rug: Understanding Different Types of Crypto Exit Scams",
    description: "Understand the difference between soft rugs (slow dumps, abandoned projects) and hard rugs (liquidity pulls, contract exploits). Learn protection strategies for each type.",
    category: "Scams",
    readTime: "11 min read",
    publishedAt: "2024-08-10",
    modifiedAt: "2025-01-07",
    author: "Digibastion Security Team",
    tags: ["soft rug", "hard rug", "exit scam", "liquidity pull", "crypto fraud"],
    difficulty: "intermediate"
  },
  {
    slug: "locked-liquidity-explained",
    title: "Locked Liquidity Explained: Does It Really Prevent Rug Pulls?",
    description: "Deep dive into liquidity locks, their limitations, and bypass methods. Learn why locked liquidity alone doesn't guarantee safety and what additional checks to perform.",
    category: "Scams",
    readTime: "10 min read",
    publishedAt: "2024-09-25",
    modifiedAt: "2025-01-12",
    author: "Digibastion Security Team",
    tags: ["liquidity lock", "unicrypt", "team finance", "rug proof", "dex safety"],
    difficulty: "intermediate"
  },

  // DeFi Security (High Search Volume: 33k-74k)
  {
    slug: "defi-hacks-2024-2025-analysis",
    title: "DeFi Hacks 2024-2025: Major Exploits, Losses & Security Lessons",
    description: "Analysis of the biggest DeFi hacks from 2024 and early 2025. Covers bridge exploits, flash loan attacks, oracle manipulations, and governance attacks with total losses exceeding $2B.",
    category: "DeFi",
    readTime: "20 min read",
    featured: true,
    publishedAt: "2025-01-05",
    modifiedAt: "2025-01-19",
    author: "Digibastion Security Team",
    tags: ["defi hack", "exploit", "crypto hack", "security breach", "2024 hacks"],
    difficulty: "intermediate"
  },
  {
    slug: "flash-loan-attacks-explained",
    title: "Flash Loan Attacks Explained: How Hackers Exploit DeFi Protocols",
    description: "Technical breakdown of flash loan attacks in DeFi. Learn how attackers use uncollateralized loans to manipulate prices, drain pools, and exploit vulnerable smart contracts.",
    category: "DeFi",
    readTime: "16 min read",
    publishedAt: "2024-06-20",
    modifiedAt: "2025-01-08",
    author: "Digibastion Security Team",
    tags: ["flash loan", "defi attack", "price manipulation", "arbitrage exploit"],
    difficulty: "advanced"
  },
  {
    slug: "oracle-manipulation-attacks",
    title: "Oracle Manipulation in DeFi: Price Feed Attacks & Prevention",
    description: "Understand how attackers manipulate price oracles to exploit DeFi protocols. Covers TWAP attacks, Chainlink best practices, and how to identify oracle-dependent vulnerabilities.",
    category: "DeFi",
    readTime: "15 min read",
    publishedAt: "2024-07-25",
    modifiedAt: "2025-01-11",
    author: "Digibastion Security Team",
    tags: ["oracle", "price feed", "chainlink", "twap", "defi exploit"],
    difficulty: "advanced"
  },
  {
    slug: "bridge-security-risks",
    title: "Cross-Chain Bridge Security: Why Bridges Are DeFi's Weakest Link",
    description: "Analysis of cross-chain bridge vulnerabilities that have led to billions in losses. Covers Ronin, Wormhole, Nomad hacks and how to safely use bridges.",
    category: "DeFi",
    readTime: "14 min read",
    publishedAt: "2024-08-05",
    modifiedAt: "2025-01-14",
    author: "Digibastion Security Team",
    tags: ["bridge hack", "cross-chain", "ronin", "wormhole", "multichain"],
    difficulty: "intermediate"
  },
  {
    slug: "sandwich-attack-prevention",
    title: "Sandwich Attacks: How MEV Bots Steal Your DEX Trades & Prevention",
    description: "Learn how sandwich attacks work in DeFi and how MEV bots front-run your transactions. Covers slippage protection, private RPCs, and MEV-resistant DEXs.",
    category: "DeFi",
    readTime: "12 min read",
    publishedAt: "2024-09-10",
    modifiedAt: "2025-01-09",
    author: "Digibastion Security Team",
    tags: ["sandwich attack", "mev", "front-running", "slippage", "dex trading"],
    difficulty: "intermediate"
  },
  {
    slug: "impermanent-loss-risks",
    title: "Impermanent Loss Explained: Hidden Risks of Liquidity Providing",
    description: "Complete guide to impermanent loss in DeFi liquidity pools. Understand when LP yields are profitable, calculate potential losses, and learn mitigation strategies.",
    category: "DeFi",
    readTime: "13 min read",
    publishedAt: "2024-10-15",
    modifiedAt: "2025-01-06",
    author: "Digibastion Security Team",
    tags: ["impermanent loss", "liquidity pool", "amm", "yield farming", "lp tokens"],
    difficulty: "intermediate"
  },
  {
    slug: "defi-smart-contract-audit-checklist",
    title: "DeFi Smart Contract Audit Checklist: What to Verify Before Investing",
    description: "Essential checklist for evaluating DeFi protocol security. Learn to check audits, verify contracts, assess team credibility, and analyze tokenomics before depositing funds.",
    category: "DeFi",
    readTime: "11 min read",
    publishedAt: "2024-11-20",
    modifiedAt: "2025-01-15",
    author: "Digibastion Security Team",
    tags: ["smart contract audit", "defi due diligence", "security audit", "certik", "trail of bits"],
    difficulty: "intermediate"
  },

  // Smart Contract Security (For Developers: 45k-90k)
  {
    slug: "reentrancy-attack-prevention",
    title: "Reentrancy Attack: The #1 Smart Contract Vulnerability Explained",
    description: "Deep dive into reentrancy attacks, the most famous smart contract vulnerability. Covers the DAO hack, checks-effects-interactions pattern, and ReentrancyGuard implementation.",
    category: "Smart Contracts",
    readTime: "17 min read",
    publishedAt: "2024-05-15",
    modifiedAt: "2025-01-10",
    author: "Digibastion Security Team",
    tags: ["reentrancy", "smart contract vulnerability", "solidity security", "dao hack"],
    difficulty: "advanced"
  },
  {
    slug: "solidity-security-best-practices",
    title: "Solidity Security Best Practices 2025: Developer's Complete Guide",
    description: "Comprehensive Solidity security guide covering access control, input validation, gas optimization, and common vulnerability patterns. Essential for Ethereum smart contract developers.",
    category: "Smart Contracts",
    readTime: "22 min read",
    featured: true,
    publishedAt: "2025-01-02",
    modifiedAt: "2025-01-18",
    author: "Digibastion Security Team",
    tags: ["solidity", "smart contract security", "ethereum development", "best practices"],
    difficulty: "advanced"
  },
  {
    slug: "erc20-token-vulnerabilities",
    title: "ERC-20 Token Vulnerabilities: Security Flaws in Custom Token Contracts",
    description: "Analysis of common ERC-20 implementation vulnerabilities including integer overflow, approval race conditions, and missing return value checks. Includes secure implementation patterns.",
    category: "Smart Contracts",
    readTime: "14 min read",
    publishedAt: "2024-06-25",
    modifiedAt: "2025-01-07",
    author: "Digibastion Security Team",
    tags: ["erc20", "token vulnerability", "integer overflow", "solidity bug"],
    difficulty: "advanced"
  },
  {
    slug: "smart-contract-fuzzing-guide",
    title: "Smart Contract Fuzzing: Automated Security Testing with Echidna & Foundry",
    description: "Guide to fuzzing smart contracts for security vulnerabilities. Covers Echidna, Foundry fuzz testing, property-based testing, and integrating fuzzing into your development workflow.",
    category: "Smart Contracts",
    readTime: "18 min read",
    publishedAt: "2024-08-30",
    modifiedAt: "2025-01-13",
    author: "Digibastion Security Team",
    tags: ["fuzzing", "echidna", "foundry", "security testing", "automated testing"],
    difficulty: "advanced"
  },
  {
    slug: "smart-contract-audit-process",
    title: "Smart Contract Audit: How Audits Work & How to Prepare Your Code",
    description: "Inside look at the smart contract audit process. Learn how top security firms review code, what auditors look for, and how to prepare your protocol for a professional audit.",
    category: "Smart Contracts",
    readTime: "15 min read",
    publishedAt: "2024-09-05",
    modifiedAt: "2025-01-11",
    author: "Digibastion Security Team",
    tags: ["security audit", "code review", "audit preparation", "defi security"],
    difficulty: "advanced"
  },
  {
    slug: "formal-verification-smart-contracts",
    title: "Formal Verification for Smart Contracts: Mathematical Proof of Security",
    description: "Introduction to formal verification techniques for blockchain. Covers symbolic execution, SMT solvers, and tools like Certora and Halmos for proving smart contract correctness.",
    category: "Smart Contracts",
    readTime: "16 min read",
    publishedAt: "2024-10-20",
    modifiedAt: "2025-01-14",
    author: "Digibastion Security Team",
    tags: ["formal verification", "certora", "symbolic execution", "mathematical proof"],
    difficulty: "advanced"
  },

  // Authentication & 2FA
  {
    slug: "2fa-crypto-security-guide",
    title: "2FA for Crypto: Best Authenticator Apps & Security Key Setup",
    description: "Complete guide to two-factor authentication for cryptocurrency accounts. Compare Google Authenticator, Authy, and YubiKey. Learn why SMS 2FA is dangerous and how to set up TOTP correctly.",
    category: "Authentication",
    readTime: "11 min read",
    publishedAt: "2024-07-10",
    modifiedAt: "2025-01-08",
    author: "Digibastion Security Team",
    tags: ["2fa", "two-factor authentication", "yubikey", "authenticator app", "totp"],
    difficulty: "beginner"
  },
  {
    slug: "sim-swap-attack-prevention",
    title: "SIM Swap Attacks: How Hackers Steal Crypto Through Phone Numbers",
    description: "Understand SIM swap attacks that bypass SMS 2FA. Learn how attackers social engineer telecom providers and steps to protect yourself from phone number hijacking.",
    category: "Authentication",
    readTime: "13 min read",
    publishedAt: "2024-08-25",
    modifiedAt: "2025-01-12",
    author: "Digibastion Security Team",
    tags: ["sim swap", "sms 2fa", "phone hacking", "identity theft", "telecom fraud"],
    difficulty: "intermediate"
  },
  {
    slug: "password-manager-crypto-security",
    title: "Password Managers for Crypto: Secure Setup for Exchange & Wallet Access",
    description: "How to properly use password managers for cryptocurrency security. Covers 1Password, Bitwarden, and KeePass with specific configurations for crypto accounts.",
    category: "Authentication",
    readTime: "10 min read",
    publishedAt: "2024-11-15",
    modifiedAt: "2025-01-09",
    author: "Digibastion Security Team",
    tags: ["password manager", "1password", "bitwarden", "exchange security", "account security"],
    difficulty: "beginner"
  },

  // Supply Chain & Infrastructure (Lower Volume: 12k-27k)
  {
    slug: "npm-supply-chain-attacks-crypto",
    title: "NPM Supply Chain Attacks: How Malicious Packages Target Crypto Projects",
    description: "Analysis of supply chain attacks targeting the crypto ecosystem through compromised NPM packages. Covers event-stream, ua-parser-js incidents and developer protection strategies.",
    category: "Supply Chain",
    readTime: "14 min read",
    publishedAt: "2024-06-30",
    modifiedAt: "2025-01-10",
    author: "Digibastion Security Team",
    tags: ["supply chain attack", "npm", "dependency", "malicious package", "developer security"],
    difficulty: "advanced"
  },
  {
    slug: "rpc-endpoint-security",
    title: "RPC Endpoint Security: Risks of Public Providers & Safe Alternatives",
    description: "Understand security and privacy risks of public RPC endpoints. Covers IP tracking, transaction censorship, and how to run your own node or use privacy-preserving RPC services.",
    category: "Infrastructure",
    readTime: "12 min read",
    publishedAt: "2024-09-30",
    modifiedAt: "2025-01-15",
    author: "Digibastion Security Team",
    tags: ["rpc", "ethereum node", "infura", "alchemy", "blockchain infrastructure"],
    difficulty: "intermediate"
  },
  {
    slug: "frontend-attack-vectors",
    title: "DeFi Frontend Attacks: DNS Hijacking, CDN Compromises & Protection",
    description: "How attackers compromise DeFi frontends without touching smart contracts. Covers BadgerDAO hack, DNS hijacking, malicious CDN injection, and verification methods.",
    category: "Infrastructure",
    readTime: "13 min read",
    publishedAt: "2024-10-05",
    modifiedAt: "2025-01-11",
    author: "Digibastion Security Team",
    tags: ["frontend attack", "dns hijacking", "badger hack", "web security", "defi security"],
    difficulty: "intermediate"
  },

  // Privacy & Anonymity
  {
    slug: "blockchain-privacy-tools-2025",
    title: "Blockchain Privacy Tools 2025: Mixers, Zero-Knowledge & Private Chains",
    description: "Comprehensive guide to privacy solutions on blockchain. Covers Tornado Cash aftermath, zk-SNARKs, privacy coins, and emerging solutions for transaction anonymity.",
    category: "Privacy",
    readTime: "16 min read",
    publishedAt: "2025-01-03",
    modifiedAt: "2025-01-17",
    author: "Digibastion Security Team",
    tags: ["privacy", "tornado cash", "zero knowledge", "zcash", "monero"],
    difficulty: "intermediate"
  },
  {
    slug: "wallet-address-deanonymization",
    title: "Wallet Deanonymization: How Your Crypto Address Reveals Your Identity",
    description: "Understand blockchain analysis techniques used to link wallets to real identities. Covers clustering, transaction patterns, exchange deposits, and privacy protection strategies.",
    category: "Privacy",
    readTime: "14 min read",
    publishedAt: "2024-08-15",
    modifiedAt: "2025-01-08",
    author: "Digibastion Security Team",
    tags: ["deanonymization", "blockchain analysis", "chainalysis", "privacy", "kyc"],
    difficulty: "intermediate"
  },
  {
    slug: "vpn-tor-crypto-trading",
    title: "VPN & Tor for Crypto: Privacy Setup for Trading & DeFi Access",
    description: "Configure VPN and Tor for secure cryptocurrency activities. Covers geo-restrictions, IP privacy, and potential risks when using privacy tools with exchanges and DeFi.",
    category: "Privacy",
    readTime: "11 min read",
    publishedAt: "2024-09-20",
    modifiedAt: "2025-01-06",
    author: "Digibastion Security Team",
    tags: ["vpn", "tor", "privacy", "anonymous trading", "ip protection"],
    difficulty: "beginner"
  },

  // NFT Security
  {
    slug: "nft-marketplace-security",
    title: "NFT Marketplace Security: Safe Trading on OpenSea, Blur & Magic Eden",
    description: "Security best practices for NFT trading on major marketplaces. Covers signature verification, hidden listing attacks, and safe approval management for NFT transactions.",
    category: "NFT",
    readTime: "12 min read",
    publishedAt: "2024-07-05",
    modifiedAt: "2025-01-10",
    author: "Digibastion Security Team",
    tags: ["nft", "opensea", "blur", "nft trading", "marketplace security"],
    difficulty: "beginner"
  },
  {
    slug: "nft-scam-red-flags",
    title: "NFT Scams: 15 Red Flags That Signal a Project Will Rug",
    description: "Learn to identify NFT project red flags before investing. Covers art theft, anonymous teams, fake roadmaps, botted Discord, and techniques scammers use to create false hype.",
    category: "NFT",
    readTime: "13 min read",
    publishedAt: "2024-08-20",
    modifiedAt: "2025-01-12",
    author: "Digibastion Security Team",
    tags: ["nft scam", "rug pull", "pfp project", "nft red flags", "art theft"],
    difficulty: "beginner"
  },
  {
    slug: "setapprovalforall-risks",
    title: "SetApprovalForAll Explained: The NFT Permission That Drains Collections",
    description: "Deep dive into the dangerous setApprovalForAll function. Understand how malicious approvals work, how to detect them, and steps to revoke access to your NFT collections.",
    category: "NFT",
    readTime: "10 min read",
    publishedAt: "2024-10-10",
    modifiedAt: "2025-01-14",
    author: "Digibastion Security Team",
    tags: ["setApprovalForAll", "nft approval", "erc721", "wallet drainer", "nft theft"],
    difficulty: "intermediate"
  },

  // Social Engineering
  {
    slug: "social-engineering-web3",
    title: "Social Engineering in Web3: Psychology Behind Crypto Scams",
    description: "Understand the psychology of crypto scams. Covers urgency tactics, authority exploitation, social proof manipulation, and cognitive biases attackers exploit.",
    category: "Social Engineering",
    readTime: "14 min read",
    publishedAt: "2024-06-10",
    modifiedAt: "2025-01-07",
    author: "Digibastion Security Team",
    tags: ["social engineering", "psychology", "manipulation", "scam tactics", "cognitive bias"],
    difficulty: "beginner"
  },
  {
    slug: "crypto-job-scams",
    title: "Crypto Job Scams: Fake Employment Offers That Steal Your Assets",
    description: "How hackers use fake job offers to target crypto professionals. Covers malicious job boards, trojanized developer tools, and verification techniques for legitimate opportunities.",
    category: "Social Engineering",
    readTime: "11 min read",
    publishedAt: "2024-09-15",
    modifiedAt: "2025-01-09",
    author: "Digibastion Security Team",
    tags: ["job scam", "employment fraud", "developer targeting", "lazarus group", "crypto hiring"],
    difficulty: "intermediate"
  },
  {
    slug: "romance-scams-crypto",
    title: "Crypto Romance Scams: Pig Butchering & Investment Fraud Tactics",
    description: "Exposing cryptocurrency romance scams and pig butchering schemes. Learn the manipulation timeline, fake platform tactics, and how to protect vulnerable individuals.",
    category: "Social Engineering",
    readTime: "15 min read",
    publishedAt: "2024-11-25",
    modifiedAt: "2025-01-16",
    author: "Digibastion Security Team",
    tags: ["romance scam", "pig butchering", "investment fraud", "sha zhu pan", "dating app scam"],
    difficulty: "beginner"
  },

  // Beginner Guides
  {
    slug: "getting-started-web3-security",
    title: "Web3 Security for Beginners: Your First 10 Steps to Crypto Safety",
    description: "Essential first steps for new crypto users. Simple, actionable security measures covering wallet setup, exchange safety, and avoiding common beginner mistakes.",
    category: "Basics",
    readTime: "10 min read",
    publishedAt: "2024-05-20",
    modifiedAt: "2025-01-05",
    author: "Digibastion Security Team",
    tags: ["beginner", "crypto security basics", "first steps", "new to crypto", "wallet setup"],
    difficulty: "beginner"
  },
  {
    slug: "advanced-wallet-security",
    title: "Advanced Wallet Security: Defense-in-Depth for High-Value Holdings",
    description: "Advanced security strategies for users with significant crypto holdings. Covers multi-wallet architecture, time-locked transactions, and operational security for whales.",
    category: "Wallet Security",
    readTime: "18 min read",
    publishedAt: "2024-07-30",
    modifiedAt: "2025-01-11",
    author: "Digibastion Security Team",
    tags: ["advanced security", "whale security", "high value", "defense in depth", "opsec"],
    difficulty: "advanced"
  },

  // Exchange Security
  {
    slug: "cex-security-best-practices",
    title: "Centralized Exchange Security: Protect Your Funds on Binance, Coinbase & More",
    description: "Essential security practices for centralized exchange accounts. Covers API key management, withdrawal whitelisting, email security, and what to do if an exchange is hacked.",
    category: "Exchange",
    readTime: "12 min read",
    publishedAt: "2024-08-10",
    modifiedAt: "2025-01-08",
    author: "Digibastion Security Team",
    tags: ["exchange security", "binance", "coinbase", "cex", "api security"],
    difficulty: "beginner"
  },
  {
    slug: "exchange-hack-survival-guide",
    title: "Exchange Hack Survival: What to Do When Your Exchange Gets Hacked",
    description: "Step-by-step response plan for exchange security breaches. Covers immediate actions, asset recovery options, legal considerations, and lessons from Mt. Gox to FTX.",
    category: "Exchange",
    readTime: "11 min read",
    publishedAt: "2024-10-30",
    modifiedAt: "2025-01-13",
    author: "Digibastion Security Team",
    tags: ["exchange hack", "asset recovery", "ftx", "mt gox", "exchange failure"],
    difficulty: "intermediate"
  },

  // Mobile Security
  {
    slug: "mobile-crypto-wallet-security",
    title: "Mobile Wallet Security: Securing Trust Wallet, Phantom & Mobile Apps",
    description: "Complete mobile security guide for cryptocurrency apps. Covers device hardening, app permissions, biometric security, and protecting against mobile-specific attack vectors.",
    category: "Mobile",
    readTime: "13 min read",
    publishedAt: "2024-09-25",
    modifiedAt: "2025-01-10",
    author: "Digibastion Security Team",
    tags: ["mobile wallet", "trust wallet", "phantom", "ios security", "android security"],
    difficulty: "beginner"
  },
  {
    slug: "physical-security-crypto",
    title: "Physical Security for Crypto: Protecting Assets from Real-World Threats",
    description: "$5 wrench attacks are real. Learn physical security measures for crypto holders including secure storage, location privacy, and what to do during a home invasion.",
    category: "Physical Security",
    readTime: "14 min read",
    publishedAt: "2024-11-10",
    modifiedAt: "2025-01-15",
    author: "Digibastion Security Team",
    tags: ["physical security", "wrench attack", "home security", "real world threat", "personal safety"],
    difficulty: "intermediate"
  },

  // Governance & DAO Security
  {
    slug: "dao-governance-attacks",
    title: "DAO Governance Attacks: Flash Loan Voting & Proposal Hijacking",
    description: "Security risks in DAO governance systems. Covers flash loan governance attacks, malicious proposals, quorum manipulation, and designing secure voting mechanisms.",
    category: "Governance",
    readTime: "15 min read",
    publishedAt: "2024-08-05",
    modifiedAt: "2025-01-09",
    author: "Digibastion Security Team",
    tags: ["dao security", "governance attack", "flash loan voting", "proposal attack", "beanstalk"],
    difficulty: "advanced"
  },

  // Incident Response
  {
    slug: "crypto-hack-response-playbook",
    title: "Crypto Hack Response: Immediate Actions When Your Wallet Is Compromised",
    description: "Emergency response playbook for wallet compromises. Step-by-step guide covering asset rescue, attacker containment, evidence preservation, and recovery options.",
    category: "Incident Response",
    readTime: "12 min read",
    publishedAt: "2024-07-20",
    modifiedAt: "2025-01-12",
    author: "Digibastion Security Team",
    tags: ["incident response", "wallet hack", "asset recovery", "emergency", "compromised wallet"],
    difficulty: "intermediate"
  },
  {
    slug: "blockchain-forensics-basics",
    title: "Blockchain Forensics: Tracing Stolen Crypto & Understanding Chain Analysis",
    description: "Introduction to blockchain forensics for hack victims. Understand how investigators trace funds, when recovery is possible, and how to work with forensics firms.",
    category: "Incident Response",
    readTime: "14 min read",
    publishedAt: "2024-10-25",
    modifiedAt: "2025-01-14",
    author: "Digibastion Security Team",
    tags: ["blockchain forensics", "chain analysis", "fund tracing", "investigation", "asset recovery"],
    difficulty: "intermediate"
  },

  // Layer 2 & Emerging Tech
  {
    slug: "layer-2-security-considerations",
    title: "Layer 2 Security: Risks & Considerations for Optimism, Arbitrum & zkSync",
    description: "Security implications of Layer 2 scaling solutions. Covers bridge risks, sequencer centralization, fraud proof windows, and safe usage practices for L2 networks.",
    category: "Layer 2",
    readTime: "16 min read",
    publishedAt: "2024-11-05",
    modifiedAt: "2025-01-16",
    author: "Digibastion Security Team",
    tags: ["layer 2", "optimism", "arbitrum", "zksync", "rollup security"],
    difficulty: "intermediate"
  },
  {
    slug: "account-abstraction-security",
    title: "Account Abstraction Security: Smart Wallet Risks & Best Practices",
    description: "Security considerations for ERC-4337 account abstraction wallets. Covers bundler trust, paymaster risks, session key management, and recovery mechanisms.",
    category: "Emerging Tech",
    readTime: "14 min read",
    publishedAt: "2024-12-10",
    modifiedAt: "2025-01-17",
    author: "Digibastion Security Team",
    tags: ["account abstraction", "erc4337", "smart wallet", "bundler", "paymaster"],
    difficulty: "advanced"
  },

  // CEX vs DEX
  {
    slug: "cex-vs-dex-security-comparison",
    title: "CEX vs DEX Security: Centralized vs Decentralized Exchange Risks",
    description: "Comprehensive security comparison of centralized and decentralized exchanges. Covers custody risks, smart contract vulnerabilities, and hybrid approaches.",
    category: "Exchange",
    readTime: "13 min read",
    publishedAt: "2024-09-08",
    modifiedAt: "2025-01-07",
    author: "Digibastion Security Team",
    tags: ["cex", "dex", "exchange comparison", "custody", "self-custody"],
    difficulty: "beginner"
  }
];

// Helper function to get article by slug
export const getArticleBySlug = (slug: string): ArticleMeta | undefined => {
  return articlesMeta.find(article => article.slug === slug);
};

// Helper function to get articles by category
export const getArticlesByCategory = (category: string): ArticleMeta[] => {
  return articlesMeta.filter(article => article.category === category);
};

// Helper function to get featured articles
export const getFeaturedArticles = (): ArticleMeta[] => {
  return articlesMeta.filter(article => article.featured);
};

// Get all unique categories
export const getCategories = (): string[] => {
  return [...new Set(articlesMeta.map(article => article.category))];
};

// Get articles count
export const getArticlesCount = (): number => {
  return articlesMeta.length;
};
