
import { Navbar } from '../components/Navbar';
import { Shield } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">About SecureWeb3</h1>
            <p className="text-lg text-foreground-secondary">
              Your comprehensive guide to Web3 security
            </p>
          </div>

          <div className="space-y-8 animate-slide-up">
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
              <p className="text-foreground-secondary">
                SecureWeb3 is dedicated to making Web3 security accessible to everyone. We provide comprehensive security checklists, guides, and tools to help users protect their digital assets and maintain privacy in the Web3 ecosystem.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">What We Offer</h2>
              <ul className="space-y-3 text-foreground-secondary">
                <li>• Comprehensive security checklists</li>
                <li>• Educational resources and guides</li>
                <li>• Security scoring system</li>
                <li>• Regular security updates</li>
                <li>• Community-driven knowledge base</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
