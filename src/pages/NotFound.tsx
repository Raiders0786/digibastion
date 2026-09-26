
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { MetaTags } from '../components/MetaTags';
import { Github, Home } from 'lucide-react';

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
        title="404 - Page Not Found | Digibastion"
        description="The page you're looking for doesn't exist. Return home to explore Web3 security checklists, threat intelligence, and OpSec tools."
        keywords="404, page not found, digibastion, web3 security"
        noindex={true}
      />
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <p className="text-foreground-secondary">
              Oops! The page you're looking for doesn't exist. It might have been moved or removed.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button asChild variant="outline" className="w-full sm:w-auto hover:bg-primary hover:text-white transition-all duration-300">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Link>
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-foreground-secondary">or</span>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full sm:w-auto hover:bg-primary hover:text-white transition-all duration-300">
              <a href="https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 mr-2" />
                Contribute on GitHub
              </a>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
