import React from 'react';

// Article content components - separated from metadata for better code organization
// Each article content is a React component for flexibility

interface ArticleContentProps {
  slug: string;
}

// Content components for high-priority articles
const PrivacySecurityOpsecContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Digital Privacy and Security - Why It Matters in Web3</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Key Takeaways</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Privacy is fundamental to maintaining control of your crypto assets</li>
          <li>On-chain transparency requires deliberate anonymity practices</li>
          <li>OpSec failures are the #1 cause of crypto theft from experienced users</li>
          <li>Your wallet address can reveal more about you than you realize</li>
        </ul>
      </div>
    </div>

    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Understanding Personal Data in Web3</h2>
        <p className="mb-4">In traditional web2, your data is scattered across hundreds of databases. In Web3, the challenge is different: while you control your assets, every transaction you make is permanently recorded on a public ledger.</p>
        <p className="mb-4">Personal data in Web3 includes:</p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Wallet addresses</strong> - Can be linked to your identity through exchange KYC, ENS domains, or social media posts</li>
          <li><strong>Transaction patterns</strong> - When you trade, what you buy, your DeFi positions</li>
          <li><strong>IP addresses</strong> - Logged by RPC providers when you interact with dApps</li>
          <li><strong>On-chain behaviors</strong> - Governance votes, NFT collections, protocol interactions</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">The OpSec Mindset</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <p className="mb-4">Operational Security (OpSec) in crypto means assuming that:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Every link could be a phishing attempt</li>
            <li>Every DM could be from an attacker</li>
            <li>Your public addresses will be analyzed</li>
            <li>Attackers have time, resources, and patience</li>
          </ul>
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <strong className="text-primary">Pro Tip:</strong> Use separate identities for different activities. Your trading wallet shouldn't be linked to your NFT profile or your governance participation.
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Essential OpSec Practices</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Wallet Segregation</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Hot wallet for small daily transactions</li>
              <li>Cold wallet for long-term holdings</li>
              <li>Burner wallet for minting and new protocols</li>
              <li>Trading wallet separate from governance</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Communication Security</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use encrypted messaging (Signal, Session)</li>
              <li>Never share screen with wallet visible</li>
              <li>Disable DMs on Discord by default</li>
              <li>Verify identities through multiple channels</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Privacy-Preserving Techniques</h2>
        <div className="space-y-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Breaking On-Chain Links</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use multiple exchange accounts for deposits/withdrawals</li>
              <li>Consider privacy-focused L2s and chains</li>
              <li>Avoid reusing addresses across identities</li>
              <li>Be aware of amount correlation (don't withdraw exactly what you deposited)</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Infrastructure Privacy</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use private RPC endpoints or run your own node</li>
              <li>VPN or Tor for sensitive transactions</li>
              <li>Browser isolation - separate browser for crypto activities</li>
              <li>Hardware wallet with air-gapped signing when possible</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Conclusion</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <p className="mb-4">Privacy and security in Web3 require constant vigilance. The transparent nature of blockchain makes it both powerful and dangerous - your entire financial history is one wrong move away from being public.</p>
          <p>By implementing these OpSec practices, you significantly reduce your attack surface and protect both your assets and your identity.</p>
        </div>
      </section>
    </div>
  </>
);

const HardwareWalletComparisonContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Choosing the Right Hardware Wallet in 2025</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Quick Comparison</h3>
        <p>Hardware wallets are essential for securing crypto assets over $1,000. This guide compares the top options: Ledger, Trezor, GridPlus, and Keystone.</p>
      </div>
    </div>

    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Why Hardware Wallets Matter</h2>
        <p className="mb-4">Unlike software wallets, hardware wallets keep your private keys offline, protected from malware, phishing, and remote attacks. Even if your computer is compromised, your keys remain secure.</p>
        <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 mb-4">
          <strong className="text-destructive">Warning:</strong> Only buy hardware wallets directly from the manufacturer. Tampered devices from third parties have led to significant losses.
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Top Hardware Wallets Compared</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-card/50 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-4 text-left">Feature</th>
                <th className="p-4 text-left">Ledger Nano X</th>
                <th className="p-4 text-left">Trezor Model T</th>
                <th className="p-4 text-left">GridPlus Lattice1</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50">
                <td className="p-4">Price</td>
                <td className="p-4">$149</td>
                <td className="p-4">$219</td>
                <td className="p-4">$397</td>
              </tr>
              <tr className="border-t border-border/50">
                <td className="p-4">Chains Supported</td>
                <td className="p-4">5,500+</td>
                <td className="p-4">1,800+</td>
                <td className="p-4">EVM chains</td>
              </tr>
              <tr className="border-t border-border/50">
                <td className="p-4">Open Source</td>
                <td className="p-4">Partial</td>
                <td className="p-4">Full</td>
                <td className="p-4">Full</td>
              </tr>
              <tr className="border-t border-border/50">
                <td className="p-4">Best For</td>
                <td className="p-4">Multi-chain users</td>
                <td className="p-4">Privacy-focused</td>
                <td className="p-4">Power users</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Our Recommendations</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Best Overall: Ledger Nano X</h3>
            <p className="mb-3">The widest chain support and proven track record make it ideal for most users. The Bluetooth connectivity allows mobile usage.</p>
            <div className="p-3 bg-primary/10 rounded-lg">
              <strong>Best for:</strong> Multi-chain portfolios, mobile users
            </div>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Best for Privacy: Trezor Model T</h3>
            <p className="mb-3">Fully open-source firmware and hardware. Touchscreen interface with excellent Ethereum DeFi support.</p>
            <div className="p-3 bg-primary/10 rounded-lg">
              <strong>Best for:</strong> Privacy advocates, open-source believers
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Setup Best Practices</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li>Verify package seal and manufacturer authenticity</li>
            <li>Set up on a clean, offline computer if possible</li>
            <li>Generate a new seed phrase - never use a pre-generated one</li>
            <li>Write seed phrase on metal, not paper</li>
            <li>Test recovery before depositing significant funds</li>
            <li>Set up a PIN that's not easily guessable</li>
            <li>Enable passphrase for an additional security layer</li>
          </ol>
        </div>
      </section>
    </div>
  </>
);

const PhishingPreventionContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Understanding Crypto Phishing in 2025</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Threat Landscape</h3>
        <p>Phishing attacks caused over $374 million in crypto losses in 2024. Modern attackers use sophisticated techniques including fake airdrops, compromised Discord servers, and malicious signature requests.</p>
      </div>
    </div>

    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Common Attack Vectors</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🎣 Fake Airdrop Sites</h3>
            <p className="mb-3">Attackers create convincing copies of legitimate DeFi protocols or NFT projects, promoting "exclusive airdrops" through social media ads and compromised accounts.</p>
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <strong>Red Flag:</strong> Any site asking you to connect wallet and sign a transaction to "claim" tokens
            </div>
          </div>
          
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">💬 Discord Compromise</h3>
            <p className="mb-3">Hackers gain access to project Discord servers, then post fake mint links or "emergency migration" notices.</p>
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <strong>Red Flag:</strong> Urgent announcements bypassing normal channels, links from compromised admin accounts
            </div>
          </div>

          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">✍️ Malicious Signatures</h3>
            <p className="mb-3">The most dangerous attacks don't require transactions - they trick you into signing messages that grant approvals or transfer assets.</p>
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <strong>Red Flag:</strong> Requests to sign permits, approvals, or messages you don't fully understand
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Protection Strategies</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Browser Security</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Install Wallet Guard or Pocket Universe for transaction simulation</li>
              <li>Bookmark legitimate sites - never use search results</li>
              <li>Use a dedicated browser profile for crypto</li>
              <li>Enable phishing protection extensions</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Verification Habits</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Check URLs character by character</li>
              <li>Verify announcements on official Twitter</li>
              <li>Never trust DMs - projects don't DM first</li>
              <li>Use transaction simulators before signing</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">What To Do If You're Phished</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Act immediately</strong> - Time is critical for asset recovery</li>
            <li><strong>Transfer remaining assets</strong> to a fresh wallet</li>
            <li><strong>Revoke all approvals</strong> using revoke.cash</li>
            <li><strong>Document everything</strong> for potential law enforcement</li>
            <li><strong>Report the phishing site</strong> to the community</li>
          </ol>
        </div>
      </section>
    </div>
  </>
);

const DeFiHacksAnalysisContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">DeFi Security: Lessons from 2024-2025 Hacks</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Numbers</h3>
        <p>Over $2.1 billion was lost to DeFi exploits in 2024, with bridge hacks and oracle manipulations leading the statistics. Understanding these attacks helps you avoid vulnerable protocols.</p>
      </div>
    </div>

    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Major Attack Categories</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Bridge Exploits</h3>
            <p className="mb-3">Cross-chain bridges remain the highest-value targets. The complexity of verifying state across chains creates numerous attack vectors.</p>
            <p className="text-sm text-muted-foreground">Examples: Ronin ($625M), Wormhole ($320M), Nomad ($190M)</p>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Oracle Manipulation</h3>
            <p className="mb-3">Attackers manipulate price feeds to borrow at artificial values or liquidate positions improperly.</p>
            <p className="text-sm text-muted-foreground">Common in lending protocols using spot prices</p>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Flash Loan Attacks</h3>
            <p className="mb-3">Uncollateralized loans enable complex arbitrage and manipulation within single transactions.</p>
            <p className="text-sm text-muted-foreground">Often combined with oracle or governance exploits</p>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Private Key Compromise</h3>
            <p className="mb-3">Social engineering and operational security failures leading to admin key theft.</p>
            <p className="text-sm text-muted-foreground">Often involves compromised team members</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">How to Evaluate Protocol Security</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Security Checklist Before Depositing</h3>
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Multiple audits</strong> from reputable firms (Trail of Bits, OpenZeppelin, Spearbit)</li>
            <li><strong>Active bug bounty</strong> with significant rewards (Immunefi)</li>
            <li><strong>Time-locked admin functions</strong> with multi-sig requirements</li>
            <li><strong>Transparent team</strong> with verifiable track record</li>
            <li><strong>Battle-tested code</strong> - time since deployment without incidents</li>
            <li><strong>Open-source contracts</strong> - verify what you're interacting with</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Risk Mitigation Strategies</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Diversification</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Spread across multiple protocols</li>
              <li>Limit single protocol exposure to 10-20%</li>
              <li>Consider protocol insurance (Nexus Mutual)</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Active Monitoring</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Follow security researchers on Twitter</li>
              <li>Set up alerts for protocol announcements</li>
              <li>Monitor governance proposals</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </>
);

const SoliditySecurityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Solidity Security Best Practices for 2025</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">For Developers</h3>
        <p>This comprehensive guide covers essential security patterns, common vulnerabilities, and best practices for writing secure Ethereum smart contracts in Solidity.</p>
      </div>
    </div>

    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Critical Vulnerability Patterns</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Reentrancy</h3>
            <p className="mb-3">The most famous vulnerability - the DAO hack exploited this in 2016. Occurs when external calls allow attackers to re-enter the function before state is updated.</p>
            <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm mb-3">
              <p>// WRONG: External call before state update</p>
              <p>function withdraw() external {'{'}</p>
              <p>  payable(msg.sender).transfer(balance);</p>
              <p>  balance = 0; // Too late!</p>
              <p>{'}'}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <strong>Solution:</strong> Use Checks-Effects-Interactions pattern and ReentrancyGuard
            </div>
          </div>
          
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Access Control Failures</h3>
            <p className="mb-3">Missing or incorrect access modifiers allowing unauthorized function calls.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use OpenZeppelin's AccessControl or Ownable</li>
              <li>Implement role-based permissions for sensitive functions</li>
              <li>Test all privilege escalation paths</li>
            </ul>
          </div>

          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Oracle Manipulation</h3>
            <p className="mb-3">Using manipulable price sources (spot prices, low-liquidity pools) for critical operations.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use time-weighted average prices (TWAP)</li>
              <li>Integrate Chainlink or other decentralized oracles</li>
              <li>Implement price deviation checks</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Development Best Practices</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Code Quality</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use latest stable Solidity version</li>
              <li>Follow the style guide</li>
              <li>Comprehensive NatSpec documentation</li>
              <li>Keep functions small and focused</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Testing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>100% code coverage target</li>
              <li>Fuzz testing with Foundry/Echidna</li>
              <li>Invariant testing for key properties</li>
              <li>Fork testing against mainnet state</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Security Tooling</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Slither</strong> - Static analysis for common vulnerability patterns</li>
            <li><strong>Mythril</strong> - Symbolic execution and security analysis</li>
            <li><strong>Echidna</strong> - Property-based fuzzing</li>
            <li><strong>Foundry</strong> - Fast testing framework with built-in fuzzing</li>
            <li><strong>Certora Prover</strong> - Formal verification</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Seed Phrase Security Content
const SeedPhraseSecurityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Protecting Your Crypto's Master Key</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Critical Warning</h3>
        <p>Your seed phrase (12 or 24 words) is the <strong>only</strong> way to recover your wallet. Lose it, and you lose everything. Share it, and you've handed over your assets.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Storage Best Practices</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">✅ DO</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Write on metal plates (fire/water resistant)</li>
              <li>Store in multiple secure locations</li>
              <li>Use Shamir Secret Sharing for large holdings</li>
              <li>Test recovery before significant deposits</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">❌ DON'T</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Store digitally (screenshots, notes apps, cloud)</li>
              <li>Email or message to yourself</li>
              <li>Take photos of your seed phrase</li>
              <li>Store in a single location</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Metal Backup Options</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Cryptosteel Capsule</strong> - Letter tiles in stainless steel tube</li>
            <li><strong>Billfodl</strong> - Stamped metal plates</li>
            <li><strong>DIY stamping</strong> - Titanium or stainless steel with letter stamps</li>
          </ul>
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <strong className="text-primary">Pro Tip:</strong> Test your metal backup survives fire and water before relying on it.
          </div>
        </div>
      </section>
    </div>
  </>
);

// Token Approval Revocation Content
const RevokeApprovalContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Why Token Approvals Are Dangerous</h2>
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 mb-6">
        <p>When you approve a token for a dApp, you're giving permission to move your tokens. <strong>Unlimited approvals</strong> let contracts drain your entire balance - even months later.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How to Check & Revoke Approvals</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-4">
            <li><strong>Visit Revoke.cash</strong> - Connect your wallet to see all active approvals</li>
            <li><strong>Sort by Risk</strong> - Look for "Unlimited" approvals on valuable tokens</li>
            <li><strong>Revoke Suspicious Approvals</strong> - Click revoke and confirm the transaction</li>
            <li><strong>Set Limited Approvals</strong> - For future interactions, approve only what you need</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Revocation Tools</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold mb-2">Revoke.cash</h3>
            <p className="text-sm text-muted-foreground">Multi-chain support, easy interface</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold mb-2">Etherscan Token Approvals</h3>
            <p className="text-sm text-muted-foreground">Ethereum-focused, official tool</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold mb-2">DeBank</h3>
            <p className="text-sm text-muted-foreground">Portfolio tracking with approvals</p>
          </div>
        </div>
      </section>
    </div>
  </>
);

// Flash Loan Attack Content
const FlashLoanContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Understanding Flash Loan Attacks</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">What Are Flash Loans?</h3>
        <p>Flash loans allow borrowing millions in crypto with no collateral - as long as you repay in the same transaction. Attackers use this to manipulate prices and exploit protocols.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Attack Pattern</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li>Borrow millions from flash loan provider (Aave, dYdX)</li>
            <li>Manipulate a price oracle or AMM pool</li>
            <li>Exploit the target protocol at manipulated price</li>
            <li>Repay the flash loan with profit</li>
            <li>Keep the stolen funds</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Notable Flash Loan Attacks</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">bZx (2020)</h3>
            <p className="text-sm text-muted-foreground">$8M stolen through price manipulation</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">Pancake Bunny (2021)</h3>
            <p className="text-sm text-muted-foreground">$45M through flash loan + price oracle</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Protection for Users</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Use protocols with TWAP oracles (not spot prices)</li>
            <li>Check if the protocol has flash loan protection</li>
            <li>Prefer battle-tested protocols over new forks</li>
            <li>Don't deposit more than you can afford to lose</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// 2FA Security Content
const TwoFactorAuthContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication for Crypto</h2>
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 mb-6">
        <h3 className="font-bold mb-2">⚠️ SMS 2FA Is Not Safe</h3>
        <p>SIM swap attacks make SMS-based 2FA vulnerable. Hackers have stolen millions by convincing carriers to transfer phone numbers.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">2FA Methods Ranked</h2>
        <div className="space-y-4">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
            <h3 className="font-semibold text-green-400">🏆 Hardware Keys (YubiKey)</h3>
            <p className="text-sm">Most secure. Physical device required for login. Phishing resistant.</p>
          </div>
          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
            <h3 className="font-semibold text-blue-400">✅ Authenticator Apps (Authy, Google Authenticator)</h3>
            <p className="text-sm">Good security. Time-based codes. Keep backup codes safe!</p>
          </div>
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <h3 className="font-semibold text-red-400">❌ SMS 2FA</h3>
            <p className="text-sm">Vulnerable to SIM swaps. Only use if nothing else is available.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Setup Recommendations</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Use YubiKey for exchange accounts (Coinbase, Kraken, Binance support it)</li>
            <li>Backup your authenticator app - Authy allows cloud backup</li>
            <li>Store backup codes in your password manager</li>
            <li>Remove your phone number from exchange accounts if possible</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// NFT Marketplace Security Content
const NFTMarketplaceContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Safe Trading on NFT Marketplaces</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <p>NFT marketplaces handle valuable digital assets. Understanding their security features and risks is essential for safe trading.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Platform-Specific Tips</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">OpenSea</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Check the blue verified checkmark on collections</li>
              <li>Review transaction details before signing</li>
              <li>Be wary of "hidden" items in your profile</li>
              <li>Use the "Hide" feature for suspicious airdrops</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Blur</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Understand bid pool mechanics</li>
              <li>Be cautious with trait bidding</li>
              <li>Check floor price volatility before bidding</li>
              <li>Review all collection offers before accepting</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Common NFT Trading Scams</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Fake collection listings</strong> - Always verify contract address</li>
            <li><strong>Hidden listing attacks</strong> - Attackers accept your old listings at low prices</li>
            <li><strong>Wash trading</strong> - Artificial volume to inflate prices</li>
            <li><strong>Airdrop phishing</strong> - Malicious NFTs that trigger drainers when interacted</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Incident Response Content
const IncidentResponseContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Emergency Response for Wallet Compromise</h2>
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 mb-6">
        <h3 className="font-bold mb-2">🚨 Time Is Critical</h3>
        <p>If you suspect your wallet is compromised, every second counts. Act immediately using this playbook.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Immediate Actions (First 5 Minutes)</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Transfer remaining assets</strong> to a NEW wallet (never compromised device)</li>
            <li><strong>Revoke all approvals</strong> on revoke.cash immediately</li>
            <li><strong>Check all chains</strong> - ETH, Polygon, Arbitrum, BSC, etc.</li>
            <li><strong>Move NFTs</strong> - Use setApprovalForAll=false if possible</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">After Securing Remaining Assets</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Document everything (screenshots, transaction hashes)</li>
            <li>Report to local authorities (for insurance/legal purposes)</li>
            <li>File reports with blockchain forensics (Chainalysis, TRM Labs)</li>
            <li>Alert the community (prevent others from falling victim)</li>
            <li>Change all related passwords</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Prevention for Next Time</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Use hardware wallet for significant holdings</li>
            <li>Enable transaction simulation (Wallet Guard, Pocket Universe)</li>
            <li>Never share your screen with wallet visible</li>
            <li>Regularly audit and revoke old approvals</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Layer 2 Security Content
const Layer2SecurityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Security on Layer 2 Networks</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <p>Layer 2 solutions offer faster, cheaper transactions but introduce new security considerations. Understand the tradeoffs before bridging significant funds.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">L2 Risk Factors</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Sequencer Centralization</h3>
            <p className="text-sm text-muted-foreground mb-3">Most L2s run single sequencers. Downtime means no transactions.</p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>Arbitrum, Optimism have single sequencers</li>
              <li>zkSync Era is also centralized currently</li>
              <li>Decentralization is on roadmaps but not implemented</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Bridge Risks</h3>
            <p className="text-sm text-muted-foreground mb-3">Bridges are the weak link. Most major hacks target bridges.</p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>Use native bridges when possible</li>
              <li>Avoid new/unaudited third-party bridges</li>
              <li>Don't bridge more than you need</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">L2 Security Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-card/50 rounded-lg overflow-hidden text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left">Network</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Withdrawal Time</th>
                <th className="p-3 text-left">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50">
                <td className="p-3">Arbitrum</td>
                <td className="p-3">Optimistic</td>
                <td className="p-3">~7 days</td>
                <td className="p-3">🟡 Medium</td>
              </tr>
              <tr className="border-t border-border/50">
                <td className="p-3">Optimism</td>
                <td className="p-3">Optimistic</td>
                <td className="p-3">~7 days</td>
                <td className="p-3">🟡 Medium</td>
              </tr>
              <tr className="border-t border-border/50">
                <td className="p-3">zkSync Era</td>
                <td className="p-3">ZK Rollup</td>
                <td className="p-3">~24 hours</td>
                <td className="p-3">🟡 Medium</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </>
);

// Hot vs Cold Wallet Content
const HotVsColdWalletContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Understanding the Wallet Security Spectrum</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Core Tradeoff</h3>
        <p>Hot wallets prioritize convenience while cold wallets prioritize security. Most users need both - the key is understanding when to use each.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Hot Wallets Explained</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <p className="mb-4">Hot wallets are connected to the internet, making them convenient for daily transactions but more vulnerable to attacks.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-green-400">✅ Pros</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Instant access to funds</li>
                <li>Easy dApp interactions</li>
                <li>Free to use</li>
                <li>Browser integration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-red-400">❌ Cons</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Vulnerable to malware</li>
                <li>Phishing attacks possible</li>
                <li>Browser extension risks</li>
                <li>Not for large holdings</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Cold Wallets Explained</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <p className="mb-4">Cold wallets store private keys offline, providing maximum security for long-term holdings.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-green-400">✅ Pros</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Keys never touch internet</li>
                <li>Immune to remote attacks</li>
                <li>Physical confirmation required</li>
                <li>Ideal for HODL strategy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-red-400">❌ Cons</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Upfront cost ($50-400)</li>
                <li>Less convenient for trading</li>
                <li>Physical device management</li>
                <li>Learning curve</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Recommended Multi-Wallet Strategy</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Hot wallet:</strong> 5-10% of holdings for daily use and small dApp interactions</li>
            <li><strong>Cold wallet:</strong> 80-90% of holdings for long-term storage</li>
            <li><strong>Burner wallet:</strong> Small amounts for minting and testing new protocols</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// MetaMask Security Settings Content
const MetaMaskSecurityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Hardening Your MetaMask Installation</h2>
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 mb-6">
        <h3 className="font-bold mb-2">⚠️ Default Settings Are Not Secure</h3>
        <p>MetaMask's default configuration prioritizes usability over security. These changes significantly reduce your attack surface.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Essential Security Settings</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Enable Hardware Wallet:</strong> Go to Settings → Advanced → Enable hardware wallet support</li>
            <li><strong>Disable Incoming Transactions:</strong> Settings → Security → Show incoming transactions OFF</li>
            <li><strong>Lock Timer:</strong> Set auto-lock to 1-5 minutes in Settings → Security</li>
            <li><strong>Phishing Detection:</strong> Ensure Settings → Security → Phishing detection is ON</li>
            <li><strong>Privacy Mode:</strong> Enable Settings → Security → Privacy mode</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Managing Connected Sites</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <p className="mb-4">Regularly review and revoke site permissions:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Click the three dots → Connected sites</li>
            <li>Review each connected site</li>
            <li>Disconnect sites you don't recognize or use</li>
            <li>Check weekly - sites can be added during transactions</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Advanced Protection</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Transaction Simulation</h3>
            <p className="text-sm">Install Wallet Guard or Pocket Universe browser extensions to simulate transactions before signing.</p>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Browser Profile</h3>
            <p className="text-sm">Use a dedicated browser profile for crypto - no other extensions, no casual browsing.</p>
          </div>
        </div>
      </section>
    </div>
  </>
);

