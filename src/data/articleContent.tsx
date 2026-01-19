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
