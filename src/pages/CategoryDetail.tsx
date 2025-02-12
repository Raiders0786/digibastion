
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSecurityState } from '../hooks/useSecurityState';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { ArrowLeft, Filter, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from '../components/ui/switch';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';

const CategoryDetail = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { categories, toggleItem } = useSecurityState();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [hideCompleted, setHideCompleted] = useState(false);

  const category = categories.find(c => c.id === categoryId);

  if (!category) {
    return <div>Category not found</div>;
  }

  const completedCount = category.items.filter(item => item.completed).length;
  const progress = Math.round((completedCount / category.items.length) * 100);

  const filteredItems = category.items.filter(item => {
    if (hideCompleted && item.completed) return false;
    if (filterLevel !== 'all' && item.level !== filterLevel) return false;
    return true;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'essential':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'recommended':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'optional':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{category.title}</h1>
              <p className="text-lg text-foreground-secondary">{category.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary mb-1">{completedCount}/{category.items.length}</div>
              <div className="text-sm text-foreground-secondary">Items completed</div>
            </div>
          </div>

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
                All ({category.items.length})
              </Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                Essential ({category.items.filter(item => item.level === 'essential').length})
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                Recommended ({category.items.filter(item => item.level === 'recommended').length})
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                Optional ({category.items.filter(item => item.level === 'optional').length})
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className={`bg-card p-6 rounded-lg border border-white/10 ${
                  item.completed ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleItem(category.id, item.id)}
                      className="h-5 w-5 rounded border-white/20 bg-secondary text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-foreground">{item.title}</h3>
                      <div className="flex items-center gap-1">
                        {getLevelIcon(item.level)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelBadgeClass(item.level)}`}>
                          {item.level}
                        </span>
                      </div>
                    </div>
                    <p className="text-foreground-secondary mb-4">{item.description}</p>
                    {item.details && (
                      <div className="bg-secondary/50 p-4 rounded-md text-sm text-foreground-secondary">
                        {item.details}
                      </div>
                    )}
                    {item.links && item.links.length > 0 && (
                      <div className="mt-4 flex gap-2">
                        {item.links.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            {link.text}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CategoryDetail;
