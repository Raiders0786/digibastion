import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { MetaTags } from '../../components/MetaTags';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, ArrowRight, Twitter, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const CAL_URL = 'https://cal.com/raiders';

const tracks = [
  {
    n: '01',
    title: 'Smart contracts and onchain logic',
    body:
      'Solidity, Vyper, and Move read by people who write it. We look for the patterns that actually cost money in 2026: re-entrancy in newer hook-based DEXes, donation and inflation attacks on share-based vaults, oracle assumptions that quietly break during a depeg, upgrade paths nobody remembers granting, and the subtle stuff around ERC-7683 cross-chain intents, EIP-7702 delegated EOAs, restaking slashing surfaces, and account-abstraction paymaster abuse.',
    fix: 'You get a ranked findings doc with reproductions, recommended fixes written against your codebase, and a working session where we walk through each one with the engineer who will close it out.',
  },
  {
    n: '02',
    title: 'Offchain services and APIs',
    body:
      'Indexers, relayers, signers, keeper bots, webhooks, the queue you stood up six months ago and stopped thinking about. We look at how requests are authenticated, what happens on replay, whether your RPC provider can lie to you and how you would notice, and where a single compromised key lets someone drain everything downstream.',
    fix: 'Concrete changes to auth, idempotency, and key handling. A short threat model your on-call engineer can actually use at 3am, not a 40-page PDF.',
  },
  {
    n: '03',
    title: 'Frontend and dApp surface',
    body:
      'Most users still get hit at the wallet prompt. We go through your connect flow, every signature your app asks for, EIP-712 payloads, approval UX, and the supply chain underneath: every npm dependency, every CDN, every font loader, every analytics script that can quietly redirect a transaction.',
    fix: 'Readable signing prompts, a CSP that actually fits your app, subresource integrity where it matters, a dependency policy you can enforce, and a plan for the lookalike-domain story.',
  },
  {
    n: '04',
    title: 'Cloud and infrastructure',
    body:
      'The configs that bite crypto teams: IAM roles with more blast radius than anyone realises, KMS keys without rotation, exposed S3 or R2 buckets full of dev exports, SSRF on cloud metadata endpoints, edge functions with prod database access, terraform drift no one is watching.',
    fix: 'A least-privilege map of who can touch what, a short list of changes ranked by blast radius, and the boring stuff (rotation, alerting, drift detection) wired up properly.',
  },
  {
    n: '05',
    title: 'Identity, access, and the people part',
    body:
      'Who can deploy, who can sign, who can press the upgrade button, who has prod DB access on a Sunday. The boring accounts: domain registrar, DNS, GitHub org, Vercel, npm, the email behind your recovery flows. This is where most teams have unfixed problems they would rather not look at.',
    fix: 'SSO and MFA on the accounts that actually matter, a written recovery plan you have tested once, and a short conversation with the people who hold the keys about what happens when one of them is unreachable.',
  },
  {
    n: '06',
    title: 'Compliance readiness, light touch',
    body:
      'Not a SOC 2 audit. A read on where you stand against what your enterprise customers, market makers, exchanges, and chain foundations are going to ask for in the next twelve months: SOC 2 Type I scoping, ISO 27001 control gaps, MiCA operational resilience for EU exposure, US state money transmitter posture if you touch fiat, sanctions screening on the counterparties you settle with.',
    fix: 'A gap analysis you can hand to your COO, plus a shortlist of auditors and lawyers we trust for the parts we are not the right people to do.',
  },
];

const deliverables = [
  'A ranked findings document, written in plain English, with severity calls we can defend',
  'Reproductions for anything that needs one, including the contract test or the curl command',
  'A live working session per surface, with the engineer who will own the fix',
  'A remediation checklist your team can actually close out',
  'Thirty days of follow-up questions, answered by the same people who did the review',
  'Optional retest once the work is done, for a fixed fee agreed up front',
];

