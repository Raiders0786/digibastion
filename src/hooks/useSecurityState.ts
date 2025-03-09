import { useState, useEffect, useMemo, useCallback } from 'react';
import { SecurityCategory, SecurityItem, SecurityStats } from '../types/security';
import { initialSecurityData } from '../data/securityData';
import { ThreatLevel } from '../types/threatProfile';
import { getItemsForThreatLevel } from '../data/threatProfiles';
import { toast } from 'sonner';

// Keys for localStorage
const STORAGE_KEY = 'security-checklist-state';
const THREAT_LEVEL_KEY = 'security-threat-level';
const COMPLETION_KEY = 'security-completion-state';

// Interface for storing completion state per threat profile
interface CompletionState {
  [threatLevel: string]: {
    [itemId: string]: boolean;
  }
}

export const useSecurityState = () => {
  // Load threat level from localStorage or default to 'all'
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(() => {
    const stored = localStorage.getItem(THREAT_LEVEL_KEY);
    return (stored as ThreatLevel) || 'all';
  });

  // Load categories from localStorage or use initial data
  const [categories, setCategories] = useState<SecurityCategory[]>(() => {
    return initialSecurityData;
  });

  // Load completion state (per threat profile)
  const [completionState, setCompletionState] = useState<CompletionState>(() => {
    const stored = localStorage.getItem(COMPLETION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with empty completion state for each threat level
    const initialState: CompletionState = {
      'all': {},
      'basic': {},
      'developer': {},
      'privacy': {},
      'highValue': {},
      'institution': {}
    };
    return initialState;
  });

  // Effect to apply completion state to categories
  useEffect(() => {
    // Map categories with completion state for current threat level
    const updatedCategories = initialSecurityData.map(category => {
      const updatedItems = category.items.map(item => {
        const isCompleted = completionState[threatLevel]?.[item.id] || false;
        return {
          ...item,
          completed: isCompleted
        };
      });
      
      return {
        ...category,
        items: updatedItems
      };
    });
    
    setCategories(updatedCategories);
  }, [completionState, threatLevel]);

  // Save threat level to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(THREAT_LEVEL_KEY, threatLevel);
    console.log(`Threat level changed to: ${threatLevel}`);
  }, [threatLevel]);

  // Save completion state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(COMPLETION_KEY, JSON.stringify(completionState));
  }, [completionState]);

  // Toggle item completion status
  const toggleItem = useCallback((categoryId: string, itemId: string) => {
    console.log(`Toggling item: ${categoryId} - ${itemId}`);
    
    // Update completion state for current threat level
    setCompletionState(prev => {
      const currentState = prev[threatLevel] || {};
      const newState = {
        ...prev,
        [threatLevel]: {
          ...currentState,
          [itemId]: !currentState[itemId]
        }
      };
      return newState;
    });
    
    // Also update categories for immediate UI feedback
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
  }, [threatLevel]);

  // Handle threat level change with loading state
  const handleThreatLevelChange = useCallback((newThreatLevel: ThreatLevel) => {
    if (newThreatLevel === threatLevel) return;
    
    // Set the new threat level
    setThreatLevel(newThreatLevel);
    
    // Force refresh the UI with a short timeout
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }, [threatLevel]);

  // Get score for a specific category based on current threat level
  const getCategoryScore = useCallback((category: SecurityCategory) => {
    // If all items are selected, calculate based on all items
    if (threatLevel === 'all') {
      const total = category.items.length;
      const completed = category.items.filter(item => item.completed).length;
      return Math.round((completed / total) * 100) || 0;
    }
    
    // Otherwise, calculate based on items relevant to the current threat level
    const relevantItemIds = getItemsForThreatLevel(category.id, threatLevel);
    if (relevantItemIds.length === 0) return 0;
    
    const relevantItems = category.items.filter(item => relevantItemIds.includes(item.id));
    const completedItems = relevantItems.filter(item => item.completed).length;
    
    return Math.round((completedItems / relevantItems.length) * 100) || 0;
  }, [threatLevel]);

  // Get overall security score based on current threat level
  const getOverallScore = useCallback(() => {
    // For 'all' threat level, consider all items
    if (threatLevel === 'all') {
      const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
      if (totalItems === 0) return 0;
      
      const completedItems = categories.reduce(
        (acc, cat) => acc + cat.items.filter(item => item.completed).length,
        0
      );
      
      return Math.round((completedItems / totalItems) * 100) || 0;
    }
    
    // For specific threat levels, only consider relevant items
    let totalRelevantItems = 0;
    let totalCompletedItems = 0;
    
    categories.forEach(category => {
      const relevantItemIds = getItemsForThreatLevel(category.id, threatLevel);
      const relevantItems = category.items.filter(item => relevantItemIds.includes(item.id));
      
      totalRelevantItems += relevantItems.length;
      totalCompletedItems += relevantItems.filter(item => item.completed).length;
    });
    
    return totalRelevantItems > 0 ? Math.round((totalCompletedItems / totalRelevantItems) * 100) : 0;
  }, [categories, threatLevel]);

  // Get security statistics based on current threat level
  const getStats = useCallback((): SecurityStats => {
    let totalItems = 0;
    let completedItems = 0;
    let essentialItems = 0;
    let recommendedItems = 0;
    let advancedItems = 0;
    let optionalItems = 0;
    
    // Function to get relevant items for a category
    const getRelevantItems = (category: SecurityCategory) => {
      if (threatLevel === 'all') {
        return category.items;
      } else {
        const relevantItemIds = getItemsForThreatLevel(category.id, threatLevel);
        return category.items.filter(item => relevantItemIds.includes(item.id));
      }
    };
    
    // Calculate statistics based on relevant items only
    categories.forEach(category => {
      const relevantItems = getRelevantItems(category);
      
      totalItems += relevantItems.length;
      completedItems += relevantItems.filter(item => item.completed).length;
      
      essentialItems += relevantItems.filter(
        item => !item.completed && item.level === 'essential'
      ).length;
      
      recommendedItems += relevantItems.filter(
        item => !item.completed && item.level === 'recommended'
      ).length;
      
      advancedItems += relevantItems.filter(
        item => !item.completed && item.level === 'advanced'
      ).length;
      
      optionalItems += relevantItems.filter(
        item => !item.completed && item.level === 'optional'
      ).length;
    });
    
    // Calculate percentages
    const overallScore = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const essentialScore = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const optionalScore = totalItems > 0 ? Math.round((completedItems / (totalItems * 2)) * 100) : 0;
    const advancedScore = totalItems > 0 ? Math.round((completedItems / (totalItems * 3)) * 100) : 0;
    
    return {
      total: totalItems,
      completed: completedItems,
      essential: essentialScore,
      optional: optionalScore,
      advanced: advancedScore,
      criticalRemaining: essentialItems,
      recommendedRemaining: recommendedItems
    };
  }, [categories, threatLevel]);

  // Get filtered categories based on threat level
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
    setThreatLevel: handleThreatLevelChange,
    toggleItem,
    getCategoryScore,
    getOverallScore,
    getStats,
  };
};
