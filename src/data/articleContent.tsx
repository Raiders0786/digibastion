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

// Oracle Manipulation Content
const OracleManipulationContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Price Oracle Attacks in DeFi</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Oracle Problem</h3>
        <p>DeFi protocols need accurate price data but blockchains can't access external information directly. Price oracles bridge this gap - and are prime attack targets.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How Oracle Manipulation Works</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Identify vulnerable oracle:</strong> Protocol uses spot price from single DEX pool</li>
            <li><strong>Flash loan capital:</strong> Borrow millions to manipulate price</li>
            <li><strong>Manipulate pool:</strong> Large trade moves price significantly</li>
            <li><strong>Exploit protocol:</strong> Borrow at fake collateral value or trigger liquidations</li>
            <li><strong>Profit and repay:</strong> Extract value before price normalizes</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Oracle Types & Security</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-red-500/10 p-6 rounded-lg border border-red-500/20">
            <h3 className="text-xl font-semibold mb-3 text-red-400">❌ Vulnerable Oracles</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Single DEX spot prices</li>
              <li>Low-liquidity pool references</li>
              <li>Non-decentralized price feeds</li>
              <li>Instant price updates</li>
            </ul>
          </div>
          <div className="bg-green-500/10 p-6 rounded-lg border border-green-500/20">
            <h3 className="text-xl font-semibold mb-3 text-green-400">✅ Secure Oracles</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Chainlink decentralized feeds</li>
              <li>TWAP (Time-Weighted Average Price)</li>
              <li>Multiple source aggregation</li>
              <li>Circuit breakers for anomalies</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Notable Oracle Attacks</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-card/50 rounded-lg overflow-hidden text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left">Protocol</th>
                <th className="p-3 text-left">Attack Vector</th>
                <th className="p-3 text-left">Loss</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50"><td className="p-3">Mango Markets</td><td className="p-3">Price manipulation</td><td className="p-3">$114M</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Cream Finance</td><td className="p-3">Oracle manipulation</td><td className="p-3">$130M</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Harvest Finance</td><td className="p-3">Flash loan + oracle</td><td className="p-3">$34M</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">User Protection</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Check what oracle a protocol uses before depositing</li>
            <li>Prefer protocols using Chainlink or similar decentralized oracles</li>
            <li>Be cautious with protocols on low-liquidity tokens</li>
            <li>Monitor protocol documentation for oracle details</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Bridge Security Content
const BridgeSecurityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Cross-Chain Bridge Security</h2>
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 mb-6">
        <h3 className="font-bold mb-2">🌉 Bridges Are High-Value Targets</h3>
        <p>Cross-chain bridges hold billions in locked assets and have complex security models. They've accounted for over $2.5B in hacks since 2021.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Why Bridges Are Vulnerable</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Complexity:</strong> Must verify state across different consensus mechanisms</li>
            <li><strong>Trust assumptions:</strong> Often rely on multisig or validator sets</li>
            <li><strong>Massive TVL:</strong> Single point of failure for billions in assets</li>
            <li><strong>Immature technology:</strong> Cross-chain verification is still evolving</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Major Bridge Hacks</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-400">Ronin Bridge - $625M (2022)</h3>
            <p className="text-sm mt-2">Lazarus Group compromised 5 of 9 validator keys through social engineering. Largest DeFi hack ever.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-400">Wormhole - $320M (2022)</h3>
            <p className="text-sm mt-2">Smart contract bug allowed attacker to mint wrapped ETH without depositing real ETH.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-400">Nomad - $190M (2022)</h3>
            <p className="text-sm mt-2">Faulty upgrade allowed anyone to drain funds - became a "free for all" exploit.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Safe Bridging Practices</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">✅ DO</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Use native bridges when possible</li>
              <li>Bridge smaller amounts at a time</li>
              <li>Check bridge audit history</li>
              <li>Verify bridge TVL and track record</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">❌ DON'T</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Bridge life-changing amounts</li>
              <li>Use new/unaudited bridges</li>
              <li>Ignore bridge security news</li>
              <li>Keep bridged funds you don't need</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </>
);

// Blockchain Privacy Tools Content
const PrivacyToolsContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Blockchain Privacy Solutions in 2025</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Privacy in a Transparent World</h3>
        <p>Blockchain's transparency is a double-edged sword. While it enables trustless verification, it exposes your entire financial history. Privacy tools help you reclaim control.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Privacy Solution Categories</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🔐 Zero-Knowledge Proofs</h3>
            <p className="text-sm text-muted-foreground mb-3">Prove something is true without revealing the underlying data.</p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>zk-SNARKs (Zcash)</li>
              <li>zk-STARKs (StarkNet)</li>
              <li>zkSync shielded transfers</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🌀 Mixing Services</h3>
            <p className="text-sm text-muted-foreground mb-3">Break the link between source and destination addresses.</p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>Tornado Cash (sanctioned)</li>
              <li>Railgun</li>
              <li>Aztec Protocol</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🪙 Privacy Coins</h3>
            <p className="text-sm text-muted-foreground mb-3">Blockchains with built-in privacy features.</p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>Monero (ring signatures)</li>
              <li>Zcash (shielded pools)</li>
              <li>Secret Network (encrypted state)</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🛡️ Private L2s</h3>
            <p className="text-sm text-muted-foreground mb-3">Layer 2 solutions with privacy features.</p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>Aztec Connect</li>
              <li>Polygon Nightfall</li>
              <li>zkBob</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Legal Considerations</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <p className="mb-4">Privacy tools exist in a complex regulatory environment:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Tornado Cash was sanctioned by OFAC in 2022 - US users risk legal issues</li>
            <li>Privacy coins are delisted from many exchanges</li>
            <li>Regulations vary significantly by jurisdiction</li>
            <li>Using privacy tools for legitimate purposes is generally legal</li>
            <li>Always consult local regulations before using mixing services</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Wallet Deanonymization Content
const DeanonymizationContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">How Your Wallet Gets Linked to Your Identity</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Pseudonymous ≠ Anonymous</h3>
        <p>Your wallet address is a pseudonym, not a mask. Blockchain analysis firms can link most addresses to real identities through various techniques.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Deanonymization Techniques</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">📊 Cluster Analysis</h3>
            <p className="text-sm mt-2">Grouping addresses that transact together or share common inputs. If one address is identified, all linked addresses are compromised.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">🏦 Exchange Deposits</h3>
            <p className="text-sm mt-2">When you deposit to a KYC exchange, that address is linked to your identity forever. Analytics can trace backwards.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">📱 ENS & Social Links</h3>
            <p className="text-sm mt-2">Registering an ENS name or posting your address on Twitter permanently links it to your identity.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">⏰ Timing Analysis</h3>
            <p className="text-sm mt-2">Transaction patterns reveal timezone, activity hours, and correlation with real-world events.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Privacy Protection Strategies</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Address segregation:</strong> Use different addresses for different purposes</li>
            <li><strong>Fresh addresses:</strong> Generate new addresses for each incoming transaction</li>
            <li><strong>Avoid round numbers:</strong> $10,000 exactly is more traceable than $10,247</li>
            <li><strong>Time delays:</strong> Don't withdraw immediately after deposits</li>
            <li><strong>VPN/Tor:</strong> Hide IP when interacting with blockchain</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Major Analytics Firms</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold">Chainalysis</h3>
            <p className="text-xs text-muted-foreground">Law enforcement focused</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold">Elliptic</h3>
            <p className="text-xs text-muted-foreground">Bank compliance</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold">TRM Labs</h3>
            <p className="text-xs text-muted-foreground">Exchange KYC</p>
          </div>
        </div>
      </section>
    </div>
  </>
);

// VPN Tor for Crypto Content
const VpnTorContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">VPN & Tor for Cryptocurrency Privacy</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Protecting Your Network Privacy</h3>
        <p>Your IP address reveals your location and can be logged by RPC providers, dApps, and exchanges. VPNs and Tor help protect this layer of privacy.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">VPN vs Tor Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-card/50 rounded-lg overflow-hidden text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left">Feature</th>
                <th className="p-3 text-left">VPN</th>
                <th className="p-3 text-left">Tor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50"><td className="p-3">Speed</td><td className="p-3">Fast</td><td className="p-3">Slow</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Anonymity</td><td className="p-3">Medium</td><td className="p-3">High</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Trust</td><td className="p-3">VPN provider</td><td className="p-3">Network design</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Exchange access</td><td className="p-3">Usually works</td><td className="p-3">Often blocked</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Best for</td><td className="p-3">Daily trading</td><td className="p-3">Sensitive ops</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">VPN Best Practices</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Choose no-log VPN providers (Mullvad, ProtonVPN)</li>
            <li>Pay with crypto for extra privacy</li>
            <li>Enable kill switch to prevent IP leaks</li>
            <li>Avoid free VPNs - you're the product</li>
            <li>Connect to VPN before opening crypto apps</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Warnings & Limitations</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li>Some exchanges ban VPN/Tor connections</li>
            <li>Using VPNs may violate exchange ToS</li>
            <li>VPNs don't hide on-chain activity</li>
            <li>Tor exit nodes can be monitored</li>
            <li>Don't log into personal accounts over Tor</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Blockchain Forensics Content
const BlockchainForensicsContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Blockchain Forensics & Fund Tracing</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">When Crypto Gets Stolen</h3>
        <p>Blockchain forensics can trace stolen funds, but recovery is rarely guaranteed. Understanding the process helps set realistic expectations.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How Forensics Works</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Transaction mapping:</strong> Trace every hop from victim to current location</li>
            <li><strong>Address clustering:</strong> Identify all addresses controlled by the attacker</li>
            <li><strong>Exchange identification:</strong> Find where funds enter KYC platforms</li>
            <li><strong>Evidence packaging:</strong> Prepare reports for law enforcement</li>
            <li><strong>Cooperation requests:</strong> Work with exchanges to freeze funds</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">When to Hire a Forensics Firm</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-500/10 p-6 rounded-lg border border-green-500/20">
            <h3 className="text-xl font-semibold mb-3 text-green-400">✅ Worth It</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>$50K+ stolen</li>
              <li>Insurance claim support needed</li>
              <li>Legal action planned</li>
              <li>Funds haven't been mixed yet</li>
            </ul>
          </div>
          <div className="bg-red-500/10 p-6 rounded-lg border border-red-500/20">
            <h3 className="text-xl font-semibold mb-3 text-red-400">❌ Likely Not Worth It</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Small amounts (&lt;$10K)</li>
              <li>Funds already mixed/bridged</li>
              <li>Attacker in non-cooperative jurisdiction</li>
              <li>Months have passed since theft</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Immediate Steps After Hack</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-2">
            <li>Document all transaction hashes and addresses</li>
            <li>Take screenshots with timestamps</li>
            <li>Report to exchanges (may freeze attacker funds)</li>
            <li>File police report (needed for legal action)</li>
            <li>Contact forensics firm within 24-48 hours</li>
          </ol>
        </div>
      </section>
    </div>
  </>
);