// Multi-Signature Wallet Content
const MultiSigWalletContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Multi-Signature Wallets: Security Through Consensus</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">What is Multi-Sig?</h3>
        <p>A multi-signature wallet requires multiple private keys to authorize transactions. Common setups include 2-of-3 (any 2 of 3 keys) or 3-of-5 for organizations.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Popular Multi-Sig Solutions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Safe (Gnosis Safe)</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Most battle-tested multi-sig</li>
              <li>$100B+ in assets secured</li>
              <li>Multi-chain support</li>
              <li>Rich DeFi integration</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Squads (Solana)</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Native Solana multi-sig</li>
              <li>Program upgrade management</li>
              <li>Treasury management features</li>
              <li>Active governance tools</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Recommended Configurations</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Personal high-value:</strong> 2-of-3 with hardware wallets at different locations</li>
            <li><strong>Small team/DAO:</strong> 3-of-5 with geographic distribution</li>
            <li><strong>Protocol treasury:</strong> 4-of-7 or higher with timelock delays</li>
          </ul>
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <strong className="text-primary">Pro Tip:</strong> Always test your multi-sig setup with small amounts before depositing significant funds.
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Key Management Best Practices</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li>Never store all keys in the same location</li>
            <li>Use different hardware wallet models for redundancy</li>
            <li>Document your recovery procedures</li>
            <li>Test key recovery annually</li>
            <li>Consider social recovery or M-of-N distribution</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Ice Phishing Content
const IcePhishingContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Ice Phishing: The Silent Approval Attack</h2>
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 mb-6">
        <h3 className="font-bold mb-2">🧊 Why "Ice" Phishing?</h3>
        <p>Unlike traditional phishing that steals credentials, ice phishing tricks you into signing approvals that give attackers permission to drain your wallet - often weeks or months later.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How Ice Phishing Works</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li>Attacker creates a fake dApp or compromises a legitimate one</li>
            <li>You connect your wallet to interact with the "service"</li>
            <li>You're prompted to sign an approval or permit</li>
            <li>The signature grants the attacker unlimited access to your tokens</li>
            <li>Attacker drains your wallet at their convenience</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Dangerous Signature Types</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">approve() / setApprovalForAll()</h3>
            <p className="text-sm text-muted-foreground">Grants permission to move your ERC-20 tokens or all NFTs in a collection</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">permit() signatures</h3>
            <p className="text-sm text-muted-foreground">Off-chain signature that creates on-chain approval - no gas means no obvious transaction</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Seaport/OpenSea orders</h3>
            <p className="text-sm text-muted-foreground">Complex order signatures that can list NFTs at 0 ETH</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">eth_sign</h3>
            <p className="text-sm text-muted-foreground">Raw message signing - extremely dangerous, can sign anything</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Protection Strategies</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Read before signing:</strong> Understand every approval request</li>
            <li><strong>Transaction simulation:</strong> Use Wallet Guard or Pocket Universe</li>
            <li><strong>Limited approvals:</strong> Only approve exact amounts needed</li>
            <li><strong>Regular revocation:</strong> Clean up old approvals monthly</li>
            <li><strong>Separate wallets:</strong> Keep valuable assets in wallets that don't interact with dApps</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Fake Airdrop Scams Content
const FakeAirdropContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Spotting Fake Airdrop Scams</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Airdrop Trap</h3>
        <p>Scammers exploit the excitement around legitimate airdrops by creating convincing fakes. The promise of free money overrides victims' security instincts.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Red Flags of Fake Airdrops</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Urgency:</strong> "Claim in the next 2 hours or lose your tokens"</li>
            <li><strong>Upfront payment:</strong> Legitimate airdrops never require payment to claim</li>
            <li><strong>Seed phrase requests:</strong> No legitimate service will ever ask for your seed phrase</li>
            <li><strong>Unknown tokens:</strong> Tokens appearing in your wallet without explanation</li>
            <li><strong>Social media DMs:</strong> Real projects don't announce exclusive airdrops via DM</li>
            <li><strong>Too good to be true:</strong> Claims of massive allocations ($10K+) without prior engagement</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">How to Verify Legitimate Airdrops</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li>Check the official project Twitter/X (look for verification and follower count)</li>
            <li>Verify announcements on official Discord from admins</li>
            <li>Compare URLs character by character with official sources</li>
            <li>Search the project on reputable news sites</li>
            <li>Check if credible influencers have confirmed the airdrop</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Safe Claiming Practices</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">✅ DO</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Use official links from verified sources</li>
              <li>Bookmark legitimate claim sites</li>
              <li>Use a separate wallet for claiming</li>
              <li>Simulate transactions before signing</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">❌ DON'T</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Click links from DMs or ads</li>
              <li>Rush due to artificial urgency</li>
              <li>Connect wallets with significant holdings</li>
              <li>Sign messages you don't understand</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </>
);

