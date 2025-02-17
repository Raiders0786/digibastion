
import { Github, Copyright, Twitter, ExternalLink } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-primary/10 bg-secondary/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground/70">
          <div className="flex items-center gap-2">
            <Copyright className="h-4 w-4" />
            <span>{currentYear}</span>
            <span className="px-1">·</span>
            <a 
              href="https://github.com/Raiders0786/digibastion/blob/main/LICENSE" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-primary transition-colors"
            >
              Licensed under MIT
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
            <span className="px-1">·</span>
            <a 
              href="https://x.com/__Raiders" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-primary transition-colors"
            >
              <Twitter className="h-4 w-4 mr-1" />
              @__Raiders
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground/90 font-medium hover:text-primary transition-colors duration-200 cursor-default select-none">
              Securing internet, one byte at a time
            </span>
            <span className="px-1">·</span>
            <a 
              href="https://github.com/Raiders0786/digibastion" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-primary transition-colors"
            >
              <Github className="h-4 w-4 mr-1" />
              View Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
