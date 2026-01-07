import { Shield, Github, FileText, Book, Info, Mail, Link, Share, Wrench, Heart, Newspaper, ChevronDown, Map, Zap } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCategoryClick = (categoryId: string) => {
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
          
          {/* Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium px-2 sm:px-3 py-2 bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 rounded-lg transition-colors">
                    <span className="hidden sm:inline">Checklists</span>
                    <span className="sm:hidden">Menu</span>
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

                {/* OpSec Quiz */}
                <NavigationMenuItem>
                  <button
                    onClick={() => navigate('/quiz')}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-foreground hover:text-primary 
                      transition-colors rounded-lg hover:bg-muted/50"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Quiz</span>
                  </button>
                </NavigationMenuItem>


                {/* Threat Intel */}
                <NavigationMenuItem>
                  <button
                    onClick={() => navigate('/threat-intel')}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-foreground hover:text-primary 
                      transition-colors rounded-lg hover:bg-muted/50"
                  >
                    <Newspaper className="w-4 h-4" />
                    <span className="hidden sm:inline">Threat Intel</span>
                  </button>
                </NavigationMenuItem>

                {/* Resources */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium px-2 sm:px-3 py-2 bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 rounded-lg transition-colors">
                    Resources
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[200px] p-2 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-elevated">
                      {[
                        { route: null, icon: Map, label: 'Roadmap', action: handleRoadmapClick },
                        { route: '/tools', icon: Wrench, label: 'Tools' },
                        { route: '/articles', icon: Book, label: 'Articles' },
                        { route: '/links', icon: Link, label: 'Useful Links' },
                        { route: '/license', icon: FileText, label: 'License' },
                        { route: '/about', icon: Info, label: 'About Us' },
                        { route: '/support', icon: Heart, label: 'Support Us' },
                        { route: '/contact', icon: Mail, label: 'Contact' },
                        { route: '/share', icon: Share, label: 'Share' }
                      ].map(item => (
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
        </div>
      </div>
    </nav>
  );
};