const packages = [
  {
    name: 'Spot Check',
    price: 'Contact for quote',
    desc: 'One surface, in depth. Contracts only, or cloud only, or the dApp only. For teams who already know where they want a second opinion.',
    features: ['One track from the six above', 'About one week of work', 'Ranked findings doc', 'A one-hour working session', 'Two weeks of question follow-up'],
    highlighted: false,
  },
  {
    name: 'Full Review',
    price: 'Contact for quote',
    desc: 'All six tracks. The right shape for a team approaching a launch, a raise, or a partnership that will ask hard questions.',
    features: ['Every track covered', 'Two to three weeks, depending on surface', 'Findings doc plus working session per track', 'Thirty days of follow-up', 'Fixed-fee retest available'],
    highlighted: true,
  },
  {
    name: 'Embedded',
    price: 'Contact for quote',
    desc: 'For teams who want a security person on retainer without hiring one yet. Quarterly review plus a Slack or Telegram channel we actually answer in.',
    features: ['Quarterly full review', 'A direct channel with the people doing the work', 'A monthly note on what changed in your stack', 'First response on live incidents in hours, not days', 'Annual readout for your board or investors'],
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Is this an audit I can put on my landing page?',
    a: 'No. This is a review, not a stamp. If you need a public audit report for a token launch or a TVL milestone, we will tell you which audit firms to talk to and help you scope the engagement so you do not waste money.',
  },
  {
    q: 'How is this different from a Code4rena or Cantina contest?',
    a: 'Different shape of work. Contests rip through a codebase in parallel and stop on submission day. We sit with your team, look at the whole system end to end, and own the followup. Most teams use both at different points.',
  },
  {
    q: 'Can you sign an NDA?',
    a: 'Yes, mutual, before the first call if you want one. We assume confidentiality is the default either way.',
  },
  {
    q: 'What if you find something serious mid-review?',
    a: 'You hear about it the same hour, in writing, with a suggested mitigation. We do not sit on findings to pad a final report.',
  },
  {
    q: 'Do you keep working with us after the report?',
    a: 'If you want. The Embedded package exists because most teams said yes the first time we offered it.',
  },
  {
    q: 'Will you touch our prod keys or signers?',
    a: 'No. We work alongside your team. You hold the keys, you press the buttons, we tell you what to do and review what you did.',
  },
];

