
import { Shield, ChevronDown } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";

export const Navbar = () => {
  return (
    <nav className="bg-card border-b border-white/10 py-4">
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
                  <ul className="grid w-[400px] gap-3 p-4">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/50 to-primary/10 p-6 no-underline outline-none focus:shadow-md">
                          <div className="mb-2 mt-4 text-lg font-medium text-foreground">
                            Personal Security Score
                          </div>
                          <p className="text-sm leading-tight text-foreground-secondary">
                            Track and improve your security across all platforms
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <a href="#mobile" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary focus:bg-secondary">
                        <div className="text-sm font-medium leading-none text-foreground">Mobile Security</div>
                        <p className="text-sm leading-snug text-foreground-secondary">
                          Essential mobile device protection
                        </p>
                      </a>
                    </li>
                    <li>
                      <a href="#web3" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary focus:bg-secondary">
                        <div className="text-sm font-medium leading-none text-foreground">Web3 Wallet Security</div>
                        <p className="text-sm leading-snug text-foreground-secondary">
                          Protect your crypto assets
                        </p>
                      </a>
                    </li>
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
