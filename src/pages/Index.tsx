
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSecurityState } from '../hooks/useSecurityState';
import { SecurityCard } from '../components/SecurityCard';
import { SecurityScore } from '../components/SecurityScore';
import { ThreatLevelSelector } from '../components/ThreatLevelSelector';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Github, Heart, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { categories, getCategoryScore, getOverallScore, getStats, threatLevel, isLoading, changeCount } = useSecurityState();
  const location = useLocation();

  // Handle scroll to score section if needed
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

  // Reset to top of page when threat level changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [changeCount]); // Use changeCount to detect threat level changes

  // If loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center" aria-live="polite" aria-busy="true">
          <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-4 text-foreground-secondary">Updating your security profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Digibastion - Ultimate Web3 Security Checklist & Resources"
        description="Protect your digital assets with our comprehensive Web3 security checklist. Follow expert-backed security practices for crypto, blockchain, and DeFi."
      />
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Hero Section */}
          <section className="relative text-center mb-24 animate-fade-in">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-hero rounded-3xl -z-10 opacity-50" />
            
            <div className="relative space-y-12 py-16 px-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm font-medium text-primary animate-glow">
                <Shield className="w-4 h-4" />
                Open Source Security Platform
              </div>

              {/* Main Headlines */}
              <header className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight max-w-5xl mx-auto">
                  <span className="block">The Ultimate</span>
                  <span className="block text-shimmer bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                    Web3 Security
                  </span>
                  <span className="block">Checklist</span>
                </h1>
                <p className="text-xl sm:text-2xl lg:text-3xl text-foreground/70 font-medium max-w-3xl mx-auto">
                  Protect your digital assets with expert-backed security practices
                </p>
              </header>

              {/* Enhanced Description */}
              <div className="max-w-3xl mx-auto space-y-6">
                <p className="text-lg text-foreground-secondary leading-relaxed">
                  Digibastion is your comprehensive security companion for the Web3 era. 
                  Follow our self-driven checklist to enhance your digital protection across crypto, blockchain, and beyond.
                </p>
                
                {/* Stats Row */}
                <div className="flex flex-wrap justify-center gap-8 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">100+</div>
                    <div className="text-sm text-foreground-secondary">Security Checks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">10</div>
                    <div className="text-sm text-foreground-secondary">Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">Open</div>
                    <div className="text-sm text-foreground-secondary">Source</div>
                  </div>
                </div>
              </div>

              {/* Enhanced CTA Buttons */}
              <div className="pt-8 flex flex-wrap justify-center gap-6">
                <a 
                  href="#score"
                  className="inline-block"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('score')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Button 
                    size="lg" 
                    className="btn-gradient text-lg px-8 py-4 h-auto font-semibold shadow-elegant"
                  >
                    <Shield className="mr-3 h-6 w-6" />
                    Start Security Check
                  </Button>
                </a>
                
                <a 
                  href="https://github.com/Raiders0786/digibastion" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-lg px-8 py-4 h-auto font-semibold border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
                  >
                    <Github className="mr-3 h-6 w-6" />
                    View on GitHub
                  </Button>
                </a>
              </div>

              {/* Support Link */}
              <div className="pt-4">
                <a 
                  href="https://www.digibastion.com/support" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-foreground-secondary hover:text-primary transition-colors duration-300 text-sm"
                >
                  <Heart className="w-4 h-4" />
                  Support our mission
                </a>
              </div>
            </div>
          </section>

          {/* Enhanced Threat Level Section */}
          <section aria-labelledby="threat-level-selection" className="mb-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Choose Your Security Profile
              </h2>
              <p className="text-foreground-secondary max-w-2xl mx-auto">
                Select your threat level to get personalized security recommendations tailored to your specific needs and risk profile.
              </p>
            </div>
            <ThreatLevelSelector />
          </section>

          {/* Enhanced Security Score Section */}
          <section className="mb-24" key={`score-${threatLevel}-${changeCount}`} id="score" aria-labelledby="security-score">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Your Security Dashboard
              </h2>
              <p className="text-foreground-secondary max-w-2xl mx-auto">
                Track your progress and see how your security measures stack up across different categories.
              </p>
            </div>
            <SecurityScore score={getOverallScore()} stats={getStats()} />
          </section>

          {/* Enhanced Categories Grid */}
          <section aria-label="Security Categories" className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Security Categories
              </h2>
              <p className="text-foreground-secondary max-w-2xl mx-auto">
                Explore comprehensive security checklists across different areas of digital protection.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
              {categories.map((category, index) => (
                <article 
                  key={`${category.id}-${threatLevel}-${changeCount}`} 
                  className="animate-fade-in feature-card" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <SecurityCard
                    category={category.id}
                    title={category.title}
                    description={category.description}
                    link={`/category/${category.id}`}
                    total={category.items.length}
                    completed={category.items.filter(item => item.completed).length}
                  />
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
