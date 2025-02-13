
import { Navbar } from '../components/Navbar';
import { Wrench } from 'lucide-react';

const Tools = () => {
  const securityTools = [
    {
      name: "Password Manager",
      description: "Securely store and manage your passwords",
      category: "Authentication"
    },
    {
      name: "2FA Authenticator",
      description: "Two-factor authentication tool",
      category: "Authentication"
    },
    {
      name: "VPN Service",
      description: "Secure your internet connection",
      category: "Privacy"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Wrench className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Security Tools</h1>
            <p className="text-lg text-foreground-secondary">
              Essential tools for your Web3 security
            </p>
          </div>

          <div className="grid gap-6 animate-slide-up">
            {securityTools.map((tool, index) => (
              <div key={index} className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
                <p className="text-foreground-secondary mb-3">{tool.description}</p>
                <span className="text-sm text-primary">{tool.category}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tools;
