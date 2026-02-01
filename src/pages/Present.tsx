import { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Globe, 
  Package, 
  Code, 
  Users, 
  Target, 
  ExternalLink,
  Github,
  Twitter,
  Mail,
  Clock,
  TrendingUp,
  Lock,
  FileText,
  Award,
  Boxes,
  Network,
  Scan,
  Bell,
  GitBranch,
  FileCode,
  Search,
  ArrowRight,
  Building,
  Wallet,
  LineChart,
  Send
} from "lucide-react";

const Present = () => {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText("chirag@digibastion.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="h-10 w-10 md:h-12 md:w-12 text-primary" />
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                  DigiBastion
                </h1>
              </div>
              
              <p className="text-lg md:text-xl text-muted-foreground font-medium">
                Secure the Stack
              </p>
              
              <div className="pt-4">
                <blockquote className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground leading-relaxed max-w-3xl mx-auto">
                  "Every major crypto hack in 2024-2025 was preventable. 
                  <span className="text-primary"> DigiBastion makes sure you're not next.</span>"
                </blockquote>
              </div>

              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto pt-4 leading-relaxed">
                An open-source, Ethereum Foundation-backed security platform delivering real-time threat intelligence, 
                operational security assessments, and comprehensive protection guides—helping projects, teams, and 
                individuals stay ahead of exploits, supply chain attacks, and zero-days.
              </p>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-12 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="bg-card/50 border-primary/20">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Ethereum Foundation</p>
                    <p className="text-sm text-muted-foreground">ESP Grant Recipient (Q3 2025)</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-primary/20">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">SEAL Alliance</p>
                    <p className="text-sm text-muted-foreground">DNS Security Framework Steward</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-primary/20">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">MITRE AADAPT</p>
                    <p className="text-sm text-muted-foreground">Contributor (ADT1195)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4 text-destructive border-destructive/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  The Problem
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">What Keeps Teams Up at Night</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                        <Code className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Protocol Teams</h3>
                        <p className="text-sm text-muted-foreground">
                          DNS hijacks, supply chain compromises, dependency vulnerabilities, audit blind spots
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                        <FileCode className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Developers</h3>
                        <p className="text-sm text-muted-foreground">
                          Malicious npm packages, compromised libraries, CVEs in their stack, JavaScript injection
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                        <Wallet className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Individuals & Traders</h3>
                        <p className="text-sm text-muted-foreground">
                          Phishing, wallet drains, social engineering, poor OpSec habits
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                        <Network className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Security Teams</h3>
                        <p className="text-sm text-muted-foreground">
                          Fragmented tools, delayed threat intel, no unified visibility across Web2 + Web3 surfaces
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-2xl md:text-3xl font-bold text-destructive">$2.3B+</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Lost to hacks in 2024</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-2xl md:text-3xl font-bold text-destructive">70%+</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">OpSec failures, not smart contract bugs</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-2xl md:text-3xl font-bold text-destructive">Bypass</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Supply chain attacks skip audits</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-2xl md:text-3xl font-bold text-destructive">Post-Exploit</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Most learn after the attack</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Solution */}
        <section className="py-16 md:py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4 text-success border-success/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  The Solution
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">What DigiBastion Delivers</h2>
              </div>

              {/* Now Live */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <h3 className="text-lg font-semibold">Now Live — Free</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-success/20 bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-success/10 shrink-0">
                          <Bell className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Real-Time Threat Intel</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Curated feed of active exploits, CVEs, supply chain attacks—delivered to your inbox
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-success/20 bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-success/10 shrink-0">
                          <FileText className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">200+ Security Checks</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            11 categories covering wallets, DeFi, OS hardening, developer security, OpSec
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-success/20 bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-success/10 shrink-0">
                          <Target className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">OpSec Assessment Quiz</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            8-question interactive assessment with personalized recommendations
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-success/20 bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-success/10 shrink-0">
                          <LineChart className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Dynamic Security Scoring</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Track your security posture improvement over time
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-success/20 bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-success/10 shrink-0">
                          <Boxes className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Curated Tool Stack</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Hand-picked security tools with integration guides
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <h3 className="text-lg font-semibold">Launching in 1-2 Weeks</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-warning/20 bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-warning/10 shrink-0">
                          <Scan className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">DNS Security Scanner</h4>
                            <Badge variant="secondary" className="text-xs">80% Complete</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Comprehensive DNS security analysis—catch hijacks before they happen
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-warning/20 bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-warning/10 shrink-0">
                          <Globe className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">DNS Monitoring</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Real-time alerts for suspicious DNS changes on your domains
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Roadmap */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <h3 className="text-lg font-semibold">Roadmap Q1-Q2 2026</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { icon: Package, title: "Supply Chain Monitoring", desc: "Real-time malicious package detection" },
                    { icon: Bell, title: "Dependency Risk Alerts", desc: "Notifications when libraries get compromised" },
                    { icon: GitBranch, title: "DevSecOps Integration", desc: "CI/CD pipeline security automation" },
                    { icon: Code, title: "JavaScript Monitoring", desc: "Detect injected scripts & compromised CDNs" },
                    { icon: Search, title: "Full-Stack Security Reviews", desc: "Comprehensive auditing for projects" },
                    { icon: Github, title: "GitHub Repo Analysis", desc: "Code security scanning for repositories" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/50">
                      <item.icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who This Is For */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">
                  <Users className="h-3 w-3 mr-1" />
                  Target Audience
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">Who This Is For</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: Code, title: "Protocol Teams", desc: "Pre-audit hardening, ongoing threat monitoring, DNS protection" },
                  { icon: FileCode, title: "Developer Teams", desc: "Supply chain security, dependency monitoring, best practices" },
                  { icon: Shield, title: "Security Researchers", desc: "Threat intelligence source, incident tracking, community contribution" },
                  { icon: Wallet, title: "Individual Holders", desc: "Personal OpSec assessment, anti-phishing protection, security hygiene" },
                  { icon: Building, title: "Funds & Institutions", desc: "Portfolio security standards, due diligence tooling" },
                ].map((item, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{item.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Key Stats */}
        <section className="py-12 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto text-center">
              {[
                { value: "200+", label: "Security Checks" },
                { value: "30+", label: "Tracked Incidents" },
                { value: "524+", label: "Commits" },
                { value: "11", label: "Categories" },
                { value: "<2min", label: "OpSec Assessment" },
                { value: "Free", label: "Forever" },
              ].map((stat, i) => (
                <div key={i} className="p-4">
                  <p className="text-xl md:text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">
                  <Users className="h-3 w-3 mr-1" />
                  Built By Practitioners
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">Core Contributors</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* Lead */}
                <Card className="md:col-span-2 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 shrink-0 w-fit">
                        <Shield className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">Chirag Agrawal</h3>
                          <Badge variant="secondary" className="text-xs">Creator & Lead</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          SEAL Alliance DNS Framework Steward • MITRE AADAPT Contributor • 
                          3+ years audit firm experience • Synack Red Team • 2 Published CVEs
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">CVE-2023-3067</Badge>
                          <Badge variant="outline">CVE-2022-4722</Badge>
                          <Badge variant="outline">AWS Security Pro</Badge>
                          <Badge variant="outline">Web3Sec.News Founder</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Other contributors */}
                {[
                  { name: "Vladimir S.", role: "Officer's Notes", desc: "Security expert & Web3 educator — reviews and curates security resources" },
                  { name: "Ridham Bhagat", role: "DNS Scanner Lead", desc: "Core contributor — DNS security scanning & network analysis tools" },
                  { name: "Cryptonian16", role: "OpSec Specialist", desc: "Security expert — operational security practices & threat mitigation" },
                ].map((person, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted shrink-0">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-semibold">{person.name}</h4>
                            <Badge variant="outline" className="text-xs">{person.role}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{person.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Open source = open contribution
                </p>
                <a
                  href="https://github.com/Raiders0786/digibastion"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Github className="h-4 w-4 mr-2" />
                    Join us on GitHub
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-2xl md:text-3xl font-bold">Ready to Secure Your Stack?</h2>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/quiz">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Target className="h-4 w-4 mr-2" />
                    Take the OpSec Quiz
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
                <a href="/threat-intel">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <Bell className="h-4 w-4 mr-2" />
                    Get Threat Alerts
                  </Button>
                </a>
              </div>

              <Separator className="my-8" />

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Interested in DNS security beta or partnership discussions?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="https://twitter.com/__Raiders"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Twitter className="h-4 w-4 mr-2" />
                      @__Raiders
                    </Button>
                  </a>
                  <a
                    href="https://t.me/Raiders0786"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Telegram
                    </Button>
                  </a>
                  <Button variant="outline" size="sm" onClick={copyEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    {copied ? "Copied!" : "chirag@digibastion.com"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Links */}
        <section className="py-12 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-center font-semibold mb-6">Key Links</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[
                  { label: "Platform", url: "https://digibastion.com", icon: Globe },
                  { label: "GitHub", url: "https://github.com/Raiders0786/digibastion", icon: Github },
                  { label: "SEAL DNS Framework", url: "https://frameworks.securityalliance.org/infrastructure/domain-and-dns-security/", icon: Shield },
                  { label: "MITRE ADT1195", url: "https://aadapt.mitre.org/techniques/ADT1195", icon: Target },
                  { label: "EF Grant", url: "https://blog.ethereum.org/2025/12/02/allocation-q3-25", icon: Award },
                  { label: "Roadmap", url: "https://github.com/Raiders0786/digibastion/blob/main/ROADMAP.md", icon: TrendingUp },
                ].map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-colors"
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{link.label}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                  </a>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>100% Open Source • MIT License • Free Forever</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Present;
