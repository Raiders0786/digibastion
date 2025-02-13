
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useSecurityState } from '../hooks/useSecurityState';
import { Navbar } from '../components/Navbar';
import { CategoryHeader } from '../components/category-detail/CategoryHeader';
import { CategoryFilters } from '../components/category-detail/CategoryFilters';
import { CategoryItem } from '../components/category-detail/CategoryItem';

const MessagingDetails = () => {
  const { categoryId } = useParams();
  const { categories, toggleItem } = useSecurityState();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [hideCompleted, setHideCompleted] = useState(false);

  const category = categories.find(c => c.id === categoryId);

  if (!category) {
    return <div>Category not found</div>;
  }

  const completedCount = category.items.filter(item => item.completed).length;

  const filteredItems = category.items.filter(item => {
    if (hideCompleted && item.completed) return false;
    if (filterLevel !== 'all' && item.level !== filterLevel) return false;
    return true;
  });

  const essentialCount = category.items.filter(item => item.level === 'essential').length;
  const recommendedCount = category.items.filter(item => item.level === 'recommended').length;
  const optionalCount = category.items.filter(item => item.level === 'optional').length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
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
                onToggle={() => toggleItem(category.id, item.id)}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-foreground-secondary">
                No items match the current filters
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagingDetails;
