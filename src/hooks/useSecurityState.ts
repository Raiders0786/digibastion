import { useState, useEffect } from 'react';
import { SecurityCategory, SecurityItem, SecurityStats } from '../types/security';
import { initialSecurityData } from '../data/securityData';

const STORAGE_KEY = 'security-checklist-state';

export const useSecurityState = () => {
  const [categories, setCategories] = useState<SecurityCategory[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      const storedCategories = JSON.parse(stored) as SecurityCategory[];
      
      return initialSecurityData.map(initialCategory => {
        const storedCategory = storedCategories.find(c => c.id === initialCategory.id);
        
        if (!storedCategory) return initialCategory;
        
        const mergedItems = initialCategory.items.map(initialItem => {
          const storedItem = storedCategory.items.find(i => i.id === initialItem.id);
          return storedItem ? { ...initialItem, completed: storedItem.completed } : initialItem;
        });
        
        return {
          ...initialCategory,
          items: mergedItems
        };
      });
    }
    
    return initialSecurityData;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  const toggleItem = (categoryId: string, itemId: string) => {
    console.log(`Toggling item: ${categoryId} - ${itemId}`);
    setCategories(prev =>
      prev.map(category =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map(item =>
                item.id === itemId
                  ? { ...item, completed: !item.completed }
                  : item
              ),
            }
          : category
      )
    );
  };

  const getCategoryScore = (category: SecurityCategory) => {
    const total = category.items.length;
    const completed = category.items.filter(item => item.completed).length;
    return Math.round((completed / total) * 100);
  };

  const getOverallScore = () => {
    const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const completedItems = categories.reduce(
      (acc, cat) => acc + cat.items.filter(item => item.completed).length,
      0
    );
    return Math.round((completedItems / totalItems) * 100);
  };

  const getStats = (): SecurityStats => {
    const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const completedItems = categories.reduce(
      (acc, cat) => acc + cat.items.filter(item => item.completed).length,
      0
    );

    const essentialItems = categories.reduce(
      (acc, cat) => acc + cat.items.filter(item => !item.completed && item.level === 'essential').length,
      0
    );
    
    const recommendedItems = categories.reduce(
      (acc, cat) => acc + cat.items.filter(item => !item.completed && item.level === 'recommended').length,
      0
    );

    return {
      total: totalItems,
      completed: completedItems,
      essential: Math.round((completedItems / totalItems) * 100),
      optional: Math.round((completedItems / (totalItems * 2)) * 100),
      advanced: Math.round((completedItems / (totalItems * 3)) * 100),
      criticalRemaining: essentialItems,
      recommendedRemaining: recommendedItems
    };
  };

  return {
    categories,
    toggleItem,
    getCategoryScore,
    getOverallScore,
    getStats,
  };
};
