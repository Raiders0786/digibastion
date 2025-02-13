
import { AlertTriangle, Info } from 'lucide-react';
import { SecurityItem } from '../../types/security';
import { Badge } from '../ui/badge';

interface CategoryItemProps {
  item: SecurityItem;
  onToggle: () => void;
}

export const CategoryItem = ({ item, onToggle }: CategoryItemProps) => {
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'essential':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'recommended':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'optional':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'essential':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'recommended':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'optional':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className={`bg-card p-6 rounded-lg border border-white/10 ${
      item.completed ? 'bg-primary/5' : ''
    }`}>
      <div className="flex items-start gap-4">
        <div className="pt-1">
          <input
            type="checkbox"
            checked={item.completed}
            onChange={onToggle}
            className="h-5 w-5 rounded border-white/20 bg-secondary text-primary focus:ring-primary"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-medium text-foreground">{item.title}</h3>
            <div className="flex items-center gap-2">
              {getLevelIcon(item.level)}
              <Badge 
                variant="outline" 
                className={`${getLevelBadgeClass(item.level)} capitalize`}
              >
                {item.level}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-foreground-secondary">{item.description}</p>
            
            {item.details && (
              <div className="bg-secondary/50 p-4 rounded-md space-y-2">
                <p className="text-sm text-foreground-secondary">{item.details}</p>
                {item.links && item.links.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {item.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        {link.text}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
