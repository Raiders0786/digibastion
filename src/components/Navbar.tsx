import { useState, type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowUpRight, Bell, BookOpen, Briefcase, CheckCircle2, ChevronRight,
  Github, Heart, HelpCircle, Info, Mail, Menu, Newspaper, Radar, Share2, Shield,
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
import { initialSecurityData } from '@/data/securityData';
import { GITHUB_REPO_URL, VANTAGE_URL } from '@/seo/siteFacts';

const SUBSCRIBE_PATH = '/threat-intel?tab=subscribe';

const resourceItems = [
  { route: '/articles', icon: BookOpen, label: 'Guides' },
  { route: '/tools', icon: Wrench, label: 'Tools' },
  { route: '/faq', icon: HelpCircle, label: 'FAQ' },
  { route: '/about', icon: Info, label: 'About Digibastion' },
  { route: '/support', icon: Heart, label: 'Support the project' },
  { route: '/contact', icon: Mail, label: 'Contact' },
  { route: '/share', icon: Share2, label: 'Share Digibastion' },
];

const desktopLinkClass = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/60 hover:text-primary ${active ? 'text-primary' : 'text-foreground'}`;

const BetaTag = () => (
  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-primary">Beta</span>
);

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  /**
   * Home sections are real links ("/#checklists") so crawlers can follow them.
   * On the home page itself the click scrolls instead of changing the route.
   */
  const sectionLinkProps = (id: string) => ({
    to: `/#${id}`,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      closeMenu();
      if (location.pathname !== '/') return;
      const element = document.getElementById(id);
      if (!element) return;
      event.preventDefault();
      const top = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    },
  });

  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
            <Shield className="h-5 w-5 text-primary" />
          </span>
          <span className="text-left">
            <span className="block text-lg font-semibold leading-none tracking-tight text-foreground">Digibastion</span>
            <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground sm:block">Security you can act on</span>
          </span>
        </Link>

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
                        <span className="flex items-center gap-2 font-semibold text-foreground">Vantage <BetaTag /></span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">Checks your domain&apos;s DNS, email, TLS, frontend and Web3 trust signals in one place.</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    </a>
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      <Link to="/quiz" className="group rounded-lg p-3 text-left transition-colors hover:bg-muted/60">
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-primary"><Zap className="h-4 w-4 text-primary" /> OpSec self-check</span>
                        <span className="mt-1 block pl-6 text-xs text-muted-foreground">Find your weakest habits</span>
                      </Link>
                      <Link {...sectionLinkProps('checklists')} className="group rounded-lg p-3 text-left transition-colors hover:bg-muted/60">
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-primary"><CheckCircle2 className="h-4 w-4 text-primary" /> Security checklists</span>
                        <span className="mt-1 block pl-6 text-xs text-muted-foreground">Track practical fixes</span>
                      </Link>
                      <Link {...sectionLinkProps('score')} className="group rounded-lg p-3 text-left transition-colors hover:bg-muted/60">
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-primary"><Sparkles className="h-4 w-4 text-primary" /> Security score</span>
                        <span className="mt-1 block pl-6 text-xs text-muted-foreground">See progress by category</span>
                      </Link>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Link to="/threat-intel" className={desktopLinkClass(location.pathname.startsWith('/threat-intel'))}>
            <Newspaper className="h-4 w-4" /> Threat Intel
          </Link>
          <Link to="/articles" className={desktopLinkClass(location.pathname.startsWith('/articles'))}>Guides</Link>
          <Link to="/services" className={desktopLinkClass(location.pathname.startsWith('/services'))}>Services</Link>
          <Button asChild size="sm" variant="outline" className="ml-1 gap-1.5 rounded-full border-primary/30 bg-primary/5 px-4 text-primary hover:bg-primary/10 hover:text-primary">
            <Link to={SUBSCRIBE_PATH}><Bell className="h-3.5 w-3.5" /> Get alerts</Link>
          </Button>
          <ThemeToggle />
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground" aria-label="Contribute to Digibastion on GitHub"><Github className="h-5 w-5" /></a>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <a href={VANTAGE_URL} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:inline-flex">Vantage <ArrowUpRight className="h-3.5 w-3.5" /></a>
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open navigation menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[min(92vw,380px)] p-0">
              <SheetHeader className="border-b border-border/60 p-5 text-left">
                <SheetTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Digibastion</SheetTitle>
                <SheetDescription>Threat Intel, guides, checklists, services and more.</SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100dvh-73px)]">
                <div className="space-y-7 p-4 pb-10">
                  <a href={VANTAGE_URL} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15"><Radar className="h-5 w-5 text-primary" /></span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-semibold text-foreground">Vantage <BetaTag /></span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Domain security checks for teams.</span></span>
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                  </a>

                  <div>
                    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Start here</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: Zap, label: 'OpSec self-check', link: { to: '/quiz', onClick: closeMenu } },
                        { icon: Newspaper, label: 'Threat Intel', link: { to: '/threat-intel', onClick: closeMenu } },
                        { icon: Briefcase, label: 'Services', link: { to: '/services', onClick: closeMenu } },
                        { icon: Sparkles, label: 'My score', link: sectionLinkProps('score') },
                      ].map((item) => (
                        <Link key={item.label} {...item.link} className="flex min-h-20 flex-col items-start justify-between rounded-xl border border-border/60 bg-card/50 p-3 text-left transition-colors hover:border-primary/30">
                          <item.icon className="h-4 w-4 text-primary" /><span className="text-xs font-medium text-foreground">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                    <Link to={SUBSCRIBE_PATH} onClick={closeMenu} className="mt-2 flex w-full items-center justify-between rounded-xl border border-primary/25 bg-primary/10 p-3 text-left transition-colors hover:border-primary/40">
                      <span className="flex items-center gap-3"><Bell className="h-4 w-4 text-primary" /><span><span className="block text-sm font-medium text-foreground">Get alerts</span><span className="block text-xs text-muted-foreground">By email or on Telegram</span></span></span>
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </Link>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between px-1"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Security checklists</p><Link {...sectionLinkProps('checklists')} className="text-[10px] font-medium text-primary">View all</Link></div>
                    <div className="space-y-1">
                      {initialSecurityData.map((category) => {
                        const active = location.pathname === `/category/${category.id}`;
                        return (
                          <Link key={category.id} to={`/category/${category.id}`} onClick={closeMenu} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${active ? 'border-primary/30 bg-primary/10' : 'border-transparent hover:bg-muted/50'}`}>
                            <span><span className={`block text-sm font-medium ${active ? 'text-primary' : 'text-foreground'}`}>{category.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{category.description}</span></span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">More from Digibastion</p>
                    <div className="space-y-1">
                      {resourceItems.map((item) => (
                        <Link key={item.route} to={item.route} onClick={closeMenu} className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-foreground transition-colors hover:bg-muted/50">
                          <item.icon className="h-4 w-4 text-muted-foreground" /> {item.label}
                        </Link>
                      ))}
                      <Link {...sectionLinkProps('roadmap')} className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-foreground transition-colors hover:bg-muted/50"><Sparkles className="h-4 w-4 text-muted-foreground" /> Roadmap and ideas</Link>
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
