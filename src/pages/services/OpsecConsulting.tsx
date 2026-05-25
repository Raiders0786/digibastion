import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { MetaTags } from '../../components/MetaTags';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, ArrowRight, Twitter, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const CAL_URL = 'https://cal.com/raiders';

const threats = [
  {
    n: '01',
    title: 'DPRK recruiter & fake-VC playbook',
    body:
      'Lazarus-aligned clusters are still running fake recruiter, VC and podcast outreach against founders and engineers — landing signed macOS stealers and Node "task" payloads in seconds.',
    fix: 'We harden your inbound-contact workflow: second-channel verification, disposable VMs for unknown calls, and a hard "no installed meeting clients" rule.',
  },
  {
    n: '02',
    title: 'Unlimited approvals & address poisoning',
    body:
      'Most drained wallets in 2025–26 were not "hacked" — they signed a single malicious approval, or pasted a poisoned look-alike address from their own history.',
    fix: 'We audit every live approval, set up signing hygiene, and migrate high-value holdings to multisig or hardware-backed flows.',
  },
  {
    n: '03',
    title: 'Infostealers & clipboard hijackers on macOS',
    body:
      'Atomic Stealer variants ship signed and notarized, lifting keychains, browser-wallet state and seed phrases the moment they execute on your main machine.',
    fix: 'We compartmentalize your devices — separate accounts, separate browser profiles, and the Qubes OS pathway for the highest-risk operators.',
  },
  {
    n: '04',
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
      <main className="flex-grow pt-28 pb-20 px-5 sm:px-8 lg:px-10">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-muted-foreground mb-10 font-mono tracking-wide" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2 text-border">/</span>
            <Link to="/services" className="hover:text-foreground">Services</Link>
            <span className="mx-2 text-border">/</span>
            <span className="text-foreground">OpSec Consulting</span>
          </nav>

          {/* Hero */}
          <section className="mb-24 sm:mb-32 animate-fade-in">
            <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-end">
              <div>
                <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-6">
                  OpSec Consulting · Now booking
                </p>
                <h1 className="font-display font-normal text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-[5.5rem] text-foreground tracking-tight mb-6">
                  Your keys. Your coins.{' '}
                  <em className="italic text-primary">Your sovereignty.</em>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Operational security consulting for founders, funds and crypto holders who can't afford a mistake.
                  Start free with our open-source checklist — or book a call when you want hands-on expert work.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-9">
                  <a href={CAL_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full px-6">
                      <Calendar className="w-4 h-4" /> Book a discovery call
                    </Button>
                  </a>
                  <Link to="/category/opsec" className="w-full sm:w-auto">
                    <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2 text-foreground hover:bg-transparent hover:text-primary">
                      Free OpSec checklist <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <ul className="hidden lg:block border-l border-border/60 pl-6 space-y-4 text-sm min-w-[14rem]">
                <li>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">ESP 2025</div>
                  <div className="text-muted-foreground mt-0.5">Ethereum Foundation grant</div>
                </li>
                <li>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">Open source</div>
                  <div className="text-muted-foreground mt-0.5">Every check is auditable</div>
                </li>
                <li>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">50+ protocols</div>
                  <div className="text-muted-foreground mt-0.5">Ethereum stack monitored</div>
                </li>
              </ul>
            </div>
          </section>

          {/* Threat landscape — editorial dossier */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Threat landscape · May 2026</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-3">The threats are real.</h2>
            <p className="text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Every week, crypto holders lose meaningful sums to a small handful of attack patterns.
              Here's what's actually landing right now — and how we address each one in an engagement.
            </p>
            <ol className="divide-y divide-border/60 border-y border-border/60">
              {threats.map((t) => (
                <li key={t.title} className="grid sm:grid-cols-[3.5rem_1fr] gap-x-6 gap-y-3 py-8">
                  <div className="font-mono text-xs tracking-[0.18em] text-primary pt-1">{t.n}</div>
                  <div>
                    <h3 className="font-display font-normal text-xl sm:text-2xl text-foreground mb-2 leading-snug">
                      {t.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">{t.body}</p>
                    <div className="border-l border-primary/50 pl-4 text-sm text-foreground/90 leading-relaxed">
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary block mb-1">
                        How we address it
                      </span>
                      {t.fix}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* What's covered — clean two-col list */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Coverage</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-8">What an engagement covers</h2>
            <ul className="grid sm:grid-cols-2 gap-x-10 border-t border-border/60">
              {covers.map((c) => (
                <li
                  key={c}
                  className="py-4 border-b border-border/60 text-foreground flex items-baseline gap-3"
                >
                  <span className="font-mono text-[11px] text-primary">—</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Process — stepper */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Process</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-10">How it works</h2>
            <div className="relative">
              <div className="hidden md:block absolute top-3 left-0 right-0 h-px bg-border/60" />
              <ol className="grid md:grid-cols-4 gap-8 md:gap-6 relative">
                {[
                  ['01', 'Discovery call', 'Free 30-min call. Understand your setup, surface immediate risks.'],
                  ['02', 'Posture audit', 'Deep analysis of wallets, devices, key storage, approvals and procedures.'],
                  ['03', 'Remediation', 'Prioritized findings with concrete fixes. We guide every step.'],
                  ['04', 'Optional retainer', 'Continuous monitoring, threat alerts and incident response on call.'],
                ].map(([n, t, d]) => (
                  <li key={n} className="relative pl-9 md:pl-0 md:pt-8">
                    <span className="md:absolute md:top-0 md:left-0 absolute left-0 top-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-background border border-primary/60 text-[10px] font-mono text-primary">
                      {n}
                    </span>
                    <h3 className="font-medium text-foreground mb-1.5">{t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Packages — flat, equal-weight */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Engagements</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-10">Three ways to work together</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/60 border border-border/60">
              {packages.map((p) => (
                <div
                  key={p.name}
                  className="bg-background p-7 flex flex-col"
                >
                  <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="font-display font-normal text-2xl text-foreground">{p.name}</h3>
                    {p.highlighted && (
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mb-4">{p.price}</p>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{p.desc}</p>
                  <ul className="space-y-2.5 mb-7 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-baseline gap-2.5 text-foreground/90">
                        <span className="font-mono text-[10px] text-primary">—</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={CAL_URL} target="_blank" rel="noopener noreferrer" className="mt-auto">
                    <Button variant={p.highlighted ? 'default' : 'outline'} className="w-full gap-2 rounded-full">
                      Contact for quote
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Team */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Team</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-3">Who you'll work with</h2>
            <p className="text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              A small, focused OpSec team. No anonymous subcontractors, no offshore handoffs — you talk to the same
              researchers who do the work.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/60 border border-border/60">
              {[
                {
                  initials: 'R',
                  name: 'Raiders',
                  role: 'Founder, DigiBastion — OpSec Lead',
                  bio:
                    'Security researcher and blockchain engineer. Builds the DigiBastion platform and leads OpSec engagements end-to-end — threat modeling, key storage, device compartmentalization and incident response.',
                  links: [
                    { Icon: Twitter, href: 'https://x.com/__Raiders' },
                    { Icon: Github, href: 'https://github.com/Raiders0786' },
                  ],
                },
                {
                  initials: 'C',
                  name: 'Cryptonian16',
                  role: 'OpSec Guru',
                  bio:
                    'Security expert specializing in operational security and threat mitigation. Deep experience in Qubes OS workflows, threat modeling for HNW holders, and the human side of social-engineering defense.',
                  links: [{ Icon: Twitter, href: 'https://x.com/SolenyaResearch' }],
                },
              ].map((m) => (
                <div key={m.name} className="bg-background p-7">
                  <div className="flex items-start gap-5">
                    <div className="font-display text-3xl w-14 h-14 border border-border/70 flex items-center justify-center text-primary shrink-0">
                      {m.initials}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-normal text-2xl text-foreground leading-tight">{m.name}</h3>
                      <p className="text-xs font-mono tracking-wide text-muted-foreground mt-1">{m.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-5 leading-relaxed">{m.bio}</p>
                  <div className="flex items-center gap-4 mt-5">
                    {m.links.map(({ Icon, href }) => (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                         className="text-muted-foreground hover:text-primary transition-colors">
                        <Icon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ — bare accordion with hairlines */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">FAQ</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-8">Frequently asked</h2>
            <Accordion type="single" collapsible className="border-t border-border/60">
              {faqs.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`} className="border-b border-border/60">
                  <AccordionTrigger className="text-left text-base font-medium py-5 hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Final CTA — quiet, framed by hairlines */}
          <section className="border-y border-border/60 py-14 sm:py-20 text-center">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-4">Next step</p>
            <h2 className="font-display font-normal text-3xl sm:text-5xl text-foreground max-w-2xl mx-auto leading-[1.1] mb-7">
              Don't wait for a breach to find out what was missing.
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm sm:max-w-none mx-auto">
              <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full px-7">
                  <Calendar className="w-4 h-4" /> Book on Cal.com
                </Button>
              </a>
              <Link to="/contact">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2 text-foreground hover:bg-transparent hover:text-primary">
                  <Mail className="w-4 h-4" /> Email us instead
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-5">Free 30-min call · NDA on request · No sales pressure</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OpsecConsulting;