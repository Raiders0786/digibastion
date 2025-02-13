
import { AlertTriangle, Info, Filter } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { SecurityItem } from '../../types/security';

interface CategoryFiltersProps {
  items: SecurityItem[];
  filterLevel: string;
  setFilterLevel: (value: string) => void;
  hideCompleted: boolean;
  setHideCompleted: (value: boolean) => void;
}

export const CategoryFilters = ({
  items,
  filterLevel,
  setFilterLevel,
  hideCompleted,
  setHideCompleted,
}: CategoryFiltersProps) => {
  const essentialCount = items.filter(item => item.level === 'essential').length;
  const recommendedCount = items.filter(item => item.level === 'recommended').length;
  const optionalCount = items.filter(item => item.level === 'optional').length;

  return (
    <div className="bg-card/50 backdrop-blur-sm p-4 sm:p-6 rounded-lg mb-6 border border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Filter Tasks</span>
          </div>
          <Select
            value={filterLevel}
            onValueChange={setFilterLevel}
          >
            <SelectTrigger className="w-full sm:w-[200px] bg-secondary border-white/10">
              <SelectValue placeholder="Filter by Level" />
            </SelectTrigger>
            <SelectContent className="bg-secondary border-white/10">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="essential">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Essential ({essentialCount})
                </div>
              </SelectItem>
              <SelectItem value="recommended">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-yellow-500" />
                  Recommended ({recommendedCount})
                </div>
              </SelectItem>
              <SelectItem value="optional">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Optional ({optionalCount})
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-sm font-medium text-foreground">Hide Completed</span>
          <Switch
            checked={hideCompleted}
            onCheckedChange={setHideCompleted}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge 
          variant="outline" 
          className={`py-1 px-3 ${filterLevel === 'all' ? 'bg-primary/20 border-primary text-primary' : 'hover:bg-primary/10'}`}
          onClick={() => setFilterLevel('all')}
          style={{ cursor: 'pointer' }}
        >
          All ({items.length})
        </Badge>
        <Badge 
          variant="outline" 
          className={`py-1 px-3 ${filterLevel === 'essential' ? 'bg-red-500/20' : ''} text-red-500 border-red-500/20 hover:bg-red-500/10`}
          onClick={() => setFilterLevel('essential')}
          style={{ cursor: 'pointer' }}
        >
          Essential ({essentialCount})
        </Badge>
        <Badge 
          variant="outline" 
          className={`py-1 px-3 ${filterLevel === 'recommended' ? 'bg-yellow-500/20' : ''} text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/10`}
          onClick={() => setFilterLevel('recommended')}
          style={{ cursor: 'pointer' }}
        >
          Recommended ({recommendedCount})
        </Badge>
        <Badge 
          variant="outline" 
          className={`py-1 px-3 ${filterLevel === 'optional' ? 'bg-blue-500/20' : ''} text-blue-500 border-blue-500/20 hover:bg-blue-500/10`}
          onClick={() => setFilterLevel('optional')}
          style={{ cursor: 'pointer' }}
        >
          Optional ({optionalCount})
        </Badge>
      </div>
    </div>
  );
};
