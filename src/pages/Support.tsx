import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ExternalLink, Github, Heart, MessageSquareText, Server, ShieldCheck } from 'lucide-react';

import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const contributionPaths = [
  {
    icon: BookOpen,
    title: 'Correct or improve guidance',
    description: 'Add a source, simplify a checklist item, or flag advice that no longer reflects how an attack works.',
    label: 'Read the contribution guide',
    href: 'https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md',
  },
  {
    icon: Github,
    title: 'Build or review code',
    description: 'Pick up a scoped issue, review an open pull request, improve tests, or propose a small product change.',
    label: 'Browse open issues',
    href: 'https://github.com/Raiders0786/digibastion/issues',
  },
  {
    icon: MessageSquareText,
    title: 'Bring a user problem',
    description: 'Tell us where a wallet user, operator, founder or security team still has to stitch tools together by hand.',
    label: 'Propose an idea',
    href: '/contact',
  },
];

const Support = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <MetaTags
      title="Support Digibastion — Contribute, Sponsor or Work With Us"
      description="Support Digibastion by improving security guidance, contributing code, sponsoring public resources, or hiring the team for security work."
      keywords="support Digibastion, contribute Web3 security, sponsor security research, Digibastion services"
    />
    <Navbar />

    <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">Keep useful security work moving</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">Support can be time, evidence, reach or funding.</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Digibastion maintains public security guidance and threat intelligence while building Vantage and delivering deeper security work. Choose the contribution that fits you.
          </p>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="Ways to contribute">
          {contributionPaths.map((path) => {
            const Icon = path.icon;
            const card = (
              <Card className="h-full p-6 hover:border-primary/40 transition-colors">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mt-5 text-lg font-semibold">{path.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{path.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  {path.label} <ArrowRight className="h-4 w-4" />
                </span>
              </Card>
            );

            return path.href.startsWith('http') ? (
              <a key={path.title} href={path.href} target="_blank" rel="noopener noreferrer" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {card}
              </a>
            ) : (
              <Link key={path.title} to={path.href} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {card}
              </Link>
            );
          })}
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2" aria-labelledby="funding-options">
          <Card className="p-6 sm:p-8 border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h2 id="funding-options" className="mt-5 text-2xl font-bold">Fund public resources</h2>
            <p className="mt-3 text-muted-foreground leading-7">
              Contributions help cover hosting, data services, research time and maintenance for resources that remain publicly accessible. This is not an investment or purchase of influence over findings.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <a href="https://buy.copperx.io/payment/payment-link/524b0e73-8733-4c99-8a55-8cf8ff7f2c00" target="_blank" rel="noopener noreferrer">
                  Support via Copperx <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="https://giveth.io/project/digibastion:-dns-opsec-supply-chain-security" target="_blank" rel="noopener noreferrer">
                  View Giveth project <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Fund the work by hiring the team</h2>
            <p className="mt-3 text-muted-foreground leading-7">
              Paid OpSec consulting and full-stack reviews support focused client outcomes and help sustain the broader project. Scope and availability are discussed before any engagement.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild><Link to="/services">Review services <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild variant="outline"><Link to="/contact">Discuss a project</Link></Button>
            </div>
          </Card>
        </section>

        <section className="mt-16 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Interested in sponsoring infrastructure or a research series?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                We will label sponsorship clearly and keep editorial conclusions independent. Tell us the audience, problem and constraints—not the answer you want published.
              </p>
            </div>
            <Button asChild variant="outline"><Link to="/contact">Contact the team</Link></Button>
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Support;
