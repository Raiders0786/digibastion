import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { MetaTags } from '../../components/MetaTags';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, ArrowRight, Twitter, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { serializeJsonLd } from '@/utils/jsonLd';

const CAL_URL = 'https://cal.com/raiders';

const threats = [
  {
    n: '01',
    title: 'The fake recruiter and the fake VC',
    body:
      'DPRK-linked crews are still the most productive social engineers in the industry. They show up as recruiters, podcasters, or eager VCs, and within a couple of messages they have you running a "coding test" or installing a meeting app that quietly empties your keychain.',
    fix: 'We put a second-channel check on every cold inbound, move first-time calls into a throwaway VM, and write down a rule you will actually follow: no new meeting clients, ever.',
  },
  {
    n: '02',
    title: 'Approvals you forgot, addresses you trusted',
    body:
      'Most wallets we see drained in the last year were not technically hacked. Someone signed an unlimited approval months ago, or pasted an address from their own history that turned out to be a poisoned lookalike. The mistake is small. The number after it is not.',
    fix: 'We walk through every live approval with you, fix the signing flow so the next prompt is readable, and move anything serious onto multisig or a hardware-backed setup.',
  },
  {
    n: '03',
    title: 'Stealers on the machine you actually use',
    body:
      'Atomic Stealer and its cousins ship signed and notarized, sometimes through fake job apps or pirated tools your kid installed. The first run is enough to lift your keychain, your browser wallet state, and any seed you ever pasted.',
    fix: 'We split your work across separate accounts and browser profiles, get the high-risk things off your main machine, and for people who want to go further, set up the Qubes pathway properly.',
  },
  {
    n: '04',
    title: 'Hardware you assumed was safe',
    body:
      'Tampered devices, sketchy firmware updates, and compromised companion apps are still a real problem, especially for hardware bought from anywhere other than the manufacturer. The supply chain is a person, and people get phished too.',
    fix: 'We verify your devices, pin down how you accept firmware updates, and run a tabletop exercise on your seed recovery so the first time you try it is not the day you need it.',
  },
];

const covers = [
  'A pass through your wallets, signing flow, and live approvals',
  'Key storage, backups, and whether multisig is worth it for you',
  'Splitting your devices and browser profiles so one bad click is not the end',
  'The Qubes setup, if you actually want to go that far',
  'Phishing drills you run on yourselves, not us writing a slide deck',
  'An incident playbook and a number you can call on a Sunday',
];

const packages = [
  {
    name: 'Baseline Audit',
    price: 'Contact for quote',
    desc: 'A focused review for one person or a small team that wants to know where they stand.',
    features: ['Wallet and approval pass', 'Honest threat read', 'Short list of what to fix first', 'One-hour working session', 'Written notes you can act on'],
    highlighted: false,
  },
  {
    name: 'Full Posture Review',
    price: 'Contact for quote',
    desc: 'The full thing, for funds, DAOs, and founders with real exposure.',
    features: ['Wallets, devices, and procedures from the ground up', 'A phishing drill we actually run against you', 'A long look at whether multisig fits', 'Findings ranked by what hurts most', 'Ninety days of help while you apply it'],
    highlighted: true,
  },
  {
    name: 'Advisory Retainer',
    price: 'Contact for quote',
    desc: 'Keep us close. For portfolios and teams where one bad day is too many.',
    features: ['Someone to call when things go wrong', 'A monthly look at what changed', 'Eyes on your stack between calls', 'A direct line to the people doing the work', 'A quarterly read-out for whoever needs one'],
    highlighted: false,
  },
];

