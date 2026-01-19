
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useSecurityState } from '../hooks/useSecurityState';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CategoryHeader } from '../components/category-detail/CategoryHeader';
import { CategoryFilters } from '../components/category-detail/CategoryFilters';
import { CategoryItem } from '../components/category-detail/CategoryItem';
import { ThreatLevelSelector } from '../components/ThreatLevelSelector';
import { MetaTags } from '../components/MetaTags';
import { Loader2, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const CategoryDetail = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { categories, toggleItem, threatLevel, isLoading, getCategoryScore, changeCount } = useSecurityState();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // Find the category with memoization, adding changeCount to dependencies
  const category = useMemo(() => {
    const foundCategory = categories.find(c => c.id === categoryId);
    setLocalLoading(false);
    return foundCategory;
  }, [categories, categoryId, changeCount]);
  
  // Reset loading state when threat level changes for visual feedback
  useEffect(() => {
    if (isLoading) {
      setLocalLoading(true);
    }
    
    // If category doesn't exist and we're not loading, redirect to home
    if (!category && !localLoading && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [category, isLoading, threatLevel, navigate, localLoading, changeCount]);

  // Reset to top of page when threat level changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [changeCount]); // Use changeCount instead of threatLevel

  if (isLoading || localLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-foreground-secondary">Loading security items...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold">Category Not Found</h2>
          <p className="mt-2 text-foreground-secondary">The requested category does not exist.</p>
          <Button
            variant="ghost"
            className="mt-6"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const completedCount = category.items.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedCount / category.items.length) * 100) || 0;
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredItems = category.items.filter(item => {
    if (hideCompleted && item.completed) return false;
    if (filterLevel !== 'all' && item.level !== filterLevel) return false;
    return true;
  });
  
  const handleToggleItem = (itemId: string) => {
    console.log('Toggling item:', itemId);
    toggleItem(category.id, itemId);
  };

  const essentialItems = category.items.filter(item => item.level === 'essential');
  const essentialCompleted = essentialItems.filter(item => item.completed).length;
  const hasIncompleteEssential = essentialItems.some(item => !item.completed);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title={`${category.title} Security Checklist — Best Practices & Tips | Digibastion`}
        description={`Complete ${category.title.toLowerCase()} security checklist with ${category.items.length} actionable items. ${category.description} Track your progress and improve your crypto security.`}
        keywords={`${category.title.toLowerCase()} security, ${category.title.toLowerCase()} checklist, crypto ${category.title.toLowerCase()}, web3 ${category.title.toLowerCase()} security, ${category.title.toLowerCase()} best practices`}
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <CategoryHeader
            title={category.title}
            description={category.description}
            completedCount={completedCount}
            totalItems={category.items.length}
          />

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-foreground-secondary">Completion</span>
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </div>
            <Progress 
              value={completionPercentage} 
              className={`h-2 ${getProgressColor(completionPercentage)}`} 
            />
          </div>

          {/* Essential items alert */}
          {hasIncompleteEssential && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-500 mb-1">Essential Items Incomplete</h3>
                <p className="text-sm text-foreground-secondary">
                  {essentialCompleted} of {essentialItems.length} essential security items completed. 
                  These items are critical for your security.
                </p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <ThreatLevelSelector />
          </div>

          <CategoryFilters
            items={category.items}
            filterLevel={filterLevel}
            setFilterLevel={setFilterLevel}
            hideCompleted={hideCompleted}
            setHideCompleted={setHideCompleted}
          />
          
          {category.longDescription && (
            <div className="bg-primary/5 p-4 rounded-lg mb-6 border border-primary/10">
              <p className="text-sm text-foreground-secondary">{category.longDescription}</p>
            </div>
          )}

          <div className="space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div key={`${item.id}-${threatLevel}-${changeCount}`} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <CategoryItem
                    item={item}
                    onToggle={() => handleToggleItem(item.id)}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-foreground-secondary animate-fade-in">
                No items match the current filters
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryDetail;
