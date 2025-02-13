
import { Article } from '../types';

export const operationalSecurityArticle: Article = {
  title: "Introductory Web3 & NFT User Operational Security for the ETH (EVM) Ecosystem",
  category: "Security",
  readTime: "20 min read",
  content: (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Overview of the Threat Landscape</h2>
        <div className="bg-card/50 p-6 rounded-lg mb-6">
          <p className="mb-4">
            Web3 connects blockchains with applications, while NFTs and P2E games unlock new forms of digital ownership. 
            However, with great opportunity comes great risk. Unlike traditional banking, there is no FDIC insurance 
            or "second chance" if your wallet is compromised.
          </p>
          <div className="p-4 bg-primary/10 rounded-lg">
            <strong className="text-primary">Important:</strong> Adversaries are targeting individual users through:
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Social engineering via Discord, email, and Twitter</li>
              <li>Phishing attempts</li>
              <li>Malicious contract mints</li>
              <li>Remote access trojans (RATs)</li>
              <li>Browser and plugin exploits</li>
              <li>Smart contract vulnerabilities</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Never Do's in Web3</h2>
          <div className="bg-red-500/10 p-6 rounded-lg">
            <ul className="list-none space-y-4">
              <li className="flex items-center gap-2 text-red-400">
                <strong>NEVER</strong> give out your seed phrase
              </li>
              <li className="flex items-center gap-2 text-red-400">
                <strong>NEVER</strong> store your seed phrase on your computer
              </li>
              <li className="flex items-center gap-2 text-red-400">
                <strong>NEVER</strong> take a digital picture of your seed phrase
              </li>
              <li className="flex items-center gap-2 text-red-400">
                <strong>NEVER</strong> import your hardware seed phrase into a software wallet
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Costs of Doing Business in Web3</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Gas Fees</h3>
              <p>$1-30 per transaction</p>
              <a 
                href="https://etherscan.io/gastracker" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline mt-2 inline-block"
              >
                Check current rates →
              </a>
            </div>
            <div className="bg-card/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Hardware Wallet</h3>
              <p>$100-150 for Ledger Nano X</p>
            </div>
            <div className="bg-card/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">ENS Domain</h3>
              <p>$40-100 for 5+ character domain</p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
};
