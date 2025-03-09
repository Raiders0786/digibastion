
import { useMemo } from 'react';
import { SecurityCategory } from '../../types/security';
import { ThreatLevel } from '../../types/threatProfile';
import { CompletionState } from '../../types/securityState';
import { getItemsForThreatLevel } from '../../data/threatProfiles';

export const useCategoryManagement = (
  categories: SecurityCategory[],
  completionState: CompletionState,
  threatLevel: ThreatLevel,
  isLoading: boolean
) => {
  // Get filtered categories based on threat level
  const getFilteredCategories = useMemo(() => {
    // If app is in loading state, return current categories to avoid UI flash
    if (isLoading) return categories;
    
    return categories.map(category => {
      // If "all" is selected, return all items
      if (threatLevel === 'all') {
        return category;
      }
      
      // Get the relevant items for the current threat level
      const relevantItemIds = getItemsForThreatLevel(category.id, threatLevel);
      
      // If no mapping found, return all items
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
  }, [categories, threatLevel, isLoading]);

  return {
    getFilteredCategories
  };
};
