
import { useCallback } from 'react';
import { SecurityCategory } from '../../types/security';
import { ThreatLevel } from '../../types/threatProfile';
import { ScoreCache } from '../../types/securityState';
import { getRelevantItems } from '../../utils/scoringUtils';

export const useSecurityScoring = (
  categories: SecurityCategory[],
  threatLevel: ThreatLevel,
  scoreCache: ScoreCache,
  setScoreCache: React.Dispatch<React.SetStateAction<ScoreCache>>
) => {
  // Get score for a specific category based on current threat level
  const getCategoryScore = useCallback((category: SecurityCategory) => {
    // Check cache first
    if (scoreCache[threatLevel]?.categories?.[category.id] !== undefined) {
      return scoreCache[threatLevel].categories[category.id];
    }
    
    const relevantItems = getRelevantItems(category, threatLevel);
    
    if (relevantItems.length === 0) return 0;
    
    const completedItems = relevantItems.filter(item => item.completed).length;
    const score = Math.round((completedItems / relevantItems.length) * 100) || 0;
    
    // Cache the result
    setScoreCache(prev => {
      const updatedCache = { ...prev };
      
      if (!updatedCache[threatLevel]) {
        updatedCache[threatLevel] = {
          overall: 0,
          categories: {}
        };
      }
      
      updatedCache[threatLevel].categories[category.id] = score;
      
      return updatedCache;
    });
    
    return score;
  }, [categories, threatLevel, scoreCache, setScoreCache]);

  // Get overall security score based on current threat level
  const getOverallScore = useCallback(() => {
    // Check cache first
    if (scoreCache[threatLevel]?.overall !== undefined) {
      return scoreCache[threatLevel].overall;
    }
    
    let totalRelevantItems = 0;
    let totalCompletedItems = 0;
    
    categories.forEach(category => {
      const relevantItems = getRelevantItems(category, threatLevel);
      totalRelevantItems += relevantItems.length;
      totalCompletedItems += relevantItems.filter(item => item.completed).length;
    });
    
    const score = totalRelevantItems > 0 ? Math.round((totalCompletedItems / totalRelevantItems) * 100) : 0;
    
    // Cache the result
    setScoreCache(prev => {
      const updatedCache = { ...prev };
      
      if (!updatedCache[threatLevel]) {
        updatedCache[threatLevel] = {
          overall: score,
          categories: {}
        };
      } else {
        updatedCache[threatLevel] = {
          ...updatedCache[threatLevel],
          overall: score
        };
      }
      
      return updatedCache;
    });
    
    return score;
  }, [categories, threatLevel, scoreCache, setScoreCache]);

  return {
    getCategoryScore,
    getOverallScore
  };
};
