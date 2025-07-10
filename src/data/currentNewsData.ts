import { NewsArticle, SecurityAlert } from '@/types/news';

// Current news with today's date (July 11, 2024)
export const currentNewsArticles: NewsArticle[] = [
  {
    id: 'current-1',
    title: 'Critical Zero-Day Exploit in Popular Web3 Wallet Browser Extensions',
    content: `A critical zero-day vulnerability (CVE-2024-7001) has been discovered in multiple popular Web3 wallet browser extensions affecting over 10 million users worldwide. The vulnerability allows attackers to bypass security checks and potentially drain user funds through malicious websites.

**Technical Details:**
The vulnerability exists in the content script injection mechanism used by wallet extensions to interact with web pages. Attackers can exploit a race condition in the permission system to execute arbitrary code with elevated privileges.

**Affected Versions:**
- MetaMask: versions 11.0.0 - 11.16.1
- Phantom: versions 23.0.0 - 23.17.0
- Coinbase Wallet: versions 2.5.0 - 2.8.3

**Immediate Actions Required:**
1. Update your wallet extension immediately to the latest version
2. Clear browser cache and restart your browser
3. Revoke all active dApp connections and reconnect only trusted applications
4. Monitor your wallet addresses for suspicious transactions
5. Consider using hardware wallets for large transactions until the issue is fully resolved

**Mitigation Steps:**
Security researchers recommend enabling additional security layers such as transaction signing confirmations and setting up alerts for wallet activity. Users should also avoid connecting to new or unfamiliar dApps until patches are verified.

**Industry Response:**
Major wallet providers have released emergency patches and are coordinating with browser vendors to implement additional security measures. The vulnerability was responsibly disclosed by the Ethereum Foundation Security Team.`,
    summary: 'Critical zero-day in Web3 wallet extensions could allow fund drainage. Update immediately and revoke dApp connections.',
    category: 'web3-security',
    tags: ['zero-day', 'wallet', 'critical', 'web3', 'browser-extension'],
    severity: 'critical',
    sourceUrl: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-7001',
    publishedAt: new Date('2024-07-11T08:30:00Z'),
    affectedTechnologies: ['MetaMask', 'Phantom', 'Coinbase Wallet', 'Browser Extensions'],
    author: 'Ethereum Foundation Security Team'
  },
  {
    id: 'current-2',
    title: 'Supply Chain Attack Targets npm Packages Used by DeFi Protocols',
    content: `A sophisticated supply chain attack has compromised 23 npm packages commonly used in DeFi protocol development, potentially affecting hundreds of protocols and thousands of developers worldwide.

**Attack Overview:**
Threat actors gained control of maintainer accounts for popular cryptographic libraries and injected malicious code designed to extract private keys and seed phrases during the build process. The attack remained undetected for approximately 72 hours.

**Compromised Packages:**
- @crypto/secp256k1-utils (versions 2.1.0 - 2.1.3)
- ethereum-wallet-tools (versions 4.2.1 - 4.2.5)
- defi-sdk-core (versions 1.8.0 - 1.8.2)
- web3-contract-helpers (versions 3.1.4 - 3.1.7)

**Detection and Response:**
The attack was discovered by automated security scanning tools that detected anomalous network requests to suspicious domains. npm has since removed the malicious versions and suspended the affected maintainer accounts.

**Developer Actions Required:**
1. Audit your package.json and lock files immediately
2. Check for any of the compromised package versions
3. If affected, rotate all cryptographic keys and secrets
4. Rebuild applications from clean dependencies
5. Implement dependency scanning in your CI/CD pipeline

**Prevention Measures:**
- Use npm audit regularly
- Pin exact versions in package-lock.json
- Implement Software Bill of Materials (SBOM) tracking
- Use multi-signature verification for package updates
- Consider using alternative package managers with enhanced security features

**Ecosystem Impact:**
Several major DeFi protocols have confirmed they were using affected packages but report no evidence of key compromise. The incident highlights the critical importance of supply chain security in the Web3 ecosystem.`,
    summary: 'Supply chain attack compromises 23 npm packages used in DeFi development. Audit dependencies immediately.',
    category: 'supply-chain',
    tags: ['supply-chain', 'npm', 'defi', 'malware', 'dependencies'],
    severity: 'high',
    publishedAt: new Date('2024-07-11T06:15:00Z'),
    affectedTechnologies: ['npm', 'Node.js', 'DeFi Protocols', 'JavaScript'],
    author: 'npm Security Team'
  },
  {
    id: 'current-3',
    title: 'New OPSEC Guidelines Released for Web3 Professionals in High-Risk Environments',
    content: `The Web3 Security Alliance has released comprehensive operational security (OPSEC) guidelines specifically designed for Web3 professionals operating in high-risk environments, including countries with restrictive cryptocurrency regulations.

**Key Recommendations:**

**Digital Identity Management:**
- Use separate devices for personal and professional Web3 activities
- Implement compartmentalized browsing with different browsers for different purposes
- Utilize VPN chains with multiple jurisdictions for sensitive operations
- Maintain separate email addresses and social media accounts for Web3 activities

**Communication Security:**
- Use Signal or Element for sensitive communications
- Implement PGP encryption for email communications
- Avoid discussing sensitive topics on mainstream social platforms
- Use code words and established protocols for sensitive discussions

**Financial Privacy:**
- Utilize privacy coins for operational expenses
- Implement coin mixing services for Bitcoin transactions
- Use multiple hardware wallets with air-gapped signing
- Maintain operational funds separate from long-term holdings

**Physical Security:**
- Implement proper key storage with geographic distribution
- Use decoy wallets with small amounts for potential compromise situations
- Establish secure communication protocols with trusted contacts
- Maintain updated emergency procedures and exit strategies

**Travel Considerations:**
- Use clean devices when crossing borders
- Implement secure remote access to necessary systems
- Establish secure communication protocols while traveling
- Maintain updated threat assessments for destination countries

**Implementation Timeline:**
The guidelines recommend implementing these measures gradually over a 30-day period to avoid operational disruption while maintaining security improvements.`,
    summary: 'New OPSEC guidelines for Web3 professionals in high-risk environments cover digital identity, communications, and travel security.',
    category: 'operational-security',
    tags: ['opsec', 'privacy', 'guidelines', 'professionals', 'high-risk'],
    severity: 'medium',
    publishedAt: new Date('2024-07-11T04:45:00Z'),
    affectedTechnologies: ['Web3 Operations', 'Privacy Tools', 'Hardware Wallets'],
    author: 'Web3 Security Alliance'
  },
  {
    id: 'current-4',
    title: 'Major DeFi Protocol Loses $12M in Flash Loan Attack - Post Mortem Analysis',
    content: `LiquidityHub, a major automated market maker (AMM) protocol, suffered a $12 million exploit early today through a sophisticated flash loan attack that manipulated price oracles across multiple liquidity pools.

**Attack Breakdown:**

**Step 1: Flash Loan Initiation**
The attacker borrowed 50,000 ETH from Aave without collateral, using this capital to manipulate prices across interconnected DeFi protocols.

**Step 2: Price Manipulation**
Using the borrowed funds, the attacker created artificial price discrepancies between LiquidityHub's internal pricing mechanism and external oracle feeds by executing large trades on low-liquidity pairs.

**Step 3: Arbitrage Exploitation**
The attacker then exploited the price differences to extract value from LiquidityHub's liquidity pools, essentially draining funds through what appeared to be legitimate arbitrage trades.

**Step 4: Loan Repayment**
After extracting the profits, the attacker repaid the flash loan and retained approximately $12 million in various tokens.

**Root Cause Analysis:**
The exploit was possible due to LiquidityHub's reliance on a single price oracle for certain token pairs, combined with insufficient slippage protection for large trades. The protocol's governance token holders had been debating oracle improvements for months but had not implemented changes.

**Protocol Response:**
- All contracts have been paused to prevent further exploitation
- Emergency governance proposal passed to implement multi-oracle pricing
- Affected users will receive compensation through the protocol's insurance fund
- Independent security audit commissioned for all smart contracts

**Industry Implications:**
This attack highlights the ongoing risks in DeFi protocols, particularly those related to oracle dependencies and flash loan vulnerabilities. The incident has prompted renewed discussions about standardized security practices.

**Prevention Measures:**
- Implement time-weighted average pricing (TWAP) oracles
- Use multiple independent oracle feeds
- Implement maximum slippage limits
- Regular security audits and bug bounty programs`,
    summary: 'LiquidityHub loses $12M in flash loan attack exploiting oracle manipulation. Protocol paused pending fixes.',
    category: 'defi-exploits',
    tags: ['flash-loan', 'exploit', 'oracle', 'defi', 'hack'],
    severity: 'high',
    publishedAt: new Date('2024-07-11T09:20:00Z'),
    affectedTechnologies: ['LiquidityHub', 'Aave', 'Flash Loans', 'Price Oracles'],
    author: 'DeFi Security Research'
  },
  {
    id: 'current-5',
    title: 'Personal Protection: New Social Engineering Campaign Targets Crypto Holders',
    content: `Security researchers have identified a sophisticated social engineering campaign specifically targeting individual cryptocurrency holders through personalized phishing attacks that leverage publicly available blockchain data.

**Campaign Overview:**
Attackers are using blockchain analysis tools to identify high-value wallet addresses, then correlating this data with social media profiles to craft highly personalized phishing messages. The campaign has been active for approximately 3 weeks with over 10,000 targeted individuals.

**Attack Methodology:**

**Phase 1: Target Identification**
- Analyze blockchain transactions to identify high-value wallets
- Cross-reference wallet addresses with social media mentions
- Build detailed profiles including interests, connections, and activity patterns
- Identify potential entry points through social media, email, or messaging platforms

**Phase 2: Trust Building**
- Initiate contact through seemingly legitimate channels
- Reference specific transactions or NFT holdings to establish credibility
- Pose as representatives from legitimate projects or exchanges
- Gradually build rapport over several days or weeks

**Phase 3: Exploitation**
- Create urgent scenarios requiring immediate action
- Direct targets to sophisticated phishing sites that mimic legitimate services
- Request seed phrases, private keys, or direct wallet connections
- Use time pressure and fear tactics to prevent careful consideration

**Protection Strategies:**

**Wallet Privacy:**
- Use multiple wallets to compartmentalize holdings
- Avoid posting wallet addresses or transaction details publicly
- Use privacy-focused wallets for sensitive transactions
- Regularly rotate addresses when possible

**Social Media Security:**
- Limit disclosure of cryptocurrency involvement
- Use privacy settings to restrict profile visibility
- Be cautious about joining crypto-related groups or communities
- Never share specific holdings or transaction details

**Communication Protocols:**
- Verify all unsolicited contact through independent channels
- Never share private keys or seed phrases under any circumstances
- Be suspicious of urgent requests or time-limited offers
- Use official channels for all cryptocurrency service interactions

**Red Flags to Watch:**
- Unsolicited contact referencing specific transactions
- Urgent requests for wallet information or private keys
- Offers that seem too good to be true
- Pressure tactics or artificial time constraints
- Requests to download unfamiliar software or visit suspicious websites

**Reporting:**
Individuals who believe they may have been targeted should report incidents to relevant authorities and warn others in their networks about the ongoing campaign.`,
    summary: 'New social engineering campaign uses blockchain data to target crypto holders with personalized phishing attacks.',
    category: 'personal-protection',
    tags: ['social-engineering', 'phishing', 'personal-security', 'crypto-holders'],
    severity: 'medium',
    publishedAt: new Date('2024-07-11T07:10:00Z'),
    affectedTechnologies: ['Cryptocurrency Wallets', 'Social Media', 'Blockchain Analysis'],
    author: 'Cybersecurity Research Institute'
  }
];

