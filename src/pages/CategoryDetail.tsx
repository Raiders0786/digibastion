
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
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CategoryDetail = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { categories, toggleItem, threatLevel, isLoading } = useSecurityState();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // Find the category with memoization
  const category = useMemo(() => {
    const foundCategory = categories.find(c => c.id === categoryId);
    setLocalLoading(false);
    return foundCategory;
  }, [categories, categoryId]);
  
  // Reset loading state when threat level changes for visual feedback
  useEffect(() => {
    if (isLoading) {
      setLocalLoading(true);
    }
    
    // If category doesn't exist and we're not loading, redirect to home
    if (!category && !localLoading && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [category, isLoading, threatLevel, navigate, localLoading]);

  // Reset to top of page when threat level changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [threatLevel]);

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

  const filteredItems = category.items.filter(item => {
    if (hideCompleted && item.completed) return false;
    if (filterLevel !== 'all' && item.level !== filterLevel) return false;
    return true;
  });
  
  const handleToggleItem = (itemId: string) => {
    console.log('Toggling item:', itemId);
    toggleItem(category.id, itemId);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title={`${category.title} Security Checklist | Digibastion`}
        description={`Complete security checklist for ${category.title}. ${category.description}`}
        type="website"
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
                <div key={`${item.id}-${threatLevel}`} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
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
