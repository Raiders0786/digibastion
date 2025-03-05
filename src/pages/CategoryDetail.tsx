
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSecurityState } from '../hooks/useSecurityState';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CategoryHeader } from '../components/category-detail/CategoryHeader';
import { CategoryFilters } from '../components/category-detail/CategoryFilters';
import { CategoryItem } from '../components/category-detail/CategoryItem';
import { MetaTags } from '../components/MetaTags';
import { loadSecurityChecklist } from '../data/checklist-loader';
import { SecurityCategory } from '../types/security';
import { useToast } from "../hooks/use-toast";

const CategoryDetail = () => {
  const { categoryId } = useParams<{categoryId?: string}>();
  const { categories, toggleItem } = useSecurityState();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [category, setCategory] = useState<SecurityCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) {
        setError('Category not found');
        setLoading(false);
        return;
      }

      try {
        console.log(`Loading category: ${categoryId}`);
        const loadedCategory = await loadSecurityChecklist(categoryId);
        
        if (!loadedCategory) {
          throw new Error(`Failed to load category ${categoryId}`);
        }
        
        // Find the category from global state to sync completion status
        const globalCategory = categories.find(c => c.id === categoryId);
        
        if (globalCategory) {
          // Map completion status from global state to loaded category
          loadedCategory.items = loadedCategory.items.map(item => {
            const globalItem = globalCategory.items.find(gi => gi.id === item.id);
            return {
              ...item,
              completed: globalItem ? globalItem.completed : false
            };
          });
        }
        
        setCategory(loadedCategory);
        setError(null);
        console.log(`Successfully loaded category ${categoryId} with ${loadedCategory.items.length} items`);
      } catch (err) {
        console.error('Error loading category:', err);
        setError('Failed to load category');
        toast({
          title: "Error",
          description: "Failed to load category. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchCategory();
  }, [categoryId, categories, toast]);

  // Create a handler that correctly updates both local and global state
  const handleToggleItem = (itemId: string) => {
    if (!category) return;
    
    // Update global state
    toggleItem(category.id, itemId);
    
    // Update local state immediately for UI response
    setCategory(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-xl">Loading category...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Category Not Found</h2>
            <p>{error || 'The requested category could not be found.'}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate completed count from the category data
  const completedCount = category.items.filter(item => item.completed).length;

  const filteredItems = category.items.filter(item => {
    if (hideCompleted && item.completed) return false;
    if (filterLevel !== 'all' && item.level !== filterLevel) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title={`${category.title} Security Checklist | Digibastion`}
        description={`Complete security checklist for ${category.title}. ${category.description}`}
        type="website"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <CategoryHeader
            title={category.title}
            description={category.description}
            completedCount={completedCount}
            totalItems={category.items.length}
          />

          <CategoryFilters
            items={category.items}
            filterLevel={filterLevel}
            setFilterLevel={setFilterLevel}
            hideCompleted={hideCompleted}
            setHideCompleted={setHideCompleted}
          />

          <div className="space-y-4">
            {filteredItems.map(item => (
              <CategoryItem
                key={item.id}
                item={item}
                onToggle={() => handleToggleItem(item.id)}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
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
