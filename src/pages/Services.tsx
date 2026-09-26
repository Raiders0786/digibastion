import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { serializeJsonLd } from '@/utils/jsonLd';

const CAL_URL = 'https://cal.com/raiders';

const services = [
  {
    slug: 'opsec-consulting',
    eyebrow: '01',
    title: 'Web3 OpSec Consulting',
    status: 'Available now',
    summary:
      'A proper look at how you store keys, sign transactions, and run your day-to-day machine. We work mostly with founders, funds, and people sitting on size who would prefer not to lose it.',
    bullets: ['Wallet and approval review', 'Device and browser cleanup', 'Phishing drills you actually run'],
    available: true,
    to: '/services/opsec-consulting',
  },
  {
    slug: 'full-stack-review',
    eyebrow: '02',
    title: 'Full-Stack Security Review',
    status: 'Available now',
    summary:
      'A senior pair of eyes across your whole product: smart contracts, offchain services, the dApp itself, cloud, identity, and the controls your enterprise buyers and chain foundations will eventually ask for.',
    bullets: ['Contracts, APIs, and cloud in one engagement', 'Findings ranked by what actually hurts', 'A working session, not a PDF you file away'],
    available: true,
    to: '/services/full-stack-review',
  },
  {
    slug: 'dns-domain-monitoring',
    eyebrow: '03',
    title: 'DNS & Domain Monitoring',
    status: 'Coming soon',
    summary:
      'We watch your DNS, your domain, and your frontend so you find out about a change before your users do. Alerts land in PagerDuty or Slack, with the context you need to act.',
    bullets: ['DNS and TLS posture', 'Lookalike domain watch', 'Frontend integrity checks'],
    available: false,
    to: '/services',
  },
  {
    slug: 'threat-intel-retainer',
    eyebrow: '04',
    title: 'Threat Intel Retainer',
    status: 'Coming soon',
    summary:
      'A curated feed built around the libraries, vendors, and chains your team actually depends on. No firehose, no daily noise: only the incidents that matter to you.',
    bullets: ['Filtered to your stack', 'Push alerts for criticals', 'Quarterly read-out for leadership'],
    available: false,
    to: '/threat-intel',
  },
];

const credentials = [
  ['ESP 2025', 'Funded by the Ethereum Foundation'],
  ['Open source', 'Read the code before you trust it'],
  ['Named team', 'You always know who is on the call'],
];

const process = [
  ['01', 'A first call', 'Thirty minutes, free. You tell us what you have, we tell you what we would look at first.'],
  ['02', 'Scoped review', 'We write down what is in and out, agree on a flat fee, and start.'],
  ['03', 'Findings and fixes', 'A short report, ranked by what matters, plus a working session to actually apply it.'],
  ['04', 'Stay on call', 'Optional. We keep an eye on things, take your panicked Sunday messages, and help when something breaks.'],
];

const Services = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.digibastion.com/' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://www.digibastion.com/services' },
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Security Services: Web3 OpSec, DNS Monitoring & Threat Intel | DigiBastion"
        description="The paid work behind DigiBastion. Web3 OpSec consulting, DNS and domain monitoring, and threat intel retainers, delivered by the same people who build the open-source platform."
        keywords="web3 security services, opsec consulting, dns monitoring, threat intelligence, crypto security audit, digibastion services"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <Navbar />
      <main className="flex-grow pt-28 pb-20 px-5 sm:px-8 lg:px-10">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <section className="mb-24 sm:mb-32 animate-fade-in">
            <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-end">
              <div>
                <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-6">
                  Services · Taking on a few clients
                </p>
                <h1 className="font-display font-normal text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-7xl text-foreground tracking-tight mb-6">
                  The security work most teams keep{' '}
                  <em className="italic text-primary">putting off.</em>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  DigiBastion is free and open source, and it will stay that way. When you would rather have someone
                  who lives in this stuff sit down with you and actually do the review, that is what these
                  engagements are for.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-9">
                  <a href={CAL_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full px-6">
                      <Calendar className="w-4 h-4" /> Talk to us for 30 minutes
                    </Button>
                  </a>
                  <Link to="/services/opsec-consulting" className="w-full sm:w-auto">
                    <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2 text-foreground hover:bg-transparent hover:text-primary">
                      Read about OpSec consulting <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <ul className="hidden lg:block border-l border-border/60 pl-6 space-y-4 text-sm min-w-[14rem]">
                {credentials.map(([k, v]) => (
                  <li key={k}>
                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary">{k}</div>
                    <div className="text-muted-foreground mt-0.5">{v}</div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Services list */}
          <section className="mb-24 sm:mb-32">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground">What we work on</h2>
              <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-muted-foreground hidden sm:block">
                Four engagements, two open now
              </span>
            </div>
            <ul className="divide-y divide-border/60 border-y border-border/60">
              {services.map((s) => {
                const Wrapper: any = s.available ? Link : 'div';
                const wrapperProps = s.available ? { to: s.to } : {};
                return (
                  <li key={s.slug}>
                    <Wrapper
                      {...wrapperProps}
                      className={`group grid sm:grid-cols-[3.5rem_1fr_auto] gap-x-6 gap-y-3 py-7 sm:py-8 transition-colors ${
                        s.available ? 'hover:bg-muted/20 cursor-pointer' : 'opacity-80'
                      }`}
                    >
                      <div className="font-mono text-xs tracking-[0.18em] text-primary pt-1">{s.eyebrow}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display font-normal text-2xl sm:text-3xl text-foreground leading-tight">
                            {s.title}
                          </h3>
                          {!s.available && (
                            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground border border-border/70 rounded-full px-2 py-0.5">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground max-w-2xl leading-relaxed">{s.summary}</p>
                        <ul className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-muted-foreground/90">
                          {s.bullets.map((b) => (
                            <li key={b} className="before:content-['+'] before:mr-2 before:text-primary/60">
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="self-center justify-self-start sm:justify-self-end">
                        {s.available ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-primary group-hover:gap-2.5 transition-all">
                            View <ArrowUpRight className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Coming soon</span>
                        )}
                      </div>
                    </Wrapper>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Mobile credentials */}
          <section className="lg:hidden mb-24 grid sm:grid-cols-3 gap-6 border-y border-border/60 py-8">
            {credentials.map(([k, v]) => (
              <div key={k}>
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary mb-1">{k}</div>
                <div className="text-sm text-muted-foreground">{v}</div>
              </div>
            ))}
          </section>

          {/* Process */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">How we work</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-10">From hello to handover</h2>
            <div className="relative">
              <div className="hidden md:block absolute top-3 left-0 right-0 h-px bg-border/60" />
              <ol className="grid md:grid-cols-4 gap-8 md:gap-6 relative">
                {process.map(([n, t, d]) => (
                  <li key={n} className="relative pl-6 md:pl-0 md:pt-8">
                    <span className="md:absolute md:top-0 md:left-0 absolute left-0 top-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-background border border-primary/60 text-[10px] font-mono text-primary">
                      {n}
                    </span>
                    <h3 className="font-medium text-foreground mb-1.5">{t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* CTA */}
          <section className="border-y border-border/60 py-14 sm:py-20 text-center">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-4">Your move</p>
            <h2 className="font-display font-normal text-3xl sm:text-5xl text-foreground max-w-2xl mx-auto leading-[1.1] mb-6">
              If something on this page lands, book a call.
            </h2>
            <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 rounded-full px-7">
                <Calendar className="w-4 h-4" /> Pick a time on Cal.com
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-4">
              Thirty minutes, free. No pitch. You will know in the first ten whether we can help.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
