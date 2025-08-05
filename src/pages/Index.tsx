
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSecurityState } from '../hooks/useSecurityState';
import { SecurityCard } from '../components/SecurityCard';
import { SecurityScore } from '../components/SecurityScore';
import { ThreatLevelSelector } from '../components/ThreatLevelSelector';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Github, Heart, Loader2 } from 'lucide-react';
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
          <section className="text-center mb-20 animate-fade-in space-y-8">
            <header className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight max-w-4xl mx-auto bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent px-4">
                The Ultimate Web3 Security Checklist
              </h1>
              <p className="text-xl sm:text-2xl lg:text-3xl text-foreground/80 font-medium">
                for Personal Digital Protection
              </p>
            </header>
            <p className="text-base sm:text-lg text-foreground-secondary max-w-2xl mx-auto leading-relaxed mt-8 px-4">
              Stop jumping between 10+ scattered security tools. Protect your personal digital footprint with Digibastion's unified Web3 OpSec platform - follow expert-backed security practices, scan for live threats, monitor supply chain risks, and enhance your privacy across crypto, Web3, and beyond.
            </p>
            <div className="pt-6 flex flex-wrap justify-center gap-4">
              <a 
                href="https://github.com/Raiders0786/digibastion" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
                aria-label="View project source code on GitHub"
              >
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-primary/25"
                >
                  <Github className="mr-2 h-5 w-5" aria-hidden="true" />
                  View on GitHub
                </Button>
              </a>
              <a 
                href="https://www.digibastion.com/support" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
                aria-label="Support our project"
              >
                <Button 
                  size="lg" 
                  className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-[#8B5CF6]/25 border border-[#9B87F5]/30"
                >
                  <Heart className="mr-2 h-5 w-5 fill-white" aria-hidden="true" />
                  Support Us
                </Button>
              </a>
            </div>
          </section>

          <section aria-labelledby="threat-level-selection">
            <h2 id="threat-level-selection" className="sr-only">Select Threat Level</h2>
            <ThreatLevelSelector />
          </section>

          <section className="mb-20" key={`score-${threatLevel}-${changeCount}`} id="score" aria-labelledby="security-score">
            <h2 id="security-score" className="sr-only">Your Security Score</h2>
            <SecurityScore score={getOverallScore()} stats={getStats()} />
          </section>

          <section aria-label="Security Categories" className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            {categories.map((category, index) => (
              <article 
                key={`${category.id}-${threatLevel}-${changeCount}`} 
                className="animate-fade-in" 
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
          </section>

          <section className="mt-32 mb-20" aria-labelledby="roadmap-section">
            <div className="text-center mb-12">
              <h2 id="roadmap-section" className="text-3xl sm:text-4xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                What's Coming Next
              </h2>
              <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
                Building the security infrastructure Web3 deserves - one unified platform for all your protection needs.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto px-4">
              <div className="glass-card p-8 sm:p-12 rounded-2xl border border-primary/20 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/60 animate-pulse"></div>
                    <h3 className="text-2xl font-bold text-foreground">Coming Soon: Complete Threat Protection</h3>
                  </div>
                  <div className="flex gap-3">
                    <a 
                      href="https://github.com/Raiders0786/digibastion/issues" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="glass-hover border-primary/30 text-primary hover:bg-primary/10"
                      >
                        View Issues
                      </Button>
                    </a>
                    <a 
                      href="https://github.com/Raiders0786/digibastion" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button 
                        size="sm"
                        className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/25"
                      >
                        Contribute
                      </Button>
                    </a>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Real-time supply chain attack monitoring",
                      description: "Detect malicious packages and compromised dependencies instantly",
                      status: "In Progress"
                    },
                    {
                      title: "Third-party dependency risk alerts",
                      description: "Get notified about vulnerabilities in your tech stack",
                      status: "Planning"
                    },
                    {
                      title: "Instant website phishing & malware detection",
                      description: "Scan URLs and domains for threats before you visit",
                      status: "Research"
                    },
                    {
                      title: "Compromised domain scanning",
                      description: "Monitor for domain hijacking and DNS poisoning",
                      status: "Planning"
                    },
                    {
                      title: "Live threat intelligence feed",
                      description: "Real-time updates on emerging security threats",
                      status: "In Progress"
                    }
                  ].map((feature, index) => (
                    <div 
                      key={index}
                      className="p-6 rounded-xl bg-gradient-to-br from-background/50 to-background/30 border border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-lg group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {feature.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          feature.status === 'In Progress' 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : feature.status === 'Planning'
                            ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                            : 'bg-muted/50 text-foreground-secondary border-border'
                        }`}>
                          {feature.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-secondary leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
                  <div className="text-center">
                    <p className="text-foreground font-medium mb-3">
                      Want to help build the future of Web3 security?
                    </p>
                    <p className="text-sm text-foreground-secondary mb-4">
                      Join our community of contributors. Check out open issues, suggest features, or submit pull requests.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <a 
                        href="https://github.com/Raiders0786/digibastion/discussions" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                          Join Discussion
                        </Button>
                      </a>
                      <a 
                        href="https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                          Contributing Guide
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
