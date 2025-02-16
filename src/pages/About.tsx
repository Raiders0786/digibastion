import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Shield, CheckCircle, Users, TrendingUp, Lightbulb, HandshakeIcon, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Ultimate Personal Web3 Security & Hygiene Checklist</h1>
            <p className="text-lg text-foreground-secondary">
              Empowering you to protect your digital life in an ever-changing online world
            </p>
          </div>

          <div className="space-y-12 animate-slide-up">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Shield className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                  <p className="text-foreground-secondary">
                    At Digibastion, we focus on providing practical guidance to secure your digital assets.
                    Private key theft has been the number one attack vector over the years, and we're here
                    to help you protect what matters most.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
                  <p className="text-foreground-secondary mb-4">
                    We provide a living, community-maintained resource that evolves with new threats and best practices.
                    Built by the <a href="https://x.com/__Raiders" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Raiders</a> and supported by contributors, sponsors, and supporters.
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-4 text-foreground-secondary">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Comprehensive security checklists
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Educational resources
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Security scoring system
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Regular security updates
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Users className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Community-Driven and Expert-Supported</h2>
                  <p className="text-foreground-secondary">
                    This project is built for the true community. We invite everyone—whether you're an
                    investor, researcher, trader, or new user—to contribute, suggest improvements, and
                    share experiences.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <TrendingUp className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Impact and Data</h2>
                  <div className="bg-card/50 p-4 rounded-lg mb-4">
                    <p className="text-2xl font-bold text-primary">$12B+</p>
                    <p className="text-foreground-secondary">Digital assets stolen due to security breaches</p>
                  </div>
                  <p className="text-foreground-secondary">
                    Social engineering and private key compromises have led to enormous losses in the crypto
                    space, highlighting the importance of maintaining robust security hygiene in Web3.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Lightbulb className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Our Future Vision</h2>
                  <p className="text-foreground-secondary mb-4">
                    We believe that when you're armed with knowledge, you can guard against even the most
                    sophisticated attacks. Our living document will continue to evolve, ensuring you always
                    have access to the latest threats and best practices.
                  </p>
                  <p className="text-foreground-secondary font-semibold">
                    Together, we're paving the way for crypto mass adoption. We all gonna make it!
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <Wallet className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Support Our Mission</h2>
                  <p className="text-foreground-secondary mb-6">
                    Support us by sponsoring this project to help us continue researching and developing more useful tools, 
                    resources, checklists, and critical alerts. Your support enables us to keep the community safe and informed 
                    with the latest security practices.
                  </p>
                  <div className="space-y-4 bg-card/50 p-4 rounded-lg">
                    <div>
                      <p className="font-semibold mb-2">ETH/ERC-20:</p>
                      <code className="bg-background p-2 rounded block text-sm">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</code>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">BTC:</p>
                      <code className="bg-background p-2 rounded block text-sm">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <HandshakeIcon className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Join Us on This Journey</h2>
                  <p className="text-foreground-secondary mb-6">
                    Digibastion is not just a resource—it's a community of people dedicated to real value
                    and protection. We invite you to engage with us, contribute your insights, and help
                    spread the word.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg">
                      <Users className="mr-2" />
                      Join Community
                    </Button>
                    <Button variant="secondary" size="lg">
                      <Shield className="mr-2" />
                      View Checklist
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
