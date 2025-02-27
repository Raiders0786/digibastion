
import React from 'react';
import { Shield, AlertCircle, Check, CheckCircle2 } from 'lucide-react';
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

  return (
    <Card 
      className="h-full border border-white/10 bg-card/70 backdrop-blur-sm overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
      onClick={handleClick}
    >
      <div className="absolute top-0 right-0 h-20 w-20 -mt-10 -mr-10 bg-gradient-to-br opacity-20 rounded-full group-hover:opacity-40 transition-all duration-300" style={{ background: `linear-gradient(${color})` }}></div>
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-opacity-10 group-hover:scale-110 transition-all duration-300" style={{ background: `linear-gradient(to bottom right, ${color})`, opacity: 0.2 }}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          {isComplete && (
            <div className="ml-auto">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
                <Check className="w-3 h-3 text-green-500" />
              </div>
            </div>
          )}
        </div>
        <CardDescription className="text-xs text-foreground-secondary mt-1">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-1000 ease-in-out rounded-full" 
            style={{ 
              width: `${progress}%`, 
              background: `linear-gradient(to right, ${color})` 
            }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-foreground-secondary">
          <span>{completed} of {total} completed</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </CardContent>
    </Card>
  );
};
