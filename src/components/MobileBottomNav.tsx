import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Zap, Newspaper, Menu, Shield, ChevronRight, Sparkles } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { ChevronDown, Map, Wrench, Book, Link, FileText, Info, Heart, Mail, Share } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SwipeableBottomSheet } from './mobile/SwipeableBottomSheet';
import { TouchFeedback } from './mobile/TouchFeedback';
import { NotificationBadge } from './mobile/NotificationBadge';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';
import { cn } from '@/lib/utils';

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { alertCount, hasNewQuiz, markAlertsRead, markQuizVisited } = useMobileNotifications();

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setMenuOpen(false);
    if (categoryId === 'score') {
      if (location.pathname !== '/') {
        navigate('/', { state: { scrollTo: 'score' } });
      } else {
        const element = document.getElementById(categoryId);
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }
    } else {
      navigate(`/category/${categoryId}`);
    }
  };

  const handleRoadmapClick = () => {
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: 'roadmap' } });
    } else {
      const element = document.getElementById('roadmap');
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  const handleNavClick = (route: string) => {
    // Mark notifications as read when navigating
    if (route === '/threat-intel') {
      markAlertsRead();
    } else if (route === '/quiz') {
      markQuizVisited();
    }
    navigate(route);
  };

  const categories = [
    { id: 'authentication', title: 'Authentication', description: 'Secure account access', emoji: '🔐' },
    { id: 'browsing', title: 'Web Browsing', description: 'Safe online browsing', emoji: '🌐' },
    { id: 'email', title: 'Email Security', description: 'Protect communications', emoji: '📧' },
    { id: 'mobile', title: 'Mobile Security', description: 'Device protection', emoji: '📱' },
    { id: 'social', title: 'Social Media', description: 'Social account security', emoji: '👥' },
    { id: 'wallet', title: 'Web3 Wallet', description: 'Crypto asset protection', emoji: '💼' },
    { id: 'os', title: 'OS Security', description: 'System hardening', emoji: '💻' },
    { id: 'defi', title: 'DeFi Security', description: 'Secure DeFi interactions', emoji: '🔗' },
    { id: 'developers', title: 'Developer Security', description: 'Web3 development security', emoji: '👨‍💻' },
    { id: 'jobs', title: 'Job Search Security', description: 'Secure job hunting', emoji: '💼' },
    { id: 'opsec', title: 'OpSec', description: 'Operational security practices', emoji: '🛡️' }
  ];

  const resourceItems = [
    { route: null, icon: Map, label: 'Roadmap', action: handleRoadmapClick },
    { route: '/tools', icon: Wrench, label: 'Tools' },
    { route: '/articles', icon: Book, label: 'Articles' },
    { route: '/links', icon: Link, label: 'Useful Links' },
    { route: '/license', icon: FileText, label: 'License' },
    { route: '/about', icon: Info, label: 'About Us' },
    { route: '/support', icon: Heart, label: 'Support Us' },
    { route: '/contact', icon: Mail, label: 'Contact' },
    { route: '/share', icon: Share, label: 'Share' }
  ];

  const navItems = [
    { route: '/', icon: Home, label: 'Home', badge: undefined },
    { route: '/quiz', icon: Zap, label: 'Quiz', badge: hasNewQuiz ? 'dot' : undefined },
    { route: '/threat-intel', icon: Newspaper, label: 'Alerts', badge: alertCount > 0 ? alertCount : undefined },
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
          {navItems.map((item, idx) => (
            <TouchFeedback
              key={item.route}
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
                    showDot={item.badge === 'dot'}
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
                  <h2 className="text-base font-semibold text-foreground">Digibastion Menu</h2>
                  <p className="text-xs text-muted-foreground">Secure the Stack</p>
                </div>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(80vh-100px)]">
              <div className="p-4 space-y-6">
                {/* Security Score - Featured Card */}
                <TouchFeedback
                  onClick={() => handleCategoryClick('score')}
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

                {/* Checklists Section */}
                <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    Security Checklists
                  </h4>
                  <div className="space-y-1.5">
                    {categories.map((category, idx) => {
                      const active = location.pathname === `/category/${category.id}`;
                      return (
                        <TouchFeedback
                          key={category.id}
                          onClick={() => handleCategoryClick(category.id)}
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
                          <span className="text-lg">{category.emoji}</span>
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
                      const active = item.route && location.pathname === item.route;
                      return (
                        <TouchFeedback
                          key={item.label}
                          onClick={() => {
                            if (item.action) {
                              item.action();
                            } else {
                              setMenuOpen(false);
                              navigate(item.route!);
                            }
                          }}
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
