import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { MetaTags } from '../../components/MetaTags';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Shield, Calendar, ArrowRight, CheckCircle2, Twitter, Github, Link as LinkIcon,
  AlertTriangle, Cpu, KeyRound, Eye, Star, Mail,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CAL_URL = 'https://cal.com/raiders';

const threats = [
  {
    icon: Eye,
    title: 'DPRK recruiter & fake-VC playbook',
    body:
      'Lazarus-aligned clusters are still running fake recruiter, VC and podcast outreach against founders and engineers — landing signed macOS stealers and Node "task" payloads in seconds.',
    fix: 'We harden your inbound-contact workflow: second-channel verification, disposable VMs for unknown calls, and a hard "no installed meeting clients" rule.',
  },
  {
    icon: KeyRound,
    title: 'Unlimited approvals & address poisoning',
    body:
      'Most drained wallets in 2025–26 were not "hacked" — they signed a single malicious approval, or pasted a poisoned look-alike address from their own history.',
    fix: 'We audit every live approval, set up signing hygiene, and migrate high-value holdings to multisig or hardware-backed flows.',
  },
  {
    icon: Cpu,
    title: 'Infostealers & clipboard hijackers on macOS',
    body:
      'Atomic Stealer variants ship signed and notarized, lifting keychains, browser-wallet state and seed phrases the moment they execute on your main machine.',
    fix: 'We compartmentalize your devices — separate accounts, separate browser profiles, and the Qubes OS pathway for the highest-risk operators.',
  },
  {
    icon: AlertTriangle,
    title: 'Hardware wallet & supply-chain risk',
    body:
      'Tampered devices, malicious firmware updates and compromised companion apps remain a real risk for anyone buying hardware outside trusted channels.',
    fix: 'We verify your hardware, lock down firmware update flow, and run a tabletop attack on your seed-recovery procedure.',
  },
];

const covers = [
  'Wallet, signing and approval review',
  'Key storage, backup and multisig posture',
  'Device & browser compartmentalization',
  'Qubes OS pathway for high-risk operators',
  'Inbound-contact / phishing drills',
  'Incident response runbook & on-call setup',
];

const packages = [
  {
    name: 'Baseline Audit',
    price: 'Contact for quote',
    desc: 'Essential security review for individual holders and small teams.',
    features: ['Wallet & approval review', 'Threat assessment', 'Prioritized checklist', '1h walkthrough call', 'Written report'],
    highlighted: false,
  },
  {
    name: 'Full Posture Review',
    price: 'Contact for quote',
    desc: 'Comprehensive audit with remediation roadmap for funds, DAOs and founders.',
    features: ['Full wallet & device audit', 'Simulated phishing drill', 'Multisig evaluation', 'Risk-scored findings', '90-day remediation support'],
    highlighted: true,
  },
  {
    name: 'Advisory Retainer',
    price: 'Contact for quote',
    desc: 'Ongoing security advisory for high-value portfolios and operating teams.',
    features: ['On-call incident response', 'Monthly assessments', 'Real-time threat monitoring', 'Direct senior access', 'Quarterly executive brief'],
    highlighted: false,
  },
];

const faqs = [
  { q: 'Will you sign an NDA?', a: 'Yes. We sign a mutual NDA before any sensitive discussion. Confidentiality is the default posture for every engagement.' },
  { q: 'Remote or in-person?', a: 'Engagements are remote by default over secure channels. On-site work is available for retainer clients on request.' },
  { q: 'Do you ever take custody of keys or funds?', a: 'Never. We do not touch your seeds, keys, or wallets. All hardening is performed by you, on your hardware, guided by us.' },
  { q: 'Is Qubes OS required?', a: 'No. Qubes is one pathway for the highest-risk operators. We meet you where you are — macOS, Linux or Windows — and harden from there.' },
  { q: 'What is the response time for retainer clients?', a: 'Retainer clients get a target 4-hour first-response window for active incidents and a dedicated Signal channel to senior staff.' },
  { q: 'What is your refund policy?', a: 'If the discovery call surfaces nothing useful, you owe nothing. Engagements are scoped before any invoice; we do not lock you into open-ended work.' },
];