export const currentSecurityAlerts: SecurityAlert[] = [
  {
    id: 'alert-current-1',
    title: 'CRITICAL: Update Web3 Wallet Extensions Immediately',
    description: 'Zero-day vulnerability in major wallet extensions allows fund drainage. Emergency patches available.',
    affectedTechnologies: ['MetaMask', 'Phantom', 'Coinbase Wallet'],
    severity: 'critical',
    alertType: 'vulnerability',
    createdAt: new Date('2024-07-11T08:30:00Z'),
    actionRequired: true,
    cveId: 'CVE-2024-7001',
    references: ['https://metamask.io/security-advisory', 'https://phantom.app/security']
  },
  {
    id: 'alert-current-2',
    title: 'HIGH: npm Supply Chain Compromise Affects DeFi Projects',
    description: 'Multiple npm packages compromised. Audit dependencies and rotate keys if affected.',
    affectedTechnologies: ['npm', 'Node.js', 'DeFi Development'],
    severity: 'high',
    alertType: 'tool-update',
    createdAt: new Date('2024-07-11T06:15:00Z'),
    actionRequired: true,
    references: ['https://npmjs.com/security-advisory']
  },
  {
    id: 'alert-current-3',
    title: 'HIGH: LiquidityHub Protocol Exploited - $12M Drained',
    description: 'Flash loan attack on major DeFi protocol. Avoid using until security patches implemented.',
    affectedTechnologies: ['LiquidityHub', 'Flash Loans', 'DeFi'],
    severity: 'high',
    alertType: 'incident',
    createdAt: new Date('2024-07-11T09:20:00Z'),
    actionRequired: true
  },
  {
    id: 'alert-current-4',
    title: 'MEDIUM: Targeted Social Engineering Campaign Active',
    description: 'Sophisticated phishing campaign targeting crypto holders using blockchain data.',
    affectedTechnologies: ['Cryptocurrency Wallets', 'Social Media'],
    severity: 'medium',
    alertType: 'best-practice',
    createdAt: new Date('2024-07-11T07:10:00Z'),
    actionRequired: false
  }
];