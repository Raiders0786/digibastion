
import { ExternalLink, Share2, MessageCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';

const Share = () => {
  const socialLinks = [
    {
      name: 'Twitter',
      icon: ExternalLink,
      url: 'https://twitter.com/intent/tweet?text=Check%20out%20SecureWeb3%20-%20Your%20comprehensive%20guide%20to%20Web3%20security!%20%23Web3%20%23Security%20%23Blockchain',
      color: 'hover:text-[#1DA1F2]'
    },
    {
      name: 'LinkedIn',
      icon: Share2,
      url: 'https://www.linkedin.com/sharing/share-offsite/?url=https://secureweb3.com',
      color: 'hover:text-[#0A66C2]'
    },
    {
      name: 'Reddit',
      icon: MessageCircle,
      url: 'https://reddit.com/submit?url=https://secureweb3.com&title=SecureWeb3%20-%20Comprehensive%20Web3%20Security%20Guide',
      color: 'hover:text-[#FF4500]'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Share SecureWeb3
            </h1>
            <p className="text-lg text-foreground-secondary">
              Help others secure their Web3 journey by sharing this resource
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 mb-8 animate-slide-up">
            <p className="text-foreground-secondary mb-6">
              If you found SecureWeb3 helpful, consider sharing it with your network. Together, we can make Web3 a safer space for everyone by spreading awareness about security best practices.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border border-white/10 ${social.color} transition-colors hover:bg-white/5`}
                >
                  <social.icon className="w-5 h-5" />
                  <span>Share on {social.name}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 animate-slide-up">
            <h2 className="text-xl font-semibold mb-4">Join Our Community</h2>
            <p className="text-foreground-secondary mb-6">
              Connect with fellow security enthusiasts, share experiences, and stay updated with the latest in Web3 security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://discord.gg/secureweb3"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-center"
              >
                Join Discord
              </a>
              <a
                href="https://t.me/secureweb3"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-secondary hover:bg-secondary/90 text-white rounded-lg transition-colors text-center"
              >
                Join Telegram
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Share;
