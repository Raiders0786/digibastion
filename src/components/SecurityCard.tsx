
import { Smartphone, Share2, Wallet, Laptop } from 'lucide-react';
import { SecurityCategory } from '../types/security';
import { Progress } from './ui/progress';

interface SecurityCardProps {
  category: SecurityCategory;
  score: number;
  onItemToggle: (itemId: string) => void;
}

export const SecurityCard = ({ category, score, onItemToggle }: SecurityCardProps) => {
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
      default:
        return <Laptop className="w-6 h-6 text-primary" />;
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-md transition-all duration-200 hover:shadow-lg animate-fade-in border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-md">
          {getIcon()}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground">{category.title}</h3>
          <p className="text-sm text-foreground-secondary">{category.description}</p>
        </div>
      </div>
      
      <Progress value={score} className="mb-4" />
      
      <div className="space-y-3">
        {category.items.map(item => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-md hover:bg-secondary/50 transition-colors"
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => onItemToggle(item.id)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-secondary text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-sm text-foreground">{item.title}</p>
              <p className="text-sm text-foreground-secondary">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
