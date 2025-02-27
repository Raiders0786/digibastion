
import { ToolCategory } from '@/data/tools/categories';
import { ToolCard } from './ToolCard';
import { Separator } from '@/components/ui/separator';

interface CategorySectionProps {
  category: ToolCategory;
  isLast?: boolean;
}

export const CategorySection = ({ category, isLast = false }: CategorySectionProps) => {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-foreground group relative inline-block">
          <span className="relative z-10">{category.title}</span>
          <span className="absolute bottom-0 left-0 w-full h-[6px] bg-primary/20 rounded -z-10 group-hover:h-[10px] transition-all duration-300"></span>
        </h2>
        <p className="text-foreground-secondary">{category.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.tools.map((tool, index) => (
          <div key={tool.name} className="transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>
            <ToolCard tool={tool} />
          </div>
        ))}
      </div>
      
      {!isLast && <Separator className="my-12 border-white/10" />}
    </div>
  );
};
