
import { Separator } from '@/components/ui/separator';
import { ToolCategory } from '@/data/tools/categories';
import { ToolCard } from './ToolCard';

interface CategorySectionProps {
  category: ToolCategory;
  isLast: boolean;
}

export const CategorySection = ({ category, isLast }: CategorySectionProps) => {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{category.title}</h2>
        <p className="text-foreground-secondary">{category.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {category.tools.map((tool, index) => (
          <ToolCard key={index} tool={tool} />
        ))}
      </div>
      
      {!isLast && <Separator className="my-8" />}
    </section>
  );
};
