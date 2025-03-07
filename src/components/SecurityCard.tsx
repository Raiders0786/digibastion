
import React from 'react';
import { 
  Shield, 
  Share, 
  Wallet, 
  Monitor, 
  Database, 
  Briefcase, 
  Code, 
  Mail, 
  Smartphone, 
  Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SecurityItem } from '@/types/security';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SecurityCardProps {
  category: string;
  title: string;
  description: string;
  icon?: React.ElementType;
  link: string;
  color?: string;
  total: number;
  completed: number;
}

export const SecurityCard: React.FC<SecurityCardProps> = ({
  category,
  title,
  description,
  icon: Icon = Shield,
  link,
  color = 'from-violet-500 to-indigo-500',
  total,
  completed,
}) => {
  const navigate = useNavigate();
  const isComplete = completed === total && total > 0;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const handleClick = () => {
    navigate(link);
  };

  // Function to determine the icon based on category
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'social':
        return Share;
      case 'wallet':
        return Wallet;
      case 'os':
        return Monitor;
      case 'defi':
        return Database;
      case 'jobs':
        return Briefcase;
      case 'developers':
        return Code;
      case 'email':
        return Mail;
      case 'mobile':
        return Smartphone;
      case 'authentication':
        return Key;
      default:
        return Shield;
    }
  };
  
  // Function to determine if category is Web2 or Web3
  const getCategoryType = (categoryId: string) => {
    // Web3 categories with proper ordering for display
    const web3Categories = ['wallet', 'defi', 'authentication', 'developers', 'os', 'jobs'];
    return web3Categories.includes(categoryId) ? 'Web3' : 'Web2';
  };
  
  // Get the appropriate icon
  const CardIcon = getCategoryIcon(category);
  
  // Determine category type (Web2 or Web3)
  const categoryType = getCategoryType(category);
  
  // Badge color based on category type
  const badgeColor = categoryType === 'Web3' 
    ? 'bg-indigo-700/70 hover:bg-indigo-700/80' 
    : 'bg-blue-600/70 hover:bg-blue-600/80';

  return (
    <Card 
      className="h-full border border-white/10 bg-card/70 backdrop-blur-sm overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
      onClick={handleClick}
    >
      <div className="absolute top-0 right-0 h-20 w-20 -mt-10 -mr-10 bg-gradient-to-br opacity-20 rounded-full group-hover:opacity-40 transition-all duration-300" style={{ background: `linear-gradient(${color})` }}></div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all duration-300">
            <CardIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                {title}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={`${badgeColor} text-xs border-0 px-2 py-0.5 h-5 ml-2 transition-colors duration-300`}
              >
                {categoryType}
              </Badge>
            </div>
            <CardDescription className="text-xs text-foreground-secondary mt-1">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="w-full h-1.5 bg-background rounded-full overflow-hidden mt-3 mb-2">
          <div 
            className="h-full transition-all duration-1000 ease-in-out rounded-full" 
            style={{ 
              width: `${progress}%`, 
              background: `linear-gradient(to right, ${color})` 
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-foreground-secondary">
          <span>{completed} of {total} completed</span>
          <span className="font-medium group-hover:text-primary transition-colors">View Details</span>
        </div>
      </CardContent>
    </Card>
  );
};