// NPM Supply Chain Content
const NpmSupplyChainContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">NPM Supply Chain Attacks on Crypto</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Dependency Danger</h3>
        <p>Modern crypto projects depend on hundreds of NPM packages. Compromising just one upstream dependency can steal private keys from thousands of applications.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Notable Supply Chain Attacks</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">event-stream (2018)</h3>
            <p className="text-sm mt-2">Malicious code targeting Copay Bitcoin wallet was injected. Stole private keys from affected users.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">ua-parser-js (2021)</h3>
            <p className="text-sm mt-2">Compromised maintainer account pushed cryptominer to millions of downloads per week.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">Ledger Connect Kit (2023)</h3>
            <p className="text-sm mt-2">Compromised NPM package affected multiple DeFi frontends. $600K stolen in hours.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Developer Protection</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Lock file verification:</strong> Always review package-lock.json changes</li>
            <li><strong>Version pinning:</strong> Use exact versions, not ranges</li>
            <li><strong>npm audit:</strong> Run regularly and address vulnerabilities</li>
            <li><strong>Dependency scanning:</strong> Use Snyk, Socket.dev, or similar tools</li>
            <li><strong>Minimal dependencies:</strong> Every package is an attack vector</li>
            <li><strong>Verify maintainers:</strong> Check who has publish rights</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">User Protection</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Use hardware wallets - immune to frontend attacks</li>
            <li>Verify dApp frontends against known-good sources</li>
            <li>Watch for unusual transaction requests after site updates</li>
            <li>Follow security researchers who track supply chain issues</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// RPC Endpoint Security Content
const RpcSecurityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">RPC Endpoint Security</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Your Gateway to the Blockchain</h3>
        <p>Every blockchain interaction goes through an RPC endpoint. Public RPCs are convenient but have privacy and security implications you should understand.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">RPC Privacy Risks</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>IP logging:</strong> RPC providers see your IP with every transaction</li>
            <li><strong>Transaction correlation:</strong> Your pending transactions reveal trading intent</li>
            <li><strong>MEV exposure:</strong> Unencrypted RPCs expose you to sandwich attacks</li>
            <li><strong>Censorship potential:</strong> Providers can choose not to broadcast your transactions</li>
            <li><strong>Data aggregation:</strong> Your entire on-chain activity can be linked to your IP</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">RPC Provider Comparison</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Public RPCs (Infura, Alchemy)</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Free and convenient</li>
              <li>High availability</li>
              <li>IP logging by default</li>
              <li>MEV vulnerable</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Private RPCs</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Flashbots Protect (MEV protection)</li>
              <li>MEV Blocker</li>
              <li>Private transaction submission</li>
              <li>Reduced frontrunning risk</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Running Your Own Node</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <p className="mb-4">For maximum privacy and security, run your own Ethereum node:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Full privacy - no third party sees your transactions</li>
            <li>Censorship resistant - no one can block your transactions</li>
            <li>Requires 2TB+ SSD and reliable internet</li>
            <li>Use Geth, Nethermind, or Besu</li>
            <li>Pair with a consensus client (Prysm, Lighthouse)</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Frontend Attack Vectors Content
const FrontendAttacksContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">DeFi Frontend Attacks</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Smart Contracts Are Secure, Frontends Aren't</h3>
        <p>Many DeFi hacks don't touch smart contracts at all. Attackers compromise the website frontend to trick users into signing malicious transactions.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Frontend Attack Types</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-400">🌐 DNS Hijacking</h3>
            <p className="text-sm mt-2">Attacker takes control of domain's DNS records, redirecting users to a malicious site that looks identical. (BadgerDAO hack)</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-400">📦 CDN Compromise</h3>
            <p className="text-sm mt-2">Malicious code injected through compromised third-party scripts or CDN. (Ledger Connect Kit)</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-400">🔧 Build Pipeline</h3>
            <p className="text-sm mt-2">Attacker compromises CI/CD system to inject malicious code during deployment.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-400">📧 Registrar Compromise</h3>
            <p className="text-sm mt-2">Social engineering against domain registrar to transfer domain ownership.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">User Protection</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Use hardware wallet:</strong> Review transactions on device screen</li>
            <li><strong>Transaction simulation:</strong> Wallet Guard, Pocket Universe show what you're signing</li>
            <li><strong>Bookmark official sites:</strong> Don't rely on Google results</li>
            <li><strong>Verify before major transactions:</strong> Check Discord/Twitter for compromise reports</li>
            <li><strong>Use IPFS frontends:</strong> When available, more resistant to hijacking</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// NFT Scam Red Flags Content
const NftScamFlagsContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">NFT Scam Warning Signs</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The NFT Scam Playbook</h3>
        <p>Most NFT rugs follow predictable patterns. Learning to spot these red flags can save you from significant losses.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">15 Red Flags</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ol className="list-decimal pl-6 space-y-2 text-sm">
            <li><strong>Anonymous team</strong> - No real identities, stock photos</li>
            <li><strong>Stolen art</strong> - Reverse image search reveals original</li>
            <li><strong>Botted Discord</strong> - Thousands of members, no real chat</li>
            <li><strong>Fake followers</strong> - High count, low engagement</li>
            <li><strong>Paid-only influencer mentions</strong> - No organic excitement</li>
            <li><strong>Unrealistic roadmap</strong> - Promises of games, metaverse, tokens</li>
            <li><strong>High mint price + no track record</strong></li>
            <li><strong>Constantly delayed mint</strong> - Building artificial scarcity</li>
            <li><strong>No contract transparency</strong> - Hidden or unverified code</li>
            <li><strong>FOMO marketing</strong> - Countdown timers everywhere</li>
            <li><strong>Celebrity association without proof</strong></li>
            <li><strong>Unoriginal derivative art</strong></li>
            <li><strong>Suspicious mint contract</strong> - Owner can mint unlimited</li>
            <li><strong>No utility explanation</strong> - Just "art" with no plan</li>
            <li><strong>Aggressive banning of questions</strong> - Legit projects welcome scrutiny</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Due Diligence Steps</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Reverse image search the art</li>
            <li>Check team LinkedIn profiles</li>
            <li>Analyze follower quality with analytics tools</li>
            <li>Review smart contract on Etherscan</li>
            <li>Ask hard questions in Discord</li>
            <li>Wait for verified secondary market activity</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// SetApprovalForAll Risks Content
const SetApprovalForAllContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">The setApprovalForAll Danger</h2>
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 mb-6">
        <h3 className="font-bold mb-2">🚨 One Signature, All Your NFTs</h3>
        <p>setApprovalForAll grants unlimited access to every NFT in a collection. One malicious approval can drain your entire collection instantly.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <p className="mb-4">When you call setApprovalForAll(operator, true), you give that operator address permission to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Transfer any NFT you own from that collection</li>
            <li>Transfer any NFT you acquire in the future</li>
            <li>Do this without any further signatures from you</li>
            <li>The permission persists until you explicitly revoke it</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">When It's Legitimate</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-500/10 p-6 rounded-lg border border-green-500/20">
            <h3 className="text-xl font-semibold mb-3 text-green-400">✅ Expected From</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>OpenSea Seaport contract</li>
              <li>Blur marketplace</li>
              <li>Known NFT staking protocols</li>
              <li>Verified collection managers</li>
            </ul>
          </div>
          <div className="bg-red-500/10 p-6 rounded-lg border border-red-500/20">
            <h3 className="text-xl font-semibold mb-3 text-red-400">❌ Never Sign For</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Random "free mint" sites</li>
              <li>Unknown contracts</li>
              <li>Airdrop claims</li>
              <li>Anything from DMs</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Checking & Revoking</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-2">
            <li>Visit revoke.cash and connect your wallet</li>
            <li>Look for "NFT Approvals" section</li>
            <li>Review each operator address</li>
            <li>Revoke any approvals you don't recognize</li>
            <li>Check regularly - new approvals get added over time</li>
          </ol>
        </div>
      </section>
    </div>
  </>
);

// Crypto Job Scams Content
const CryptoJobScamsContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Crypto Job Scams Targeting Professionals</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">When Job Offers Are Attack Vectors</h3>
        <p>State-sponsored groups like Lazarus specifically target crypto developers and executives with fake job offers designed to install malware or steal credentials.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Common Attack Patterns</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-400">📋 Fake Coding Tests</h3>
            <p className="text-sm mt-2">"Complete this take-home assignment" - repo contains malware that runs on npm install or git clone.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-400">📄 Malicious Documents</h3>
            <p className="text-sm mt-2">"Review our company overview" - PDF or Word doc with embedded exploits.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-400">🔗 Trojanized Tools</h3>
            <p className="text-sm mt-2">"Use our custom IDE/chat app for the interview" - actually malware.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-400">💼 LinkedIn Impersonation</h3>
            <p className="text-sm mt-2">Fake profiles of real recruiters or executives reaching out with "opportunities."</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Protection Strategies</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Verify recruiters:</strong> Contact the company directly through official channels</li>
            <li><strong>Use VMs:</strong> Run any code assignments in isolated virtual machines</li>
            <li><strong>Don't install custom tools:</strong> Use standard video calling and IDEs</li>
            <li><strong>Separate devices:</strong> Keep work separate from crypto wallets</li>
            <li><strong>Check job listings:</strong> Verify position exists on company's actual career page</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Romance Scams Content
const RomanceScamsContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Crypto Romance Scams & Pig Butchering</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">What is "Pig Butchering"?</h3>
        <p>Named for "fattening the pig before slaughter," these scams build relationships over weeks or months before convincing victims to "invest" in fake crypto platforms.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">The Scam Timeline</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Initial contact:</strong> "Accidental" text, dating app match, or social media DM</li>
            <li><strong>Relationship building:</strong> Weeks of friendly conversation, sharing life details</li>
            <li><strong>Wealth display:</strong> Casually mention crypto trading profits, luxury lifestyle</li>
            <li><strong>Investment introduction:</strong> "Let me show you how I make money"</li>
            <li><strong>Fake platform:</strong> Direct to convincing fake exchange showing fake gains</li>
            <li><strong>Increasing deposits:</strong> Early "withdrawals" work to build trust</li>
            <li><strong>The rug:</strong> Can't withdraw, need to pay "taxes" or "fees" first</li>
            <li><strong>Disappearance:</strong> Contact cuts off once victim stops paying</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Warning Signs</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li>Stranger reaches out first and is unusually friendly</li>
            <li>Quickly moves conversation to WhatsApp or Telegram</li>
            <li>Photos seem too perfect or model-like</li>
            <li>Claims of easy, consistent crypto profits</li>
            <li>Uses unfamiliar trading platforms</li>
            <li>Encourages larger and larger deposits</li>
            <li>Provides excuses for not video calling</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Protect Vulnerable Friends & Family</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Educate elderly relatives about these scams</li>
            <li>Anyone sending money to online relationships should verify identity</li>
            <li>Use reverse image search on profile photos</li>
            <li>Never invest on platforms recommended by online-only contacts</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Getting Started Web3 Security Content
const GettingStartedContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Your First 10 Steps to Crypto Safety</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Welcome to Web3 Security</h3>
        <p>New to crypto? These foundational security practices will protect you from the most common threats. Master these before exploring advanced strategies.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Essential Security Checklist</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-4">
            <li><strong>Get a hardware wallet:</strong> Ledger or Trezor for anything over $1,000</li>
            <li><strong>Secure your seed phrase:</strong> Write on metal, store safely, never digitize</li>
            <li><strong>Use a password manager:</strong> Unique passwords for every exchange</li>
            <li><strong>Enable 2FA everywhere:</strong> Authenticator app or hardware key, not SMS</li>
            <li><strong>Bookmark official sites:</strong> Never use search results or links from messages</li>
            <li><strong>Disable Discord DMs:</strong> Scammers' favorite attack vector</li>
            <li><strong>Verify before signing:</strong> Read every transaction request</li>
            <li><strong>Use burner wallets:</strong> For minting and testing new protocols</li>
            <li><strong>Revoke old approvals:</strong> Check revoke.cash monthly</li>
            <li><strong>Stay skeptical:</strong> If it seems too good to be true, it is</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Beginner Mistakes to Avoid</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li>Storing seed phrase in screenshots or cloud storage</li>
            <li>Clicking links from Discord DMs or Twitter replies</li>
            <li>FOMO buying into projects without research</li>
            <li>Keeping all funds on exchanges</li>
            <li>Using the same wallet for everything</li>
            <li>Signing messages without understanding them</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Advanced Wallet Security Content
const AdvancedWalletSecurityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Defense-in-Depth for High-Value Holdings</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Security at Scale</h3>
        <p>When you're holding significant assets, basic security isn't enough. This guide covers advanced strategies used by crypto institutions and high-net-worth individuals.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Multi-Wallet Architecture</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold">🔥 Hot Wallet (1-5%)</h4>
              <p className="text-sm text-muted-foreground">Daily transactions, dApp interactions. Expect potential compromise.</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold">❄️ Cold Wallet (20-30%)</h4>
              <p className="text-sm text-muted-foreground">Hardware wallet at home. Transactions when needed.</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold">🏔️ Deep Cold Storage (50-70%)</h4>
              <p className="text-sm text-muted-foreground">Multi-sig or geographically distributed. Rarely accessed.</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold">🔥 Burner Wallet (Minimal)</h4>
              <p className="text-sm text-muted-foreground">New protocols, mints, suspicious sites. Assume it will get drained.</p>
            </div>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Advanced Techniques</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Time-Locked Transactions</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Use Gnosis Safe with time delays</li>
              <li>24-72 hour delays on large transfers</li>
              <li>Guardians can cancel suspicious transactions</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Geographic Distribution</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Seed phrase parts in different locations</li>
              <li>Bank safety deposit boxes</li>
              <li>Trusted family or attorneys</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </>
);

// Exchange Hack Survival Content
const ExchangeHackSurvivalContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Surviving an Exchange Hack</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">When Your Exchange Gets Hacked</h3>
        <p>From Mt. Gox to FTX, exchange failures have cost billions. Know what to do before, during, and after an exchange incident.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Immediate Actions</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Verify the news:</strong> Check official channels, not just social media rumors</li>
            <li><strong>Withdraw remaining funds:</strong> If withdrawals are open, move to self-custody</li>
            <li><strong>Document everything:</strong> Screenshot balances, transaction history, account details</li>
            <li><strong>Change passwords:</strong> If you reused the exchange password anywhere</li>
            <li><strong>Revoke API keys:</strong> Any trading bots should be disconnected</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">If Funds Are Trapped</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li>File a claim with the exchange's official process</li>
            <li>Report to law enforcement in your jurisdiction</li>
            <li>Join creditor groups for organized representation</li>
            <li>Document all communications</li>
            <li>Be patient - Mt. Gox creditors waited 10 years</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Prevention</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Never store more than you need for trading on exchanges</li>
            <li>Diversify across multiple exchanges</li>
            <li>Choose exchanges with proof-of-reserves</li>
            <li>Self-custody for long-term holdings</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// CEX vs DEX Comparison Content
const CexVsDexContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">CEX vs DEX Security Comparison</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Different Trade-offs</h3>
        <p>Centralized and decentralized exchanges have fundamentally different security models. Understanding both helps you choose wisely.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Security Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-card/50 rounded-lg overflow-hidden text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left">Aspect</th>
                <th className="p-3 text-left">CEX</th>
                <th className="p-3 text-left">DEX</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50"><td className="p-3">Custody</td><td className="p-3">Exchange holds keys</td><td className="p-3">You hold keys</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Hack risk</td><td className="p-3">Exchange can be hacked</td><td className="p-3">Smart contract risks</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">KYC</td><td className="p-3">Required</td><td className="p-3">None</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Freezing risk</td><td className="p-3">Can freeze your account</td><td className="p-3">Cannot freeze</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">Recovery</td><td className="p-3">Customer support</td><td className="p-3">Self-responsibility</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">MEV</td><td className="p-3">No MEV</td><td className="p-3">Sandwich attack risk</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">When to Use Each</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Use CEX For</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Fiat on/off ramps</li>
              <li>High-frequency trading</li>
              <li>Margin/leverage trading</li>
              <li>Beginners who need support</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Use DEX For</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Privacy-focused trading</li>
              <li>Early token access</li>
              <li>Censorship resistance</li>
              <li>Long-term self-custody</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </>
);

