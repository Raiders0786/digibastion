
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

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
      <Navbar />
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
          <a href="/" className="text-primary hover:text-primary/90 underline">
            Return to Home
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
