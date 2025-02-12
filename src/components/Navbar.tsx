
import { Shield } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const navigate = useNavigate();

  const scrollToCategory = (categoryId: string) => {
    if (categoryId === 'score') {
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
    } else {
      navigate(`/category/${categoryId}`);
    }
  };

  return (
    <nav className="bg-card border-b border-white/10 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground">SecureWeb3</span>
          </div>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Security Checklists</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 bg-card">
                    <li className="row-span-3">
                      <button
                        onClick={() => scrollToCategory('score')}
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/50 to-primary/10 p-6 no-underline outline-none focus:shadow-md"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium text-foreground">
                          Personal Security Score
                        </div>
                        <p className="text-sm leading-tight text-foreground-secondary">
                          Track and improve your security across all platforms
                        </p>
                      </button>
                    </li>
                    {[
                      { id: 'authentication', title: 'Authentication', desc: 'Secure account access' },
                      { id: 'browsing', title: 'Web Browsing', desc: 'Safe online browsing' },
                      { id: 'email', title: 'Email Security', desc: 'Protect communications' },
                      { id: 'mobile', title: 'Mobile Security', desc: 'Device protection' },
                      { id: 'social', title: 'Social Media', desc: 'Social account security' },
                      { id: 'wallet', title: 'Web3 Wallet', desc: 'Crypto asset protection' },
                      { id: 'os', title: 'OS Security', desc: 'System hardening' },
                    ].map(item => (
                      <li key={item.id}>
                        <button
                          onClick={() => scrollToCategory(item.id)}
                          className="block w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent focus:bg-accent text-left"
                        >
                          <div className="text-sm font-medium leading-none text-foreground">{item.title}</div>
                          <p className="line-clamp-2 text-sm leading-snug text-foreground-secondary">
                            {item.desc}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </nav>
  );
};
