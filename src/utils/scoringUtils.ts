
import { SecurityCategory, SecurityItem, SecurityStats } from '../types/security';
import { ThreatLevel } from '../types/threatProfile';
import { getItemsForThreatLevel } from '../data/threatProfiles';

// Get relevant items for a category based on threat level
export const getRelevantItems = (
  category: SecurityCategory,
  threatLevel: ThreatLevel
): SecurityItem[] => {
  if (threatLevel === 'all') {
    return category.items;
  } else {
    const relevantItemIds = getItemsForThreatLevel(category.id, threatLevel);
    return category.items.filter(item => relevantItemIds.includes(item.id));
  }
};

// Calculate percentage safely to avoid NaN
export const calculatePercentage = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// Calculate security statistics for all categories
export const calculateSecurityStats = (
  categories: SecurityCategory[],
  threatLevel: ThreatLevel
): SecurityStats => {
  let totalItems = 0;
  let completedItems = 0;
  let essentialItems = 0;
  let recommendedItems = 0;
  let advancedItems = 0;
  let optionalItems = 0;
  
  // Calculate statistics based on relevant items only
  categories.forEach(category => {
    const relevantItems = getRelevantItems(category, threatLevel);
    
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
};

// Get category score by ID - helper function for external components
export const getCategoryScoreById = (
  categories: SecurityCategory[],
  categoryId: string,
  threatLevel: ThreatLevel
): number => {
  const category = categories.find(c => c.id === categoryId);
  if (!category) return 0;
  
  const relevantItems = getRelevantItems(category, threatLevel);
  if (relevantItems.length === 0) return 0;
  
  const completedItems = relevantItems.filter(item => item.completed).length;
  return Math.round((completedItems / relevantItems.length) * 100) || 0;
};
