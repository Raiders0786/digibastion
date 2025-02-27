
import { Shield, Clock, Share2, Copy, Mail, Twitter } from 'lucide-react';
import { handleShare } from '@/utils/share';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ArticleHeaderProps {
  title: string;
  category: string;
  readTime: string;
}

export const ArticleHeader = ({ title, category, readTime }: ArticleHeaderProps) => {
  const currentUrl = window.location.href;
  
  const handleTwitterShare = () => {
    // Create a more descriptive tweet for article sharing
    const tweetText = `${title} - A ${category} guide from Digibastion`;
    handleShare('twitter', currentUrl, tweetText);
  };
  
  const handleCopyLink = () => {
    handleShare('copy', currentUrl, title);
  };
  
  const handleEmailShare = () => {
    handleShare('email', currentUrl, `${title} - ${category} guide from Digibastion`);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-primary">{category}</span>
      </div>
      
      <h1 className="text-4xl font-bold mb-4 text-foreground/90">{title}</h1>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          <Clock className="w-4 h-4" />
          <span>{readTime}</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover">
              <Share2 className="w-4 h-4" />
              Share Article
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleTwitterShare}>
              <Twitter className="w-4 h-4 mr-2" />
              Share on Twitter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEmailShare}>
              <Mail className="w-4 h-4 mr-2" />
              Share via Email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
