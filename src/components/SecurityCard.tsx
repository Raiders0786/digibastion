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
  Globe,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
} from '@/components/ui/card';

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
  link,
  total,
  completed,
}) => {
  const navigate = useNavigate();
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const handleClick = () => {
    navigate(link);
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'social': return Share;
      case 'wallet': return Wallet;
      case 'os': return Monitor;
      case 'defi': return Database;
      case 'jobs': return Briefcase;
      case 'developers': return Code;
      case 'email': return Mail;
      case 'mobile': return Smartphone;
      case 'authentication': return Key;
      case 'browsing': return Globe;
      case 'opsec': return ShieldAlert;
      default: return Shield;
    }
  };
  
  const getCategoryType = (categoryId: string) => {
    const web2Categories = ['email', 'social', 'browsing', 'mobile'];
    return web2Categories.includes(categoryId) ? 'Web2' : 'Web3';
  };
  
  const CardIcon = getCategoryIcon(category);
  const categoryType = getCategoryType(category);

  return (
    <Card 
      className="group relative h-full glass-card-hover cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center
            group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
            <CardIcon className="w-5 h-5 text-primary" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {title}
              </h3>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide
                ${categoryType === 'Web3' 
                  ? 'bg-primary/15 text-primary border border-primary/20' 
                  : 'bg-accent/15 text-accent border border-accent/20'
                }`}>
                {categoryType}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 relative">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{completed}</span>
              <span className="mx-1">/</span>
              <span>{total} completed</span>
            </span>
            
            <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
