
import { AlertTriangle, Info } from 'lucide-react';
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
  return (
    <div className="bg-card p-6 rounded-lg mb-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Select
            value={filterLevel}
            onValueChange={setFilterLevel}
          >
            <SelectTrigger className="w-[200px] bg-secondary">
              <SelectValue placeholder="Filter by Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="essential">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Essential
                </div>
              </SelectItem>
              <SelectItem value="recommended">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-yellow-500" />
                  Recommended
                </div>
              </SelectItem>
              <SelectItem value="optional">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Optional
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground-secondary">Hide Completed</span>
          <Switch
            checked={hideCompleted}
            onCheckedChange={setHideCompleted}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Badge variant="outline" className={`${filterLevel === 'all' ? 'bg-primary/10' : ''}`}>
          All ({items.length})
        </Badge>
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          Essential ({items.filter(item => item.level === 'essential').length})
        </Badge>
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          Recommended ({items.filter(item => item.level === 'recommended').length})
        </Badge>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          Optional ({items.filter(item => item.level === 'optional').length})
        </Badge>
      </div>
    </div>
  );
};
