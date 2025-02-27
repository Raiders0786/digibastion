
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
        "Protect your personal digital footprint with Digibastion today. Self-driven operation security best practices, expert-backed checklists, and security scoring to enhance your privacy across digital services, crypto, Web3, and beyond."
      ),
      color: 'hover:text-[#1DA1F2]'
    },
    {
      name: 'LinkedIn',
      icon: Share2,
      onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${websiteUrl}&title=Digibastion%20-%20Digital%20Security%20Platform&summary=Protect%20your%20personal%20digital%20footprint%20with%20Digibastion.%20Self-driven%20security%20checklists%20and%20tools%20for%20users%20and%20developers.%20Enhance%20your%20privacy%20across%20all%20digital%20activities.`, '_blank'),
      color: 'hover:text-[#0A66C2]'
    },
    {
      name: 'Reddit',
      icon: MessageCircle,
      onClick: () => window.open(`https://reddit.com/submit?url=${websiteUrl}&title=Digibastion%20-%20The%20Ultimate%20Digital%20Security%20Resource%20Hub`, '_blank'),
      color: 'hover:text-[#FF4500]'
    },
    {
      name: 'Copy Link',
      icon: ExternalLink,
      onClick: () => {
        handleShare('copy', websiteUrl, 'Digibastion - Digital Security Platform');
      },
      color: 'hover:text-primary'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Share Digibastion | Digital Security Resources"
        description="Share Digibastion's complete digital security resources with your network. Help make online activities and blockchain safer for everyone."
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
              Help others secure their digital journey
            </p>
          </div>

          <Card className="bg-card rounded-lg p-6 mb-8 animate-slide-up border border-white/10 hover:border-white/20 transition-all">
            <p className="text-foreground-secondary mb-6">
              If you found Digibastion helpful, consider sharing it with your network. Together, we can make the digital world safer by spreading awareness about security best practices. Our comprehensive security checklists, tools, and resources help protect digital assets across everyday online activities, social media, email, cryptocurrency, and more.
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
              Connect with fellow security enthusiasts, share experiences, and stay updated with the latest in digital security. Be part of a community dedicated to making technology safer for everyone.
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
