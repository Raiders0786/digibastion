import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, Bell, BookOpen, Check, CheckCircle2, ExternalLink,
  Github, Globe2, GraduationCap, Loader2, Lock, MessageCircle, Newspaper,
  Radar, Shield, Sparkles, Users, Wrench, Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Navbar } from '@/components/Navbar';
import { QuickSubscribeCard } from '@/components/newsletter/QuickSubscribeCard';
import { SecurityCard } from '@/components/SecurityCard';
import { SecurityPresets } from '@/components/SecurityPresets';
import { SecurityScore } from '@/components/SecurityScore';
import { ThreatLevelSelector } from '@/components/ThreatLevelSelector';
import { useSecurityState } from '@/hooks/useSecurityState';
import { useSubscriberCount } from '@/hooks/useSubscriberCount';
import { supabase } from '@/integrations/supabase/client';
import espLogo from '@/assets/esp-logo-white.svg';

interface RecentAlert {
  id: string;
  title: string;
  severity: string;
  published_at: string;
}

const VANTAGE_URL = 'https://vantage.digibastion.com';

const audiencePaths = [
  {
    icon: GraduationCap,
    eyebrow: 'I am getting started',
    title: 'Find your security gaps',
    description: 'Take the short OpSec assessment and get a practical starting point.',
    action: 'Take the assessment',
    href: '/quiz',
  },
  {
    icon: Lock,
    eyebrow: 'I hold or use crypto',
    title: 'Harden wallets and accounts',
    description: 'Work through clear checklists for wallets, authentication, devices, and DeFi.',
    action: 'Open the checklists',
    href: '#checklists',
  },
  {
    icon: Radar,
    eyebrow: 'I run a product or team',
    title: 'See your external attack surface',
    description: 'Use Vantage to review domain, DNS, email, TLS, frontend, and Web3 trust evidence.',
    action: 'Explore Vantage',
    href: VANTAGE_URL,
    external: true,
  },
  {
    icon: Users,
    eyebrow: 'I need expert help',
    title: 'Work through the risk with us',
    description: 'Get an OpSec or full-stack review with findings ranked by real-world impact.',
    action: 'View services',
    href: '/services',
  },
];

