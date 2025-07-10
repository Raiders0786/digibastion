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
  Key,
  Globe
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
      case 'browsing':
        return Globe;
      default:
        return Shield;
    }
  };
  
  const getCategoryType = (categoryId: string) => {
    const web2Categories = ['email', 'social', 'browsing', 'mobile'];
    
    return web2Categories.includes(categoryId) ? 'Web2' : 'Web3';
  };
  
  const CardIcon = getCategoryIcon(category);
  
  const categoryType = getCategoryType(category);
  
  const badgeColor = categoryType === 'Web3' 
    ? 'bg-indigo-700/70 hover:bg-indigo-700/80' 
    : 'bg-blue-600/70 hover:bg-blue-600/80';

  return (
    <Card 
      className="h-full feature-card cursor-pointer group relative overflow-hidden"
      onClick={handleClick}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 h-24 w-24 -mt-12 -mr-12 bg-gradient-to-br from-primary/20 to-primary-glow/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300 group-hover:scale-110">
            <CardIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300 truncate">
                {title}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={`${badgeColor} text-xs border-0 px-3 py-1 font-medium text-white transition-colors duration-300 flex-shrink-0 ml-3`}
              >
                {categoryType}
              </Badge>
            </div>
            <CardDescription className="text-sm text-foreground-secondary leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-6 relative z-10">
        {/* Enhanced Progress Bar */}
        <div className="space-y-3">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-1000 ease-out rounded-full bg-gradient-to-r from-primary to-primary-glow shadow-sm" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {completed} / {total}
              </span>
              <span className="text-xs text-foreground-secondary">
                completed
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <span className="text-sm font-medium">Explore</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Completion Status */}
          {isComplete && (
            <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Complete</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </Card>
  );
};