// Discord Crypto Scams Content
const DiscordScamsContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Discord Security for Crypto Users</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Discord Threat Landscape</h3>
        <p>Discord is essential for crypto communities but has become a hunting ground for scammers. Server compromises, fake DMs, and malicious bots have led to millions in losses.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Common Discord Attack Vectors</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-400">🔴 Server Takeovers</h3>
            <p className="text-sm mt-2">Hackers compromise admin accounts and post fake mint links. Often happens during high-profile launches when urgency is high.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-400">🟠 Fake DMs</h3>
            <p className="text-sm mt-2">Scammers impersonate mods or team members, offering "exclusive opportunities" or pretending to help with support issues.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-400">🟡 Malicious Bots</h3>
            <p className="text-sm mt-2">Fake verification bots that steal tokens or request wallet signatures. Sometimes added to servers after compromise.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Essential Discord Security Settings</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Disable DMs from server members:</strong> Settings → Privacy & Safety → Allow DMs OFF</li>
            <li><strong>Enable 2FA:</strong> Settings → My Account → Enable 2FA (use authenticator app, not SMS)</li>
            <li><strong>Scan messages:</strong> Keep "Scan direct messages" enabled</li>
            <li><strong>Verify links:</strong> Check URLs before clicking, even from "official" channels</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Server Compromise Indicators</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li>Announcements from unusual times or with typos</li>
            <li>Mint links that bypass normal verification</li>
            <li>Urgent "emergency migration" notices</li>
            <li>Links that don't match official domain</li>
            <li>Missing or deleted messages after announcements</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Honeypot Tokens Content
const HoneypotTokensContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Detecting Honeypot Tokens</h2>
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 mb-6">
        <h3 className="font-bold mb-2">🍯 The Honeypot Trap</h3>
        <p>A honeypot token allows you to buy but prevents selling. The contract is coded to only allow the creator to sell while trapping everyone else's funds.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How Honeypots Work</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li>Scammer deploys a token with hidden sell restrictions</li>
            <li>They create a liquidity pool and generate fake hype</li>
            <li>Victims buy in, seeing the price "pump"</li>
            <li>Victims cannot sell - transactions fail or revert</li>
            <li>Scammer eventually drains liquidity and disappears</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Detection Tools</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">TokenSniffer</h3>
            <p className="text-sm text-muted-foreground">Automated scam detection with contract analysis</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Honeypot.is</h3>
            <p className="text-sm text-muted-foreground">Simulates buy/sell to detect sell restrictions</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">DEXTools</h3>
            <p className="text-sm text-muted-foreground">Charts with contract audit indicators</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">GoPlus Security</h3>
            <p className="text-sm text-muted-foreground">API for automated security checks</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Red Flags to Watch</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Unverified contract on block explorer</li>
            <li>Hidden or obfuscated contract code</li>
            <li>High buy tax but "reasonable" sell tax shown</li>
            <li>Only the creator wallet has successful sells</li>
            <li>Massive marketing but no real utility</li>
            <li>Team members are anonymous with no history</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Rug Pull Warning Signs Content
const RugPullWarningsContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Identifying Rug Pull Projects Early</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">What is a Rug Pull?</h3>
        <p>A rug pull occurs when project creators abandon a project after attracting investor funds, either by draining liquidity, selling their tokens, or simply disappearing.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Top 10 Rug Pull Warning Signs</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Anonymous team</strong> - No verifiable identities or track records</li>
            <li><strong>Unaudited contracts</strong> - No reputable security audit</li>
            <li><strong>Unlocked liquidity</strong> - LP tokens not locked or short lock periods</li>
            <li><strong>Concentrated ownership</strong> - Top wallets hold majority of supply</li>
            <li><strong>Copied whitepaper</strong> - Plagiarized or vague documentation</li>
            <li><strong>Unrealistic promises</strong> - Guaranteed returns or insane APYs</li>
            <li><strong>Aggressive marketing</strong> - All hype, no substance</li>
            <li><strong>Disabled sells</strong> - Contract modifications that prevent selling</li>
            <li><strong>No GitHub activity</strong> - Claims of development without code</li>
            <li><strong>Paid endorsements</strong> - Only paid influencers shilling</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Due Diligence Checklist</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Verify team identities on LinkedIn and GitHub</li>
            <li>Check if audit is from reputable firms (not paid-for seals)</li>
            <li>Analyze token distribution on Etherscan/BSCScan</li>
            <li>Verify liquidity locks on Unicrypt or Team.Finance</li>
            <li>Review contract for owner-only functions</li>
            <li>Check social media age and organic engagement</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Sandwich Attack Prevention Content
const SandwichAttackContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Understanding Sandwich Attacks</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The MEV Problem</h3>
        <p>Sandwich attacks are a form of MEV (Maximal Extractable Value) where bots detect your pending swap and place transactions before and after yours to profit at your expense.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How Sandwich Attacks Work</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Detection:</strong> MEV bot detects your large pending swap in the mempool</li>
            <li><strong>Front-run:</strong> Bot buys the token first, pushing the price up</li>
            <li><strong>Your trade:</strong> You buy at the inflated price</li>
            <li><strong>Back-run:</strong> Bot sells immediately after you, profiting from the difference</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Protection Strategies</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Slippage Settings</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Set tight slippage (0.1-0.5%)</li>
              <li>Trade fails if price moves too much</li>
              <li>Tradeoff: may need retry on volatile pairs</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Private RPCs</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Flashbots Protect</li>
              <li>MEV Blocker</li>
              <li>Hides transactions from public mempool</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">MEV-Resistant DEXs</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>CoW Swap:</strong> Batch auctions prevent front-running</li>
            <li><strong>1inch Fusion:</strong> MEV protection built-in</li>
            <li><strong>UniswapX:</strong> Off-chain orders with MEV protection</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Reentrancy Attack Content
const ReentrancyAttackContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Reentrancy: The Attack That Changed Ethereum</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The DAO Hack Legacy</h3>
        <p>In 2016, a reentrancy exploit drained $60M from The DAO, leading to Ethereum's controversial hard fork. This vulnerability remains one of the most common causes of smart contract losses.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How Reentrancy Works</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <p className="mb-4">Reentrancy occurs when a contract calls an external contract before updating its own state:</p>
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm mb-4">
            <p className="text-red-400">// VULNERABLE CODE</p>
            <p>function withdraw() public {'{'}</p>
            <p>  uint amount = balances[msg.sender];</p>
            <p>  msg.sender.call{'{'}value: amount{'}'}("");</p>
            <p>  balances[msg.sender] = 0; // Too late!</p>
            <p>{'}'}</p>
          </div>
          <p>The attacker's fallback function calls withdraw() again before the balance is set to 0, draining funds repeatedly.</p>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Prevention Patterns</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Checks-Effects-Interactions</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Check conditions first</li>
              <li>Update state (effects) second</li>
              <li>External calls last</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">ReentrancyGuard</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Use OpenZeppelin's modifier</li>
              <li>Locks function during execution</li>
              <li>Prevents re-entry mid-call</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Notable Reentrancy Attacks</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-card/50 rounded-lg overflow-hidden text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left">Protocol</th>
                <th className="p-3 text-left">Year</th>
                <th className="p-3 text-left">Loss</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50"><td className="p-3">The DAO</td><td className="p-3">2016</td><td className="p-3">$60M</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Uniswap + Lendf.Me</td><td className="p-3">2020</td><td className="p-3">$25M</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Curve Finance</td><td className="p-3">2023</td><td className="p-3">$62M</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </>
);

// SIM Swap Prevention Content
const SimSwapContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">SIM Swap Attacks: Hijacking Your Phone Number</h2>
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 mb-6">
        <h3 className="font-bold mb-2">📱 Your Phone Number Is Not Secure</h3>
        <p>Attackers can convince your carrier to transfer your number to their SIM, bypassing SMS 2FA and password resets. Crypto users are primary targets.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How SIM Swaps Work</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Reconnaissance:</strong> Attacker gathers your personal information</li>
            <li><strong>Social Engineering:</strong> Calls carrier pretending to be you</li>
            <li><strong>Transfer:</strong> Convinces carrier to activate new SIM</li>
            <li><strong>Account Takeover:</strong> Receives your SMS codes, resets passwords</li>
            <li><strong>Drain Accounts:</strong> Accesses exchanges, wallets, email</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Protection Measures</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Carrier Security</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Set up a carrier PIN/password</li>
              <li>Enable port-out protection</li>
              <li>Request in-store only SIM changes</li>
              <li>Use carrier's fraud alert service</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Remove Phone Dependency</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Remove phone from exchange accounts</li>
              <li>Use hardware keys (YubiKey) for 2FA</li>
              <li>Use authenticator apps, not SMS</li>
              <li>Consider a Google Voice number for less critical accounts</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Warning Signs</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li>Sudden loss of cell service</li>
            <li>"SIM not provisioned" error</li>
            <li>Unexpected password reset emails</li>
            <li>Notifications about account changes you didn't make</li>
          </ul>
          <p className="mt-4 font-semibold">If you notice these signs, contact your carrier immediately and change all passwords from a secure device.</p>
        </div>
      </section>
    </div>
  </>
);

// Social Engineering Content
const SocialEngineeringContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">The Psychology of Crypto Scams</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Why Smart People Fall for Scams</h3>
        <p>Social engineering exploits human psychology, not technical vulnerabilities. Understanding these tactics is your best defense - intelligence alone won't protect you.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Psychological Triggers Exploited</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-400">⏰ Urgency</h3>
            <p className="text-sm mt-2">"Mint closes in 10 minutes!" - Rushed decisions bypass rational thinking</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-400">👑 Authority</h3>
            <p className="text-sm mt-2">Impersonating Vitalik, CZ, or project admins to add credibility</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-400">👥 Social Proof</h3>
            <p className="text-sm mt-2">Fake screenshots showing others making money, botted engagement</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-400">🎁 Reciprocity</h3>
            <p className="text-sm mt-2">"Here's a free NFT" → Now you owe them (an approval signature)</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-400">😨 Fear</h3>
            <p className="text-sm mt-2">"Your wallet is compromised, click here to secure it"</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-400">💰 Greed</h3>
            <p className="text-sm mt-2">"1000% APY guaranteed!" - Too good to be true IS too good to be true</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Building Mental Defenses</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Pause before acting:</strong> If something creates urgency, wait 24 hours</li>
            <li><strong>Verify independently:</strong> Check official channels, not the link you received</li>
            <li><strong>Assume DMs are scams:</strong> Legitimate projects don't DM first</li>
            <li><strong>Trust your gut:</strong> If something feels off, it probably is</li>
            <li><strong>Use the money test:</strong> Would you send $10K to this address? Then don't connect your wallet either</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// CEX Security Content
const CexSecurityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Securing Your Exchange Accounts</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Not Your Keys, Not Your Crypto</h3>
        <p>While self-custody is ideal, many users need centralized exchanges. If you use CEXs, implement maximum security measures.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Essential CEX Security Setup</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Hardware 2FA:</strong> Use YubiKey, not SMS or authenticator apps</li>
            <li><strong>Withdrawal whitelist:</strong> Only allow withdrawals to pre-approved addresses</li>
            <li><strong>Anti-phishing code:</strong> Set a unique code that appears in all real emails</li>
            <li><strong>Separate email:</strong> Unique email address used only for the exchange</li>
            <li><strong>IP whitelisting:</strong> If available, restrict logins to known IPs</li>
            <li><strong>Withdrawal delay:</strong> Enable 24-48 hour delay for new addresses</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">API Key Security</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <p className="mb-4">API keys are high-value targets. If you use trading bots:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Never enable withdrawal permissions unless absolutely necessary</li>
            <li>Restrict to specific IP addresses</li>
            <li>Set trading pair restrictions</li>
            <li>Rotate keys regularly</li>
            <li>Never share keys or paste them into untrusted sites</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Which Exchange Features to Enable</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 p-4 rounded-lg text-center">
            <h3 className="font-semibold text-green-400">✅ Enable</h3>
            <p className="text-sm mt-2">All security features, 2FA, whitelists, delays</p>
          </div>
          <div className="bg-yellow-500/10 p-4 rounded-lg text-center">
            <h3 className="font-semibold text-yellow-400">⚠️ Careful</h3>
            <p className="text-sm mt-2">API access - only with restrictions</p>
          </div>
          <div className="bg-red-500/10 p-4 rounded-lg text-center">
            <h3 className="font-semibold text-red-400">❌ Avoid</h3>
            <p className="text-sm mt-2">SMS 2FA, unrestricted APIs</p>
          </div>
        </div>
      </section>
    </div>
  </>
);

