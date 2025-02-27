
import { ExternalLink, Share2, MessageCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { handleShare } from '@/utils/share';

const Share = () => {
  const { toast } = useToast();
  const websiteUrl = "https://digibastion.com";
  
  const socialLinks = [
    {
      name: 'Twitter',
      icon: ExternalLink,
      onClick: () => handleShare(
        'twitter', 
        websiteUrl, 
        "Discover Digibastion - Your comprehensive guide to Web3 security! Protect your crypto assets with expert checklists and tools. Check it out at https://digibastion.com #Web3Security #Blockchain #CryptoSafety"
      ),
      color: 'hover:text-[#1DA1F2]'
    },
    {
      name: 'LinkedIn',
      icon: Share2,
      onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${websiteUrl}&title=Digibastion%20-%20Web3%20Security%20Platform&summary=Digibastion%20offers%20comprehensive%20security%20checklists%20and%20tools%20for%20blockchain%20users%20and%20developers.%20Protect%20your%20digital%20assets%20with%20our%20expert%20security%20resources.`, '_blank'),
      color: 'hover:text-[#0A66C2]'
    },
    {
      name: 'Reddit',
      icon: MessageCircle,
      onClick: () => window.open(`https://reddit.com/submit?url=${websiteUrl}&title=Digibastion%20-%20The%20Ultimate%20Web3%20Security%20Resource%20Hub`, '_blank'),
      color: 'hover:text-[#FF4500]'
    },
    {
      name: 'Copy Link',
      icon: ExternalLink,
      onClick: () => {
        handleShare('copy', websiteUrl, 'Digibastion - Web3 Security Platform');
      },
      color: 'hover:text-primary'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Share Digibastion | Web3 Security Resources"
        description="Share Digibastion's Web3 security resources with your network. Help make blockchain and cryptocurrency safer for everyone."
        type="website"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Share Digibastion
            </h1>
            <p className="text-lg text-foreground-secondary">
              Help others secure their Web3 journey by sharing this resource
            </p>
          </div>

          <Card className="bg-card rounded-lg p-6 mb-8 animate-slide-up border border-white/10 hover:border-white/20 transition-all">
            <p className="text-foreground-secondary mb-6">
              If you found Digibastion helpful, consider sharing it with your network. Together, we can make Web3 a safer space for everyone by spreading awareness about security best practices. Our comprehensive security checklists, tools, and resources can help both new and experienced users protect their digital assets.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {socialLinks.map((social) => (
                <button
                  key={social.name}
                  onClick={social.onClick}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border border-white/10 ${social.color} transition-all duration-300 hover:bg-white/5 hover:scale-105`}
                >
                  <social.icon className="w-5 h-5" />
                  <span>Share on {social.name}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-card rounded-lg p-6 animate-slide-up border border-white/10 hover:border-white/20 transition-all">
            <h2 className="text-xl font-semibold mb-4">Join Our Community</h2>
            <p className="text-foreground-secondary mb-6">
              Connect with fellow security enthusiasts, share experiences, and stay updated with the latest in Web3 security. Be part of a community dedicated to making blockchain technology safer for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://twitter.com/__Raiders"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-card hover:bg-card/80 text-foreground rounded-lg transition-all duration-300 border border-white/10 hover:border-white/20 text-center hover:shadow-lg hover:shadow-primary/10 hover:scale-105"
              >
                Follow on Twitter
              </a>
              <a
                href="https://github.com/Raiders0786/digibastion"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all duration-300 text-center hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
              >
                Star on GitHub
              </a>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Share;
