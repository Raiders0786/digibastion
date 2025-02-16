
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
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight max-w-4xl mx-auto">
              Web3 Security Checklist
              <span className="block text-xl sm:text-2xl text-foreground/80 mt-2 font-medium">
                for Personal Digital Protection
              </span>
            </h1>
            <p className="text-base sm:text-lg text-foreground-secondary max-w-2xl mx-auto leading-relaxed">
              Protect your personal digital footprint with Digibastion. Our self-driven Web3 OpSec checklist lets you follow expert-backed security practices, earn a security score, and enhance your privacy across crypto, Web3, and beyond.
            </p>
            <div className="pt-2">
              <a 
                href="https://github.com/yourusername/web3-security-checklist" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
                >
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>

          <SecurityScore score={getOverallScore()} stats={getStats()} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
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