const OpsecConsulting = () => {
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Web3 OpSec Consulting',
    serviceType: 'Operational Security Consulting',
    provider: {
      '@type': 'Organization',
      name: 'DigiBastion',
      url: 'https://www.digibastion.com',
    },
    areaServed: 'Worldwide',
    description:
      'Operational security consulting for web3 founders, funds and high-net-worth holders. Threat modeling, device hardening, key management and the Qubes OS pathway.',
    url: 'https://www.digibastion.com/services/opsec-consulting',
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.digibastion.com/' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://www.digibastion.com/services' },
      { '@type': 'ListItem', position: 3, name: 'OpSec Consulting', item: 'https://www.digibastion.com/services/opsec-consulting' },
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Web3 OpSec Consulting — Threat Modeling & Qubes Hardening | DigiBastion"
        description="Operational security consulting for web3 founders, funds and HNW holders. Threat modeling, device compartmentalization, key management and the Qubes OS pathway. Delivered by named researchers — book a free discovery call."
        keywords="web3 opsec, opsec consulting, crypto security audit, qubes os, threat modeling, wallet hardening, web3 security consultant"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Navbar />
      <main className="flex-grow pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/services" className="hover:text-foreground">Services</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">OpSec Consulting</span>
          </nav>

          {/* Hero */}
          <section className="mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-5">
              <Shield className="w-3.5 h-3.5" /> Now accepting HNW clients & teams
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Web3 OpSec Consulting — Threat Modeling, Device Hardening, Qubes Pathway
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Your keys. Your coins. Your sovereignty. Operational security consulting for founders, funds and crypto
              holders who can't afford a mistake. Start free with our open-source OpSec checklist — or book a call when
              you want hands-on expert work.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2">
                  <Calendar className="w-4 h-4" /> Book a discovery call
                </Button>
              </a>
              <Link to="/category/opsec">
                <Button size="lg" variant="outline" className="gap-2">
                  Browse free OpSec checklist <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 text-xs text-muted-foreground">
              <span>ESP 2025 grant recipient</span>
              <span>·</span>
              <span>Open-source platform</span>
              <span>·</span>
              <span>50+ Ethereum protocols monitored</span>
            </div>
          </section>

          {/* Threat landscape */}
          <section className="mb-16">
            <div className="mb-6">
              <span className="text-xs font-mono text-primary">[ threat landscape — May 2026 ]</span>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mt-2">The threats are real</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Every week, crypto holders lose meaningful sums to a small handful of attack patterns. Here's what's
                actually landing right now — and how we address each one in an engagement.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {threats.map((t) => (
                <Card key={t.title} className="glass-card-hover p-6">
                  <t.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">{t.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.body}</p>
                  <div className="text-sm text-foreground border-l-2 border-primary/40 pl-3">
                    <span className="font-medium text-primary">How we address it: </span>
                    {t.fix}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* What's covered */}
          <section className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-6">What an engagement covers</h2>
            <Card className="p-6">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {covers.map((c) => (
                  <li key={c} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{c}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Process */}
          <section className="mb-16">
            <span className="text-xs font-mono text-primary">[ process ]</span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mt-2 mb-6">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['01', 'Discovery call', 'Free 30-min call. Understand your setup, surface immediate risks.'],
                ['02', 'Posture audit', 'Deep analysis of wallets, devices, key storage, approvals and procedures.'],
                ['03', 'Remediation report', 'Prioritized findings with concrete fixes. We guide every step.'],
                ['04', 'Optional retainer', 'Continuous monitoring, threat alerts and incident response on call.'],
              ].map(([n, t, d]) => (
                <Card key={n} className="p-5">
                  <div className="text-xs font-mono text-primary mb-2">{n}</div>
                  <h3 className="font-medium text-foreground mb-1">{t}</h3>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Packages */}
          <section className="mb-16">
            <span className="text-xs font-mono text-primary">[ services ]</span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mt-2 mb-6">Security packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {packages.map((p) => (
                <Card
                  key={p.name}
                  className={`p-6 flex flex-col relative ${
                    p.highlighted ? 'border-primary/40 shadow-glow' : ''
                  }`}
                >
                  {p.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold tracking-wide inline-flex items-center gap-1">
                      <Star className="w-3 h-3" /> MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-foreground mb-1">{p.name}</h3>
                  <p className="text-sm text-primary mb-2">{p.price}</p>
                  <p className="text-sm text-muted-foreground mb-5">{p.desc}</p>
                  <ul className="space-y-2 mb-6 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={CAL_URL} target="_blank" rel="noopener noreferrer" className="mt-auto">
                    <Button variant={p.highlighted ? 'default' : 'outline'} className="w-full gap-2">
                      <Calendar className="w-4 h-4" /> Contact for quote
                    </Button>
                  </a>
                </Card>
              ))}
            </div>
          </section>

          {/* Team */}
          <section className="mb-16">
            <span className="text-xs font-mono text-primary">[ team ]</span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mt-2 mb-3">Who you'll work with</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl">
              We're a small, focused OpSec team. No anonymous subcontractors, no offshore handoffs — you talk to the
              same researchers who do the work.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Raiders */}
              <Card className="glass-card-hover p-6">
                <h3 className="text-lg font-semibold text-foreground">Raiders</h3>
                <p className="text-sm text-primary mb-3">Founder, DigiBastion — OpSec Lead</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Security researcher and blockchain engineer. Builds the DigiBastion platform and leads OpSec
                  engagements end-to-end — from threat modeling and key storage to device compartmentalization and
                  incident response.
                </p>
                <div className="flex items-center gap-3">
                  <a href="https://x.com/__Raiders" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href="https://github.com/Raiders0786" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </Card>
              {/* Cryptonian16 */}
              <Card className="glass-card-hover p-6">
                <h3 className="text-lg font-semibold text-foreground">Cryptonian16</h3>
                <p className="text-sm text-primary mb-3">OpSec Guru</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Security expert specializing in operational security practices and threat mitigation. Brings deep
                  experience in Qubes OS workflows, threat-modeling for HNW holders, and the human side of
                  social-engineering defense.
                </p>
                <div className="flex items-center gap-3">
                  <a href="https://x.com/SolenyaResearch" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <Twitter className="w-4 h-4" />
                  </a>
                </div>
              </Card>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-6">Frequently asked questions</h2>
            <Card className="p-2 sm:p-4">
              <Accordion type="single" collapsible>
                {faqs.map((f, i) => (
                  <AccordionItem key={f.q} value={`item-${i}`}>
                    <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </section>

          {/* Final CTA */}
          <section className="text-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              Don't wait for a breach.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Book a free 30-minute discovery call. We'll assess your risk and recommend next steps. No obligation, no
              sales pressure.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2">
                  <Calendar className="w-4 h-4" /> Book on Cal.com
                </Button>
              </a>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="gap-2">
                  <Mail className="w-4 h-4" /> Email us instead
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OpsecConsulting;