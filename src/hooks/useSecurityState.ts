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

// Interface for storing completion state - global completion status regardless of threat level
interface CompletionState {
  [itemId: string]: boolean;
}

// Interface for score cache structure
interface ScoreCache {
  [threatLevel: string]: {
    overall: number;
    categories: { [categoryId: string]: number };
  };
}

export const useSecurityState = () => {
  // Load threat level from localStorage or default to 'all'
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(() => {
    const stored = localStorage.getItem(THREAT_LEVEL_KEY);
    return (stored as ThreatLevel) || 'all';
  });

  // State for loading transitions
  const [isLoading, setIsLoading] = useState(false);
  
  // Load categories from initial data
  const [categories, setCategories] = useState<SecurityCategory[]>(() => {
    return initialSecurityData;
  });

  // Global completion state - single source of truth for all item completions
  const [completionState, setCompletionState] = useState<CompletionState>(() => {
    const stored = localStorage.getItem(COMPLETION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Handle old format (per threat level) vs new format (global)
        if (typeof parsed === 'object' && parsed !== null) {
          if (parsed[threatLevel]) {
            // Old format - migrate to new format
            const allCompletions: CompletionState = {};
            Object.keys(parsed).forEach(level => {
              Object.keys(parsed[level]).forEach(itemId => {
                if (parsed[level][itemId]) {
                  allCompletions[itemId] = true;
                }
              });
            });
            return allCompletions;
          } else {
            // New format or empty
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error parsing completion state:', e);
      }
    }
    
    // Initialize with empty completion state
    return {};
  });

  // Cache for calculated scores to prevent recalculation on every render
  const [scoreCache, setScoreCache] = useState<ScoreCache>({});

  // Effect to apply completion state to categories
  useEffect(() => {
    // Apply completion state to categories
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

  // Save threat level to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(THREAT_LEVEL_KEY, threatLevel);
    console.log(`Threat level changed to: ${threatLevel}`);
    
    // Clear score cache for the changed threat level to force recalculation
    setScoreCache(prev => {
      const newCache = { ...prev };
      delete newCache[threatLevel];
      return newCache;
    });
  }, [threatLevel]);

  // Save completion state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(COMPLETION_KEY, JSON.stringify(completionState));
    
    // Invalidate all score caches when completion state changes
    setScoreCache({});
  }, [completionState]);

  // Toggle item completion status
  const toggleItem = useCallback((categoryId: string, itemId: string) => {
    console.log(`Toggling item: ${categoryId} - ${itemId}`);
    
    // Update global completion state
    setCompletionState(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);

  // Handle threat level change with loading state
  const handleThreatLevelChange = useCallback((newThreatLevel: ThreatLevel) => {
    if (newThreatLevel === threatLevel) return;
    
    // Set loading state to provide visual feedback
    setIsLoading(true);
    
    try {
      // Set the new threat level
      setThreatLevel(newThreatLevel);
      
      // Force refresh with a short timeout to update UI
      setTimeout(() => {
        setIsLoading(false);
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } catch (error) {
      console.error('Error changing threat level:', error);
      toast.error('Error changing security profile', {
        description: 'Please try again',
      });
      setIsLoading(false);
    }
  }, [threatLevel]);

  // Get score for a specific category based on current threat level
  const getCategoryScore = useCallback((category: SecurityCategory) => {
    // Check cache first
    if (scoreCache[threatLevel]?.categories?.[category.id] !== undefined) {
      return scoreCache[threatLevel].categories[category.id];
    }
    
    let relevantItems: SecurityItem[];
    
    // If all items are selected, calculate based on all items
    if (threatLevel === 'all') {
      relevantItems = category.items;
    } else {
      // Otherwise, calculate based on items relevant to the current threat level
      const relevantItemIds = getItemsForThreatLevel(category.id, threatLevel);
      relevantItems = category.items.filter(item => relevantItemIds.includes(item.id));
    }
    
    if (relevantItems.length === 0) return 0;
    
    const completedItems = relevantItems.filter(item => item.completed).length;
    const score = Math.round((completedItems / relevantItems.length) * 100) || 0;
    
    // Cache the result with required properties
    setScoreCache(prev => {
      const updatedCache = { ...prev };
      
      // Initialize if not exists with all required properties
      if (!updatedCache[threatLevel]) {
        updatedCache[threatLevel] = {
          overall: 0,
          categories: {}
        };
      }
      
      // Make sure categories object exists
      if (!updatedCache[threatLevel].categories) {
        updatedCache[threatLevel].categories = {};
      }
      
      // Update category score
      updatedCache[threatLevel].categories[category.id] = score;
      
      return updatedCache;
    });
    
    return score;
  }, [categories, threatLevel, scoreCache]);

  // Get overall security score based on current threat level
  const getOverallScore = useCallback(() => {
    // Check cache first
    if (scoreCache[threatLevel]?.overall !== undefined) {
      return scoreCache[threatLevel].overall;
    }
    
    let totalRelevantItems = 0;
    let totalCompletedItems = 0;
    
    categories.forEach(category => {
      let relevantItems: SecurityItem[];
      
      // If all items are selected, calculate based on all items
      if (threatLevel === 'all') {
        relevantItems = category.items;
      } else {
        // Otherwise, calculate based on items relevant to the current threat level
        const relevantItemIds = getItemsForThreatLevel(category.id, threatLevel);
        relevantItems = category.items.filter(item => relevantItemIds.includes(item.id));
      }
      
      totalRelevantItems += relevantItems.length;
      totalCompletedItems += relevantItems.filter(item => item.completed).length;
    });
    
    const score = totalRelevantItems > 0 ? Math.round((totalCompletedItems / totalRelevantItems) * 100) : 0;
    
    // Cache the result with required properties
    setScoreCache(prev => {
      const updatedCache = { ...prev };
      
      // Initialize if not exists with all required properties
      if (!updatedCache[threatLevel]) {
        updatedCache[threatLevel] = {
          overall: score,
          categories: {}
        };
      } else {
        // Update overall score while keeping categories
        updatedCache[threatLevel] = {
          ...updatedCache[threatLevel],
          overall: score
        };
      }
      
      return updatedCache;
    });
    
    return score;
  }, [categories, threatLevel, scoreCache]);

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
    
    // Calculate percentages safely to avoid NaN
    const calculatePercentage = (completed: number, total: number) => {
      if (total === 0) return 0;
      return Math.round((completed / total) * 100);
    };
    
    const essentialScore = calculatePercentage(completedItems, totalItems);
    const optionalScore = calculatePercentage(completedItems, totalItems);
    const advancedScore = calculatePercentage(completedItems, totalItems);
    
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
    categories: getFilteredCategories,
    originalCategories: categories,
    threatLevel,
    setThreatLevel: handleThreatLevelChange,
    toggleItem,
    getCategoryScore,
    getOverallScore,
    getStats,
    isLoading,
  };
};
