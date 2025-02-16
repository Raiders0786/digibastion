import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Link as LinkIcon, ExternalLink } from 'lucide-react';

const Links = () => {
  const links = [
    {
      title: "Web3 Security Alliance",
      url: "#",
      description: "Community-driven security initiatives"
    },
    {
      title: "Blockchain Security Hub",
      url: "#",
      description: "Latest updates on blockchain security"
    },
    {
      title: "DeFi Security Best Practices",
      url: "#",
      description: "Comprehensive guide to DeFi security"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <LinkIcon className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Useful Links</h1>
            <p className="text-lg text-foreground-secondary">
              Curated resources for Web3 security
            </p>
          </div>

          <div className="grid gap-6 animate-slide-up">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card rounded-lg p-6 hover:bg-card/80 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{link.title}</h3>
                  <ExternalLink className="w-4 h-4 text-primary" />
                </div>
                <p className="text-foreground-secondary">{link.description}</p>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Links;
