
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
import espLogo from '../assets/esp-logo.png';

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
      
      {/* Support Announcement Banner */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-4">
          <div className="flex items-center justify-center gap-4 text-center">
            <span className="text-sm text-foreground-secondary font-medium">
              Supported in 2025 with a small grant from:
            </span>
            <img 
              src={espLogo} 
              alt="Ethereum Ecosystem Support Program" 
              className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity duration-200"
            />
          </div>
        </div>
      </div>
      
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

          <section id="roadmap" className="mt-32 mb-20 scroll-mt-20" aria-labelledby="roadmap-section">
            <div className="text-center mb-12">
              <h2 id="roadmap-section" className="text-3xl sm:text-4xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                What's Coming Next
              </h2>
              <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
                Building the security infrastructure Web3 deserves - one unified platform for all your protection needs.
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto px-4">
              <div className="glass-card p-8 sm:p-12 rounded-3xl border border-primary/20 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-12 flex-wrap gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse"></div>
                          <div className="absolute inset-0 w-4 h-4 rounded-full bg-primary/30 animate-ping"></div>
                        </div>
                        <span className="text-sm font-medium text-primary tracking-wider uppercase">Roadmap Q3 2025 - Q2 2026</span>
                      </div>
                      <h3 className="text-3xl font-bold text-foreground">
                        Complete Threat Protection
                      </h3>
                      <p className="text-foreground-secondary italic">
                        Building the security infrastructure Web3 deserves - one unified platform for all your protection needs.
                      </p>
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
                          className="glass-hover border-primary/40 text-primary hover:bg-primary/15 hover:border-primary/60 transition-all duration-300"
                        >
                          <Github className="mr-2 h-4 w-4" />
                          Issues
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
                          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-primary/25 transition-all duration-300"
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Contribute
                        </Button>
                      </a>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {[
                      {
                        title: "Real-time supply chain attack monitoring",
                        description: "Detect malicious packages and compromised dependencies instantly across your entire tech stack",
                        status: "In Progress",
                        priority: "high",
                        eta: "Q4 2025"
                      },
                      {
                        title: "Source code analysis & vulnerability scanning",
                        description: "AI-powered static analysis to detect security vulnerabilities, code smells, and potential exploits in your repositories",
                        status: "In Progress",
                        priority: "high",
                        eta: "Q4 2025"
                      },
                      {
                        title: "DevSecOps pipeline security integration",
                        description: "Seamless CI/CD security scanning with GitHub Actions, GitLab CI, and Jenkins integration for automated security checks",
                        status: "Planning",
                        priority: "high",
                        eta: "Q1 2026"
                      },
                      {
                        title: "Third-party dependency risk alerts",
                        description: "Get immediate notifications about critical vulnerabilities in your dependencies with fix recommendations",
                        status: "Planning", 
                        priority: "high",
                        eta: "Q1 2026"
                      },
                      {
                        title: "GitHub repository security analysis",
                        description: "Comprehensive scanning of public and private repositories for secrets, misconfigurations, and security anti-patterns",
                        status: "Research",
                        priority: "high",
                        eta: "Q1 2026"
                      },
                      {
                        title: "Instant website phishing & malware detection",
                        description: "AI-powered URL scanning that protects you from malicious sites before you click",
                        status: "Research",
                        priority: "medium",
                        eta: "Q1 2026"
                      },
                      {
                        title: "Compromised domain scanning",
                        description: "Continuous monitoring for domain hijacking, DNS poisoning, and certificate anomalies",
                        status: "Planning",
                        priority: "medium", 
                        eta: "Q2 2026"
                      },
                      {
                        title: "Live threat intelligence feed",
                        description: "Real-time global threat intelligence with personalized risk assessments for your profile",
                        status: "In Progress",
                        priority: "high",
                        eta: "Q4 2025"
                      }
                    ].map((feature, index) => (
                      <div 
                        key={index}
                        className="group p-6 rounded-2xl bg-gradient-to-br from-card/80 to-card/60 border border-primary/15 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <div className={`w-2 h-2 rounded-full ${
                                feature.status === 'In Progress' ? 'bg-green-500' :
                                feature.status === 'Planning' ? 'bg-orange-500' : 'bg-gray-400'
                              } animate-pulse`}></div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                                {feature.title}
                              </h4>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
                          {feature.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <span className={`inline-flex items-center text-xs px-3 py-1 rounded-full font-medium ${
                              feature.status === 'In Progress' 
                                ? 'bg-green-500/15 text-green-600 border border-green-500/25' 
                                : feature.status === 'Planning'
                                ? 'bg-orange-500/15 text-orange-600 border border-orange-500/25'
                                : 'bg-muted/60 text-foreground-secondary border border-border/50'
                            }`}>
                              {feature.status}
                            </span>
                            <span className={`inline-flex items-center text-xs px-3 py-1 rounded-full font-medium ${
                              feature.priority === 'high'
                                ? 'bg-red-500/15 text-red-600 border border-red-500/25'
                                : 'bg-blue-500/15 text-blue-600 border border-blue-500/25'
                            }`}>
                              {feature.priority} priority
                            </span>
                          </div>
                          <span className="text-xs text-foreground-secondary font-mono bg-muted/30 px-2 py-1 rounded">
                            {feature.eta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/8 via-primary/12 to-secondary/8 border border-primary/25 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 mb-4">
                        <Heart className="h-5 w-5 text-primary" />
                        <span className="text-lg font-semibold text-foreground">Join Our Security Mission</span>
                      </div>
                      <p className="text-foreground-secondary mb-6 max-w-2xl mx-auto">
                        Help us build the most comprehensive Web3 security platform. Whether you're a security researcher, 
                        developer, or just passionate about digital safety - there's a place for you in our community.
                      </p>
                      <div className="flex flex-wrap justify-center gap-4">
                        <a href="https://t.me/digibastion" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/15 hover:border-primary/60">
                            💬 Join Discussion
                          </Button>
                        </a>
                        <a href="https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/15 hover:border-primary/60">
                            📖 Contributing Guide
                          </Button>
                        </a>
                        <a href="https://github.com/Raiders0786/digibastion/issues/new" target="_blank" rel="noopener noreferrer">
                          <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                            🚀 Suggest Feature
                          </Button>
                        </a>
                      </div>
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
