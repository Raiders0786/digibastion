import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Globe, Newspaper, Calendar, CheckCircle2, ArrowRight, Lock, Code, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const CAL_URL = 'https://cal.com/raiders';

const services = [
  {
    slug: 'opsec-consulting',
    title: 'Web3 OpSec Consulting',
    status: 'Available now',
    icon: Shield,
    summary:
      'Threat modeling, device hardening, key management, and the Qubes OS pathway for founders, funds and high-net-worth holders.',
    bullets: ['Wallet & approval audit', 'Compartmentalized device setup', 'Phishing & social-engineering drills'],
    available: true,
    to: '/services/opsec-consulting',
  },
  {
    slug: 'dns-domain-monitoring',
    title: 'DNS & Domain Security Monitoring',
    status: 'Coming soon',
    icon: Globe,
    summary:
      'Continuous DNS, domain and frontend integrity monitoring with PagerDuty / Slack alerts, scored findings and PDF reports.',
    bullets: ['DNS posture scan & score', 'Lookalike / phishing domain watch', 'Breach & exposure intel'],
    available: false,
    to: '/services',
  },
  {
    slug: 'threat-intel-retainer',
    title: 'Threat Intel Retainer',
    status: 'Coming soon',
    icon: Newspaper,
    summary:
      'High-signal, personalized threat intelligence covering the third-party stack and external dependencies your team actually uses.',
    bullets: ['Personalized feed by stack', 'Critical incident push alerts', 'Quarterly executive briefings'],
    available: false,
    to: '/threat-intel',
  },
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
      <main className="flex-grow pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <section className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6">
              <Lock className="w-3.5 h-3.5" /> Paid services from the DigiBastion team
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Security services for teams that can't afford to get hacked.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              DigiBastion is open-source and free forever. When you need hands-on expert work — threat modeling,
              hardening, monitoring or incident response — our researchers deliver it.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2">
                  <Calendar className="w-4 h-4" /> Book a free 30-min call
                </Button>
              </a>
              <Link to="/services/opsec-consulting">
                <Button size="lg" variant="outline" className="gap-2">
                  Explore OpSec Consulting <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </section>

          {/* Trust pillars */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
            {[
              { icon: Shield, title: 'ESP 2025 grant', desc: 'Backed by the Ethereum Foundation Ecosystem Support Program.' },
              { icon: Code, title: 'Open-source platform', desc: 'Every check we run is auditable in our public repo.' },
              { icon: Users, title: 'Named researchers', desc: 'You know exactly who is doing the work — no anonymous subcontractors.' },
            ].map((p) => (
              <Card key={p.title} className="glass-card-hover p-5">
                <p.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-medium text-foreground mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </Card>
            ))}
          </section>

          {/* Services grid */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Our services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {services.map((s) => (
                <Card key={s.slug} className="glass-card-hover p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
                        s.available
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-muted/50 text-muted-foreground border border-border'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{s.summary}</p>
                  <ul className="space-y-2 mb-5 text-sm">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    {s.available ? (
                      <Link to={s.to}>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          View details <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        Coming soon
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Process */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-foreground mb-6">How engagements work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['01', 'Discovery call', 'Free 30-min call to scope your risk and answer questions.'],
                ['02', 'Scoped assessment', 'We map your attack surface and agree on a fixed-scope review.'],
                ['03', 'Remediation report', 'Prioritized findings with concrete fixes and guided walkthrough.'],
                ['04', 'Optional retainer', 'Ongoing monitoring, threat alerts, and on-call incident response.'],
              ].map(([n, t, d]) => (
                <Card key={n} className="p-5">
                  <div className="text-xs font-mono text-primary mb-2">{n}</div>
                  <h3 className="font-medium text-foreground mb-1">{t}</h3>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              Don't wait for a breach.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Book a free 30-minute discovery call. We'll assess your exposure and recommend next steps. No obligation,
              no sales pressure.
            </p>
            <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Calendar className="w-4 h-4" /> Book on Cal.com
              </Button>
            </a>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Services;