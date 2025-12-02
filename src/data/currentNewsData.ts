import { NewsArticle, SecurityAlert } from '@/types/news';

// Updated news feed with 2024-2025 threat intelligence
export const currentNewsArticles: NewsArticle[] = [
  // === CRITICAL 2025 INCIDENTS ===
  {
    id: 'balancer-v2-exploit-2025',
    title: 'Balancer V2 Protocol Exploit - $128M Drained Across Multiple Chains',
    content: `Balancer, a major DeFi liquidity protocol, suffered one of the largest exploits of 2025. Attackers exploited precision rounding errors and invariant manipulation within V2 Composable Stable Pools.

**Attack Vector:**
- Deployed malicious smart contracts with custom tokens
- Exploited rounding errors in swap calculations via \`batchSwap\` function
- Chained multiple swaps to compound rounding losses into price distortions
- Drained liquidity across Ethereum, Arbitrum, Base, Polygon, Optimism, Sonic, and Berachain

**Key Details:**
- Ethereum deployment hit hardest (~$99M)
- TVL dropped from $815M to $388M
- Multiple Balancer forks potentially vulnerable (Beets Finance, Hexagon, HoldrFi)
- $19.3M recovered via white-hat counter-exploit
- Sonic Labs froze attacker wallets

**Mitigation:**
- Verify exposure to Balancer V2 forks
- Revoke approvals immediately
- Await post-mortem before re-engaging`,
    summary: 'Balancer V2 exploited for $128M through precision rounding errors in Composable Stable Pools across multiple chains.',
    category: 'defi-exploits',
    tags: ['balancer', 'defi', 'exploit', 'multi-chain', 'critical'],
    severity: 'critical',
    publishedAt: new Date('2025-11-03T10:00:00Z'),
    affectedTechnologies: ['Balancer', 'Ethereum', 'Arbitrum', 'Base', 'Polygon', 'Optimism'],
    author: 'DeFi Security Watch'
  },
  {
    id: 'shai-hulud-npm-attack-2025',
    title: 'Shai-Hulud 2.0: Most Aggressive NPM Supply Chain Attack of 2025',
    content: `The most aggressive npm supply chain attack of 2025, dubbed "The Second Coming," compromised hundreds of packages and exfiltrated credentials from developer environments worldwide.

**Attack Vector:**
- Malicious code executes during \`preinstall\` lifecycle (not post-install)
- Deploys via \`setup_bun.js\` and \`bun_environment.js\` payloads
- Uses Bun runtime instead of Node.js for evasion
- Aggressive fallback: attempts to destroy user's home directory if exfiltration fails

**Data Exfiltrated:**
- GitHub and npm tokens
- SSH keys
- Cloud provider credentials (AWS, Azure, GCP)
- CI/CD secrets

**IOCs:**
- Malicious repos with description: "Sha1-Hulud: The Second Coming"
- Payload files: \`setup_bun.js\`, \`bun_environment.js\`

**Mitigation:**
- Immediately rotate all developer credentials
- Audit dependencies in \`package-lock.json\`
- Run \`npm audit\`
- Check for preinstall scripts in packages`,
    summary: 'Massive npm supply chain attack compromised hundreds of packages, exfiltrating developer credentials and destroying systems.',
    category: 'supply-chain',
    tags: ['npm', 'supply-chain', 'malware', 'credentials', 'bun'],
    severity: 'critical',
    publishedAt: new Date('2025-11-21T08:00:00Z'),
    affectedTechnologies: ['npm', 'Node.js', 'Bun', 'GitHub', 'AWS', 'Azure', 'GCP'],
    author: 'npm Security Response Team'
  },
  {
    id: 'aerodrome-dns-hijack-2025',
    title: 'Aerodrome Finance DNS Hijacking - Base Network Largest DEX Targeted',
    content: `Attackers hijacked DNS for Aerodrome Finance, Base network's largest DEX with $400M TVL, redirecting users to phishing sites.

**Attack Details:**
- DNS records modified to point to attacker-controlled servers
- Fake interface mimicked legitimate Aerodrome UI
- Users prompted to sign malicious transactions
- Over $1M stolen before detection

**Mitigation:**
- Always verify contract addresses before signing
- Use hardware wallets for large transactions
- Bookmark official URLs, never use search results
- Enable DNS-over-HTTPS for additional protection`,
    summary: 'Aerodrome Finance suffered DNS hijacking attack targeting Base network users with $1M+ stolen.',
    category: 'web3-security',
    tags: ['dns-hijacking', 'phishing', 'base', 'dex', 'aerodrome'],
    severity: 'critical',
    publishedAt: new Date('2025-11-22T14:00:00Z'),
    affectedTechnologies: ['Aerodrome Finance', 'Base Network', 'DNS'],
    author: 'Web3 Security Alliance'
  },
  // === 2024 MAJOR INCIDENTS ===
  {
    id: 'dmm-bitcoin-lazarus-2024',
    title: 'DMM Bitcoin Exchange Hack - $305M Stolen by North Korean Lazarus Group',
    content: `FBI/DOD/Japanese authorities formally attributed this attack to North Korea (TraderTraitor/Jade Sleet/Lazarus Group/UNC4899). The exchange shut down in December 2024.

**Attack Chain:**
- **March 2024:** Ginco (wallet provider) employee targeted via LinkedIn with fake recruiter
- Malicious Python script in pre-employment test compromised session cookies
- **Mid-May:** Attackers accessed Ginco's communications system
- **Late May:** Manipulated legitimate DMM transaction request to steal 4,502.9 BTC

**Laundering:**
- Used Bitcoin CoinJoin mixers
- Eventually moved to HuiOne Guarantee (Cambodian marketplace)

**Key Learning:**
- Never download/run code from recruiters or unknown sources
- Implement zero-trust architecture for vendor access
- Use short-lived session tokens with IP binding
- Deploy behavioral analytics for employee accounts`,
    summary: 'DMM Bitcoin lost $305M to North Korean hackers via social engineering attack on wallet provider employee.',
    category: 'web3-security',
    tags: ['exchange-hack', 'lazarus', 'north-korea', 'social-engineering', 'bitcoin'],
    severity: 'critical',
    publishedAt: new Date('2024-05-31T06:00:00Z'),
    affectedTechnologies: ['DMM Bitcoin', 'Ginco', 'Bitcoin', 'LinkedIn'],
    author: 'FBI Cyber Division'
  },
  {
    id: 'wazirx-multisig-hack-2024',
    title: 'WazirX Exchange Hack - $235M Lost via Sophisticated Multisig Compromise',
    content: `India's largest crypto exchange suffered a sophisticated attack targeting its Gnosis Safe 4-of-6 multisig wallet.

**Attack Vector:**
- Attackers manipulated the Liminal Custody interface
- Deceived signers into approving malicious smart contract upgrades
- Displayed legitimate transactions while actual malicious transactions were signed
- Three WazirX hardware wallet signatures + one Liminal signature exploited

**Impact:**
- $234.9 million stolen (50% of exchange assets)
- Exchange ceased operations
- Recently resumed with creditor restructuring

**Key Learning:**
- Never trust UI alone—always verify transaction details on hardware wallet display
- Implement transaction simulation before signing
- Use time-locks for smart contract upgrades
- Deploy independent security monitoring separate from wallet provider`,
    summary: 'WazirX lost $235M through sophisticated multisig wallet compromise that deceived hardware wallet signers.',
    category: 'web3-security',
    tags: ['exchange-hack', 'multisig', 'gnosis-safe', 'india', 'lazarus'],
    severity: 'critical',
    publishedAt: new Date('2024-07-18T12:00:00Z'),
    affectedTechnologies: ['WazirX', 'Gnosis Safe', 'Liminal Custody', 'Hardware Wallets'],
    author: 'Blockchain Security Research'
  },
  {
    id: 'solana-web3js-backdoor-2024',
    title: 'Solana Web3.js Supply Chain Attack - CVE-2024-54134',
    content: `Compromised npm publish account led to malicious versions of @solana/web3.js library, one of the most critical Solana development tools with 450K weekly downloads.

**Technical Details:**
- **Affected Versions:** 1.95.6 and 1.95.7
- **Impact Window:** Only 5 hours (3:20pm-8:25pm UTC, December 2)
- **Loss:** ~$190K (limited due to quick response)
- Backdoor exfiltrated private keys through CloudFlare headers to attacker domain (sol-rpc[.]xyz)
- Targeted backend systems and bots handling wallets directly
- Major consumer wallets unaffected

**Mitigation:**
- Pin exact dependency versions, avoid auto-updates
- Implement SCA (Software Composition Analysis) tools
- Monitor for suspicious package updates
- Use package lock files and verify integrity hashes
- Rotate keys if compromised versions installed`,
    summary: 'Solana Web3.js library compromised via npm account takeover, exfiltrating private keys for 5 hours.',
    category: 'supply-chain',
    tags: ['solana', 'npm', 'supply-chain', 'backdoor', 'private-keys'],
    severity: 'critical',
    cveId: 'CVE-2024-54134',
    publishedAt: new Date('2024-12-02T20:25:00Z'),
    affectedTechnologies: ['Solana', 'npm', '@solana/web3.js', 'Node.js'],
    author: 'Solana Foundation Security'
  },
  {
    id: 'radiant-capital-multisig-2024',
    title: 'Radiant Capital Second Hack - $58M via Advanced Multisig Malware',
    content: `Binance-backed DeFi lender hit with sophisticated attack targeting 3-of-11 multisig. High confidence attribution to North Korea (DPRK/Lazarus Group).

**Attack Vector:**
- Advanced malware manipulated Gnosis Safe interface
- Displayed legitimate transactions while actual malicious transactions were signed
- Attackers gained control of Pool Provider contracts on Arbitrum and BSC

**Key Details:**
- $50-58 million stolen
- Previous flash loan attack in January 2024 ($4.5M)
- Shows escalating sophistication of DPRK cyber operations

**Mitigation:**
- Verify ALL transaction details on multiple independent interfaces
- Use hardware wallet displays as source of truth
- Implement transaction simulation with independent validators
- Deploy malware detection on signer devices
- Consider air-gapped signing devices for critical operations`,
    summary: 'Radiant Capital lost $58M to North Korean hackers using advanced malware that manipulated multisig interfaces.',
    category: 'defi-exploits',
    tags: ['radiant', 'multisig', 'malware', 'lazarus', 'arbitrum', 'bsc'],
    severity: 'critical',
    publishedAt: new Date('2024-10-16T09:00:00Z'),
    affectedTechnologies: ['Radiant Capital', 'Gnosis Safe', 'Arbitrum', 'BSC'],
    author: 'DeFi Security Watch'
  },
  {
    id: 'lottie-player-compromise-2024',
    title: 'Lottie-Player Library Supply Chain Attack',
    content: `Malicious actors gained unauthorized access to maintainer token on lottie-player library, affecting millions of websites using the popular animation library.

**Attack Details:**
- **Versions Affected:** 2.0.5, 2.0.6, 2.0.7
- **Scale:** 4M+ lifetime uses, 94K weekly downloads
- Injected code displaying fake Web3 wallet connection prompts on legitimate websites
- Targeted cryptocurrency platforms and high-traffic websites

**Mitigation:**
- Audit all client-side dependencies regularly
- Implement Subresource Integrity (SRI) for CDN resources
- Use Content Security Policy (CSP) headers
- Monitor for unexpected DOM modifications
- Update to clean version 2.0.8 immediately`,
    summary: 'Lottie-Player library compromised to inject fake Web3 wallet prompts on millions of websites.',
    category: 'supply-chain',
    tags: ['lottie', 'npm', 'supply-chain', 'wallet-phishing', 'javascript'],
    severity: 'high',
    publishedAt: new Date('2024-10-30T16:00:00Z'),
    affectedTechnologies: ['lottie-player', 'npm', 'Web3 Wallets', 'JavaScript'],
    author: 'npm Security Team'
  },
  {
    id: 'genesis-creditor-phishing-2024',
    title: 'Genesis Creditor Phishing Heist - $243M Bitcoin Stolen',
    content: `Sophisticated social engineering scam where attackers impersonated Google and Gemini support to steal 4,064 BTC from a Genesis creditor.

**Attack Vector:**
- Trio impersonated Google and Gemini support
- Convinced victim to reset 2FA
- Used AnyDesk remote access to steal Bitcoin Core private keys
- Funds laundered through 15+ exchanges

**Outcome:**
- Two arrested (Malone Iam, Veer Chetal, Jeandiel Serrano)
- $9M frozen, $500K recovered
- Demonstrates extreme social engineering sophistication

**Mitigation:**
- Never share 2FA reset codes over phone
- Disable remote desktop software when not needed
- Use hardware wallets for large holdings
- Verify support requests through official channels only
- Store private keys offline, never in Bitcoin Core on networked devices`,
    summary: 'Social engineering attack impersonating Google/Gemini support led to $243M Bitcoin theft via remote access.',
    category: 'personal-protection',
    tags: ['phishing', 'social-engineering', 'bitcoin', 'remote-access', 'genesis'],
    severity: 'critical',
    publishedAt: new Date('2024-08-19T11:00:00Z'),
    affectedTechnologies: ['Bitcoin', 'AnyDesk', 'Google', 'Gemini'],
    author: 'FBI Cyber Crime Unit'
  },
  {
    id: 'bingx-hot-wallet-2024',
    title: 'BingX Exchange Hot Wallet Compromise - $52M Stolen',
    content: `Singapore-based CEX suffered breach across multiple blockchains, likely attributed to Lazarus Group.

**Attack Details:**
- Hot wallets accessed using malware
- Multiple blockchains affected (Ethereum, BSC, Avalanche)
- Stolen assets: 5,300 ETH, 4,100 BNB, 17M+ USDT
- Exchange covered all losses

**Mitigation:**
- Migrate majority of assets to cold storage (90%+)
- Implement MPC or multisig for hot wallets
- Deploy EDR/XDR solutions for endpoint protection
- Segregate hot wallet infrastructure from general network`,
    summary: 'BingX lost $52M across multiple chains via hot wallet compromise, likely by Lazarus Group.',
    category: 'web3-security',
    tags: ['exchange-hack', 'hot-wallet', 'lazarus', 'singapore', 'multi-chain'],
    severity: 'high',
    publishedAt: new Date('2024-09-20T08:00:00Z'),
    affectedTechnologies: ['BingX', 'Ethereum', 'BSC', 'Avalanche'],
    author: 'Exchange Security Monitor'
  },
  {
    id: 'penpie-reentrancy-2024',
    title: 'Penpie DeFi Protocol Reentrancy Exploit - $27M Drained',
    content: `Attacker exploited reentrancy protection flaw in Penpie's staking system on Pendle.

**Attack Vector:**
- Used flash loans to manipulate fake Pendle markets
- Exploited reentrancy vulnerability in staking system
- Drained 11,113.6 ETH by repeatedly claiming unearned rewards

**Mitigation:**
- Implement comprehensive reentrancy guards (Check-Effects-Interactions pattern)
- Conduct thorough audits specifically testing reentrancy vectors
- Use OpenZeppelin's ReentrancyGuard
- Deploy real-time monitoring for abnormal staking patterns
- Implement flash loan detection and rate limiting`,
    summary: 'Penpie lost $27M to reentrancy attack exploiting staking system via flash loans.',
    category: 'defi-exploits',
    tags: ['penpie', 'reentrancy', 'flash-loan', 'pendle', 'staking'],
    severity: 'high',
    publishedAt: new Date('2024-09-15T14:00:00Z'),
    affectedTechnologies: ['Penpie', 'Pendle', 'Flash Loans', 'Ethereum'],
    author: 'DeFi Security Research'
  },
  {
    id: 'playdapp-access-control-2024',
    title: 'PlayDapp Access Control Exploit - $290M Token Minting',
    content: `Access control vulnerability via private key compromise led to unauthorized minting of 1.79 billion PLA tokens.

**Timeline:**
- **Feb 9:** 200M tokens minted ($36.5M)
- **Feb 12:** 1.59B tokens minted ($253.9M) after failed negotiation

**Impact:**
- Token value crashed
- Only $32M actually liquidated due to market saturation
- Shows importance of access control even when market cant absorb stolen funds

**Mitigation:**
- Implement time-locks on minting functions
- Use multisig for privileged operations
- Deploy rate limiting on critical functions
- Monitor for unusual admin operations`,
    summary: 'PlayDapp lost $290M when private key compromise allowed unauthorized minting of 1.79B tokens.',
    category: 'web3-security',
    tags: ['playdapp', 'access-control', 'token-minting', 'private-key'],
    severity: 'critical',
    publishedAt: new Date('2024-02-12T10:00:00Z'),
    affectedTechnologies: ['PlayDapp', 'PLA Token', 'Ethereum'],
    author: 'Blockchain Security Research'
  },
  {
    id: 'lifi-protocol-exploit-2024',
    title: 'Li.Fi Protocol Second Exploit - $11.6M Lost',
    content: `Second time Li.Fi was hacked (previous incident March 2022). New smart contract facet contained critical vulnerability.

**Attack Vector:**
- Arbitrary call vulnerability allowing unauthorized calls to any contract
- No validation on target contract calls
- Affected users with infinite approval settings

**Mitigation:**
- Revoke unlimited token approvals immediately
- Implement comprehensive testing for new contract deployments
- Use approval limits instead of infinite approvals
- Deploy circuit breakers for abnormal activity`,
    summary: 'Li.Fi exploited for second time due to arbitrary call vulnerability affecting infinite approvals.',
    category: 'defi-exploits',
    tags: ['lifi', 'bridge', 'arbitrary-call', 'approvals', 'cross-chain'],
    severity: 'high',
    publishedAt: new Date('2024-07-16T09:00:00Z'),
    affectedTechnologies: ['Li.Fi', 'Cross-chain Bridges', 'Token Approvals'],
    author: 'Bridge Security Watch'
  },
  {
    id: 'indodax-withdrawal-breach-2024',
    title: 'Indodax Exchange Withdrawal System Breach - $22M Stolen',
    content: `Indonesia's largest exchange (6M+ users) suffered withdrawal system compromise attributed to North Korean actors.

**Attack Details:**
- Breached withdrawal system (not single private key compromise)
- Stole BTC, ETH, TRX, MATIC, SHIB across multiple chains
- Different from typical hot wallet attacks

**Mitigation:**
- Implement withdrawal whitelisting with time-delays
- Deploy anomaly detection for withdrawal patterns
- Use multi-layer approval for large withdrawals
- Segregate withdrawal infrastructure
- Conduct regular penetration testing`,
    summary: 'Indodax lost $22M via novel withdrawal system breach, different from typical key compromises.',
    category: 'web3-security',
    tags: ['indodax', 'exchange-hack', 'withdrawal', 'indonesia', 'north-korea'],
    severity: 'high',
    publishedAt: new Date('2024-09-11T07:00:00Z'),
    affectedTechnologies: ['Indodax', 'Bitcoin', 'Ethereum', 'TRON', 'Polygon'],
    author: 'Exchange Security Monitor'
  },
  {
    id: 'munchables-rogue-dev-2024',
    title: 'Munchables Rogue Developer Exploit - $62.8M (Recovered)',
    content: `Blast-based game exploited by rogue developer who created upgradeable proxy contract controlled by their own address.

**Attack Details:**
- Developer created upgradeable proxy controlled by deployer address (owned by developer)
- Assigned themselves 1M ETH balance
- Funds recovered after developer's address was blocklisted

**Key Learning:**
- Never give single developer full upgrade control
- Use multisig for all upgrade mechanisms
- Implement time-locks on upgrades
- Conduct thorough background checks on core developers
- Implement upgrade transparency`,
    summary: 'Munchables lost $62.8M to insider threat via malicious proxy contract, funds later recovered.',
    category: 'web3-security',
    tags: ['munchables', 'insider-threat', 'blast', 'proxy', 'recovered'],
    severity: 'high',
    publishedAt: new Date('2024-03-21T15:00:00Z'),
    affectedTechnologies: ['Munchables', 'Blast', 'Upgradeable Proxies'],
    author: 'Blast Security Team'
  },
  {
    id: 'lastpass-crypto-thefts-2024',
    title: 'LastPass Breach Continues - $35M+ in Crypto Stolen',
    content: `Continued fallout from December 2022 LastPass data breach. Victims' crypto stolen as weak passwords were cracked over time.

**Details:**
- December 2024 alone: $12.3M stolen
- Cumulative: $35M+ across 150+ victims
- Attackers copied encrypted vault backups in 2022
- Weak passwords being cracked over time
- Users who stored private keys/seeds in LastPass most affected

**Critical Actions:**
- **NEVER store private keys or seed phrases in password managers**
- Use hardware wallets for all significant holdings
- Implement passphrase encryption for seeds
- If breach occurred, assume compromise and move funds immediately`,
    summary: 'LastPass breach from 2022 continues causing crypto losses as weak vault passwords are cracked.',
    category: 'personal-protection',
    tags: ['lastpass', 'password-manager', 'data-breach', 'private-keys', 'seed-phrases'],
    severity: 'critical',
    publishedAt: new Date('2024-12-15T10:00:00Z'),
    affectedTechnologies: ['LastPass', 'Hardware Wallets', 'Seed Phrases'],
    author: 'Security Researchers Collective'
  },
  {
    id: 'spweth-permit-phishing-2024',
    title: 'SpWETH Permit Signature Phishing - $32.4M Stolen',
    content: `Sophisticated phishing targeting Spark Wrapped Ether (spWETH) users through fraudulent permit signatures.

**Attack Vector:**
- Lured victims into signing fraudulent "permit" signatures
- Granted unauthorized access to tokens
- Funds moved across multiple wallets after signing

**Mitigation:**
- Educate users about permit signature risks
- Implement signature warnings in wallet interfaces
- Use permit2 with proper allowance limits
- Deploy transaction simulation before signing
- Warn users about off-chain signature requests`,
    summary: 'Permit signature phishing campaign stole $32.4M from spWETH users via fraudulent approvals.',
    category: 'personal-protection',
    tags: ['permit', 'phishing', 'spweth', 'signatures', 'spark'],
    severity: 'high',
    publishedAt: new Date('2024-09-27T13:00:00Z'),
    affectedTechnologies: ['Spark Protocol', 'spWETH', 'Permit Signatures'],
    author: 'Wallet Security Research'
  },
  // === 2025 ADDITIONAL INCIDENTS ===
  {
    id: 'nimdoor-macos-lazarus-2025',
    title: 'NimDoor macOS Malware - North Korean Campaign Targets Web3 Developers',
    content: `North Korean hackers deployed NimDoor malware targeting Web3 and cryptocurrency developers through sophisticated social engineering.

**Attack Vector:**
- Social engineering via Telegram targeting developers
- Malware uses encrypted WebSockets for C2 communication
- Written in Nim programming language for cross-platform evasion
- Targets development environments and crypto wallets

**Mitigation:**
- Verify all contacts through multiple channels
- Use separate devices for development and personal use
- Implement endpoint detection specifically for development machines
- Never run untrusted code from recruitment contacts`,
    summary: 'North Korean NimDoor malware targets Web3 developers via Telegram social engineering.',
    category: 'web3-security',
    tags: ['nimdoor', 'macos', 'lazarus', 'telegram', 'malware'],
    severity: 'high',
    publishedAt: new Date('2025-07-15T09:00:00Z'),
    affectedTechnologies: ['macOS', 'Web3', 'Telegram', 'Developer Tools'],
    author: 'Kaspersky GReAT'
  },
  {
    id: 'rho-markets-oracle-2025',
    title: 'Rho Markets Price Oracle Manipulation - $7.6M Exploit',
    content: `Attackers manipulated on-chain price feeds to exploit Rho Markets lending protocol.

**Attack Details:**
- Manipulated price oracle feeds
- Created artificial arbitrage opportunities
- Drained $7.6M from lending pools

**Mitigation:**
- Implement time-weighted average pricing (TWAP)
- Use multiple independent oracle sources
- Deploy circuit breakers for abnormal price movements
- Implement maximum price deviation limits`,
    summary: 'Rho Markets lost $7.6M to price oracle manipulation attack on lending pools.',
    category: 'defi-exploits',
    tags: ['rho-markets', 'oracle', 'price-manipulation', 'lending'],
    severity: 'high',
    publishedAt: new Date('2025-07-08T11:00:00Z'),
    affectedTechnologies: ['Rho Markets', 'Price Oracles', 'DeFi Lending'],
    author: 'DeFi Security Watch'
  },
  {
    id: 'polter-finance-oracle-2025',
    title: 'Polter Finance Oracle Manipulation - $8.7M Lost',
    content: `Oracle manipulation attack altered external price feeds for unfair trades on Polter Finance.

**Attack Vector:**
- Altered external price feeds
- Executed trades at manipulated prices
- Drained $8.7M from protocol

**Mitigation:**
- Implement robust oracle architecture
- Use multiple data sources with outlier detection
- Deploy price deviation alerts
- Implement trading pauses for abnormal activity`,
    summary: 'Polter Finance exploited for $8.7M through oracle price feed manipulation.',
    category: 'defi-exploits',
    tags: ['polter', 'oracle', 'price-manipulation', 'defi'],
    severity: 'high',
    publishedAt: new Date('2025-11-10T16:00:00Z'),
    affectedTechnologies: ['Polter Finance', 'Price Oracles', 'DeFi'],
    author: 'Oracle Security Research'
  },
  {
    id: 'thala-smart-contract-2025',
    title: 'Thala Smart Contract Vulnerability - $25.5M Stolen',
    content: `Thala protocol exploited through flawed smart contract logic that allowed attackers to bypass restrictions.

**Attack Details:**
- Exploited flawed contract logic
- Bypassed access restrictions
- Drained $25.5M from protocol

**Mitigation:**
- Conduct comprehensive smart contract audits
- Use formal verification for critical functions
- Implement multi-stage access controls
- Deploy real-time monitoring`,
    summary: 'Thala lost $25.5M due to smart contract logic flaw that bypassed access restrictions.',
    category: 'defi-exploits',
    tags: ['thala', 'smart-contract', 'access-control', 'logic-flaw'],
    severity: 'high',
    publishedAt: new Date('2025-11-05T14:00:00Z'),
    affectedTechnologies: ['Thala', 'Smart Contracts', 'DeFi'],
    author: 'Smart Contract Security Lab'
  },
  {
    id: 'fake-metamask-extensions-2025',
    title: 'Fake MetaMask and Coinbase Wallet Extensions Campaign',
    content: `Over 40 fake cryptocurrency wallet browser extensions discovered stealing private keys and draining wallets.

**Attack Details:**
- Fake extensions mimicking MetaMask, Coinbase Wallet, and other popular wallets
- Distributed through browser extension stores
- Steal private keys upon installation
- Over 1.7 million downloads before removal

**Mitigation:**
- Only install extensions from official sources
- Verify extension publisher and reviews
- Use hardware wallets for significant holdings
- Regularly audit installed browser extensions`,
    summary: '40+ fake wallet extensions stole private keys from 1.7M+ users through browser stores.',
    category: 'personal-protection',
    tags: ['fake-extensions', 'metamask', 'coinbase', 'browser', 'phishing'],
    severity: 'high',
    publishedAt: new Date('2025-07-20T10:00:00Z'),
    affectedTechnologies: ['Browser Extensions', 'MetaMask', 'Coinbase Wallet'],
    author: 'Browser Security Research'
  },
  {
    id: 'npmjs-help-phishing-2025',
    title: 'npmjs.help Phishing Domain - Web3 Transaction Interception',
    content: `Malicious phishing domain using obfuscated JavaScript to intercept Web3 transactions and redirect wallet addresses.

**Attack Vector:**
- Domain mimics official npm site
- Obfuscated JavaScript intercepts transactions
- Redirects wallet addresses to attacker-controlled wallets
- Targets developers during package installation

**Mitigation:**
- Always verify domain URLs carefully
- Use DNS security tools
- Implement transaction verification on separate devices
- Report suspicious domains immediately`,
    summary: 'Phishing domain npmjs.help intercepts Web3 transactions using obfuscated JavaScript.',
    category: 'supply-chain',
    tags: ['phishing', 'npm', 'javascript', 'wallet-address', 'domain-spoofing'],
    severity: 'medium',
    publishedAt: new Date('2025-08-12T08:00:00Z'),
    affectedTechnologies: ['npm', 'Web3', 'JavaScript', 'Cryptocurrency Wallets'],
    author: 'Domain Security Watch'
  },
  // === 2024 STATISTICS ARTICLE ===
  {
    id: '2024-threat-landscape',
    title: '2024 Web3 Security Landscape: $2.9B Lost, North Korea Dominates',
    content: `Comprehensive analysis of 2024's Web3 security incidents reveals alarming trends and shifting attack vectors.

**Overall Landscape:**
- **Total Losses:** $2.3-2.9 billion
- **Incident Count:** 200+ hacking incidents
- **Recovery:** Only 7.43% of stolen funds recovered ($105M of $1.4B in DeFi)

**Attack Vector Breakdown:**
- Access Control Exploits: 75-81% of all losses ($1.7B)
- Phishing: $1.05B across 296 incidents (331% increase from 2023)
- Private Key Compromises: $855M across 65 incidents
- Smart Contract Vulnerabilities: Only 14-19% of total losses

**Most Targeted Chains:**
- Ethereum: 403 incidents, $748M in losses
- Bitcoin: $542.7M stolen
- Solana: Major target for rug pulls and memecoin scams

**North Korean Activity:**
- Responsible for $1.34 billion across 47 incidents (>50% of 2024 crypto theft)
- Primary Groups: Lazarus Group, TraderTraitor, Jade Sleet, APT38
- Tactics: Job-themed social engineering, fake GitHub projects, malicious npm packages

**Key Trends:**
- Supply Chain Sophistication: XZ utils-style attacks now targeting Web3 libraries
- CeFi Vulnerability Shift: Centralized services now more targeted than DeFi
- Social Engineering Evolution: "Pig butchering" scams using AI and extended manipulation
- Multisig Isn't Enough: Advanced attacks bypass even hardware wallet + multisig setups`,
    summary: '2024 saw $2.9B in crypto losses with North Korea responsible for over 50% of theft.',
    category: 'web3-security',
    tags: ['statistics', '2024', 'trends', 'north-korea', 'analysis'],
    severity: 'info',
    publishedAt: new Date('2024-12-31T23:59:00Z'),
    affectedTechnologies: ['Ethereum', 'Bitcoin', 'Solana', 'DeFi', 'CeFi'],
    author: 'Web3 Security Alliance'
  },
  {
    id: 'btcturk-hot-wallet-2024',
    title: 'BtcTurk Hot Wallet Compromise - $55M Stolen',
    content: `Turkish crypto exchange suffered hot wallet breach affecting 10 wallets with attackers bypassing multisig protection.

**Attack Details:**
- 10 wallets compromised
- Enough private keys gained to bypass multisig
- All stolen assets belonged to exchange, not customers
- Binance froze $5.3M

**Mitigation:**
- Implement MPC wallets to eliminate single private key risk
- Store majority of funds in cold storage
- Use hardware security modules (HSMs)
- Implement key rotation policies`,
    summary: 'BtcTurk lost $55M via hot wallet compromise that bypassed multisig protection.',
    category: 'web3-security',
    tags: ['btcturk', 'exchange-hack', 'hot-wallet', 'turkey', 'multisig'],
    severity: 'high',
    publishedAt: new Date('2024-06-22T14:00:00Z'),
    affectedTechnologies: ['BtcTurk', 'Hot Wallets', 'Multisig'],
    author: 'Exchange Security Monitor'
  },
  {
    id: 'deltaprime-key-theft-2024',
    title: 'DeltaPrime Private Key Compromise - $5.98M Lost',
    content: `Arbitrum-based DeFi protocol suffered attack due to compromised private keys allowing unauthorized fund transfers.

**Mitigation:**
- Use MPC or multisig, never single private keys
- Implement key management best practices (HSMs, key sharding)
- Deploy monitoring for private key usage
- Rotate keys regularly
- Use different keys for different privilege levels`,
    summary: 'DeltaPrime lost $5.98M on Arbitrum due to private key compromise.',
    category: 'defi-exploits',
    tags: ['deltaprime', 'private-key', 'arbitrum', 'defi'],
    severity: 'high',
    publishedAt: new Date('2024-09-08T11:00:00Z'),
    affectedTechnologies: ['DeltaPrime', 'Arbitrum', 'Private Keys'],
    author: 'DeFi Security Watch'
  },
  {
    id: 'gala-games-mint-2024',
    title: 'Gala Games Deployer Compromise - $216M Malicious Mint',
    content: `Gala Games suffered massive exploit via compromised deployer account leading to unauthorized token minting.

**Attack Details:**
- Deployer account compromised
- $216M worth of GALA tokens minted
- Tokens dumped on market before response

**Mitigation:**
- Implement multisig for deployer accounts
- Use time-locks on minting functions
- Deploy monitoring for admin account activities
- Rotate deployer credentials regularly`,
    summary: 'Gala Games deployer account compromised leading to $216M unauthorized token mint.',
    category: 'web3-security',
    tags: ['gala-games', 'deployer', 'token-minting', 'access-control'],
    severity: 'critical',
    publishedAt: new Date('2024-05-20T16:00:00Z'),
    affectedTechnologies: ['Gala Games', 'GALA Token', 'Deployer Accounts'],
    author: 'Gaming Security Research'
  }
];

