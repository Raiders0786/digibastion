
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSecurityState } from '../hooks/useSecurityState';
import { SecurityCard } from '../components/SecurityCard';
import { SecurityScore } from '../components/SecurityScore';
import { Navbar } from '../components/Navbar';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { categories, toggleItem, getCategoryScore, getOverallScore, getStats } = useSecurityState();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo === 'score') {
      const element = document.getElementById('score');
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
      // Clear the state after scrolling
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              The Ultimate Web3 Personal Security Checklist
            </h1>
            <p className="text-lg text-foreground-secondary max-w-3xl mx-auto mb-8">
              Master your Web3 security with our comprehensive guide. Protect your digital assets, enhance privacy, 
              and safeguard your crypto investments with expert-backed security practices.
            </p>
            <a 
              href="https://github.com/yourusername/web3-security-checklist" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90"
              >
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Button>
            </a>
          </div>

          <SecurityScore score={getOverallScore()} stats={getStats()} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {categories.map(category => (
              <SecurityCard
                key={category.id}
                category={category}
                score={getCategoryScore(category)}
                onItemToggle={(itemId) => toggleItem(category.id, itemId)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
