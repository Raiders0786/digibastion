import { useState } from 'react';
import { Shield, Github, FileText, Book, Info, Mail, Link, Share, Wrench, Heart, Newspaper, ChevronDown, Map, Zap, Menu, X } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    setMobileMenuOpen(false);
    if (categoryId === 'score') {
      if (location.pathname !== '/') {
        navigate('/', { state: { scrollTo: 'score' } });
      } else {
        const element = document.getElementById(categoryId);
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    } else {
      navigate(`/category/${categoryId}`);
    }
  };

  const handleRoadmapClick = () => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: 'roadmap' } });
    } else {
      const element = document.getElementById('roadmap');
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleMobileNavigate = (route: string) => {
    setMobileMenuOpen(false);
    navigate(route);
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

  return (
    <nav className="bg-background/80 backdrop-blur-xl border-b border-border/50 py-3 sm:py-4 fixed top-0 left-0 right-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-semibold text-foreground tracking-tight leading-none">
                Digibastion
              </span>
              <span className="text-[9px] text-muted-foreground/70 hidden sm:block tracking-wide">
                Secure the Stack
              </span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-1 sm:gap-2">
            {/* Checklists Dropdown - Separate NavigationMenu */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium px-2 sm:px-3 py-2 bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 rounded-lg transition-colors">
                    Checklists
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[320px] sm:w-[400px] p-4 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-elevated">
                      {/* Featured Card */}
                      <button
                        onClick={() => handleCategoryClick('score')}
                        className="w-full rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 p-5 text-left mb-4
                          border border-primary/20 transition-all duration-300 hover:border-primary/40 hover:shadow-glow group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <div className="relative">
                          <h3 className="text-base font-semibold text-foreground mb-1.5">
                            Security Score
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Track your security progress across all categories
                          </p>
                        </div>
                      </button>
                      
                      {/* Category List */}
                      <div className="space-y-0.5 max-h-[50vh] overflow-y-auto scrollbar-hide">
                        {categories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id)}
                            className="w-full p-3 text-left rounded-lg transition-all duration-200
                              hover:bg-muted/50 group flex items-center justify-between"
                          >
                            <div>
                              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {category.title}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {category.description}
                              </div>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* OpSec Quiz */}
            <button
              onClick={() => navigate('/quiz')}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-foreground hover:text-primary 
                transition-colors rounded-lg hover:bg-muted/50"
            >
              <Zap className="w-4 h-4" />
              <span>Quiz</span>
            </button>

            {/* Threat Intel */}
            <button
              onClick={() => navigate('/threat-intel')}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-foreground hover:text-primary 
                transition-colors rounded-lg hover:bg-muted/50"
            >
              <Newspaper className="w-4 h-4" />
              <span>Threat Intel</span>
            </button>

            {/* Resources Dropdown - Separate NavigationMenu */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium px-2 sm:px-3 py-2 bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 rounded-lg transition-colors">
                    Resources
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[200px] p-2 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-elevated">
                      {resourceItems.map(item => (
                        <button
                          key={item.label}
                          onClick={() => item.action ? item.action() : navigate(item.route!)}
                          className="flex items-center gap-2.5 w-full p-2.5 text-sm rounded-lg 
                            hover:bg-muted/50 text-left transition-all duration-200 group"
                        >
                          <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-foreground group-hover:text-primary transition-colors">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* GitHub */}
            <a 
              href="https://github.com/Raiders0786/digibastion"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              aria-label="View on GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>

          {/* Mobile Navigation - Only theme toggle and hamburger, bottom nav handles main actions */}
          <div className="flex sm:hidden items-center gap-1">
            <ThemeToggle />

            {/* Hamburger Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="p-2">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                <SheetHeader className="p-4 border-b border-border/50">
                  <SheetTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span>Digibastion</span>
                  </SheetTitle>
                </SheetHeader>
                
                <ScrollArea className="h-[calc(100vh-80px)]">
                  <div className="p-4 space-y-6">
                    {/* Security Score */}
                    <button
                      onClick={() => handleCategoryClick('score')}
                      className={`w-full rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 p-4 text-left
                        border transition-all duration-300 hover:border-primary/40 hover:scale-[1.02] active:scale-[0.98]
                        animate-fade-in ${location.pathname === '/' && location.hash === '#score' ? 'border-primary/60 shadow-glow' : 'border-primary/20'}`}
                      style={{ animationDelay: '50ms' }}
                    >
                      <h3 className="text-sm font-semibold text-foreground mb-1">Security Score</h3>
                      <p className="text-xs text-muted-foreground">Track your security progress</p>
                    </button>

                    {/* Checklists Section */}
                    <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Security Checklists
                      </h4>
                      <div className="space-y-1">
                        {categories.map((category, idx) => {
                          const isActive = location.pathname === `/category/${category.id}`;
                          return (
                            <button
                              key={category.id}
                              onClick={() => handleCategoryClick(category.id)}
                              className={`w-full p-3 text-left rounded-lg transition-all duration-200
                                flex items-center justify-between group hover:scale-[1.01] active:scale-[0.99]
                                animate-fade-in ${isActive 
                                  ? 'bg-primary/10 border border-primary/30' 
                                  : 'hover:bg-muted/50 border border-transparent'}`}
                              style={{ animationDelay: `${150 + idx * 30}ms` }}
                            >
                              <div>
                                <div className={`text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                                  {category.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {category.description}
                                </div>
                              </div>
                              <ChevronDown className={`w-4 h-4 -rotate-90 transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:translate-x-0.5'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Resources Section */}
                    <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Resources
                      </h4>
                      <div className="space-y-1">
                        {resourceItems.map((item, idx) => {
                          const isActive = item.route && location.pathname === item.route;
                          return (
                            <button
                              key={item.label}
                              onClick={() => item.action ? item.action() : handleMobileNavigate(item.route!)}
                              className={`flex items-center gap-3 w-full p-3 text-sm rounded-lg 
                                text-left transition-all duration-200 group hover:scale-[1.01] active:scale-[0.99]
                                animate-fade-in ${isActive 
                                  ? 'bg-primary/10 border border-primary/30' 
                                  : 'hover:bg-muted/50 border border-transparent'}`}
                              style={{ animationDelay: `${450 + idx * 30}ms` }}
                            >
                              <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                              <span className={`transition-colors ${isActive ? 'text-primary font-medium' : 'text-foreground group-hover:text-primary'}`}>
                                {item.label}
                              </span>
                              {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* GitHub Link */}
                    <div className="pt-4 border-t border-border/50 animate-fade-in" style={{ animationDelay: '700ms' }}>
                      <a 
                        href="https://github.com/Raiders0786/digibastion"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 w-full p-3 text-sm rounded-lg 
                          hover:bg-muted/50 text-left transition-all duration-200 group hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <Github className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-foreground group-hover:text-primary transition-colors">
                          View on GitHub
                        </span>
                      </a>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
