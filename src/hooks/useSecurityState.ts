
import { useState, useEffect } from 'react';
import { SecurityCategory, SecurityItem, SecurityStats } from '../types/security';
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

  const getStats = (): SecurityStats => {
    const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const completedItems = categories.reduce(
      (acc, cat) => acc + cat.items.filter(item => item.completed).length,
      0
    );

    const essentialItems = categories.reduce(
      (acc, cat) => acc + cat.items.filter(item => !item.completed).length,
      0
    );

    const criticalTasks = Math.floor(essentialItems * 0.3); // 30% of incomplete items are critical
    const recommendedTasks = essentialItems - criticalTasks;

    return {
      total: totalItems,
      completed: completedItems,
      essential: Math.round((completedItems / totalItems) * 100),
      optional: Math.round((completedItems / (totalItems * 2)) * 100),
      advanced: Math.round((completedItems / (totalItems * 3)) * 100),
      criticalRemaining: criticalTasks,
      recommendedRemaining: recommendedTasks
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
