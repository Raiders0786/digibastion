import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Bell, BookOpen, Briefcase, CheckCircle2, ChevronRight,
  Github, Heart, Info, Mail, Menu, Newspaper, Radar, Share2, Shield,
  Sparkles, Wrench, Zap,
} from 'lucide-react';
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem,
  NavigationMenuList, NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const VANTAGE_URL = 'https://vantage.digibastion.com';

const categories = [
  { id: 'authentication', title: 'Authentication', description: 'Secure account access' },
  { id: 'browsing', title: 'Web Browsing', description: 'Safer browsing habits' },
  { id: 'email', title: 'Email Security', description: 'Protect communications' },
  { id: 'mobile', title: 'Mobile Security', description: 'Harden your phone' },
  { id: 'social', title: 'Social Media', description: 'Secure public accounts' },
  { id: 'wallet', title: 'Web3 Wallet', description: 'Protect crypto assets' },
  { id: 'os', title: 'OS Security', description: 'Harden your computer' },
  { id: 'defi', title: 'DeFi Security', description: 'Reduce transaction risk' },
  { id: 'developers', title: 'Developer Security', description: 'Secure what you ship' },
  { id: 'jobs', title: 'Job Search Security', description: 'Spot recruitment attacks' },
  { id: 'opsec', title: 'Operational Security', description: 'Manage your exposure' },
];

const resourceItems = [
  { route: '/articles', icon: BookOpen, label: 'Security guides' },
  { route: '/tools', icon: Wrench, label: 'Tool directory' },
  { route: '/about', icon: Info, label: 'About Digibastion' },
  { route: '/support', icon: Heart, label: 'Support the project' },
  { route: '/contact', icon: Mail, label: 'Contact' },
  { route: '/share', icon: Share2, label: 'Share Digibastion' },
];

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const goTo = (route: string) => {
    setMobileMenuOpen(false);
    navigate(route);
  };

  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate('/')} className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
            <Shield className="h-5 w-5 text-primary" />
          </span>
          <span className="text-left">
            <span className="block text-lg font-semibold leading-none tracking-tight text-foreground">Digibastion</span>
            <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground sm:block">Security you can act on</span>
          </span>
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm">Products</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[520px] rounded-xl border border-border/60 bg-popover/95 p-3 shadow-elevated backdrop-blur-xl">
                    <a href={VANTAGE_URL} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 rounded-xl border border-primary/20 bg-primary/10 p-4 transition-colors hover:border-primary/40">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15"><Radar className="h-5 w-5 text-primary" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold text-foreground">Vantage <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-success">Live</span></span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">Domain security intelligence and external trust evidence for Web3 and Web2 teams.</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    </a>
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {[
                        { icon: Zap, title: 'OpSec assessment', description: 'Find your highest-priority gaps', route: '/quiz' },
                        { icon: Newspaper, title: 'Threat intelligence', description: 'Current incidents and alerts', route: '/threat-intel' },
                        { icon: CheckCircle2, title: 'Security checklists', description: 'Track practical improvements', action: () => goToSection('checklists') },
                        { icon: Sparkles, title: 'Security score', description: 'See progress across categories', action: () => goToSection('score') },
                      ].map((item) => (
                        <button key={item.title} type="button" onClick={() => item.action ? item.action() : navigate(item.route!)} className="group rounded-lg p-3 text-left transition-colors hover:bg-muted/60">
                          <span className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-primary"><item.icon className="h-4 w-4 text-primary" /> {item.title}</span>
                          <span className="mt-1 block pl-6 text-xs text-muted-foreground">{item.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <button type="button" onClick={() => navigate('/services')} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/60 hover:text-primary ${location.pathname.startsWith('/services') ? 'text-primary' : 'text-foreground'}`}>Services</button>
          <button type="button" onClick={() => navigate('/articles')} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/60 hover:text-primary ${location.pathname.startsWith('/articles') ? 'text-primary' : 'text-foreground'}`}>Guides</button>
          <button type="button" onClick={() => navigate('/tools')} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/60 hover:text-primary ${location.pathname === '/tools' ? 'text-primary' : 'text-foreground'}`}>Tools</button>
          <button type="button" onClick={() => goToSection('roadmap')} className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 hover:text-primary">Roadmap</button>
          <ThemeToggle />
          <a href="https://github.com/Raiders0786/digibastion" target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground" aria-label="Contribute to Digibastion on GitHub"><Github className="h-5 w-5" /></a>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <a href={VANTAGE_URL} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:inline-flex">Vantage <ArrowUpRight className="h-3.5 w-3.5" /></a>
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open navigation menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[min(92vw,380px)] p-0">
              <SheetHeader className="border-b border-border/60 p-5 text-left">
                <SheetTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Digibastion</SheetTitle>
                <SheetDescription>Navigate products, services, guides, and security checklists.</SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100dvh-73px)]">
                <div className="space-y-7 p-4 pb-10">
                  <a href={VANTAGE_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15"><Radar className="h-5 w-5 text-primary" /></span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-semibold text-foreground">Vantage <span className="text-[9px] font-mono uppercase text-success">Live</span></span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Domain security intelligence and trust evidence.</span></span>
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                  </a>

                  <div>
                    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Start here</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: Zap, label: 'Assessment', route: '/quiz' },
                        { icon: Bell, label: 'Threats', route: '/threat-intel' },
                        { icon: Briefcase, label: 'Services', route: '/services' },
                        { icon: Sparkles, label: 'My score', action: () => goToSection('score') },
                      ].map((item) => (
                        <button key={item.label} type="button" onClick={() => item.action ? item.action() : goTo(item.route!)} className="flex min-h-20 flex-col items-start justify-between rounded-xl border border-border/60 bg-card/50 p-3 text-left transition-colors hover:border-primary/30">
                          <item.icon className="h-4 w-4 text-primary" /><span className="text-xs font-medium text-foreground">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between px-1"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Security checklists</p><button type="button" onClick={() => goToSection('checklists')} className="text-[10px] font-medium text-primary">View all</button></div>
                    <div className="space-y-1">
                      {categories.map((category) => {
                        const active = location.pathname === `/category/${category.id}`;
                        return (
                          <button key={category.id} type="button" onClick={() => goTo(`/category/${category.id}`)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${active ? 'border-primary/30 bg-primary/10' : 'border-transparent hover:bg-muted/50'}`}>
                            <span><span className={`block text-sm font-medium ${active ? 'text-primary' : 'text-foreground'}`}>{category.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{category.description}</span></span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">More from Digibastion</p>
                    <div className="space-y-1">
                      {resourceItems.map((item) => (
                        <button key={item.route} type="button" onClick={() => goTo(item.route)} className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-foreground transition-colors hover:bg-muted/50">
                          <item.icon className="h-4 w-4 text-muted-foreground" /> {item.label}
                        </button>
                      ))}
                      <button type="button" onClick={() => goToSection('roadmap')} className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-foreground transition-colors hover:bg-muted/50"><Sparkles className="h-4 w-4 text-muted-foreground" /> Roadmap and ideas</button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
