
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Heart, Shield, ArrowRight, Zap, Lock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Support = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Support Digibastion | Contribute to Web3 Security"
        description="Support our mission to improve Web3 security for everyone. Your contribution helps us develop better security tools and resources."
        type="website"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 animate-fade-in">
            <Heart className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Support Our Mission</h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Your contribution helps us develop better security tools, resources, and educational content to keep the Web3 community safe.
            </p>
          </div>

          <div className="grid gap-12 animate-slide-up">
            <section className="bg-gradient-to-br from-primary/5 to-card border border-white/10 rounded-lg p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
              <div className="relative z-10">
                <div className="mb-8">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Support Digibastion</h2>
                  <p className="text-foreground-secondary mb-6">
                    Help us create more security tools, guides, and resources for the Web3 community
                  </p>
                  
                  <div className="mb-8 bg-card/30 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                    <div className="aspect-w-16 aspect-h-9 mb-6">
                      <iframe 
                        src="https://buy.copperx.io/payment/payment-link/524b0e73-8733-4c99-8a55-8cf8ff7f2c00" 
                        className="w-full h-[400px] border-0 rounded-md"
                        title="Support Digibastion"
                        allow="payment"
                      ></iframe>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-card/30 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                    <Shield className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-medium mb-2">Improved Resources</h3>
                    <p className="text-sm text-foreground-secondary">
                      Help us create more in-depth security guides and tools
                    </p>
                  </div>
                  
                  <div className="bg-card/30 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                    <Lock className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-medium mb-2">Security Research</h3>
                    <p className="text-sm text-foreground-secondary">
                      Support our ongoing security research and threat analysis
                    </p>
                  </div>
                  
                  <div className="bg-card/30 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                    <Zap className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-medium mb-2">Community Growth</h3>
                    <p className="text-sm text-foreground-secondary">
                      Help us reach and educate more users about Web3 security
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-foreground-secondary mb-4">
                    Your support enables us to dedicate more time and resources to our mission of making Web3 safer for everyone.
                    We're committed to transparency in how we use contributions to improve our platform.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <ArrowRight className="w-6 h-6 text-primary" />
                Other Ways to Support
              </h2>
              <p className="text-foreground-secondary">
                Financial contributions are just one way to support our mission. Here are other meaningful ways you can help:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                <div className="bg-card/30 p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-medium mb-3">Contribute Code</h3>
                  <p className="text-foreground-secondary text-sm mb-4">
                    Help improve our platform by contributing code, fixing bugs, or adding new features through GitHub.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://github.com/Raiders0786/digibastion', '_blank')}
                    className="w-full"
                  >
                    View GitHub Repository
                  </Button>
                </div>
                
                <div className="bg-card/30 p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-medium mb-3">Spread the Word</h3>
                  <p className="text-foreground-secondary text-sm mb-4">
                    Share Digibastion with your network to help more people learn about Web3 security best practices.
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.pathname = '/share'}
                    className="w-full"
                  >
                    Share Digibastion
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
