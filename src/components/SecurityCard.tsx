import { useState } from 'react';
import { Smartphone, Share2, Wallet, Laptop, ChevronDown, ChevronUp } from 'lucide-react';
import { SecurityCategory } from '../types/security';
import { Progress } from './ui/progress';

interface SecurityCardProps {
  category: SecurityCategory;
  score: number;
  onItemToggle: (itemId: string) => void;
}

export const SecurityCard = ({ category, score, onItemToggle }: SecurityCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(category.items.length / itemsPerPage);
  
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

  const visibleItems = isExpanded 
    ? category.items.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : category.items.slice(0, 3);

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
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-secondary/50 rounded-full transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-foreground-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-foreground-secondary" />
          )}
        </button>
      </div>
      
      <Progress value={score} className="mb-4" />
      
      <div className="space-y-3">
        {visibleItems.map(item => (
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

      {isExpanded && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-md hover:bg-secondary/50 disabled:opacity-50 text-sm text-foreground-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-foreground-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-md hover:bg-secondary/50 disabled:opacity-50 text-sm text-foreground-secondary"
          >
            Next
          </button>
        </div>
      )}

      {!isExpanded && category.items.length > 3 && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full mt-4 pt-4 border-t border-white/10 text-sm text-foreground-secondary hover:text-foreground transition-colors"
        >
          Show {category.items.length - 3} more items
        </button>
      )}
    </div>
  );
};
