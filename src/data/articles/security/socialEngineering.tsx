import { Article } from '../types';

export const socialEngineeringArticle: Article = {
  title: "Social Engineering in Web3: Complete Guide to Avoiding Scams",
  category: "Security",
  readTime: "12 min read",
  content: (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Understanding Social Engineering in Web3</h2>
        <div className="bg-card/50 p-6 rounded-lg mb-6">
          <h3 className="font-bold mb-2">TL;DR</h3>
          <p>Social engineering exploits human psychology rather than technical vulnerabilities. In Web3, attackers use deception and manipulation to steal cryptocurrency, NFTs, and other digital assets. Understanding common tactics and implementing strong security practices is crucial for protecting your investments.</p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Common Social Engineering Attacks</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Phishing Attacks</h3>
              <div className="bg-card/50 p-6 rounded-lg">
                <p className="mb-4">Deceptive emails, messages, or websites that mimic legitimate platforms. Often target users with fake:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Airdrop announcements</li>
                  <li>Minting opportunities</li>
                  <li>Security alerts</li>
                </ul>
                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                  <strong className="text-primary">Pro Tip:</strong> Always double-check URLs and avoid clicking unsolicited links from social media, Discord, or Telegram.
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Rug Pulls and Exit Scams</h3>
              <div className="bg-card/50 p-6 rounded-lg">
                <p className="mb-4">Malicious projects build hype and community before developers suddenly abandon the project with investors' funds.</p>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <strong className="text-primary">Warning Signs:</strong>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Anonymous teams</li>
                    <li>Unrealistic promises or returns</li>
                    <li>Rushed launches with high pressure to invest</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Impersonation Tactics</h3>
                <div className="bg-card/50 p-6 rounded-lg">
                  <p className="mb-4">Attackers create fake profiles to impersonate:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Project developers</li>
                    <li>Community managers</li>
                    <li>Celebrities and influencers</li>
                  </ul>
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                    <strong className="text-primary">Safety Check:</strong> Verify identities through official channels and check for verified account badges.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Advanced Attack Vectors</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Approval Phishing</h3>
                <p className="mb-4">Attackers trick users into "blind signing" transactions that grant access to tokens.</p>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <strong className="text-primary">Protection:</strong> Always review transaction details and use transaction simulators when possible.
                </div>
              </div>
              <div className="bg-card/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Fake Giveaways</h3>
                <p className="mb-4">Scammers promote fake airdrops to collect information or connect wallets to malicious sites.</p>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <strong className="text-primary">Rule:</strong> Never share seed phrases or connect to unofficial platforms.
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Protection Strategies</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Essential Security Measures</h3>
                <div className="bg-card/50 p-6 rounded-lg">
                  <ul className="list-disc pl-6 space-y-4">
                    <li>
                      <strong>Strong Authentication:</strong>
                      <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li>Use unique, complex passwords</li>
                        <li>Enable 2FA with authenticator apps</li>
                        <li>Avoid SMS-based verification</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Wallet Security:</strong>
                      <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li>Keep private keys offline</li>
                        <li>Use hardware wallets for large holdings</li>
                        <li>Implement burner wallets for testing</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Transaction Safety:</strong>
                      <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li>Review all transaction details carefully</li>
                        <li>Understand smart contract permissions</li>
                        <li>Use transaction simulation tools</li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Best Practices</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card/50 p-6 rounded-lg">
                    <h4 className="font-bold mb-3">Daily Habits</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Verify URLs manually</li>
                      <li>Use security extensions</li>
                      <li>Keep software updated</li>
                    </ul>
                  </div>
                  <div className="bg-card/50 p-6 rounded-lg">
                    <h4 className="font-bold mb-3">Community Engagement</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Join trusted communities</li>
                      <li>Share security insights</li>
                      <li>Report suspicious activity</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Conclusion</h2>
            <div className="bg-card/50 p-6 rounded-lg">
              <p className="mb-4">Social engineering remains one of the most significant threats in Web3. By understanding common tactics and implementing robust security practices, you can significantly reduce your risk of falling victim to scams.</p>
              <div className="p-4 bg-primary/10 rounded-lg">
                <strong className="text-primary">Remember:</strong> Vigilance and skepticism are your best defenses in a decentralized ecosystem. Stay informed, secure your assets, and contribute to a safer Web3 community.
              </div>
            </div>
          </section>
        </div>
      </>
  )
};
