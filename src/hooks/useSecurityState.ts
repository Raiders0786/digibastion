
import { useState, useEffect } from 'react';
import { SecurityCategory, SecurityItem } from '../types/security';
import { initialSecurityData } from '../data/securityData';

const STORAGE_KEY = 'security-checklist-state';

export const useSecurityState = () => {
  const [categories, setCategories] = useState<SecurityCategory[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialSecurityData;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  const toggleItem = (categoryId: string, itemId: string) => {
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

  return {
    categories,
    toggleItem,
    getCategoryScore,
    getOverallScore,
  };
};
