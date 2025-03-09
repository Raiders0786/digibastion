
import { useState, useEffect, useMemo, useCallback } from 'react';
import { SecurityCategory, SecurityItem, SecurityStats } from '../types/security';
import { initialSecurityData } from '../data/securityData';
import { ThreatLevel } from '../types/threatProfile';
import { getItemsForThreatLevel } from '../data/threatProfiles';
import { toast } from 'sonner';

const STORAGE_KEY = 'security-checklist-state';
const THREAT_LEVEL_KEY = 'security-threat-level';

export const useSecurityState = () => {
  // Load categories from localStorage or use initial data
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

  // Load threat level from localStorage or default to 'all'
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(() => {
    const stored = localStorage.getItem(THREAT_LEVEL_KEY);
    return (stored as ThreatLevel) || 'all';
  });

  // Save categories to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  // Save threat level to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(THREAT_LEVEL_KEY, threatLevel);
    console.log(`Threat level changed to: ${threatLevel}`);
  }, [threatLevel]);

  // Toggle item completion status
  const toggleItem = useCallback((categoryId: string, itemId: string) => {
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
  }, []);

  // Get score for a specific category
  const getCategoryScore = useCallback((category: SecurityCategory) => {
    const total = category.items.length;
    const completed = category.items.filter(item => item.completed).length;
    return Math.round((completed / total) * 100);
  }, []);

  // Get overall security score
  const getOverallScore = useCallback(() => {
    const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const completedItems = categories.reduce(
      (acc, cat) => acc + cat.items.filter(item => item.completed).length,
      0
    );
    return Math.round((completedItems / totalItems) * 100);
  }, [categories]);

  // Get security statistics
  const getStats = useCallback((): SecurityStats => {
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

    const advancedItems = categories.reduce(
      (acc, cat) => acc + cat.items.filter(item => !item.completed && item.level === 'advanced').length,
      0
    );

    const optionalItems = categories.reduce(
      (acc, cat) => acc + cat.items.filter(item => !item.completed && item.level === 'optional').length,
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
  }, [categories]);

  // Get filtered categories based on threat level - memoized for performance
  const getFilteredCategories = useMemo(() => {
    console.log(`Filtering categories for threat level: ${threatLevel}`);
    
    return categories.map(category => {
      // If "all" is selected, return all items
      if (threatLevel === 'all') {
        return category;
      }
      
      // Get the relevant items for the current threat level
      const relevantItemIds = getItemsForThreatLevel(category.id, threatLevel);
      
      // If no mapping found, log warning and return all items
      if (!relevantItemIds.length) {
        console.warn(`No items found for category ${category.id} with threat level ${threatLevel}`);
        return category;
      }
      
      // Filter the items based on the threat level
      const filteredItems = category.items.filter(item => 
        relevantItemIds.includes(item.id)
      );
      
      return {
        ...category,
        items: filteredItems
      };
    });
  }, [categories, threatLevel]);

  return {
    categories: getFilteredCategories,
    originalCategories: categories,
    threatLevel,
    setThreatLevel,
    toggleItem,
    getCategoryScore,
    getOverallScore,
    getStats,
  };
};
