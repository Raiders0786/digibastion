
import { Github, Copyright, Twitter, ExternalLink, MessageSquare, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-primary/10 bg-secondary/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground/70 hover:text-primary hover:bg-primary/10 transition-all duration-300"
              asChild
            >
              <a
                href="https://t.me/digibastion"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Join Telegram
              </a>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground/70 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-all duration-300"
              asChild
            >
              <a
                href="https://www.digibastion.com/support"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                Support Us
              </a>
            </Button>
          </div>
          
          <Separator className="bg-white/5" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground/70">
            <div className="flex items-center flex-wrap justify-center sm:justify-start gap-2">
              <Copyright className="h-4 w-4" />
              <span>{currentYear}</span>
              <span className="hidden sm:inline">·</span>
              <a 
                href="https://github.com/Raiders0786/digibastion/blob/main/LICENSE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center"
              >
                MIT License
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              <span className="hidden sm:inline">·</span>
              <a 
                href="https://x.com/__Raiders" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center"
              >
                <Twitter className="h-4 w-4 mr-1" />
                @__Raiders
              </a>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href="https://github.com/Raiders0786/digibastion" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center"
              >
                <Github className="h-4 w-4 mr-1" />
                View Source
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
