import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSecurityState } from '../hooks/useSecurityState';
import { SecurityCard } from '../components/SecurityCard';
import { SecurityScore } from '../components/SecurityScore';
import { ThreatLevelSelector } from '../components/ThreatLevelSelector';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { OpsecBanner } from '../components/opsec/OpsecBanner';
import { SecurityBadges } from '../components/opsec/SecurityBadges';
import { Github, Heart, Loader2, ArrowRight, MessageSquare, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import espLogo from '../assets/esp-logo-white.svg';

const Index = () => {
  const { categories, getCategoryScore, getOverallScore, getStats, threatLevel, isLoading, changeCount } = useSecurityState();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const elementId = location.state.scrollTo;
      const element = document.getElementById(elementId);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        setTimeout(() => {
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [changeCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center" aria-live="polite" aria-busy="true">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
            <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse-soft" />
          </div>
          <p className="mt-4 text-muted-foreground">Updating your security profile...</p>
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
      
      {/* OpSec Quiz Banner */}
      <div className="pt-16">
        <OpsecBanner />
      </div>
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="section-container section-spacing">
          {/* ESP Support Badge */}
          <div className="flex justify-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-muted/30 border border-border/50">
              <span className="text-sm text-muted-foreground">Supported in 2025 with a small grant from</span>
              <a 
                href="https://esp.ethereum.foundation/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transition-all duration-200 hover:scale-105 hover:brightness-110"
                aria-label="Ethereum Ecosystem Support Program"
              >
                <img 
                  src={espLogo} 
                  alt="Ethereum ESP" 
                  className="h-7 w-auto opacity-90 hover:opacity-100"
                />
              </a>
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-foreground">The Ultimate </span>
              <span className="text-gradient">Web3 Security</span>
              <br />
              <span className="text-foreground">Checklist</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Stop jumping between scattered security tools. Protect your digital footprint with 
              our unified OpSec platform — expert-backed practices, live threat monitoring, 
              and supply chain risk alerts.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <a 
                href="https://github.com/Raiders0786/digibastion" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="btn-primary gap-2">
                  <Github className="h-5 w-5" />
                  View on GitHub
                </Button>
              </a>
              <a 
                href="https://www.digibastion.com/support" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50">
                  <Heart className="h-5 w-5 text-primary" />
                  Support Us
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Threat Level Selector */}
        <section className="section-container pb-16">
          <ThreatLevelSelector />
        </section>

        {/* Security Score */}
        <section className="section-container pb-20" key={`score-${threatLevel}-${changeCount}`} id="score">
          <SecurityScore score={getOverallScore()} stats={getStats()} />
        </section>

        {/* Security Badges */}
        <section className="section-container pb-20">
          <SecurityBadges />
        </section>

        {/* Security Categories Grid */}
        <section className="section-container pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Security Categories
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comprehensive checklists covering every aspect of your digital security
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
            {categories.map((category, index) => (
              <SecurityCard
                key={`${category.id}-${threatLevel}-${changeCount}`}
                category={category.id}
                title={category.title}
                description={category.description}
                link={`/category/${category.id}`}
                total={category.items.length}
                completed={category.items.filter(item => item.completed).length}
              />
            ))}
          </div>
        </section>

        {/* Roadmap Section */}
        <section id="roadmap" className="section-container section-spacing scroll-mt-20 border-t border-border/50">
          <div className="text-center mb-12">
            <div className="badge-primary mb-4 inline-flex">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Roadmap
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What's Coming Next
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Building the security infrastructure Web3 deserves — one unified platform for all your protection needs.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="glass-card p-8 sm:p-10">
              {/* Roadmap Header */}
              <div className="flex items-center justify-between mb-10 flex-wrap gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-success/50 animate-ping" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                      Q3 2025 — Q2 2026
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Complete Threat Protection
                  </h3>
                </div>
                <div className="flex gap-2">
                  <a href="https://github.com/Raiders0786/digibastion/issues" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2 border-border/50 hover:bg-muted/50">
                      <Github className="h-4 w-4" />
                      Issues
                    </Button>
                  </a>
                  <a href="https://github.com/Raiders0786/digibastion" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="gap-2 btn-primary">
                      <Heart className="h-4 w-4" />
                      Contribute
                    </Button>
                  </a>
                </div>
              </div>
              
              {/* Feature Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
                {[
                  {
                    title: "Real-time supply chain attack monitoring",
                    description: "Detect malicious packages and compromised dependencies instantly",
                    status: "In Progress",
                    eta: "Q4 2025"
                  },
                  {
                    title: "Source code analysis & vulnerability scanning",
                    description: "AI-powered static analysis to detect security vulnerabilities",
                    status: "In Progress",
                    eta: "Q4 2025"
                  },
                  {
                    title: "DevSecOps pipeline integration",
                    description: "Seamless CI/CD security scanning with GitHub Actions & GitLab CI",
                    status: "Planning",
                    eta: "Q1 2026"
                  },
                  {
                    title: "Third-party dependency risk alerts",
                    description: "Immediate notifications about critical vulnerabilities",
                    status: "Planning", 
                    eta: "Q1 2026"
                  },
                  {
                    title: "GitHub repository security analysis",
                    description: "Scanning for secrets, misconfigurations, and anti-patterns",
                    status: "Research",
                    eta: "Q1 2026"
                  },
                  {
                    title: "Phishing & malware detection",
                    description: "AI-powered URL scanning to protect from malicious sites",
                    status: "Research",
                    eta: "Q1 2026"
                  },
                  {
                    title: "Compromised domain scanning",
                    description: "Monitoring for domain hijacking and DNS poisoning",
                    status: "Planning",
                    eta: "Q2 2026"
                  },
                  {
                    title: "Live threat intelligence feed",
                    description: "Real-time global threat intelligence with personalized assessments",
                    status: "In Progress",
                    eta: "Q4 2025"
                  }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="group p-5 rounded-xl bg-muted/20 border border-border/50 
                      hover:border-primary/30 hover:bg-muted/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          feature.status === 'In Progress' ? 'bg-success' :
                          feature.status === 'Planning' ? 'bg-warning' : 'bg-muted-foreground'
                        }`} />
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">
                          {feature.title}
                        </h4>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        feature.status === 'In Progress' 
                          ? 'bg-success/15 text-success' 
                          : feature.status === 'Planning'
                          ? 'bg-warning/15 text-warning'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {feature.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {feature.eta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Community CTA */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    Join Our Security Mission
                  </h4>
                  <p className="text-sm text-muted-foreground mb-5 max-w-xl mx-auto">
                    Help us build the most comprehensive Web3 security platform. Whether you're a security researcher, 
                    developer, or passionate about digital safety.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a href="https://t.me/digibastion" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2 border-border/50 hover:bg-muted/50">
                        <MessageSquare className="h-4 w-4" />
                        Join Discussion
                      </Button>
                    </a>
                    <a href="https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2 border-border/50 hover:bg-muted/50">
                        <BookOpen className="h-4 w-4" />
                        Contributing Guide
                      </Button>
                    </a>
                    <a href="https://github.com/Raiders0786/digibastion/issues/new" target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-2 btn-primary">
                        <ArrowRight className="h-4 w-4" />
                        Suggest Feature
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