const Index = () => {
  const { categories, getOverallScore, getStats, threatLevel, isLoading, changeCount } = useSecurityState();
  const location = useLocation();
  const navigate = useNavigate();
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [alertsLoaded, setAlertsLoaded] = useState(false);
  const { data: subscriberCount } = useSubscriberCount();

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('news_articles')
        .select('id, title, severity, published_at')
        .in('severity', ['critical', 'high', 'medium'])
        .order('published_at', { ascending: false })
        .limit(3);

      if (data) setRecentAlerts(data);
      setAlertsLoaded(true);
    };
    void fetchAlerts();
  }, []);

  useEffect(() => {
    const targetId = location.state?.scrollTo ?? location.hash.replace(/^#/, '');
    if (!targetId) return;
    const element = document.getElementById(targetId);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 80;
      window.setTimeout(() => window.scrollTo({ top, behavior: 'smooth' }), 100);
    }
    if (location.state?.scrollTo) window.history.replaceState({}, document.title);
  }, [location.hash, location.state]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [changeCount]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center" aria-live="polite" aria-busy="true">
          <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your security workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Digibastion — Practical Security for People, Crypto and Web3 Teams"
        description="Assess your OpSec, follow practical security checklists, monitor current threats, and review domain risk with Vantage — practical tools from Digibastion."
      />
      <Navbar />

      <main className="flex-grow pt-16">
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative section-container py-14 sm:py-20 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
              <div className="max-w-3xl">
                <a
                  href="https://blog.ethereum.org/2025/12/02/allocation-q3-25"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <span>Supported by</span>
                  <img src={espLogo} alt="Ethereum Foundation Ecosystem Support Program" className="h-4 w-auto opacity-90" />
                </a>

                <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Security you can act on</p>
                <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                  Know what to protect. <span className="text-gradient">Fix what matters.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
                  Digibastion brings personal OpSec, crypto safety, live threat intelligence, and product security into one practical place. Start free; bring us in when the risk needs an expert.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" onClick={() => navigate('/quiz')} className="h-12 w-full gap-2 rounded-full px-6 sm:w-auto">
                    <Zap className="h-4 w-4" /> Check my security <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => scrollTo('start-here')} className="h-12 w-full rounded-full px-6 sm:w-auto">
                    See what Digibastion offers
                  </Button>
                </div>
                <p className="mt-5 text-xs leading-5 text-muted-foreground">
                  No account for checklists or the assessment. Publicly inspectable. Built for beginners, operators, and security teams.
                </p>
              </div>

              <div className="relative mx-auto w-full max-w-xl lg:max-w-none" aria-label="Digibastion security workspace overview">
                <div className="rounded-3xl border border-border/70 bg-card/80 p-3 shadow-elevated backdrop-blur sm:p-5">
                  <div className="flex items-center justify-between border-b border-border/60 px-2 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15"><Shield className="h-5 w-5 text-primary" /></div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Your security workspace</div>
                        <div className="text-[11px] text-muted-foreground">Learn · assess · monitor · improve</div>
                      </div>
                    </div>
                    <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success">Live</span>
                  </div>
                  <div className="grid gap-3 pt-4 sm:grid-cols-2">
                    {[
                      { icon: Zap, label: 'OpSec assessment', detail: 'Personal next steps', value: 'Free' },
                      { icon: CheckCircle2, label: 'Security checklists', detail: `${categories.length} focused areas`, value: 'Practical' },
                      { icon: Bell, label: 'Threat intelligence', detail: 'Curated incident alerts', value: 'Current' },
                      { icon: Radar, label: 'Vantage', detail: 'External trust evidence', value: 'Shipped' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <item.icon className="h-5 w-5 text-primary" />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{item.value}</span>
                        </div>
                        <div className="mt-4 text-sm font-semibold text-foreground">{item.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="start-here" className="section-container scroll-mt-24 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Choose your path</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Start with the problem in front of you.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">You do not need to understand every security acronym. Pick the outcome you need and Digibastion will take you to the right tool.</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {audiencePaths.map((path) => {
              const content = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><path.icon className="h-5 w-5" /></div>
                    {path.external && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="mt-6 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-primary">{path.eyebrow}</p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{path.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{path.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-primary">
                    {path.action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </>
              );

              const className = 'group rounded-2xl border border-border/60 bg-card/50 p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
              if (path.external) return <a key={path.title} href={path.href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>;
              if (path.href.startsWith('#')) return <button key={path.title} type="button" onClick={() => scrollTo(path.href.slice(1))} className={className}>{content}</button>;
              return <button key={path.title} type="button" onClick={() => navigate(path.href)} className={className}>{content}</button>;
            })}
          </div>
        </section>

        <section className="border-y border-border/60 bg-muted/20">
          <div className="section-container py-16 sm:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <Radar className="h-4 w-4" /> Vantage by Digibastion · Live now
                </div>
                <h2 className="mt-5 text-3xl font-bold leading-tight text-foreground sm:text-5xl">Your domain is part of your security boundary.</h2>
                <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
                  Vantage collects external trust evidence across DNS, email, TLS, web headers, infrastructure, JavaScript integrity, phishing, breaches, and Web3 trust paths. Start with a public score, then move findings into an owned remediation workflow.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="w-full gap-2 rounded-full sm:w-auto"><a href={VANTAGE_URL} target="_blank" rel="noopener noreferrer">Open Vantage <ExternalLink className="h-4 w-4" /></a></Button>
                  <Button asChild size="lg" variant="outline" className="w-full rounded-full sm:w-auto"><a href={`${VANTAGE_URL}/signup/`} target="_blank" rel="noopener noreferrer">Request access</a></Button>
                </div>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background p-5 shadow-card sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">External trust evidence</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">One view of what users trust</p>
                  </div>
                  <span className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs text-primary">12 modules</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {['DNS & ownership', 'Email controls', 'TLS & headers', 'Frontend supply chain', 'Phishing exposure', 'Web3 trust paths'].map((item) => (
                    <div key={item} className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs font-medium text-foreground"><Check className="mb-3 h-4 w-4 text-success" />{item}</div>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-5 text-muted-foreground">Public scores support quick triage. Private workspaces add evidence, history, ownership, comments, exports, and monitoring.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-container py-16 sm:py-20">
          <div className="grid min-w-0 items-start gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div className="min-w-0 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-destructive motion-safe:animate-pulse" />
                <span className="text-xs font-semibold text-destructive">Current threat intelligence</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Know what is happening before you sign, click, or ship.</h2>
              <p className="leading-relaxed text-muted-foreground">We curate high-signal incidents across phishing, wallet drainers, smart-contract exploits, and software supply chains. Read the feed or subscribe for the alerts that need attention.</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate('/threat-intel?tab=alerts')} className="w-full gap-2 sm:w-auto"><Newspaper className="h-4 w-4" /> View threat feed</Button>
                <Button onClick={() => navigate('/threat-intel?tab=subscribe')} variant="outline" className="w-full gap-2 sm:w-auto">
                  <Bell className="h-4 w-4" /> Subscribe
                  {subscriberCount && subscriberCount.count > 0 && <span className="text-xs">({subscriberCount.label})</span>}
                </Button>
              </div>
            </div>
            <div className="min-w-0 rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-5" aria-live="polite">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><AlertTriangle className="h-4 w-4 text-destructive" /> Latest alerts</div>
                <button type="button" onClick={() => navigate('/threat-intel?tab=alerts')} className="text-xs font-medium text-primary hover:underline">View all</button>
              </div>
              <div className="space-y-2">
                {recentAlerts.length > 0 ? recentAlerts.map((alert) => (
                  <button key={alert.id} type="button" onClick={() => navigate('/threat-intel?tab=alerts')} className="flex w-full items-start gap-3 rounded-xl border border-transparent bg-background/70 p-3 text-left transition-colors hover:border-border">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alert.severity === 'critical' ? 'bg-destructive' : alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{alert.title}</span>
                      <span className="mt-1 block text-xs capitalize text-muted-foreground">{alert.severity} · {formatDistanceToNow(new Date(alert.published_at), { addSuffix: true })}</span>
                    </span>
                  </button>
                )) : <div className="py-8 text-center text-sm text-muted-foreground">{alertsLoaded ? 'No high-priority alerts are available right now.' : 'Loading current alerts…'}</div>}
              </div>
            </div>
          </div>
          <div className="mt-10 max-w-3xl"><QuickSubscribeCard /></div>
        </section>

        <section className="border-y border-border/60 bg-muted/20">
          <div className="section-container py-16 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Personal security workspace</p>
              <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Build a plan that fits your real threat level.</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Choose the profile closest to your situation. Your score and checklist priorities update without requiring an account.</p>
            </div>
            <div className="mt-9">
              <ThreatLevelSelector />
              <div className="mt-4 flex justify-center"><SecurityPresets /></div>
            </div>
            <div id="score" className="scroll-mt-24 pt-12" key={`score-${threatLevel}-${changeCount}`}><SecurityScore score={getOverallScore()} stats={getStats()} /></div>
          </div>
        </section>

        <section id="checklists" className="section-container scroll-mt-24 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Do the work</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Security checklists built for real life.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">Save progress locally as you improve wallets, accounts, devices, development workflows, and day-to-day operational security.</p>
          </div>
          {[
            { title: 'Start here', icon: Shield, ids: ['wallet', 'authentication', 'opsec'] },
            { title: 'Devices and communications', icon: Lock, ids: ['os', 'browsing', 'mobile', 'email'] },
            { title: 'Web3, work, and development', icon: Wrench, ids: ['defi', 'developers', 'jobs', 'social'] },
          ].map((group) => (
            <div key={group.title} className="mt-10">
              <div className="mb-4 flex items-center gap-2"><group.icon className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">{group.title}</h3></div>
              <div className="grid gap-4 md:grid-cols-2">
                {categories.filter((category) => group.ids.includes(category.id)).map((category) => (
                  <SecurityCard key={`${category.id}-${threatLevel}-${changeCount}`} category={category.id} title={category.title} description={category.description} link={`/category/${category.id}`} total={category.items.length} completed={category.items.filter((item) => item.completed).length} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <section id="roadmap" className="border-y border-border/60 bg-muted/20 scroll-mt-24">
          <div className="section-container py-16 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Built in public</p>
                <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">What is live, and what we are improving.</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">No stale launch promises. This is the product as it stands today, followed by the work where community feedback can make it better.</p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <Button asChild variant="outline" className="w-full gap-2 sm:w-auto lg:w-full xl:w-auto"><a href="https://github.com/Raiders0786/digibastion/blob/main/ROADMAP.md" target="_blank" rel="noopener noreferrer">Read the roadmap <ExternalLink className="h-4 w-4" /></a></Button>
                  <Button asChild variant="outline" className="w-full gap-2 sm:w-auto lg:w-full xl:w-auto"><a href="https://github.com/Raiders0786/digibastion/issues" target="_blank" rel="noopener noreferrer">Suggest an idea <MessageCircle className="h-4 w-4" /></a></Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { status: 'Live', title: 'Available today', items: ['Vantage domain intelligence', 'OpSec assessment and score', 'Threat feed and email alerts', '11 security checklists'], color: 'text-success border-success/30 bg-success/10' },
                  { status: 'Improving', title: 'Active work', items: ['Vantage evidence and workflows', 'Threat source coverage', 'Checklist depth and freshness', 'Mobile and accessibility polish'], color: 'text-primary border-primary/30 bg-primary/10' },
                  { status: 'Open', title: 'Help shape next', items: ['Community-requested guides', 'Contributor-led integrations', 'More actionable incident research', 'Tools people can use without setup'], color: 'text-warning border-warning/30 bg-warning/10' },
                ].map((column) => (
                  <div key={column.title} className="rounded-2xl border border-border/60 bg-background p-5">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider ${column.color}`}>{column.status}</span>
                    <h3 className="mt-4 text-base font-semibold text-foreground">{column.title}</h3>
                    <ul className="mt-4 space-y-3">{column.items.map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-container py-16 sm:py-20">
          <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-10 lg:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" /><span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">A public-good security project</span></div>
                <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">Use it, question it, improve it.</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">Report a missing threat, improve a checklist, propose a tool, or contribute code. Useful criticism and small fixes are just as welcome as large features.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Button asChild size="lg" className="w-full gap-2 rounded-full sm:w-auto"><a href="https://github.com/Raiders0786/digibastion" target="_blank" rel="noopener noreferrer"><Github className="h-5 w-5" /> Contribute on GitHub</a></Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/services')} className="w-full gap-2 rounded-full sm:w-auto">Work with Digibastion <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border/60 pt-8 sm:grid-cols-4">
              {[
                { icon: Globe2, label: 'Source available' }, { icon: BookOpen, label: 'Practical education' },
                { icon: Newspaper, label: 'Current intelligence' }, { icon: Shield, label: 'Expert services' },
              ].map((item) => <div key={item.label} className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm"><item.icon className="h-4 w-4 shrink-0 text-primary" /> {item.label}</div>)}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
