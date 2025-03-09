
import { useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useSecurityState } from '../hooks/useSecurityState';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CategoryHeader } from '../components/category-detail/CategoryHeader';
import { CategoryFilters } from '../components/category-detail/CategoryFilters';
import { CategoryItem } from '../components/category-detail/CategoryItem';
import { ThreatLevelSelector } from '../components/ThreatLevelSelector';
import { MetaTags } from '../components/MetaTags';
import { Loader2 } from 'lucide-react';

const CategoryDetail = () => {
  const { categoryId } = useParams();
  const { categories, toggleItem, threatLevel } = useSecurityState();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Find the category with memoization
  const category = useMemo(() => {
    const foundCategory = categories.find(c => c.id === categoryId);
    setIsLoading(false);
    return foundCategory;
  }, [categories, categoryId]);
  
  // Reset loading state when threat level changes for visual feedback
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500); // Brief loading period for visual feedback
    return () => clearTimeout(timer);
  }, [threatLevel]);

  // Reset to top of page when threat level changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [threatLevel]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-foreground-secondary">Loading security items...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Category Not Found</h2>
        <p className="mt-2 text-foreground-secondary">The requested category does not exist.</p>
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
            {filteredItems.map((item, index) => (
              <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <CategoryItem
                  item={item}
                  onToggle={() => handleToggleItem(item.id)}
                />
              </div>
            ))}
            {filteredItems.length === 0 && (
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
