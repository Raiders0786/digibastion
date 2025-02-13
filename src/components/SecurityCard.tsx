
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Smartphone, 
  Share2, 
  Wallet, 
  Laptop, 
  ChevronDown, 
  ChevronUp,
  Key,
  Globe,
  Mail
} from 'lucide-react';
import { SecurityCategory } from '../types/security';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

interface SecurityCardProps {
  category: SecurityCategory;
  score: number;
  onItemToggle: (itemId: string) => void;
}

export const SecurityCard = ({ category, score, onItemToggle }: SecurityCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
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
      default:
        return <Laptop className="w-6 h-6 text-primary" />;
    }
  };

  const handleViewDetails = () => {
    navigate(`/category/${category.id}`);
  };

  return (
    <div 
      id={category.id} 
      className="bg-card rounded-lg p-6 shadow-md transition-all duration-200 hover:shadow-lg animate-fade-in border border-white/10 scroll-mt-24"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-md">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-foreground">{category.title}</h3>
          <p className="text-sm text-foreground-secondary">{category.description}</p>
        </div>
      </div>
      
      <Progress value={score} className="mb-4" />
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground-secondary">
          {t('security.completed_items', {
            completed: category.items.filter(item => item.completed).length,
            total: category.items.length
          })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewDetails}
        >
          {t('security.view_details')}
        </Button>
      </div>
    </div>
  );
};
