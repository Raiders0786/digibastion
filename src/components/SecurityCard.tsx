
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Share2, 
  Wallet, 
  Laptop, 
  ChevronDown, 
  ChevronUp,
  Key,
  Globe,
  Mail,
  Wallet2,
  Code,
  Briefcase
} from 'lucide-react';
import { SecurityCategory } from '../types/security';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface SecurityCardProps {
  category: SecurityCategory;
  score: number;
  onItemToggle: (itemId: string) => void;
}

const WEB2_CATEGORIES = ['authentication', 'browsing', 'email', 'mobile', 'social'];

export const SecurityCard = ({ category, score, onItemToggle }: SecurityCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  
  const getIcon = () => {
    switch (category.icon) {
      case 'smartphone':
        return <Smartphone className="w-6 h-6 text-primary" />;
      case 'share-2':
        return <Share2 className="w-6 h-6 text-primary" />;
      case 'wallet':
        return <Wallet className="w-6 h-6 text-primary" />;
      case 'laptop':
        return <Laptop className="w-6 h-6 text-primary" />;
      case 'key':
        return <Key className="w-6 h-6 text-primary" />;
      case 'globe':
        return <Globe className="w-6 h-6 text-primary" />;
      case 'mail':
        return <Mail className="w-6 h-6 text-primary" />;
      case 'wallet-2':
        return <Wallet2 className="w-6 h-6 text-primary" />;
      case 'code':
        return <Code className="w-6 h-6 text-primary" />;
      case 'briefcase':
        return <Briefcase className="w-6 h-6 text-primary" />;
      default:
        return <Laptop className="w-6 h-6 text-primary" />;
    }
  };

  const handleViewDetails = () => {
    navigate(`/category/${category.id}`);
  };

  const isWeb2 = WEB2_CATEGORIES.includes(category.id);

  return (
    <div 
      id={category.id} 
      className="group bg-card rounded-lg p-6 shadow-md transition-all duration-300 
        hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02] hover:-translate-y-1
        hover:bg-card/80 animate-fade-in border border-white/10 scroll-mt-24
        cursor-pointer relative overflow-hidden
        before:content-[''] before:absolute before:inset-0 
        before:bg-gradient-to-r before:from-primary/0 before:via-primary/5 before:to-primary/0 
        before:translate-x-[-100%] before:opacity-0 before:transition-all before:duration-500
        hover:before:translate-x-[100%] hover:before:opacity-100"
      onClick={handleViewDetails}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-md transition-all duration-300 group-hover:bg-primary/20">
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg text-foreground transition-all duration-300 group-hover:text-primary">
              {category.title}
            </h3>
            <Badge 
              variant="outline" 
              className={`${
                isWeb2 
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' 
                  : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400'
              } text-xs`}
            >
              {isWeb2 ? 'Web2' : 'Web3'}
            </Badge>
          </div>
          <p className="text-sm text-foreground-secondary mb-4">{category.description}</p>
        </div>
      </div>
      
      <Progress value={score} className="mb-4" />
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground-secondary">
          {category.items.filter(item => item.completed).length} of {category.items.length} completed
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="transition-all duration-300 group-hover:bg-primary group-hover:text-white"
        >
          View Details
        </Button>
      </div>
    </div>
  );
};
