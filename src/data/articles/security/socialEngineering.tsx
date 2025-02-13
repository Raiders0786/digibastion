
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
          </div>
        </section>
      </div>
    </>
  )
};
