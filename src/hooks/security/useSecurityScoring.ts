
import { useCallback } from 'react';
import { SecurityCategory } from '../../types/security';
import { ThreatLevel } from '../../types/threatProfile';
import { getRelevantItems } from '../../utils/scoringUtils';

export const useSecurityScoring = (
  categories: SecurityCategory[],
  threatLevel: ThreatLevel,
) => {
  // Get score for a specific category based on current threat level
  const getCategoryScore = useCallback((category: SecurityCategory) => {
    const relevantItems = getRelevantItems(category, threatLevel);
    
    if (relevantItems.length === 0) return 0;
    
    const completedItems = relevantItems.filter(item => item.completed).length;
    return Math.round((completedItems / relevantItems.length) * 100) || 0;
  }, [threatLevel]);

  // Get overall security score based on current threat level
  const getOverallScore = useCallback(() => {
    let totalRelevantItems = 0;
    let totalCompletedItems = 0;
    
    categories.forEach(category => {
      const relevantItems = getRelevantItems(category, threatLevel);
      totalRelevantItems += relevantItems.length;
      totalCompletedItems += relevantItems.filter(item => item.completed).length;
    });
    
    return totalRelevantItems > 0 ? Math.round((totalCompletedItems / totalRelevantItems) * 100) : 0;
  }, [categories, threatLevel]);

  return {
    getCategoryScore,
    getOverallScore
  };
};
