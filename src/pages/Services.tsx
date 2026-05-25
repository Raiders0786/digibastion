import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CAL_URL = 'https://cal.com/raiders';

const services = [
  {
    slug: 'opsec-consulting',
    eyebrow: '01',
    title: 'Web3 OpSec Consulting',
    status: 'Available now',
    summary:
      'Threat modeling, device hardening, key management and the Qubes OS pathway for founders, funds and high-net-worth holders.',
    bullets: ['Wallet & approval audit', 'Compartmentalized devices', 'Phishing & social drills'],
    available: true,
    to: '/services/opsec-consulting',
  },
  {
    slug: 'dns-domain-monitoring',
    eyebrow: '02',
    title: 'DNS & Domain Monitoring',
    status: 'Coming soon',
    summary:
      'Continuous DNS, domain and frontend integrity monitoring with PagerDuty / Slack alerts and scored findings.',
    bullets: ['DNS posture & score', 'Lookalike domain watch', 'Breach & exposure intel'],
    available: false,
    to: '/services',
  },
  {
    slug: 'threat-intel-retainer',
    eyebrow: '03',
    title: 'Threat Intel Retainer',
    status: 'Coming soon',
    summary:
      'High-signal, personalized threat intelligence covering the third-party stack and dependencies your team actually uses.',
    bullets: ['Feed personalized by stack', 'Critical push alerts', 'Quarterly exec briefings'],
    available: false,
    to: '/threat-intel',
  },
];

const credentials = [
  ['ESP 2025', 'Ethereum Foundation grant recipient'],
  ['Open source', 'Every check auditable in our public repo'],
  ['Named team', 'You know who is doing the work'],
];

const process = [
  ['01', 'Discovery call', 'Free 30-min call to scope your risk and answer questions.'],
  ['02', 'Scoped assessment', 'We map your attack surface and agree on a fixed-scope review.'],
  ['03', 'Remediation', 'Prioritized findings with concrete fixes and guided walkthrough.'],
  ['04', 'Optional retainer', 'Ongoing monitoring, threat alerts and incident response.'],
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
        title="Security Services — Web3 OpSec, DNS Monitoring & Threat Intel | DigiBastion"
        description="Paid security services from the team behind DigiBastion: Web3 OpSec consulting, DNS & domain monitoring, and threat intelligence retainers. Open-source platform, named researchers, ESP 2025 grant recipient."
        keywords="web3 security services, opsec consulting, dns monitoring, threat intelligence, crypto security audit, digibastion services"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="flex-grow pt-28 pb-20 px-5 sm:px-8 lg:px-10">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <section className="mb-24 sm:mb-32 animate-fade-in">
            <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-end">
              <div>
                <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-6">
                  Services · Now booking
                </p>
                <h1 className="font-display font-normal text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-7xl text-foreground tracking-tight mb-6">
                  Security work for teams that can't afford{' '}
                  <em className="italic text-primary">a mistake.</em>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  DigiBastion is open-source and free forever. When you need hands-on expert work —
                  threat modeling, hardening, monitoring or incident response — our researchers deliver it.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-9">
                  <a href={CAL_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full px-6">
                      <Calendar className="w-4 h-4" /> Book a 30-min call
                    </Button>
                  </a>
                  <Link to="/services/opsec-consulting" className="w-full sm:w-auto">
                    <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2 text-foreground hover:bg-transparent hover:text-primary">
                      Explore OpSec Consulting <ArrowRight className="w-4 h-4" />
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

          {/* Services list — editorial */}
          <section className="mb-24 sm:mb-32">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground">Our services</h2>
              <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-muted-foreground hidden sm:block">
                03 lines of work
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
                            <li key={b} className="before:content-['—'] before:mr-2 before:text-primary/60">
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

          {/* Process — stepper */}
          <section className="mb-24 sm:mb-32">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-3">Process</p>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-foreground mb-10">How engagements work</h2>
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

          {/* CTA — quiet */}
          <section className="border-y border-border/60 py-14 sm:py-20 text-center">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-primary mb-4">Next step</p>
            <h2 className="font-display font-normal text-3xl sm:text-5xl text-foreground max-w-2xl mx-auto leading-[1.1] mb-6">
              Don't wait for a breach to find out what was missing.
            </h2>
            <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 rounded-full px-7">
                <Calendar className="w-4 h-4" /> Book on Cal.com
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-4">Free 30-min call · No obligation · NDA on request</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Services;