
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
    <Card className="p-6 hover:shadow-lg transition-shadow relative overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <tool.icon className="w-5 h-5" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground">{tool.name}</h3>
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
            className="w-full mt-4"
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
