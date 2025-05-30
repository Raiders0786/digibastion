
import { AlertTriangle, Info, Zap, Shield, Code, EyeOff, Disc3, Building } from 'lucide-react';
import { SecurityItem } from '../../types/security';
import { Badge } from '../ui/badge';
import { ThreatLevel } from '../../types/threatProfile';

interface CategoryItemProps {
  item: SecurityItem;
  onToggle: () => void;
}

export const CategoryItem = ({ item, onToggle }: CategoryItemProps) => {
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'essential':
        return <AlertTriangle className="w-4 h-4 text-red-500" aria-label="Essential" />;
      case 'recommended':
        return <Info className="w-4 h-4 text-yellow-500" aria-label="Recommended" />;
      case 'optional':
        return <Info className="w-4 h-4 text-blue-500" aria-label="Optional" />;
      case 'advanced':
        return <Zap className="w-4 h-4 text-purple-500" aria-label="Advanced" />;
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
      case 'advanced':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getThreatLevelIcon = (level: ThreatLevel) => {
    switch (level) {
      case 'basic':
        return <Shield className="w-3 h-3 text-blue-400" aria-label="Basic" />;
      case 'developer':
        return <Code className="w-3 h-3 text-purple-400" aria-label="Developer" />;
      case 'privacy':
        return <EyeOff className="w-3 h-3 text-green-400" aria-label="Privacy" />;
      case 'highValue':
        return <Disc3 className="w-3 h-3 text-amber-400" aria-label="High Value" />;
      case 'institution':
        return <Building className="w-3 h-3 text-red-400" aria-label="Institution" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`group bg-card p-4 rounded-lg border border-white/10 
        transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 
        hover:scale-[1.01] hover:-translate-y-0.5 hover:bg-card/80
        relative overflow-hidden cursor-pointer
        before:content-[''] before:absolute before:inset-0 
        before:bg-gradient-to-r before:from-primary/0 before:via-primary/5 before:to-primary/0 
        before:translate-x-[-100%] before:opacity-0 before:transition-all before:duration-500
        hover:before:translate-x-[100%] hover:before:opacity-100
        ${item.completed ? 'bg-primary/5' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <input
            type="checkbox"
            checked={item.completed}
            onChange={onToggle}
            className="h-4 w-4 rounded border-white/20 bg-secondary text-primary focus:ring-primary
              transition-all duration-300 group-hover:border-primary/50"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-base font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
              {item.title}
            </h3>
            <div className="flex items-center gap-2">
              {getLevelIcon(item.level)}
              <Badge 
                variant="outline" 
                className={`${getLevelBadgeClass(item.level)} capitalize text-xs transition-all duration-300
                  group-hover:shadow-sm group-hover:shadow-primary/10`}
              >
                {item.level}
              </Badge>
            </div>
            
            {item.threatLevels && item.threatLevels.length > 0 && (
              <div className="flex ml-auto gap-1">
                {item.threatLevels.map((level) => (
                  <div key={level} className="tooltip" data-tip={level}>
                    {getThreatLevelIcon(level)}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <p className="text-sm text-foreground-secondary transition-colors duration-300 group-hover:text-foreground-secondary/90">
              {item.details}
            </p>
            {item.links && item.links.length > 0 && (
              <div className="flex gap-2 mt-2">
                {item.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs transition-all duration-300
                      hover:text-primary-hover"
                  >
                    {link.text}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
