
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

const CategoryDetail = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { categories, toggleItem } = useSecurityState();
  const [showFilters, setShowFilters] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [hideIgnored, setHideIgnored] = useState(true);

  const category = categories.find(c => c.id === categoryId);

  if (!category) {
    return <div>Category not found</div>;
  }

  const completedCount = category.items.filter(item => item.completed).length;
  const ignoredCount = category.items.filter(item => item.ignored).length;
  const progress = Math.round((completedCount / category.items.length) * 100);

  const filteredItems = category.items.filter(item => {
    if (hideCompleted && item.completed) return false;
    if (hideIgnored && item.ignored) return false;
    if (filterLevel !== 'all' && item.level !== filterLevel) return false;
    return true;
  });

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'essential':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
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

          {category.longDescription && (
            <div className="bg-card p-6 rounded-lg mb-6 border border-white/10">
              <p className="text-foreground-secondary">{category.longDescription}</p>
            </div>
          )}

          <div className="mb-6">
            <Progress value={progress} />
            <div className="flex justify-between mt-2 text-sm text-foreground-secondary">
              <span>{completedCount} completed</span>
              <span>{ignoredCount} ignored</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {showFilters && (
            <div className="bg-card p-4 rounded-lg mb-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Level</label>
                <Select
                  value={filterLevel}
                  onValueChange={setFilterLevel}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="essential">Essential</SelectItem>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Hide Completed</label>
                <Switch
                  checked={hideCompleted}
                  onCheckedChange={setHideCompleted}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Hide Ignored</label>
                <Switch
                  checked={hideIgnored}
                  onCheckedChange={setHideIgnored}
                />
              </div>
            </div>
          )}

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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelBadgeClass(item.level)}`}>
                        {item.level}
                      </span>
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
