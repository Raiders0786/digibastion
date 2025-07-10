import { NewsCategory, SeverityLevel } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { newsCategoryConfig } from '@/data/newsData';
import { Filter, X } from 'lucide-react';

interface NewsFiltersProps {
  selectedCategories: NewsCategory[];
  selectedSeverities: SeverityLevel[];
  onCategoryToggle: (category: NewsCategory) => void;
  onSeverityToggle: (severity: SeverityLevel) => void;
  onClearFilters: () => void;
}

export const NewsFilters = ({
  selectedCategories,
  selectedSeverities,
  onCategoryToggle,
  onSeverityToggle,
  onClearFilters
}: NewsFiltersProps) => {
  const hasActiveFilters = selectedCategories.length > 0 || selectedSeverities.length > 0;

  const severityLevels: { value: SeverityLevel; label: string; color: string }[] = [
    { value: 'critical', label: 'Critical', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { value: 'high', label: 'High', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    { value: 'low', label: 'Low', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { value: 'info', label: 'Info', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
  ];

  return (
    <Card className="glass-card sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Category Filters */}
        <div>
          <h4 className="text-sm font-medium mb-3">Categories</h4>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(newsCategoryConfig) as NewsCategory[]).map((category) => {
              const isSelected = selectedCategories.includes(category);
              const categoryInfo = newsCategoryConfig[category];
              
              return (
                <Badge
                  key={category}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                  onClick={() => onCategoryToggle(category)}
                >
                  {categoryInfo.name}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Severity Filters */}
        <div>
          <h4 className="text-sm font-medium mb-3">Severity Level</h4>
          <div className="flex flex-wrap gap-2">
            {severityLevels.map((severity) => {
              const isSelected = selectedSeverities.includes(severity.value);
              
              return (
                <Badge
                  key={severity.value}
                  variant="outline"
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : `${severity.color} hover:bg-accent`
                  }`}
                  onClick={() => onSeverityToggle(severity.value)}
                >
                  {severity.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Active Filter Summary */}
        {hasActiveFilters && (
          <div className="pt-3 border-t">
            <div className="text-sm text-muted-foreground">
              Active filters: {selectedCategories.length + selectedSeverities.length}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};