const FullStackReview = () => {
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Full-Stack Web3 Security Review',
    serviceType: 'Security Review',
    provider: {
      '@type': 'Organization',
      name: 'DigiBastion',
      url: 'https://www.digibastion.com',
    },
    areaServed: 'Worldwide',
    description:
      'A senior review across your crypto product: smart contracts, offchain services, dApp, cloud, identity, and compliance readiness. Flat fee, named team, honest report.',
    url: 'https://www.digibastion.com/services/full-stack-review',
    offers: packages.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      description: p.desc,
    })),
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
      { '@type': 'ListItem', position: 3, name: 'Full-Stack Review', item: 'https://www.digibastion.com/services/full-stack-review' },
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Full-Stack Web3 Security Review: Contracts, APIs, Cloud, Compliance | DigiBastion"
        description="A senior review across your crypto product: smart contracts, offchain services, dApp, cloud, identity, and compliance readiness. Flat fee, named team, honest report."
        keywords="web3 security review, smart contract audit, dapp security, crypto cloud security, web3 compliance, soc 2 crypto, mica readiness, full stack security review"
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
            <span className="text-foreground">Full-Stack Review</span>
          </nav>

          {/* Hero */}
          <section className="mb-24 sm:mb-32 animate-fade-in">
            <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-end">
              <div>
                <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-6">
                  Services · Full-Stack Review
                </p>
                <h1 className="font-display font-normal text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-[5.5rem] text-foreground tracking-tight mb-6">
                  One review, across the whole{' '}
                  <em className="italic text-primary">surface.</em>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Most security work in crypto is sold in slices: an audit here, a pentest there, a SOC 2 reviewer
                  who has never opened Etherscan. We sit with your team for a couple of weeks and look at the whole
                  product, contracts through to cloud, and tell you what to fix first.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-9">
                  <a href={CAL_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full px-6">
                      <Calendar className="w-4 h-4" /> Set up a call
                    </Button>
                  </a>
                  <a href="#tracks" className="w-full sm:w-auto">
                    <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2 text-foreground hover:bg-transparent hover:text-primary">
                      See what we cover <ArrowRight className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
              <ul className="hidden lg:block border-l border-border/60 pl-6 space-y-4 text-sm min-w-[14rem]">
                <li>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">ESP 2025</div>
                  <div className="text-muted-foreground mt-0.5">Funded by the Ethereum Foundation</div>
                </li>
                <li>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">Named team</div>
                  <div className="text-muted-foreground mt-0.5">You always know who is on the call</div>
                </li>
                <li>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">Flat fee</div>
                  <div className="text-muted-foreground mt-0.5">Agreed before any work starts</div>
                </li>
              </ul>
            </div>
          </section>

          {/* Tracks */}
          <section id="tracks" className="mb-24 sm:mb-32 scroll-mt-28">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">What we actually look at</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-3">Six tracks, scoped to your stack.</h2>
            <p className="text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              You do not have to take all six. We will tell you which ones are worth your time after the first call.
              The list below is what a full engagement covers.
            </p>
            <ol className="divide-y divide-border/60 border-y border-border/60">
              {tracks.map((t) => (
                <li key={t.title} className="grid sm:grid-cols-[3.5rem_1fr] gap-x-6 gap-y-3 py-8">
                  <div className="font-mono text-xs tracking-[0.18em] text-primary pt-1">{t.n}</div>
                  <div>
                    <h3 className="font-display font-normal text-xl sm:text-2xl text-foreground mb-2 leading-snug">
                      {t.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">{t.body}</p>
                    <div className="border-l border-primary/50 pl-4 text-sm text-foreground/90 leading-relaxed">
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary block mb-1">
                        What you get back
                      </span>
                      {t.fix}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Deliverables */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">The deliverable</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-8">A report you will actually use.</h2>
            <ul className="grid sm:grid-cols-2 gap-x-10 border-t border-border/60">
              {deliverables.map((c) => (
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
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">How an engagement runs</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-10">From intro call to retest</h2>
            <div className="relative">
              <div className="hidden md:block absolute top-3 left-0 right-0 h-px bg-border/60" />
              <ol className="grid md:grid-cols-4 gap-8 md:gap-6 relative">
                {[
                  ['01', 'Intro call', 'Thirty minutes, free. You walk us through the product, we tell you which tracks we would prioritise.'],
                  ['02', 'Scoping doc', 'A short written scope, in and out, with a flat fee agreed before anything starts. No hourly games.'],
                  ['03', 'Review', 'One to three weeks, depending on surface. We work in your repo, on your infra, with the engineer closest to each track.'],
                  ['04', 'Readout and retest', 'A working session per track, then a remediation window. Optional fixed-fee retest once the work is done.'],
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
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-10">Three ways in</h2>
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
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-3">The people on the review</h2>
            <p className="text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              We have done this on protocols holding nine-figure TVL and on five-person teams two weeks from launch.
              The people you meet on the first call are the people who do the work.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/60 border border-border/60">
              {[
                {
                  initials: 'R',
                  name: 'Raiders',
                  role: 'Founder, DigiBastion. Review lead.',
                  bio:
                    'Security researcher and blockchain engineer. Reads Solidity for a living and has spent years on the wrong end of incident calls. Runs scoping and the final readout on every engagement.',
                  links: [
                    { Icon: Twitter, href: 'https://x.com/__Raiders' },
                    { Icon: Github, href: 'https://github.com/Raiders0786' },
                  ],
                },
                {
                  initials: 'C',
                  name: 'Cryptonian16',
                  role: 'Infra and offchain review.',
                  bio:
                    'Backend, cloud, and the offchain plumbing nobody wants to own. Has rotated more compromised keys than he would like to admit. The person you want looking at your IAM policies and your relayer.',
                  links: [
                    { Icon: Twitter, href: 'https://x.com/cryptonian16' },
                  ],
                },
              ].map((m) => (
                <div key={m.name} className="bg-background p-7">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-display text-xl text-primary">
                      {m.initials}
                    </div>
                    <div>
                      <h3 className="font-display font-normal text-xl text-foreground leading-tight">{m.name}</h3>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{m.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{m.bio}</p>
                  <div className="flex gap-3">
                    {m.links.map(({ Icon, href }) => (
                      <a
                        key={href}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
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
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Questions we get a lot</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-8">Before you book a call</h2>
            <Accordion type="single" collapsible className="border-y border-border/60">
              {faqs.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`} className="border-b border-border/60 last:border-b-0">
                  <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-5">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* CTA */}
          <section className="border-y border-border/60 py-14 sm:py-20 text-center">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-4">Your move</p>
            <h2 className="font-display font-normal text-3xl sm:text-5xl text-foreground max-w-2xl mx-auto leading-[1.1] mb-6">
              If something here lands, book a call.
            </h2>
            <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 rounded-full px-7">
                <Calendar className="w-4 h-4" /> Pick a time on Cal.com
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-4">
              Thirty minutes, free. You will know in the first ten whether we are useful to you.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FullStackReview;