// Mobile Wallet Security Content
const MobileWalletSecurityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Mobile Crypto Wallet Security</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Your Phone Is a High-Value Target</h3>
        <p>Mobile wallets offer convenience but introduce unique attack vectors. Device security, app permissions, and network safety all matter.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Device Hardening</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">iOS Security</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Enable Face ID/Touch ID for wallet apps</li>
              <li>Keep iOS updated</li>
              <li>Disable lock screen notifications for crypto apps</li>
              <li>Use Lockdown Mode if high-value target</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Android Security</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Only install from Google Play Store</li>
              <li>Enable Google Play Protect</li>
              <li>Use app lock features</li>
              <li>Avoid rooted devices for crypto</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Safe Mobile Wallet Practices</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Use a dedicated phone for high-value crypto operations</li>
            <li>Avoid public WiFi - use mobile data or VPN</li>
            <li>Disable Bluetooth when not in use</li>
            <li>Verify wallet app authenticity before installing</li>
            <li>Keep only daily-use amounts in mobile wallets</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Recommended Mobile Wallets</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold">Trust Wallet</h3>
            <p className="text-sm text-muted-foreground">Multi-chain, WalletConnect</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold">Phantom</h3>
            <p className="text-sm text-muted-foreground">Solana-focused, clean UX</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold">Rainbow</h3>
            <p className="text-sm text-muted-foreground">Ethereum, great for NFTs</p>
          </div>
        </div>
      </section>
    </div>
  </>
);

// DAO Governance Attacks Content
const DaoGovernanceContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">DAO Governance Security</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Decentralized Doesn't Mean Secure</h3>
        <p>DAO governance mechanisms can be exploited through flash loan voting, malicious proposals, and quorum manipulation. The Beanstalk hack showed how devastating these attacks can be.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Common Governance Attack Vectors</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-400">🔴 Flash Loan Voting</h3>
            <p className="text-sm mt-2">Borrow millions in governance tokens, pass malicious proposal, drain treasury, repay loan - all in one transaction. Beanstalk lost $182M this way.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-400">🟠 Malicious Proposals</h3>
            <p className="text-sm mt-2">Proposals that look benign but contain hidden function calls or upgrade malicious code.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-400">🟡 Quorum Attacks</h3>
            <p className="text-sm mt-2">Passing proposals when legitimate voters are inactive or during unusual times.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Governance Security Best Practices</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Time-locks:</strong> Mandatory delay between proposal passing and execution</li>
            <li><strong>Snapshot voting:</strong> Base voting power on historical snapshots</li>
            <li><strong>Multi-day voting:</strong> Extend voting periods to prevent flash attacks</li>
            <li><strong>Security council:</strong> Veto power for obviously malicious proposals</li>
            <li><strong>Code review:</strong> Mandatory review of proposal code by security team</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">For DAO Participants</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Read proposals carefully - don't just vote based on titles</li>
            <li>Verify proposal code matches description</li>
            <li>Be wary of rushed voting timelines</li>
            <li>Delegate to security-conscious representatives</li>
            <li>Report suspicious proposals to security teams</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Default placeholder content for articles not yet fully written
const PlaceholderContent = ({ title }: { title: string }) => (
  <div className="mb-8">
    <div className="bg-card/50 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-muted-foreground mb-4">This comprehensive guide covers essential security practices and actionable recommendations for protecting your crypto assets.</p>
      <div className="space-y-4">
        <div className="bg-primary/10 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">What You'll Learn</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Key security concepts and best practices</li>
            <li>Common attack vectors and how to avoid them</li>
            <li>Practical steps to implement today</li>
            <li>Tools and resources for ongoing protection</li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">Full content coming soon. In the meantime, explore our other security guides or subscribe to our threat alerts to stay informed.</p>
      </div>
    </div>
  </div>
);

// Map slugs to content components
const contentMap: Record<string, React.FC> = {
  'privacy-security-web3-opsec': PrivacySecurityOpsecContent,
  'best-hardware-wallet-2025': HardwareWalletComparisonContent,
  'crypto-phishing-attacks-prevention': PhishingPreventionContent,
  'defi-hacks-2024-2025-analysis': DeFiHacksAnalysisContent,
  'solidity-security-best-practices': SoliditySecurityContent,
  'seed-phrase-security-guide': SeedPhraseSecurityContent,
  'revoke-token-approvals-guide': RevokeApprovalContent,
  'flash-loan-attacks-explained': FlashLoanContent,
  '2fa-crypto-security-guide': TwoFactorAuthContent,
  'nft-marketplace-security': NFTMarketplaceContent,
  'crypto-hack-response-playbook': IncidentResponseContent,
  'layer-2-security-considerations': Layer2SecurityContent,
  'hot-wallet-vs-cold-wallet': HotVsColdWalletContent,
  'metamask-security-settings': MetaMaskSecurityContent,
  'multi-signature-wallet-setup': MultiSigWalletContent,
  'ice-phishing-explained': IcePhishingContent,
  'fake-airdrop-scams': FakeAirdropContent,
  'discord-crypto-scams': DiscordScamsContent,
  'honeypot-tokens-detection': HoneypotTokensContent,
  'rug-pull-warning-signs': RugPullWarningsContent,
  'sandwich-attack-prevention': SandwichAttackContent,
  'reentrancy-attack-prevention': ReentrancyAttackContent,
  'sim-swap-attack-prevention': SimSwapContent,
  'social-engineering-web3': SocialEngineeringContent,
  'cex-security-best-practices': CexSecurityContent,
  'mobile-crypto-wallet-security': MobileWalletSecurityContent,
  'dao-governance-attacks': DaoGovernanceContent,
};

// Main content getter
export const getArticleContent = (slug: string, title: string): React.ReactNode => {
  const ContentComponent = contentMap[slug];
  if (ContentComponent) {
    return <ContentComponent />;
  }
  return <PlaceholderContent title={title} />;
};

// Legacy content compatibility - maps to old articles.tsx
export { articles as legacyArticles } from './articles';
