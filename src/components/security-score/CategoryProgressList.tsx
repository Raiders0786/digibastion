
import { ThreatLevel } from '../../types/threatProfile';
import { CategoryIcon } from './CategoryIcon';

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  priority: string;
}

interface CategoryProgressListProps {
  categories: CategoryData[];
  threatLevel: ThreatLevel;
  getValidCategoryProgress: (categoryId: string) => number;
  getProgressColor: (progress: number) => string;
  bgColor: string;
}

export const CategoryProgressList = ({
  categories,
  threatLevel,
  getValidCategoryProgress,
  getProgressColor,
  bgColor
}: CategoryProgressListProps) => {
  return (
    <div className="grid gap-3 pr-2">
      {categories.map((category) => {
        const progress = getValidCategoryProgress(category.id);
        return (
          <div key={`${category.id}-${threatLevel}`} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center`}>
              <CategoryIcon iconName={category.icon} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{category.name}</span>
                <span className="text-xs text-foreground-secondary">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
