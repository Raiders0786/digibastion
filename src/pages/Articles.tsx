
import { Navbar } from '../components/Navbar';
import { Book } from 'lucide-react';

const Articles = () => {
  const articles = [
    {
      title: "Getting Started with Web3 Security",
      description: "Learn the basics of securing your Web3 presence",
      readTime: "5 min read"
    },
    {
      title: "Advanced Wallet Security",
      description: "Best practices for protecting your crypto assets",
      readTime: "8 min read"
    },
    {
      title: "Social Engineering in Web3",
      description: "How to avoid common scams and attacks",
      readTime: "6 min read"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Book className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Articles</h1>
            <p className="text-lg text-foreground-secondary">
              Stay informed about Web3 security
            </p>
          </div>

          <div className="grid gap-6 animate-slide-up">
            {articles.map((article, index) => (
              <div key={index} className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                <p className="text-foreground-secondary mb-3">{article.description}</p>
                <span className="text-sm text-primary">{article.readTime}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Articles;
