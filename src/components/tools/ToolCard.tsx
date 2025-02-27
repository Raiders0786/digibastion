
import { Tool } from '@/data/tools/categories';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ToolCardProps {
  tool: Tool;
}

export const ToolCard = ({ tool }: ToolCardProps) => {
  const getBadgeVariant = (importance: string) => {
    switch (importance) {
      case 'Essential':
        return 'default';
      case 'Recommended':
        return 'secondary';
      case 'Optional':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card 
      className="bg-card/50 p-5 border border-white/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group hover:scale-[1.02]"
      onClick={() => window.open(tool.link, '_blank')}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-all duration-300">
          <tool.icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-medium group-hover:text-primary transition-colors">
          {tool.name}
        </h3>
        <div className="ml-auto">
          <Badge variant={getBadgeVariant(tool.importance)} className="text-xs">
            {tool.importance}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-foreground-secondary">{tool.description}</p>
      <div className="mt-4 text-xs text-foreground-secondary truncate hover:text-primary transition-colors">
        {tool.link}
      </div>
    </Card>
  );
};
