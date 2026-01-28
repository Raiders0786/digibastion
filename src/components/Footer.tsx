import { Github, Copyright, Twitter, ExternalLink, MessageSquare, Heart } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/50 bg-background/50 backdrop-blur-sm pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col space-y-6">
          {/* Social Links */}
          <div className="flex justify-center gap-3">
            <a
              href="https://t.me/digibastion_chat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50
                transition-all duration-200"
            >
              <MessageSquare className="h-4 w-4" />
              Telegram
            </a>
            
            <a
              href="https://www.digibastion.com/support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20
                transition-all duration-200"
            >
              <Heart className="h-4 w-4" />
              Support Us
            </a>
          </div>
          
          {/* Divider */}
          <div className="divider" />
          
          {/* Tagline */}
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Digibastion — Secure the Stack</p>
            <p className="text-xs text-muted-foreground mt-1">
              The Open-Source Web3 Security Platform • Supported by{' '}
              <a 
                href="https://blog.ethereum.org/2025/12/02/allocation-q3-25#:~:text=Community%20%26%20education-,Digibastion,-Chirag%20Agrawal"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline underline-offset-2"
              >
                Ethereum Foundation ESP 2025
              </a>
            </p>
          </div>
          
          {/* Divider */}
          <div className="divider" />
          
          {/* Bottom Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <Copyright className="h-3.5 w-3.5" />
                <span>{currentYear}</span>
              </div>
              <a 
                href="https://github.com/Raiders0786/digibastion/blob/main/LICENSE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                MIT License
                <ExternalLink className="h-3 w-3" />
              </a>
              <a 
                href="https://x.com/__Raiders" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <Twitter className="h-3.5 w-3.5" />
                @__Raiders
              </a>
            </div>
            
            <a 
              href="https://github.com/Raiders0786/digibastion" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <Github className="h-4 w-4" />
              View Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
