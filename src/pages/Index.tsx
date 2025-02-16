
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSecurityState } from '../hooks/useSecurityState';
import { SecurityCard } from '../components/SecurityCard';
import { SecurityScore } from '../components/SecurityScore';
import { Navbar } from '../components/Navbar';
import { Github, Copyright, Twitter, ExternalLink } from 'lucide-react';
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

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight max-w-4xl mx-auto bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent px-4">
                The Ultimate Web3 Security Checklist
              </h1>
              <p className="text-xl sm:text-2xl lg:text-3xl text-foreground/80 font-medium">
                for Personal Digital Protection
              </p>
            </div>
            <p className="text-base sm:text-lg text-foreground-secondary max-w-2xl mx-auto leading-relaxed mt-8 px-4">
              Protect your personal digital footprint with Digibastion. Our self-driven Web3 OpSec checklist lets you follow expert-backed security practices, earn a security score, and enhance your privacy across crypto, Web3, and beyond.
            </p>
            <div className="pt-6">
              <a 
                href="https://github.com/yourusername/web3-security-checklist" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-primary/25"
                >
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>

          <div className="mb-20">
            <SecurityScore score={getOverallScore()} stats={getStats()} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
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

      <footer className="w-full border-t border-primary/10 bg-secondary/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground/70">
            <div className="flex items-center gap-2">
              <Copyright className="h-4 w-4" />
              <span>{currentYear}</span>
              <span className="px-1">·</span>
              <a 
                href="https://github.com/yourusername/web3-security-checklist/blob/main/LICENSE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center hover:text-primary transition-colors"
              >
                Licensed under MIT
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              <span className="px-1">·</span>
              <a 
                href="https://x.com/__Raiders" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center hover:text-primary transition-colors"
              >
                <Twitter className="h-4 w-4 mr-1" />
                @__Raiders
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground/60">Securing Web, one byte at a time</span>
              <span className="px-1">·</span>
              <a 
                href="https://github.com/yourusername/web3-security-checklist" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center hover:text-primary transition-colors"
              >
                <Github className="h-4 w-4 mr-1" />
                View Source
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
