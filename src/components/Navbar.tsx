
import { Shield, Github, FileText, Book, Info, Mail, Link, Share, ExternalLink, Wrench, Globe } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'zh', label: 'Chinese' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'ru', label: 'Русский' }
  ];

  const scrollToCategory = (categoryId: string) => {
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

  const categories = [
    { id: 'authentication', title: 'Authentication', description: 'Secure account access' },
    { id: 'browsing', title: 'Web Browsing', description: 'Safe online browsing' },
    { id: 'email', title: 'Email Security', description: 'Protect communications' },
    { id: 'mobile', title: 'Mobile Security', description: 'Device protection' },
    { id: 'social', title: 'Social Media', description: 'Social account security' },
    { id: 'wallet', title: 'Web3 Wallet', description: 'Crypto asset protection' },
    { id: 'os', title: 'OS Security', description: 'System hardening' }
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="bg-card border-b border-white/10 py-3 sm:py-4 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span className="text-lg sm:text-xl font-bold text-foreground">SecureWeb3</span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm sm:text-base px-2 sm:px-4">
                    <span className="hidden sm:inline">Security Checklists</span>
                    <span className="sm:hidden">Checklist</span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[300px] sm:w-[400px] p-4 bg-[#1a1f2c]">
                      <div className="mb-4">
                        <button
                          onClick={() => scrollToCategory('score')}
                          className="w-full rounded-lg bg-gradient-to-br from-[#6e59a5] to-[#9b87f5] p-6 text-left"
                        >
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Personal Security Score
                          </h3>
                          <p className="text-sm text-gray-200">
                            Track and improve your security across all platforms
                          </p>
                        </button>
                      </div>
                      <div className="space-y-1">
                        {categories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => scrollToCategory(category.id)}
                            className="w-full p-3 text-left hover:bg-white/5 rounded-md transition-colors"
                          >
                            <div className="text-sm font-medium text-white">{category.title}</div>
                            <div className="text-xs text-gray-400">{category.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm sm:text-base px-2 sm:px-4">Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[200px] sm:w-[220px] p-3 bg-card">
                      {[
                        { route: '/about', icon: Info, label: 'About Us' },
                        { route: '/license', icon: FileText, label: 'License' },
                        { route: '/tools', icon: Wrench, label: 'Tools' },
                        { route: '/articles', icon: Book, label: 'Articles' },
                        { route: '/links', icon: Link, label: 'Useful Links' },
                        { route: '/contact', icon: Mail, label: 'Contact' },
                        { route: '/share', icon: Share, label: 'Share & Connect' }
                      ].map(item => (
                        <button
                          key={item.route}
                          onClick={() => navigate(item.route)}
                          className="flex items-center gap-2 w-full p-2 text-sm rounded-md hover:bg-accent text-left"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <Globe className="w-5 h-5 text-foreground-secondary hover:text-foreground transition-colors" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`cursor-pointer ${i18n.language === lang.code ? 'bg-accent' : ''}`}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <a 
              href="https://github.com/yourusername/secureweb3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};
