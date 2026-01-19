import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSecurityState } from '../hooks/useSecurityState';
import { SecurityCard } from '../components/SecurityCard';
import { SecurityScore } from '../components/SecurityScore';
import { ThreatLevelSelector } from '../components/ThreatLevelSelector';
import { SecurityPresets } from '../components/SecurityPresets';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';
import { supabase } from '@/integrations/supabase/client';
import { Github, Loader2, ArrowRight, Shield, AlertTriangle, Zap, Bell, Lock, Newspaper, CheckCircle2, Map, ExternalLink, MessageCircle, Users, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import espLogo from '../assets/esp-logo-white.svg';
import { formatDistanceToNow } from 'date-fns';
import { useSubscriberCount } from '@/hooks/useSubscriberCount';

interface RecentAlert {
  id: string;
  title: string;
  severity: string;
  published_at: string;
}

const Index = () => {
  const { categories, getCategoryScore, getOverallScore, getStats, threatLevel, isLoading, changeCount } = useSecurityState();
  const location = useLocation();
  const navigate = useNavigate();
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const { data: subscriberCount } = useSubscriberCount();

  // Fetch recent alerts from database
  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('news_articles')
        .select('id, title, severity, published_at')
        .in('severity', ['critical', 'high', 'medium'])
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (data) {
        setRecentAlerts(data);
      }
    };
    fetchAlerts();
  }, []);

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
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Digibastion — Protect Your Crypto from Phishing, Hacks & Scams"
        description="Free, open-source Web3 security platform. Get real-time threat alerts, security checklists, and OpSec assessments to protect your crypto from phishing, wallet drains, and scams."
      />
      <Navbar />
      
      <main className="flex-grow pt-16">
        {/* Hero Section - Clear Value Prop */}
        <section className="relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-destructive/5 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative section-container py-16 sm:py-20">
            {/* ESP Badge */}
            <div className="flex justify-center mb-8 sm:mb-10 animate-fade-in px-2">
              <a 
                href="https://blog.ethereum.org/2025/12/02/allocation-q3-25"
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-muted/30 border border-border/50 transition-all duration-200 hover:bg-muted/50 hover:border-primary/30"
              >
                <span className="text-[10px] sm:text-xs text-muted-foreground text-center">Supported in 2025 with a small grant from:</span>
                <img 
                  src={espLogo} 
                  alt="Ethereum ESP" 
                  className="h-5 sm:h-6 w-auto opacity-90"
                />
              </a>
            </div>

            {/* Main Headline - Clear Problem/Solution */}
            <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-fade-in-up px-2">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                <span className="text-foreground">Don't Get </span>
                <span className="text-destructive">Rekt</span>
                <span className="text-foreground">.</span>
                <br />
                <span className="text-foreground">Protect Your Crypto from </span>
                <span className="text-gradient">Phishing & Scams</span>
              </h1>
              
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto px-2">
                Free security checklists, real-time threat alerts, and OpSec assessments. 
                Stay one step ahead of hackers.
              </p>
            </div>

            {/* What You Get - Simple 3 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12">
              <button
                onClick={() => navigate('/threat-intel?tab=alerts')}
                className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 hover:border-destructive/40 hover:bg-destructive/10 transition-all group text-left"
              >
                <AlertTriangle className="w-6 h-6 text-destructive mb-2" />
                <h3 className="font-semibold text-foreground text-sm">Live Threat Alerts</h3>
                <p className="text-xs text-muted-foreground mt-1">Real-time crypto security threats delivered to your inbox</p>
              </button>
              
              <button
                onClick={() => navigate('/quiz')}
                className="p-4 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all group text-left"
              >
                <Shield className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-semibold text-foreground text-sm">OpSec Quiz</h3>
                <p className="text-xs text-muted-foreground mt-1">Test your security and get personalized recommendations</p>
              </button>
              
              <button
                onClick={() => {
                  const element = document.getElementById('checklists');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="p-4 rounded-xl bg-accent/5 border border-accent/20 hover:border-accent/40 hover:bg-accent/10 transition-all group text-left"
              >
                <CheckCircle2 className="w-6 h-6 text-accent mb-2" />
                <h3 className="font-semibold text-foreground text-sm">Security Checklists</h3>
                <p className="text-xs text-muted-foreground mt-1">Step-by-step guides to secure wallets, devices & accounts</p>
              </button>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8 sm:mt-10 px-4">
              <Button 
                onClick={() => navigate('/threat-intel?tab=alerts')}
                size="lg" 
                className="gap-2 bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
              >
                <Bell className="h-4 w-4" />
                Get Threat Alerts
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => navigate('/quiz')}
                size="lg" 
                variant="outline"
                className="gap-2 border-primary/30 hover:bg-primary/10 w-full sm:w-auto"
              >
                <Zap className="h-4 w-4 text-primary" />
                Take Security Quiz
              </Button>
            </div>

            {/* Trust Signal */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              100% free & open-source • No account required • Community-powered
            </p>
          </div>
        </section>

        {/* Threat Intel Highlight */}
        <section className="section-container py-10 sm:py-12 border-y border-border/50 bg-muted/30">
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
            <div className="flex-1 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-xs font-medium text-destructive">Live Threat Feed</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                Real-Time Crypto Security Alerts
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Stay ahead of wallet drainers, phishing sites, and smart contract exploits. 
                Get critical alerts delivered to your inbox before you become a victim.
              </p>
              <ul className="space-y-2 inline-block text-left">
                {[
                  'Critical exploit warnings',
                  'Phishing site detections',
                  'Wallet drainer alerts',
                  'Supply chain attack notifications'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center lg:justify-start">
                <Button onClick={() => navigate('/threat-intel?tab=alerts')} className="gap-2 w-full sm:w-auto">
                  <Newspaper className="w-4 h-4" />
                  View Threat Feed
                </Button>
                <Button onClick={() => navigate('/threat-intel?tab=subscribe')} variant="outline" className="gap-2 w-full sm:w-auto">
                  <Bell className="w-4 h-4" />
                  Subscribe
                  {subscriberCount && subscriberCount.count > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">({subscriberCount.label})</span>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="p-4 rounded-xl bg-background border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-foreground">Recent Alerts</span>
                </div>
                <div className="space-y-3">
                  {recentAlerts.length > 0 ? (
                    recentAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          alert.severity === 'critical' ? 'bg-destructive' : 
                          alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.published_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Loading alerts...</p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-3 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => navigate('/threat-intel?tab=alerts')}
                >
                  View all alerts →
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Threat Level Selector */}
        <section className="section-container py-12">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Choose Your Threat Profile
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Different users face different threats. Select your profile to see relevant security recommendations.
            </p>
          </div>
          <ThreatLevelSelector />
          <div className="flex justify-center mt-4">
            <SecurityPresets />
          </div>
        </section>

        {/* Security Score */}
        <section className="section-container pb-16" key={`score-${threatLevel}-${changeCount}`} id="score">
          <SecurityScore score={getOverallScore()} stats={getStats()} />
        </section>


        {/* Security Checklists */}
        <section className="section-container pb-20" id="checklists">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Security Checklists
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Step-by-step guides to protect every aspect of your digital life. Start with the essentials, then level up.
            </p>
          </div>
          
          {/* Priority Categories - Start Here */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Start Here — Essential Security</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories
                .filter(c => ['wallet', 'authentication', 'opsec'].includes(c.id))
                .map((category) => (
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
          </div>

          {/* Device & Network Security */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Device & Network Security</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories
                .filter(c => ['os', 'browsing', 'mobile', 'email'].includes(c.id))
                .map((category) => (
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
          </div>

          {/* Web3 Specific */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-warning" />
              <h3 className="text-lg font-semibold text-foreground">Web3 & DeFi Security</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories
                .filter(c => ['defi', 'developers', 'jobs', 'social'].includes(c.id))
                .map((category) => (
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
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="section-container pb-16" id="roadmap">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Map className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">Public Roadmap</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              What's Coming Next
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Building the security infrastructure Web3 deserves. Join us in shaping the future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* Q4 2025 */}
            <div className="p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-foreground">Q4 2025</span>
                <span className="text-xs text-green-500 ml-auto">In Progress</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>OpSec Assessment Quiz</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Threat Intelligence Feed</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary shrink-0 mt-0.5" />
                  <span>Supply Chain Monitoring</span>
                </li>
              </ul>
            </div>

            {/* Q1 2026 */}
            <div className="p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm font-semibold text-foreground">Q1 2026</span>
                <span className="text-xs text-yellow-500 ml-auto">Planning</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-500 shrink-0 mt-0.5" />
                  <span>DNS Security Scanner</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-500 shrink-0 mt-0.5" />
                  <span>DevSecOps Integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-500 shrink-0 mt-0.5" />
                  <span>GitHub Repo Analysis</span>
                </li>
              </ul>
            </div>

            {/* Q2 2026 */}
            <div className="p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold text-foreground">Q2 2026</span>
                <span className="text-xs text-blue-500 ml-auto">Research</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 shrink-0 mt-0.5" />
                  <span>Browser Extension</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 shrink-0 mt-0.5" />
                  <span>Domain Scanning</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 shrink-0 mt-0.5" />
                  <span>Mobile App</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <a 
              href="https://github.com/Raiders0786/digibastion/blob/main/ROADMAP.md" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                View Full Roadmap
              </Button>
            </a>
            <a 
              href="https://t.me/digibastion" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Join Community
              </Button>
            </a>
          </div>
        </section>

        {/* GitHub CTA */}
        <section className="section-container pb-20">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 border border-border/50 text-center">
            <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Open Source & Community Powered
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Built in public by security researchers and the crypto community. 
              Star us on GitHub or contribute to help keep the ecosystem safe.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a 
                href="https://github.com/Raiders0786/digibastion" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gap-2">
                  <Github className="h-5 w-5" />
                  Star on GitHub
                </Button>
              </a>
              <a 
                href="https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="gap-2">
                  Contribute
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      <OnboardingTour />
    </div>
  );
};

export default Index;
