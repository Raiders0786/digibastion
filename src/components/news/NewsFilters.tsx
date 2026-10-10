import { NewsCategory, SeverityLevel } from '@/types/news';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NEWS_CATEGORIES, NEWS_CATEGORY_CONFIG, SEVERITY_LEVELS, SEVERITY_STYLES } from '@/lib/threatIntel/taxonomy';
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

  const severityLevels: { value: SeverityLevel; label: string; color: string }[] = SEVERITY_LEVELS.map((level) => ({
    value: level,
    label: SEVERITY_STYLES[level].label,
    color: SEVERITY_STYLES[level].badgeClass,
  }));

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
            {NEWS_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category);
              const categoryInfo = NEWS_CATEGORY_CONFIG[category];
              
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isSelected}
                  title={categoryInfo.description}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
                  }`}
                  onClick={() => onCategoryToggle(category)}
                >
                  {categoryInfo.name}
                </button>
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
                <button
                  key={severity.value}
                  type="button"
                  aria-pressed={isSelected}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : `${severity.color} hover:bg-accent`
                  }`}
                  onClick={() => onSeverityToggle(severity.value)}
                >
                  {severity.label}
                </button>
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
