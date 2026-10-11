import { useLocation } from 'react-router-dom';
import { Bell, Home, Zap, Newspaper, Menu, Shield, ChevronRight, Sparkles, Radar } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Map, Wrench, Book, Link as LinkIcon, FileText, Info, Heart, Mail, Share, Briefcase, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SwipeableBottomSheet, SwipeableSheetDescription, SwipeableSheetTitle } from './mobile/SwipeableBottomSheet';
import { TouchFeedback } from './mobile/TouchFeedback';
import { NotificationBadge } from './mobile/NotificationBadge';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';
import { cn } from '@/lib/utils';
import { initialSecurityData } from '@/data/securityData';
import { VANTAGE_URL } from '@/seo/siteFacts';

const CATEGORY_EMOJI: Record<string, string> = {
  authentication: '🔐',
  browsing: '🌐',
  email: '📧',
  mobile: '📱',
  social: '👥',
  wallet: '💼',
  os: '💻',
  defi: '🔗',
  developers: '👨‍💻',
  jobs: '🧭',
  opsec: '🛡️',
};

export const MobileBottomNav = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { alertCount, hasNewQuiz, markAlertsRead, markQuizVisited } = useMobileNotifications();

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  /** Home sections are links ("/#score"); on the home page the tap also scrolls, so a repeat tap works. */
  const scrollToHomeSection = (id: string) => {
    setMenuOpen(false);
    if (location.pathname !== '/') return;
    const element = document.getElementById(id);
    if (element) {
      const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleNavClick = (route: string) => {
    // Mark notifications as read when navigating
    if (route === '/threat-intel') {
      markAlertsRead();
    } else if (route === '/quiz') {
      markQuizVisited();
    }
  };

  const closeMenu = () => setMenuOpen(false);

  const resourceItems: { route: string; icon: typeof Map; label: string; action?: () => void }[] = [
    { route: '/services', icon: Briefcase, label: 'Services' },
    { route: '/#roadmap', icon: Map, label: 'Roadmap', action: () => scrollToHomeSection('roadmap') },
    { route: '/quiz', icon: Zap, label: 'OpSec self-check' },
    { route: '/articles', icon: Book, label: 'Guides' },
    { route: '/tools', icon: Wrench, label: 'Tools' },
    { route: '/links', icon: LinkIcon, label: 'Useful links' },
    { route: '/faq', icon: HelpCircle, label: 'FAQ' },
    { route: '/about', icon: Info, label: 'About' },
    { route: '/support', icon: Heart, label: 'Support' },
    { route: '/contact', icon: Mail, label: 'Contact' },
    { route: '/share', icon: Share, label: 'Share' },
    { route: '/license', icon: FileText, label: 'License' },
  ];

  const navItems = [
    { route: '/', icon: Home, label: 'Home', badge: undefined },
    { route: '/quiz', icon: Zap, label: 'Quiz', badge: hasNewQuiz ? 'dot' : undefined },
    { route: '/threat-intel', icon: Newspaper, label: 'Threat Intel', badge: alertCount > 0 ? alertCount : undefined },
  ];

  const isActive = (route: string) => location.pathname === route;

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 sm:hidden",
        "transition-all duration-500 ease-out",
        mounted ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
    >
      {/* Gradient fade effect at top - no blur */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Navigation bar - solid background to prevent blur issues */}
      <nav className="bg-background border-t border-border/50 px-2 pb-safe shadow-2xl">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <TouchFeedback
              key={item.route}
              to={item.route}
              onClick={() => handleNavClick(item.route)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive(item.route) 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              )}
              rippleColor={isActive(item.route) ? 'bg-primary/20' : 'bg-muted-foreground/20'}
            >
              <div className="relative">
                <item.icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive(item.route) && "scale-110"
                  )} 
                />
                {/* Notification badge */}
                {item.badge !== undefined && (
                  <NotificationBadge 
                    count={typeof item.badge === 'number' ? item.badge : undefined}
                    showDot={(item.badge as unknown) === 'dot'}
                    pulse
                  />
                )}
                {/* Active indicator */}
                {isActive(item.route) && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span 
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive(item.route) && "text-primary font-semibold"
                )}
              >
                {item.label}
              </span>
            </TouchFeedback>
          ))}

          <TouchFeedback
            href={VANTAGE_URL}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl text-muted-foreground"
            rippleColor="bg-primary/20"
          >
            <Radar className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-medium">Vantage</span>
          </TouchFeedback>

          {/* Menu Button with Swipeable Sheet */}
          <TouchFeedback
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl text-muted-foreground"
            rippleColor="bg-muted-foreground/20"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </TouchFeedback>

          <SwipeableBottomSheet 
            open={menuOpen} 
            onOpenChange={setMenuOpen}
            className="h-[80vh]"
          >
            {/* Header */}
            <div className="px-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <SwipeableSheetTitle className="text-base font-semibold text-foreground">Digibastion Menu</SwipeableSheetTitle>
                  <SwipeableSheetDescription className="text-xs text-muted-foreground">Navigate products, services, and security checklists.</SwipeableSheetDescription>
                </div>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(80vh-100px)]">
              <div className="p-4 space-y-6">
                {/* Security Score - Featured Card */}
                <TouchFeedback
                  to="/#score"
                  onClick={() => scrollToHomeSection('score')}
                  className={cn(
                    "w-full rounded-2xl overflow-hidden",
                    "bg-gradient-to-br from-primary/15 via-primary/10 to-accent/10",
                    "p-4 text-left border transition-all duration-300",
                    "animate-fade-in",
                    location.pathname === '/' ? 'border-primary/40 shadow-glow' : 'border-primary/20'
                  )}
                  rippleColor="bg-primary/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Security Score</h3>
                        <p className="text-xs text-muted-foreground">Track your security progress</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </TouchFeedback>

                <TouchFeedback
                  to="/threat-intel?tab=subscribe"
                  onClick={closeMenu}
                  className="w-full rounded-2xl border border-primary/25 bg-primary/10 p-4 text-left"
                  rippleColor="bg-primary/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Get alerts</h3>
                        <p className="text-xs text-muted-foreground">By email or on Telegram</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </div>
                </TouchFeedback>

                {/* Checklists Section */}
                <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    Security Checklists
                  </h4>
                  <div className="space-y-1.5">
                    {initialSecurityData.map((category, idx) => {
                      const active = location.pathname === `/category/${category.id}`;
                      return (
                        <TouchFeedback
                          key={category.id}
                          to={`/category/${category.id}`}
                          onClick={closeMenu}
                          className={cn(
                            "w-full p-3.5 text-left rounded-xl transition-all duration-200",
                            "flex items-center gap-3 group animate-fade-in",
                            active 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'border border-transparent hover:bg-muted/50'
                          )}
                          style={{ animationDelay: `${100 + idx * 25}ms` } as React.CSSProperties}
                          rippleColor={active ? 'bg-primary/25' : 'bg-muted-foreground/15'}
                        >
                          <span className="text-lg" aria-hidden="true">{CATEGORY_EMOJI[category.id] ?? '🔒'}</span>
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "text-sm font-medium transition-colors truncate",
                              active ? 'text-primary' : 'text-foreground'
                            )}>
                              {category.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {category.description}
                            </div>
                          </div>
                          {active && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                          <ChevronRight className={cn(
                            "w-4 h-4 transition-all duration-200",
                            active ? 'text-primary' : 'text-muted-foreground/50 group-active:translate-x-0.5'
                          )} />
                        </TouchFeedback>
                      );
                    })}
                  </div>
                </div>

                {/* Resources Section */}
                <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    Resources
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {resourceItems.map((item, idx) => {
                      const active = location.pathname === item.route;
                      return (
                        <TouchFeedback
                          key={item.label}
                          to={item.route}
                          onClick={item.action ?? closeMenu}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl",
                            "transition-all duration-200 animate-fade-in",
                            active 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'border border-border/50 hover:bg-muted/50'
                          )}
                          style={{ animationDelay: `${350 + idx * 25}ms` } as React.CSSProperties}
                          rippleColor={active ? 'bg-primary/25' : 'bg-muted-foreground/15'}
                        >
                          <item.icon className={cn(
                            "w-5 h-5 transition-colors",
                            active ? 'text-primary' : 'text-muted-foreground'
                          )} />
                          <span className={cn(
                            "text-[10px] font-medium text-center transition-colors",
                            active ? 'text-primary' : 'text-foreground'
                          )}>
                            {item.label}
                          </span>
                        </TouchFeedback>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom safe area padding */}
                <div className="h-4" />
              </div>
            </ScrollArea>
          </SwipeableBottomSheet>
        </div>
      </nav>
    </div>
  );
};
