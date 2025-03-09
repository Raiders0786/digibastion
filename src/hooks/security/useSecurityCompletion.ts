
import { useState, useEffect, useCallback } from 'react';
import { CompletionState } from '../../types/securityState';
import { SecurityCategory } from '../../types/security';
import { initialSecurityData } from '../../data/securityData';
import { loadCompletionState, saveCompletionState } from '../../utils/storageUtils';

export const useSecurityCompletion = () => {
  const [completionState, setCompletionState] = useState<CompletionState>(() => loadCompletionState());
  const [categories, setCategories] = useState<SecurityCategory[]>(() => initialSecurityData);

  // Apply completion state to categories
  useEffect(() => {
    const updatedCategories = initialSecurityData.map(category => {
      const updatedItems = category.items.map(item => {
        return {
          ...item,
          completed: !!completionState[item.id]
        };
      });
      
      return {
        ...category,
        items: updatedItems
      };
    });
    
    setCategories(updatedCategories);
  }, [completionState]);

  // Save completion state to localStorage
  useEffect(() => {
    saveCompletionState(completionState);
  }, [completionState]);

  // Toggle item completion status
  const toggleItem = useCallback((categoryId: string, itemId: string) => {
    console.log(`Toggling item: ${categoryId} - ${itemId}`);
    
    setCompletionState(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);

  return {
    completionState,
    setCompletionState,
    categories,
    toggleItem
  };
};