// Physical Security Content
const PhysicalSecurityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Physical Security for Crypto Holders</h2>
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 mb-6">
        <h3 className="font-bold mb-2">🔧 The $5 Wrench Attack</h3>
        <p>No encryption can protect against physical coercion. If attackers know you have significant crypto and can reach you physically, you're vulnerable.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Threat Model</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Home invasion:</strong> Targeted attacks on known holders</li>
            <li><strong>Kidnapping:</strong> Forced transfers under duress</li>
            <li><strong>Social engineering:</strong> Gaining physical access through deception</li>
            <li><strong>Device theft:</strong> Stealing hardware wallets or phones</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Protection Strategies</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">OpSec</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Never publicly disclose holdings</li>
              <li>Use pseudonymous profiles</li>
              <li>Don't wear crypto merchandise</li>
              <li>Be vague about investment success</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Technical</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Decoy wallets with small amounts</li>
              <li>Time-locked transactions</li>
              <li>Multi-sig requiring remote co-signers</li>
              <li>Geographic distribution of keys</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Duress Protocol</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <p className="mb-4">Plan for worst-case scenarios:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Have a "decoy wallet" you can hand over</li>
            <li>Ensure bulk of holdings require time delays or remote approval</li>
            <li>Consider plausible deniability setups (hidden wallets)</li>
            <li>Compliance may be safest - no amount of crypto is worth your life</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Account Abstraction Security Content
const AccountAbstractionContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">ERC-4337 Account Abstraction Security</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Future of Wallet Security</h3>
        <p>Account abstraction enables smart contract wallets with advanced features like social recovery, spending limits, and gas sponsorship. But new features mean new risks.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">New Security Considerations</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">🔄 Bundler Trust</h3>
            <p className="text-sm mt-2">Bundlers submit your transactions. Malicious bundlers could censor or reorder your operations.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">⛽ Paymaster Risks</h3>
            <p className="text-sm mt-2">Paymasters sponsoring gas could have access to your transaction data and potentially manipulate execution.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">🔑 Session Keys</h3>
            <p className="text-sm mt-2">Delegated keys for dApp interactions - improper scoping could lead to unauthorized transactions.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">🔧 Upgrade Risks</h3>
            <p className="text-sm mt-2">Smart wallets can be upgraded - malicious upgrades could drain funds.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Use reputable wallet implementations (Safe, Argent)</li>
            <li>Configure recovery carefully - guardians need proper security too</li>
            <li>Set appropriate spending limits and delays</li>
            <li>Review session key permissions before granting</li>
            <li>Understand upgrade mechanisms and who controls them</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// ERC-20 Vulnerabilities Content
const Erc20VulnerabilitiesContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Common ERC-20 Token Vulnerabilities</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Not All Tokens Are Created Equal</h3>
        <p>The ERC-20 standard is minimal. Many implementations contain vulnerabilities that can be exploited for theft or manipulation.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Critical Vulnerabilities</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-400">Integer Overflow/Underflow</h3>
            <p className="text-sm mt-2">Pre-Solidity 0.8: math operations could wrap around, creating tokens from nothing.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-400">Approval Race Condition</h3>
            <p className="text-sm mt-2">Changing approval from N to M allows attacker to spend N+M tokens.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-400">Missing Return Values</h3>
            <p className="text-sm mt-2">Some tokens don't return bool on transfer - breaks DeFi protocol compatibility.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-400">Fee-on-Transfer</h3>
            <p className="text-sm mt-2">Tokens that take fees break protocols assuming 1:1 transfer amounts.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Safe Implementation Patterns</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Use OpenZeppelin's audited ERC-20 implementation</li>
            <li>Use Solidity 0.8+ for built-in overflow protection</li>
            <li>Implement approve() to require setting to 0 first</li>
            <li>Always return bool from transfer/transferFrom</li>
            <li>Use SafeERC20 when interacting with unknown tokens</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Smart Contract Fuzzing Content  
const SmartContractFuzzingContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Fuzzing Smart Contracts</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Automated Bug Discovery</h3>
        <p>Fuzzing bombards your contracts with random inputs to find edge cases that break invariants. It's one of the most effective security testing methods.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Fuzzing Tools</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Foundry (forge fuzz)</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Built into Foundry framework</li>
              <li>Fast, Rust-based</li>
              <li>Good for quick property testing</li>
              <li>Configurable run count</li>
            </ul>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Echidna</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Coverage-guided fuzzing</li>
              <li>Sequence generation</li>
              <li>Property-based testing</li>
              <li>Multi-contract support</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">What to Fuzz</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Invariants:</strong> "Total supply never exceeds cap"</li>
            <li><strong>Access control:</strong> "Only owner can call admin functions"</li>
            <li><strong>State transitions:</strong> "Balance only changes on transfer"</li>
            <li><strong>Economic properties:</strong> "No profitable arbitrage paths"</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Impermanent Loss Content
const ImpermanentLossContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Understanding Impermanent Loss</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Hidden Cost of Liquidity Providing</h3>
        <p>Impermanent loss occurs when the price ratio of tokens in your LP position changes from when you deposited. It's called "impermanent" because it reverses if prices return - but often they don't.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <p className="mb-4">When you provide liquidity:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>You deposit equal values of two tokens</li>
            <li>AMM automatically rebalances as prices change</li>
            <li>This means selling your winning token and buying your losing token</li>
            <li>Result: Less gains than holding, or amplified losses</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Loss by Price Change</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-card/50 rounded-lg overflow-hidden text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left">Price Change</th>
                <th className="p-3 text-left">Impermanent Loss</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50"><td className="p-3">1.25x (25% up or down)</td><td className="p-3">~0.6%</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">1.5x</td><td className="p-3">~2%</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">2x</td><td className="p-3">~5.7%</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">3x</td><td className="p-3">~13.4%</td></tr>
              <tr className="border-t border-border/50"><td className="p-3">5x</td><td className="p-3">~25.5%</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">When LP Still Makes Sense</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Stable pairs (USDC/USDT) - minimal IL</li>
            <li>Trading fees exceed IL</li>
            <li>You believe prices will revert</li>
            <li>Additional farming rewards compensate</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Twitter Impersonation Content
const TwitterImpersonationContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Twitter/X Crypto Impersonation Scams</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Fake Accounts, Real Losses</h3>
        <p>Scammers create convincing copies of crypto influencer accounts to promote fake giveaways, airdrops, and investment opportunities.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Common Impersonation Tactics</h2>
        <div className="space-y-4">
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">🔵 Blue Check Fraud</h3>
            <p className="text-sm mt-2">Since Twitter Blue allows paid verification, scammers buy checkmarks to appear legitimate.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">📝 Reply Scams</h3>
            <p className="text-sm mt-2">Fake accounts reply to real influencer posts with scam links, appearing in high-visibility threads.</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg">
            <h3 className="font-semibold">🎁 Giveaway Scams</h3>
            <p className="text-sm mt-2">"I'm giving away 10 ETH! Send 0.1 ETH to receive 1 ETH back!" - It never works that way.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Verification Techniques</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Check follower count and account age</li>
            <li>Look for subtle username differences (@vitalikbuterin vs @vltaIikbuterin)</li>
            <li>Verify claims on official project websites</li>
            <li>Real influencers don't DM asking for crypto</li>
            <li>Cross-reference with Discord/Telegram channels</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Soft vs Hard Rug Content
const SoftVsHardRugContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Soft Rug vs Hard Rug</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Two Types of Exit Scams</h3>
        <p>Not all rugs are sudden. Understanding the difference helps identify projects before complete collapse.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Comparison</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-red-500/10 p-6 rounded-lg border border-red-500/20">
            <h3 className="text-xl font-semibold mb-3 text-red-400">Hard Rug</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Instant liquidity drain</li>
              <li>Smart contract exploit</li>
              <li>Team vanishes overnight</li>
              <li>Token goes to zero instantly</li>
              <li>Clear malicious intent</li>
            </ul>
          </div>
          <div className="bg-yellow-500/10 p-6 rounded-lg border border-yellow-500/20">
            <h3 className="text-xl font-semibold mb-3 text-yellow-400">Soft Rug</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Team slowly sells tokens</li>
              <li>Development slows/stops</li>
              <li>Promises not delivered</li>
              <li>Gradual price decline</li>
              <li>Plausible deniability</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Soft Rug Warning Signs</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Team wallets regularly selling large amounts</li>
            <li>Missed roadmap deadlines with vague excuses</li>
            <li>Developer activity on GitHub slowing</li>
            <li>Community managers becoming less active</li>
            <li>Increasing focus on token price over product</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Locked Liquidity Content
const LockedLiquidityContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Locked Liquidity: Does It Really Protect You?</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Lock Illusion</h3>
        <p>Locked liquidity is often promoted as proof of safety, but it's just one factor. Scammers have found many ways to rug even with "locked" liquidity.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">How Locks Work</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <p className="mb-4">When a team "locks" liquidity, they send LP tokens to a time-locked contract (Unicrypt, Team.Finance). The tokens can't be withdrawn until the lock expires.</p>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Why Locks Don't Guarantee Safety</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Mint functions:</strong> Team can create infinite tokens, dumping on locked liquidity</li>
            <li><strong>Short lock periods:</strong> 30-day locks are not meaningful</li>
            <li><strong>Partial locks:</strong> Only locking 10% while keeping 90%</li>
            <li><strong>Team token allocations:</strong> Large unlocked team holdings can still rug</li>
            <li><strong>Smart contract backdoors:</strong> Hidden functions to drain funds</li>
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">What to Actually Check</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Lock duration (1+ years is meaningful)</li>
            <li>Percentage of liquidity locked (80%+ is good)</li>
            <li>Token minting permissions</li>
            <li>Team token vesting schedules</li>
            <li>Overall contract permissions</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Smart Contract Audit Process Content
const AuditProcessContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">The Smart Contract Audit Process</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">What Really Happens in an Audit</h3>
        <p>Understanding the audit process helps you evaluate audit quality and know what auditors can and can't guarantee.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Typical Audit Phases</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Scoping:</strong> Define what's being audited, timeline, and cost</li>
            <li><strong>Manual review:</strong> Auditors read every line of code</li>
            <li><strong>Automated analysis:</strong> Tools like Slither, Mythril scan for patterns</li>
            <li><strong>Finding documentation:</strong> Issues categorized by severity</li>
            <li><strong>Initial report:</strong> Findings shared with team</li>
            <li><strong>Remediation:</strong> Team fixes identified issues</li>
            <li><strong>Final review:</strong> Auditors verify fixes</li>
            <li><strong>Final report:</strong> Published publicly</li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">What Audits Don't Cover</h2>
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
          <ul className="list-disc pl-6 space-y-2">
            <li>Economic attacks and oracle manipulation</li>
            <li>Off-chain components and frontends</li>
            <li>Future code changes post-audit</li>
            <li>100% bug-free guarantee</li>
            <li>Business model viability</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// DeFi Audit Checklist Content
const DefiAuditChecklistContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">DeFi Due Diligence Checklist</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Before You Deposit</h3>
        <p>Use this checklist to evaluate any DeFi protocol before trusting it with your funds.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Security Checklist</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="space-y-3">
            <li className="flex items-start gap-2"><span className="text-lg">☐</span> Multiple audits from reputable firms</li>
            <li className="flex items-start gap-2"><span className="text-lg">☐</span> Active bug bounty on Immunefi ($100K+ rewards)</li>
            <li className="flex items-start gap-2"><span className="text-lg">☐</span> Time-locked admin functions</li>
            <li className="flex items-start gap-2"><span className="text-lg">☐</span> Multi-sig controlled (3+ signers)</li>
            <li className="flex items-start gap-2"><span className="text-lg">☐</span> 6+ months without major incidents</li>
            <li className="flex items-start gap-2"><span className="text-lg">☐</span> Verified contracts on block explorer</li>
            <li className="flex items-start gap-2"><span className="text-lg">☐</span> Open-source code</li>
            <li className="flex items-start gap-2"><span className="text-lg">☐</span> Doxxed or reputable team</li>
            <li className="flex items-start gap-2"><span className="text-lg">☐</span> Uses reliable oracles (Chainlink)</li>
            <li className="flex items-start gap-2"><span className="text-lg">☐</span> Reasonable TVL-to-insurance ratio</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Password Manager Content
const PasswordManagerContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Password Managers for Crypto Security</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">The Foundation of Account Security</h3>
        <p>Password managers are essential for managing the dozens of accounts crypto users accumulate. Here's how to set them up securely.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Recommended Options</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold">1Password</h3>
            <p className="text-sm text-muted-foreground">Best for teams, travel mode</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold">Bitwarden</h3>
            <p className="text-sm text-muted-foreground">Open source, self-hostable</p>
          </div>
          <div className="bg-card/50 p-4 rounded-lg text-center">
            <h3 className="font-semibold">KeePassXC</h3>
            <p className="text-sm text-muted-foreground">Fully offline, local storage</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">Crypto-Specific Setup</h2>
        <div className="bg-card/50 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Generate 20+ character random passwords for exchanges</li>
            <li>Store exchange backup codes securely</li>
            <li>Never store seed phrases in password managers</li>
            <li>Use unique email aliases for each exchange</li>
            <li>Enable 2FA on the password manager itself</li>
          </ul>
        </div>
      </section>
    </div>
  </>
);

// Formal Verification Content
const FormalVerificationContent = () => (
  <>
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Formal Verification for Smart Contracts</h2>
      <div className="bg-card/50 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Mathematical Proof of Correctness</h3>
        <p>Formal verification uses mathematical techniques to prove smart contracts behave correctly under all possible inputs and states.</p>
      </div>
    </div>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Verification Tools</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Certora Prover</h3>
            <p className="text-sm text-muted-foreground">Industry-leading formal verification, used by Aave, Compound</p>
          </div>
          <div className="bg-card/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Halmos</h3>
            <p className="text-sm text-muted-foreground">Symbolic testing for Foundry, open source</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">What Can Be Verified</h2>
        <div className="bg-primary/10 p-6 rounded-lg">
          <ul className="list-disc pl-6 space-y-2">
            <li>Total supply invariants</li>
            <li>Access control correctness</li>
            <li>No overflow/underflow</li>
            <li>No reentrancy paths</li>
            <li>Economic properties</li>
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
  'oracle-manipulation-attacks': OracleManipulationContent,
  'bridge-security-risks': BridgeSecurityContent,
  'blockchain-privacy-tools-2025': PrivacyToolsContent,
  'wallet-address-deanonymization': DeanonymizationContent,
  'vpn-tor-crypto-trading': VpnTorContent,
  'blockchain-forensics-basics': BlockchainForensicsContent,
  'npm-supply-chain-attacks-crypto': NpmSupplyChainContent,
  'rpc-endpoint-security': RpcSecurityContent,
  'frontend-attack-vectors': FrontendAttacksContent,
  'nft-scam-red-flags': NftScamFlagsContent,
  'setapprovalforall-risks': SetApprovalForAllContent,
  'crypto-job-scams': CryptoJobScamsContent,
  'romance-scams-crypto': RomanceScamsContent,
  'getting-started-web3-security': GettingStartedContent,
  'advanced-wallet-security': AdvancedWalletSecurityContent,
  'exchange-hack-survival-guide': ExchangeHackSurvivalContent,
  'cex-vs-dex-security-comparison': CexVsDexContent,
  'physical-security-crypto': PhysicalSecurityContent,
  'account-abstraction-security': AccountAbstractionContent,
  'erc20-token-vulnerabilities': Erc20VulnerabilitiesContent,
  'smart-contract-fuzzing-guide': SmartContractFuzzingContent,
  'impermanent-loss-risks': ImpermanentLossContent,
  'twitter-crypto-impersonation': TwitterImpersonationContent,
  'soft-rug-vs-hard-rug': SoftVsHardRugContent,
  'locked-liquidity-explained': LockedLiquidityContent,
  'smart-contract-audit-process': AuditProcessContent,
  'defi-smart-contract-audit-checklist': DefiAuditChecklistContent,
  'password-manager-crypto-security': PasswordManagerContent,
  'formal-verification-smart-contracts': FormalVerificationContent,
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
