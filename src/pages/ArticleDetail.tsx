
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, Clock, Shield, Share2, Copy, Mail, Twitter, Link as LinkIcon } from 'lucide-react';
import { toast } from "sonner";
import { useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ArticleDetail = () => {
  const { slug } = useParams();

  const articles = {
    "privacy-security-web3-opsec": {
      title: "Privacy, Security, and Web3 OPSEC",
      category: "Security",
      readTime: "15 min read",
      content: (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Digital Privacy and Security - Why It Matters</h2>
            <div className="bg-card/50 p-6 rounded-lg mb-6">
              <h3 className="font-bold mb-2">TL;DR</h3>
              <p>Privacy is a fundamental right, essential to democracy, liberty, and freedom of speech. However, it is constantly under threat from governments (mass surveillance), corporations (data harvesting and monetization), and cybercriminals (identity theft, fraud, and exploitation). Security is necessary to keep private data private, and robust digital security is crucial to counter the growing risks of a data-driven world.</p>
              <p className="mt-4">With the rise of Web3, new privacy and security challenges emerge. While blockchain offers decentralization and transparency, it also presents unique risks, including transaction deanonymization, wallet exploits, and smart contract vulnerabilities. Operational Security (OPSEC) is crucial to maintaining digital sovereignty in this rapidly evolving space.</p>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Understanding Personal Data</h2>
              <p className="mb-4">Personal data refers to any information that identifies an individual, directly or indirectly. Even anonymized data can often be re-identified when combined with other datasets. This data can include:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Sensitive documents (medical records, banking information, crypto wallet addresses, etc.)</li>
                <li>User-generated content (messages, emails, social media posts, transactions, NFTs, etc.)</li>
                <li>Metadata (device fingerprints, mouse clicks, keystroke timing, IP addresses, etc.)</li>
              </ul>
              <p className="mb-4">In the Web3 context, personal data extends to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Wallet addresses and transaction histories</li>
                <li>Smart contract interactions and on-chain behaviors</li>
                <li>Decentralized Identity (DID) and reputation systems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">How Data Is Collected</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Traditional Data Collection</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Web tracking: Cookies, device fingerprints, IP addresses, and analytics tools.</li>
                    <li>Centralized platforms: Social media, cloud storage, and digital services collect and monetize user data.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Web3-Specific Data Collection</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>On-chain transparency: Blockchain transactions are public, making it possible to track and link addresses to real-world identities.</li>
                    <li>Wallet fingerprinting: Tools can analyze transaction patterns to deanonymize users.</li>
                    <li>DApps and smart contracts: Many DeFi platforms and NFT marketplaces require wallet interactions that expose user activity.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">OPSEC for Web3 Privacy and Security</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Wallet Security</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use hardware wallets (Ledger, Trezor) for cold storage.</li>
                    <li>Segregate wallets: Use separate wallets for trading, governance, and high-value holdings.</li>
                    <li>Avoid reusing addresses: Generate new wallet addresses for different transactions.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Transaction Privacy</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use privacy-preserving tools: Mixers, CoinJoin, and stealth addresses.</li>
                    <li>Leverage Layer-2 solutions: zk-Rollups and private transaction networks.</li>
                    <li>Use VPNs and Tor: Mask IP addresses when interacting with blockchain applications.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">What You Can Do</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card/50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3">Immediate Actions</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Educate Yourself: Stay informed about privacy threats and security trends</li>
                    <li>Secure Your Accounts: Enable 2FA and use strong passwords</li>
                    <li>Use Privacy Tools: Opt for decentralized browsers and encrypted messaging</li>
                  </ul>
                </div>
                <div className="bg-card/50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3">Long-term Strategy</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Anonymize On-Chain Activity: Mix transactions and use privacy wallets</li>
                    <li>Support Privacy Projects: Contribute to open-source security tools</li>
                    <li>Be Cautious with Smart Contracts: Verify contract security</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Conclusion</h2>
              <div className="bg-card/50 p-6 rounded-lg">
                <p className="mb-4">Privacy is a right, not a privilege. In an era of mass surveillance and blockchain transparency, digital security is more important than ever. Web3 offers new opportunities for self-sovereignty, but only if users adopt strong OPSEC practices and leverage privacy-enhancing technologies.</p>
                <p>By taking control of your digital footprint, securing your Web3 interactions, and advocating for privacy rights, you contribute to a safer, more decentralized internet.</p>
              </div>
            </section>
          </div>
        </>
      )
    }
  };

  const article = articles[slug as keyof typeof articles];

  useEffect(() => {
    // Update OG image when article loads
    if (article) {
      const ogImageUrl = `https://og-image.vercel.app/${encodeURIComponent(
        article.title
      )}.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-white.svg`;
      
      // Update OG image meta tag
      const ogImageElement = document.getElementById('og-image');
      if (ogImageElement) {
        ogImageElement.setAttribute('content', ogImageUrl);
      }

      // Update page title
      document.title = `${article.title} - SecureQuest Checklist`;
    }
  }, [article]);

  const handleShare = async (type: 'copy' | 'twitter' | 'email') => {
    const url = window.location.href;
    const title = article?.title || 'Check out this article';
    
    switch (type) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`, '_blank');
        break;
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Article not found</h1>
            <Link to="/articles" className="text-primary hover:text-primary-hover">
              Return to Articles
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link 
              to="/articles"
              className="inline-flex items-center text-primary hover:text-primary-hover mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Articles
            </Link>
            
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">{article.category}</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 text-foreground/90">{article.title}</h1>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                <Clock className="w-4 h-4" />
                <span>{article.readTime}</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover">
                    <Share2 className="w-4 h-4" />
                    Share Article
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleShare('copy')}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('twitter')}>
                    <Twitter className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('email')}>
                    <Mail className="w-4 h-4 mr-2" />
                    Share via Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="text-foreground/80 space-y-6">
              {article.content}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};

export default ArticleDetail;
