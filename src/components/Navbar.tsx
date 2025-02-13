
import { Shield, Github, Twitter, Linkedin, Reddit, Book, Info, Mail, Link, FileText, Tool, Share } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { useNavigate, useLocation } from 'react-router-dom';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <nav className="bg-card border-b border-white/10 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground">SecureWeb3</span>
          </div>
          
          <div className="flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <span className="hidden sm:inline">Security Checklists</span>
                    <span className="sm:hidden">Checklist</span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 bg-card">
                      <div className="row-span-3">
                        <button
                          onClick={() => scrollToCategory('score')}
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/50 to-primary/10 p-6 no-underline outline-none focus:shadow-md"
                        >
                          <div className="mb-2 text-lg font-medium text-foreground">
                            Security Score
                          </div>
                          <p className="text-sm leading-tight text-foreground-secondary">
                            Track your security progress
                          </p>
                        </button>
                      </div>
                      {[
                        { id: 'authentication', title: 'Authentication', icon: 'key' },
                        { id: 'browsing', title: 'Web Browsing', icon: 'globe' },
                        { id: 'email', title: 'Email Security', icon: 'mail' },
                        { id: 'mobile', title: 'Mobile Security', icon: 'smartphone' },
                        { id: 'social', title: 'Social Media', icon: 'share' },
                      ].map(item => (
                        <button
                          key={item.id}
                          onClick={() => scrollToCategory(item.id)}
                          className="block w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent focus:bg-accent text-left"
                        >
                          <div className="text-sm font-medium leading-none text-foreground">{item.title}</div>
                        </button>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[220px] gap-2 p-4 bg-card">
                      <button 
                        onClick={() => navigate('/about')}
                        className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                      >
                        <Info className="w-4 h-4" />
                        <span className="text-sm">About Us</span>
                      </button>
                      <button 
                        onClick={() => navigate('/license')}
                        className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">License</span>
                      </button>
                      <button 
                        onClick={() => navigate('/tools')}
                        className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                      >
                        <Tool className="w-4 h-4" />
                        <span className="text-sm">Tools</span>
                      </button>
                      <button 
                        onClick={() => navigate('/articles')}
                        className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                      >
                        <Book className="w-4 h-4" />
                        <span className="text-sm">Articles</span>
                      </button>
                      <button 
                        onClick={() => navigate('/links')}
                        className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                      >
                        <Link className="w-4 h-4" />
                        <span className="text-sm">Useful Links</span>
                      </button>
                      <button 
                        onClick={() => navigate('/contact')}
                        className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">Contact</span>
                      </button>
                      <button 
                        onClick={() => navigate('/share')}
                        className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                      >
                        <Share className="w-4 h-4" />
                        <span className="text-sm">Share & Connect</span>
                      </button>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <div className="flex items-center gap-4">
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
      </div>
    </nav>
  );
};
