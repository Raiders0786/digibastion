
import { useState, useEffect, useMemo, useCallback } from 'react';
import { SecurityCategory, SecurityStats } from '../types/security';
import { initialSecurityData } from '../data/securityData';
import { ThreatLevel } from '../types/threatProfile';
import { toast } from 'sonner';
import { CompletionState, ScoreCache, SecurityStateContextType } from '../types/securityState';
import { 
  loadThreatLevel, 
  saveThreatLevel, 
  loadCompletionState, 
  saveCompletionState,
  addScoreHistoryEntry 
} from '../utils/storageUtils';
import { 
  getRelevantItems, 
  calculateSecurityStats,
  getCategoryScoreById
} from '../utils/scoringUtils';
import { useCategoryManagement } from './security/useCategoryManagement';
import { useSecurityScoring } from './security/useSecurityScoring';

export const useSecurityState = (): SecurityStateContextType => {
  // Load threat level from localStorage or default to 'all'
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(() => loadThreatLevel());
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<SecurityCategory[]>(() => initialSecurityData);
  const [completionState, setCompletionState] = useState<CompletionState>(() => loadCompletionState());
  const [scoreCache, setScoreCache] = useState<ScoreCache>({});
  
  // Extract category management logic to a custom hook
  const { getFilteredCategories } = useCategoryManagement(
    categories, 
    completionState, 
    threatLevel, 
    isLoading
  );

  // Extract scoring logic to a custom hook
  const { getCategoryScore, getOverallScore } = useSecurityScoring(
    categories, 
    threatLevel, 
    scoreCache, 
    setScoreCache
  );

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

  // Save threat level to localStorage
  useEffect(() => {
    saveThreatLevel(threatLevel);
    console.log(`Threat level changed to: ${threatLevel}`);
    
    // Clear score cache for the changed threat level
    setScoreCache(prev => {
      const newCache = { ...prev };
      delete newCache[threatLevel];
      return newCache;
    });
  }, [threatLevel]);

  // Save completion state to localStorage
  useEffect(() => {
    saveCompletionState(completionState);
    setScoreCache({}); // Invalidate all score caches
  }, [completionState]);

  // Toggle item completion status
  const toggleItem = useCallback((categoryId: string, itemId: string) => {
    console.log(`Toggling item: ${categoryId} - ${itemId}`);
    
    setCompletionState(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);

  // Handle threat level change with loading state
  const handleThreatLevelChange = useCallback((newThreatLevel: ThreatLevel) => {
    if (newThreatLevel === threatLevel) return;
    
    setIsLoading(true);
    
    try {
      setThreatLevel(newThreatLevel);
      
      setTimeout(() => {
        setIsLoading(false);
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

  // Get security statistics and record history
  const getStats = useCallback((): SecurityStats => {
    const stats = calculateSecurityStats(categories, threatLevel);
    
    // Record this score in history
    const score = getOverallScore();
    addScoreHistoryEntry(score, stats);
    
    return stats;
  }, [categories, threatLevel, getOverallScore]);

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
