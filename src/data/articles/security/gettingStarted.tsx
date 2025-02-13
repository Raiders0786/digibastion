import { Article } from '../types';

export const gettingStartedArticle: Article = {
  title: "Getting Started with Web3 Security: Essential Guide for Beginners",
  category: "Security",
  readTime: "10 min read",
  content: (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Understanding Web3 Security</h2>
        <div className="bg-card/50 p-6 rounded-lg mb-6">
          <h3 className="font-bold mb-2">TL;DR</h3>
          <p>Web3 introduces a paradigm shift from traditional web models by emphasizing decentralization, user ownership, and blockchain technology. While this offers enhanced control and transparency, it also presents unique security challenges that require proactive measures.</p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Key Security Practices for Web3</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Safeguard Your Secret Recovery Phrase (SRP)</h3>
              <div className="bg-card/50 p-6 rounded-lg">
                <p className="mb-4">Your SRP, often referred to as a seed phrase, is the master key to your crypto wallets. Never share it with anyone, and store it securely offline. Be cautious of phishing attempts that seek to obtain this information.</p>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <strong className="text-primary">Important:</strong> Write down your seed phrase on paper and store it in a secure location. Never store it digitally or share it with anyone.
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Use Reputable Wallets and DApps</h3>
              <div className="bg-card/50 p-6 rounded-lg">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Research wallet providers thoroughly before use</li>
                  <li>Verify DApp security audits and community feedback</li>
                  <li>Check for proper documentation and support channels</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Enable Multi-Factor Authentication (MFA)</h3>
              <div className="bg-card/50 p-6 rounded-lg">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Set up authenticator apps for additional security</li>
                  <li>Use hardware security keys when possible</li>
                  <li>Avoid SMS-based authentication when alternatives exist</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Essential Security Tools</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Hardware Wallets</h3>
              <p className="mb-4">Secure your assets with cold storage solutions that keep private keys offline.</p>
              <div className="p-4 bg-primary/10 rounded-lg">
                <strong className="text-primary">Recommendation:</strong> Use hardware wallets for storing significant amounts of crypto assets.
              </div>
            </div>
            <div className="bg-card/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Security Extensions</h3>
              <p className="mb-4">Install browser extensions that help identify phishing attempts and malicious websites.</p>
              <div className="p-4 bg-primary/10 rounded-lg">
                <strong className="text-primary">Must-Have:</strong> Use anti-phishing extensions and blockchain explorers to verify transactions.
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Best Practices for Beginners</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Start Small and Learn</h3>
              <div className="bg-card/50 p-6 rounded-lg">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Begin with small amounts to practice transactions</li>
                  <li>Use test networks before mainnet transactions</li>
                  <li>Join educational communities and follow security experts</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Regular Security Checks</h3>
              <div className="bg-card/50 p-6 rounded-lg">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Monitor wallet activity regularly</li>
                  <li>Review connected applications and revoke unused permissions</li>
                  <li>Keep software and firmware updated</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Common Mistakes to Avoid</h2>
          <div className="bg-card/50 p-6 rounded-lg">
            <ul className="list-disc pl-6 space-y-4">
              <li>Storing large amounts in hot wallets</li>
              <li>Clicking on suspicious links or connecting to unknown DApps</li>
              <li>Sharing wallet credentials or recovery phrases</li>
              <li>Ignoring security updates and warnings</li>
            </ul>
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <strong className="text-primary">Remember:</strong> In Web3, you are responsible for your own security. Take time to learn and implement proper security measures.
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <div className="bg-card/50 p-6 rounded-lg">
            <p className="mb-4">As you become more comfortable with basic security practices, consider exploring advanced topics like:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Multi-signature wallets</li>
              <li>Smart contract security</li>
              <li>Privacy tools and techniques</li>
              <li>Advanced OPSEC practices</li>
            </ul>
          </div>
        </section>
      </div>
    </>
  )
};
