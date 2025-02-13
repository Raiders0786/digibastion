import { Navbar } from '../components/Navbar';
import { Book, Shield, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Articles = () => {
  const articles = [
    {
      title: "Privacy, Security, and Web3 OPSEC",
      description: "A comprehensive guide to understanding and implementing digital privacy, security, and operational security in the Web3 era",
      readTime: "15 min read",
      category: "Security",
      featured: true,
      slug: "privacy-security-web3-opsec"
    },
    {
      title: "Getting Started with Web3 Security",
      description: "Learn the basics of securing your Web3 presence",
      readTime: "5 min read",
      category: "Basics",
      featured: false,
      slug: "getting-started-web3-security"
    },
    {
      title: "Advanced Wallet Security",
      description: "Best practices for protecting your crypto assets",
      readTime: "8 min read",
      category: "Security",
      featured: false,
      slug: "advanced-wallet-security"
    },
    {
      title: "Social Engineering in Web3",
      description: "How to avoid common scams and attacks",
      readTime: "6 min read",
      category: "Security",
      featured: false,
      slug: "social-engineering-web3"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Book className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Articles</h1>
            <p className="text-lg text-foreground-secondary">
              Stay informed about Web3 security and privacy
            </p>
          </div>

          {/* Featured Article */}
          {articles.filter(article => article.featured).map((article, index) => (
            <Link 
              key={index}
              to={`/articles/${article.slug}`}
              className="block mb-12"
            >
              <div className="bg-card rounded-xl p-8 border border-primary/20 hover:border-primary/40 transition-all duration-300 animate-fade-in">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-primary">{article.category}</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-foreground">{article.title}</h2>
                    <p className="text-foreground-secondary mb-4">{article.description}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                        <Clock className="w-4 h-4" />
                        <span>{article.readTime}</span>
                      </div>
                      <span className="text-primary hover:text-primary-hover flex items-center gap-1">
                        Read more <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Other Articles Grid */}
          <div className="grid gap-6 md:grid-cols-2 animate-slide-up">
            {articles.filter(article => !article.featured).map((article, index) => (
              <Link 
                key={index}
                to={`/articles/${article.slug}`}
                className="block"
              >
                <div className="bg-card rounded-lg p-6 border border-white/10 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{article.category}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{article.title}</h3>
                  <p className="text-foreground-secondary mb-3">{article.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {article.readTime}
                    </span>
                    <span className="text-primary hover:text-primary-hover text-sm flex items-center gap-1">
                      Read more <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Articles;
