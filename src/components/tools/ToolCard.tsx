
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tool } from '@/data/tools/categories';

interface ToolCardProps {
  tool: Tool;
}

export const ToolCard = ({ tool }: ToolCardProps) => {
  const getImportanceBadgeColor = (importance: string) => {
    switch (importance.toLowerCase()) {
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
    <Card className="group p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 
      hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden cursor-pointer
      before:content-[''] before:absolute before:inset-0 
      before:bg-gradient-to-r before:from-primary/0 before:via-primary/5 before:to-primary/0 
      before:translate-x-[-100%] before:opacity-0 before:transition-all before:duration-500
      hover:before:translate-x-[100%] hover:before:opacity-100">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20">
          <tool.icon className="w-5 h-5 transition-colors duration-300 group-hover:text-primary" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">{tool.name}</h3>
            <Badge 
              variant="outline" 
              className={`${getImportanceBadgeColor(tool.importance)} text-xs`}
            >
              {tool.importance}
            </Badge>
          </div>
          
          <p className="text-sm text-foreground-secondary">{tool.description}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4 transition-all duration-300 group-hover:bg-primary group-hover:text-white"
            onClick={() => window.open(tool.link, '_blank')}
          >
            Visit Tool
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