const faqs = [
  { q: 'Will you sign an NDA?', a: 'Yes, mutual, before anything sensitive is on the table. We treat the rest as default.' },
  { q: 'Remote or in person?', a: 'Remote by default, over channels we both trust. We will travel for retainer clients if it makes sense.' },
  { q: 'Do you ever touch our keys or funds?', a: 'No. We do not handle seeds, keys, or wallets. You do the work on your own hardware, we stay on the call and tell you what to do next.' },
  { q: 'Do we have to use Qubes?', a: 'Not at all. Qubes is one option for people who want to go further. We start from whatever you already run, on macOS, Linux, or Windows, and improve from there.' },
  { q: 'How fast do retainer clients get a response?', a: 'We aim to be on a live incident inside four hours, and you get a direct Signal line to the people who do the work.' },
  { q: 'What if the first call is not useful?', a: 'You owe us nothing. We agree the scope and the fee before anything bills, and we will not push you into work that does not pay you back.' },
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
        title="Web3 OpSec Consulting: Threat Modeling & Qubes Hardening | DigiBastion"
        description="Hands-on OpSec for founders, funds, and people sitting on size. We review your wallets, your devices, and the way you actually work, and tell you what to change first. Book a free call."
        keywords="web3 opsec, opsec consulting, crypto security audit, qubes os, threat modeling, wallet hardening, web3 security consultant"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(serviceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
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
                  OpSec Consulting · Taking new clients
                </p>
                <h1 className="font-display font-normal text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-[5.5rem] text-foreground tracking-tight mb-6">
                  OpSec for people who already know{' '}
                  <em className="italic text-primary">what is at stake.</em>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Most of the founders and holders we work with do not need to be lectured about the risks. They
                  want a quiet afternoon with someone who can look at their setup and tell them, plainly, what to
                  change first.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-9">
                  <a href={CAL_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full px-6">
                      <Calendar className="w-4 h-4" /> Set up a call
                    </Button>
                  </a>
                  <Link to="/category/opsec" className="w-full sm:w-auto">
                    <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2 text-foreground hover:bg-transparent hover:text-primary">
                      Try the free checklist first <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <ul className="hidden lg:block border-l border-border/60 pl-6 space-y-4 text-sm min-w-[14rem]">
                <li>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">ESP 2025</div>
                  <div className="text-muted-foreground mt-0.5">Funded by the Ethereum Foundation</div>
                </li>
                <li>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">Open source</div>
                  <div className="text-muted-foreground mt-0.5">Read the code before you trust us</div>
                </li>
                <li>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">50+ protocols</div>
                  <div className="text-muted-foreground mt-0.5">Watched across the Ethereum stack</div>
                </li>
              </ul>
            </div>
          </section>

          {/* Threat landscape */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Threat landscape · May 2026</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-3">What we keep seeing.</h2>
            <p className="text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Most of the losses we hear about every week come down to the same handful of attacks. Here is what is
              landing right now, and the part of an engagement that deals with each one.
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
                        How we deal with it
                      </span>
                      {t.fix}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* What's covered */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">What we look at</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-8">Inside an engagement</h2>
            <ul className="grid sm:grid-cols-2 gap-x-10 border-t border-border/60">
              {covers.map((c) => (
                <li
                  key={c}
                  className="py-4 border-b border-border/60 text-foreground flex items-baseline gap-3"
                >
                  <span className="font-mono text-[11px] text-primary">+</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Process */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">How we work</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-10">From first call to handover</h2>
            <div className="relative">
              <div className="hidden md:block absolute top-3 left-0 right-0 h-px bg-border/60" />
              <ol className="grid md:grid-cols-4 gap-8 md:gap-6 relative">
                {[
                  ['01', 'A first call', 'Thirty minutes, free. You tell us what you have, we tell you where we would start.'],
                  ['02', 'Proper review', 'Wallets, devices, keys, approvals, the procedures around them. Written down so it stays useful.'],
                  ['03', 'Findings and fixes', 'A short list, ranked by what matters, plus a working session to apply it together.'],
                  ['04', 'Stay on call', 'Optional. We keep an eye on things and pick up the phone when something goes sideways.'],
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

          {/* Packages */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Engagements</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-10">Three ways to work with us</h2>
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
                        Most pick this
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mb-4">{p.price}</p>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{p.desc}</p>
                  <ul className="space-y-2.5 mb-7 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-baseline gap-2.5 text-foreground/90">
                        <span className="font-mono text-[10px] text-primary">+</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={CAL_URL} target="_blank" rel="noopener noreferrer" className="mt-auto">
                    <Button variant={p.highlighted ? 'default' : 'outline'} className="w-full gap-2 rounded-full">
                      Get a quote
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Team */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Team</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-3">The people on your call</h2>
            <p className="text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              We are a small team. No anonymous subcontractors, no offshore handoffs. The people you meet on the
              first call are the people who do the work.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/60 border border-border/60">
              {[
                {
                  initials: 'R',
                  name: 'Raiders',
                  role: 'Founder, DigiBastion. OpSec lead.',
                  bio:
                    'Security researcher and blockchain engineer. Built DigiBastion from scratch and runs every engagement end to end, from the first review of your wallets to the late-night call when something is wrong.',
                  links: [
                    { Icon: Twitter, href: 'https://x.com/__Raiders' },
                    { Icon: Github, href: 'https://github.com/Raiders0786' },
                  ],
                },
                {
                  initials: 'C',
                  name: 'Cryptonian16',
                  role: 'OpSec, deep end.',
                  bio:
                    'Spends most days in the kind of Qubes setups other people only read about. Works on the human side of this too: how holders actually get phished, and what to change so it stops working.',
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

          {/* FAQ */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Things people ask</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-8">Before you book the call</h2>
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

          {/* Final CTA */}
          <section className="border-y border-border/60 py-14 sm:py-20 text-center">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-4">Your move</p>
            <h2 className="font-display font-normal text-3xl sm:text-5xl text-foreground max-w-2xl mx-auto leading-[1.1] mb-7">
              If something on this page lands, book the call.
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm sm:max-w-none mx-auto">
              <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full px-7">
                  <Calendar className="w-4 h-4" /> Pick a time on Cal.com
                </Button>
              </a>
              <Link to="/contact">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2 text-foreground hover:bg-transparent hover:text-primary">
                  <Mail className="w-4 h-4" /> Or send us an email
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-5">
              Thirty minutes, free. No pitch. You will know in the first ten whether we can help.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OpsecConsulting;