export const currentSecurityAlerts: SecurityAlert[] = [
  // Critical 2025 Alerts
  {
    id: 'alert-balancer-2025',
    title: 'CRITICAL: Balancer V2 Exploit - $128M Drained',
    description: 'Precision rounding errors in Composable Stable Pools exploited across multiple chains. Revoke approvals immediately.',
    affectedTechnologies: ['Balancer', 'Ethereum', 'Arbitrum', 'Base', 'Polygon'],
    severity: 'critical',
    alertType: 'exploit',
    createdAt: new Date('2025-11-03T10:00:00Z'),
    actionRequired: true,
    references: ['https://balancer.fi/security']
  },
  {
    id: 'alert-shai-hulud-2025',
    title: 'CRITICAL: Shai-Hulud NPM Supply Chain Attack',
    description: 'Hundreds of npm packages compromised. Rotate all developer credentials immediately. Check for preinstall scripts.',
    affectedTechnologies: ['npm', 'Node.js', 'GitHub', 'AWS', 'Azure'],
    severity: 'critical',
    alertType: 'vulnerability',
    createdAt: new Date('2025-11-21T08:00:00Z'),
    actionRequired: true,
    references: ['https://npmjs.com/security-advisory']
  },
  {
    id: 'alert-aerodrome-2025',
    title: 'CRITICAL: Aerodrome Finance DNS Hijacking',
    description: 'Base network largest DEX DNS compromised. Verify contract addresses before signing any transactions.',
    affectedTechnologies: ['Aerodrome', 'Base Network', 'DNS'],
    severity: 'critical',
    alertType: 'incident',
    createdAt: new Date('2025-11-22T14:00:00Z'),
    actionRequired: true
  },
  // 2024 Alerts
  {
    id: 'alert-solana-web3js-2024',
    title: 'CRITICAL: Solana Web3.js Supply Chain Compromise',
    description: 'Versions 1.95.6-1.95.7 contained backdoor exfiltrating private keys. Update and rotate keys if affected.',
    affectedTechnologies: ['Solana', '@solana/web3.js', 'npm'],
    severity: 'critical',
    alertType: 'vulnerability',
    createdAt: new Date('2024-12-02T20:30:00Z'),
    actionRequired: true,
    cveId: 'CVE-2024-54134',
    references: ['https://solana.com/security']
  },
  {
    id: 'alert-lastpass-ongoing',
    title: 'HIGH: LastPass Breach - Ongoing Crypto Theft',
    description: 'Attackers cracking encrypted vaults from 2022 breach. Never store seeds/keys in password managers. Move funds immediately if affected.',
    affectedTechnologies: ['LastPass', 'Cryptocurrency Wallets'],
    severity: 'high',
    alertType: 'best-practice',
    createdAt: new Date('2024-12-15T10:00:00Z'),
    actionRequired: true
  },
  {
    id: 'alert-north-korea-2024',
    title: 'HIGH: North Korean Cyber Campaign Intensifies',
    description: 'Lazarus Group responsible for $1.34B in 2024. Watch for LinkedIn recruiters, fake job tests, and malicious npm packages.',
    affectedTechnologies: ['LinkedIn', 'npm', 'GitHub', 'Telegram'],
    severity: 'high',
    alertType: 'best-practice',
    createdAt: new Date('2024-12-31T12:00:00Z'),
    actionRequired: false
  },
  {
    id: 'alert-multisig-malware-2024',
    title: 'HIGH: Advanced Multisig UI Manipulation Attacks',
    description: 'Sophisticated malware manipulates Gnosis Safe UI to show fake transactions. Always verify on hardware wallet display.',
    affectedTechnologies: ['Gnosis Safe', 'Multisig Wallets', 'Hardware Wallets'],
    severity: 'high',
    alertType: 'vulnerability',
    createdAt: new Date('2024-10-20T09:00:00Z'),
    actionRequired: true
  },
  {
    id: 'alert-fake-extensions-2025',
    title: 'HIGH: Fake Wallet Extensions in Browser Stores',
    description: '40+ fake MetaMask and Coinbase extensions detected. Only install from official sources and verify publisher.',
    affectedTechnologies: ['Browser Extensions', 'MetaMask', 'Coinbase Wallet'],
    severity: 'high',
    alertType: 'incident',
    createdAt: new Date('2025-07-20T10:00:00Z'),
    actionRequired: true
  },
  {
    id: 'alert-permit-phishing',
    title: 'MEDIUM: Permit Signature Phishing Campaigns Active',
    description: 'Attackers tricking users into signing permit signatures for token access. Always verify what you sign.',
    affectedTechnologies: ['ERC-20 Permits', 'Web3 Wallets'],
    severity: 'medium',
    alertType: 'best-practice',
    createdAt: new Date('2024-09-30T08:00:00Z'),
    actionRequired: false
  },
  {
    id: 'alert-oracle-manipulation',
    title: 'MEDIUM: Oracle Manipulation Attacks Increasing',
    description: 'Multiple DeFi protocols hit by oracle manipulation. Use TWAP and multiple data sources.',
    affectedTechnologies: ['Price Oracles', 'DeFi Protocols'],
    severity: 'medium',
    alertType: 'best-practice',
    createdAt: new Date('2025-11-15T14:00:00Z'),
    actionRequired: false
  }
];
