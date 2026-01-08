import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Zap, Newspaper, Menu, Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { ChevronDown, Map, Wrench, Book, Link, FileText, Info, Heart, Mail, Share } from 'lucide-react';
import { useState, useRef } from 'react';

interface RippleEffect {
  x: number;
  y: number;
  id: number;
}

const RippleButton = ({ 
  children, 
  onClick, 
  isActive,
  className = '',
  style
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  isActive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);

    onClick();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      style={style}
      className={`relative overflow-hidden ${className}`}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-primary/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      {children}
    </button>
  );
};

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const categories = [
    { id: 'authentication', title: 'Authentication', description: 'Secure account access' },
    { id: 'browsing', title: 'Web Browsing', description: 'Safe online browsing' },
    { id: 'email', title: 'Email Security', description: 'Protect communications' },
    { id: 'mobile', title: 'Mobile Security', description: 'Device protection' },
    { id: 'social', title: 'Social Media', description: 'Social account security' },
    { id: 'wallet', title: 'Web3 Wallet', description: 'Crypto asset protection' },
    { id: 'os', title: 'OS Security', description: 'System hardening' },
    { id: 'defi', title: 'DeFi Security', description: 'Secure DeFi interactions' },
    { id: 'developers', title: 'Developer Security', description: 'Web3 development security' },
    { id: 'jobs', title: 'Job Search Security', description: 'Secure job hunting' },
    { id: 'opsec', title: 'OpSec', description: 'Operational security practices' }
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
    { route: '/', icon: Home, label: 'Home' },
    { route: '/quiz', icon: Zap, label: 'Quiz' },
    { route: '/threat-intel', icon: Newspaper, label: 'Alerts' },
  ];

  const isActive = (route: string) => location.pathname === route;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
      {/* Gradient fade effect at top */}
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Navigation bar */}
      <nav className="bg-background/95 backdrop-blur-xl border-t border-border/50 px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <RippleButton
              key={item.route}
              onClick={() => navigate(item.route)}
              isActive={isActive(item.route)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200
                ${isActive(item.route) 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive(item.route) ? 'scale-110' : ''}`} />
                {isActive(item.route) && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-all ${isActive(item.route) ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </RippleButton>
          ))}

          {/* Menu Button with Sheet */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <RippleButton
                onClick={() => {}}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-medium">Menu</span>
              </RippleButton>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl px-0">
              <SheetHeader className="px-6 pb-4 border-b border-border/50">
                <SheetTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Digibastion Menu</span>
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="h-[calc(80vh-80px)]">
                <div className="p-4 space-y-6">
                  {/* Security Score */}
                  <RippleButton
                    onClick={() => handleCategoryClick('score')}
                    className={`w-full rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 p-4 text-left
                      border transition-all duration-300 hover:border-primary/40 animate-fade-in
                      ${location.pathname === '/' ? 'border-primary/60' : 'border-primary/20'}`}
                  >
                    <h3 className="text-sm font-semibold text-foreground mb-1">Security Score</h3>
                    <p className="text-xs text-muted-foreground">Track your security progress</p>
                  </RippleButton>

                  {/* Checklists Section */}
                  <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                      Security Checklists
                    </h4>
                    <div className="space-y-1">
                      {categories.map((category, idx) => {
                        const active = location.pathname === `/category/${category.id}`;
                        return (
                          <RippleButton
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id)}
                            isActive={active}
                            className={`w-full p-3 text-left rounded-lg transition-all duration-200
                              flex items-center justify-between group animate-fade-in
                              ${active 
                                ? 'bg-primary/10 border border-primary/30' 
                                : 'hover:bg-muted/50 border border-transparent'}`}
                            style={{ animationDelay: `${100 + idx * 25}ms` } as React.CSSProperties}
                          >
                            <div>
                              <div className={`text-sm font-medium transition-colors ${active ? 'text-primary' : 'text-foreground'}`}>
                                {category.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {category.description}
                              </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 -rotate-90 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                          </RippleButton>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resources Section */}
                  <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                      Resources
                    </h4>
                    <div className="space-y-1">
                      {resourceItems.map((item, idx) => {
                        const active = item.route && location.pathname === item.route;
                        return (
                          <RippleButton
                            key={item.label}
                            onClick={() => {
                              if (item.action) {
                                item.action();
                              } else {
                                setMenuOpen(false);
                                navigate(item.route!);
                              }
                            }}
                            isActive={active || false}
                            className={`flex items-center gap-3 w-full p-3 text-sm rounded-lg 
                              text-left transition-all duration-200 group animate-fade-in
                              ${active 
                                ? 'bg-primary/10 border border-primary/30' 
                                : 'hover:bg-muted/50 border border-transparent'}`}
                            style={{ animationDelay: `${350 + idx * 25}ms` } as React.CSSProperties}
                          >
                            <item.icon className={`w-4 h-4 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`transition-colors ${active ? 'text-primary font-medium' : 'text-foreground'}`}>
                              {item.label}
                            </span>
                            {active && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            )}
                          </RippleButton>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
};
