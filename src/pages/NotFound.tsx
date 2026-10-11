import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BookOpen, Home, Newspaper, Zap } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { MetaTags } from '../components/MetaTags';

const destinations = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/threat-intel', label: 'Threat Intel', icon: Newspaper },
  { to: '/articles', label: 'Security guides', icon: BookOpen },
  { to: '/quiz', label: 'OpSec self-check', icon: Zap },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Page not found | Digibastion"
        description="This page does not exist or has moved. Try Threat Intel, the security guides or the OpSec self-check."
        robots="noindex,follow"
      />
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <p className="text-4xl font-bold text-primary">404</p>
            <h1 className="text-2xl font-semibold">Page not found</h1>
            <p className="text-foreground-secondary">
              This page does not exist or has moved.
            </p>
          </div>

          <nav aria-label="Popular pages" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {destinations.map((destination) => (
              <Button key={destination.to} asChild variant="outline" className="w-full">
                <Link to={destination.to}>
                  <destination.icon className="w-4 h-4 mr-2" aria-hidden="true" />
                  {destination.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
