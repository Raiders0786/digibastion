import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  ExternalLink,
  Github,
  HeartHandshake,
  Radar,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { serializeJsonLd } from '@/utils/jsonLd';

const products = [
  {
    icon: BellRing,
    title: 'Know what is happening',
    description: 'Follow sourced security incidents and subscribe to alerts without sorting through dozens of feeds.',
    label: 'Threat intelligence',
    href: '/threat-intel',
    external: false,
  },
  {
    icon: BookOpenCheck,
    title: 'Improve your own setup',
    description: 'Use practical checklists and a short OpSec assessment to find the next security change worth making.',
    label: 'Start a checkup',
    href: '/quiz',
    external: false,
  },
  {
    icon: Radar,
    title: 'Understand domain risk',
    description: 'Vantage brings DNS, email, TLS, frontend, supply-chain and Web3 trust evidence into one workflow.',
    label: 'Open Vantage',
    href: 'https://vantage.digibastion.com/',
    external: true,
  },
  {
    icon: ShieldCheck,
    title: 'Bring in an experienced reviewer',
    description: 'For higher-stakes work, Digibastion offers focused OpSec consulting and full-stack security reviews.',
    label: 'View services',
    href: '/services',
    external: false,
  },
];

const principles = [
  {
    title: 'Show the source',
    description: 'Threat reports, recommendations and educational material should be traceable to evidence—not anonymous certainty.',
  },
  {
    title: 'Give a next action',
    description: 'A score or warning is only useful when a person can understand the risk and decide what to do next.',
  },
  {
    title: 'Design for different stakes',
    description: 'A first-time wallet user, a protocol engineer and a treasury operator need different depth, language and controls.',
  },
  {
    title: 'Build in public',
    description: 'The repository, roadmap and contribution process are public so gaps can be challenged and improvements can be shared.',
  },
];

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Digibastion',
  url: 'https://www.digibastion.com/about',
  description: 'Security intelligence, practical guidance, domain monitoring and expert review for people and teams working in Web3.',
  sameAs: [
    'https://github.com/Raiders0786/digibastion',
    'https://x.com/__Raiders',
  ],
  knowsAbout: [
    'Web3 security',
    'Operational security',
    'Threat intelligence',
    'Domain security monitoring',
    'Frontend supply-chain security',
  ],
};

const About = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <MetaTags
      title="About Digibastion — Practical Security for Web3"
      description="Digibastion helps people and teams understand threats, improve operational security, monitor domain risk with Vantage, and get expert help when the stakes are higher."
      keywords="Digibastion, Web3 security, operational security, threat intelligence, domain security monitoring, Vantage"
    />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationLd) }} />
    <Navbar />

    <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-20">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Security people can actually use
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
              Turn security information into better decisions.
            </h1>
            <p className="mt-6 max-w-3xl text-base sm:text-lg leading-8 text-muted-foreground">
              Digibastion connects timely threat intelligence, personal security guidance, domain-risk evidence and hands-on review. Start with the free resources; bring us in when the risk deserves deeper work.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/quiz">Find your next security step <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="https://vantage.digibastion.com/" target="_blank" rel="noopener noreferrer">
                  Explore Vantage <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <Card className="p-6 sm:p-8 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Why Digibastion exists</p>
            <p className="mt-4 text-xl sm:text-2xl font-semibold leading-9 text-foreground">
              Security guidance is scattered. Alerts lack context. Scanner output rarely explains ownership or the next decision.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              We are building the connective tissue: clear explanations for individuals, operational evidence for teams, and a public place for practitioners to improve the work together.
            </p>
          </Card>
        </section>

        <section aria-labelledby="what-we-build">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">What is live</p>
            <h2 id="what-we-build" className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">One security practice, several useful entry points.</h2>
            <p className="mt-4 text-muted-foreground leading-7">Choose the path that matches what you need today. You do not need an account to read the guidance or explore the public resources.</p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {products.map((product) => {
              const Icon = product.icon;
              const content = (
                <Card className="h-full p-6 border-border/70 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{product.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{product.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    {product.label} {product.external ? <ExternalLink className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </span>
                </Card>
              );

              return product.external ? (
                <a key={product.title} href={product.href} target="_blank" rel="noopener noreferrer" className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  {content}
                </a>
              ) : (
                <Link key={product.title} to={product.href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  {content}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start" aria-labelledby="how-we-work">
          <div>
            <p className="text-sm font-semibold text-primary">How we work</p>
            <h2 id="how-we-work" className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Useful beats impressive.</h2>
            <p className="mt-4 text-muted-foreground leading-7">
              The best security product is the one people understand well enough to act on. These principles guide the platform, research and client work.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map((principle) => (
              <Card key={principle.title} className="p-5">
                <h3 className="font-semibold text-foreground">{principle.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{principle.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 sm:p-10" aria-labelledby="proof-and-participation">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h2 id="proof-and-participation" className="mt-5 text-2xl sm:text-3xl font-bold">Built in public, improved by practitioners.</h2>
              <p className="mt-4 text-muted-foreground leading-7">
                Security researchers, writers, designers and engineers can propose corrections, add sources, improve a checklist or build a feature. A useful contribution can be one precise paragraph—not only a large pull request.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <a href="https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" /> Contribute on GitHub
                  </a>
                </Button>
                <Button asChild variant="outline"><Link to="/contact">Propose an idea</Link></Button>
              </div>
            </div>
            <div className="space-y-4">
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Public evidence</p>
                <a href="https://github.com/Raiders0786/digibastion" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 font-semibold hover:text-primary">
                  Repository, issues and change history <ExternalLink className="h-4 w-4" />
                </a>
              </Card>
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Independent support</p>
                <a href="https://blog.ethereum.org/2025/12/02/allocation-q3-25" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 font-semibold hover:text-primary">
                  Ethereum Foundation ESP allocation <ExternalLink className="h-4 w-4" />
                </a>
              </Card>
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Higher-stakes work</p>
                <Link to="/services" className="mt-2 inline-flex items-center gap-2 font-semibold hover:text-primary">
                  Review services and current availability <ArrowRight className="h-4 w-4" />
                </Link>
              </Card>
            </div>
          </div>
        </section>

        <section className="text-center max-w-3xl mx-auto">
          <HeartHandshake className="h-8 w-8 text-primary mx-auto" />
          <h2 className="mt-4 text-3xl font-bold">Tell us what would make this more useful.</h2>
          <p className="mt-3 text-muted-foreground leading-7">Report a gap, propose a collaboration, or describe the security problem your team keeps solving by hand.</p>
          <Button asChild size="lg" className="mt-6"><Link to="/contact">Start a conversation</Link></Button>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default About;
