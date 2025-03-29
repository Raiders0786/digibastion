
import { useState, useEffect, useCallback } from 'react';
import { SecurityStats } from '../types/security';
import { ThreatLevel } from '../types/threatProfile';
import { toast } from 'sonner';
import { ScoreCache, SecurityStateContextType } from '../types/securityState';
import { 
  loadThreatLevel, 
  saveThreatLevel,
  addScoreHistoryEntry 
} from '../utils/storageUtils';
import { calculateSecurityStats } from '../utils/scoringUtils';
import { useCategoryManagement } from './security/useCategoryManagement';
import { useSecurityScoring } from './security/useSecurityScoring';
import { useSecurityCompletion } from './security/useSecurityCompletion';

// Create a global state variable to track threat level changes
let globalThreatLevelChangeCount = 0;

export const useSecurityState = (): SecurityStateContextType => {
  // Load threat level from localStorage or default to 'all'
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(() => {
    try {
      return loadThreatLevel();
    } catch (error) {
      console.error('Error loading threat level:', error);
      return 'all' as ThreatLevel; // Fallback to 'all' if there's an error
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [scoreCache, setScoreCache] = useState<ScoreCache>({});
  // Add a change counter to force re-renders when threat level changes
  const [changeCount, setChangeCount] = useState(0);
  
  // Use the completion state hook
  const { 
    categories, 
    completionState, 
    toggleItem 
  } = useSecurityCompletion();

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

  // Save threat level to localStorage and synchronize global state
  useEffect(() => {
    try {
      saveThreatLevel(threatLevel);
      console.log(`Threat level changed to: ${threatLevel}`);
      
      // Clear score cache for the changed threat level
      setScoreCache(prev => {
        const newCache = { ...prev };
        delete newCache[threatLevel];
        return newCache;
      });

      // Update global counter to inform other components of the change
      globalThreatLevelChangeCount++;
      setChangeCount(globalThreatLevelChangeCount);
    } catch (error) {
      console.error('Error saving threat level:', error);
      toast.error('Error saving security profile', {
        description: 'Your selection was saved but may not persist after reload',
      });
    }
  }, [threatLevel]);

  // Handle threat level change - simplified since we're doing a full page reload
  const handleThreatLevelChange = useCallback((newThreatLevel: ThreatLevel) => {
    if (newThreatLevel === threatLevel) return;
    
    try {
      // Just update the threat level in localStorage
      setThreatLevel(newThreatLevel);
      
      // Force a re-render by updating change count
      globalThreatLevelChangeCount++;
      setChangeCount(globalThreatLevelChangeCount);
    } catch (error) {
      console.error('Error changing threat level:', error);
      toast.error('Error changing security profile', {
        description: 'Please try again',
      });
    }
  }, [threatLevel]);

  // Get security statistics and record history
  const getStats = useCallback((): SecurityStats => {
    try {
      const stats = calculateSecurityStats(categories, threatLevel);
      
      // Record this score in history
      const score = getOverallScore();
      addScoreHistoryEntry(score, stats);
      
      return stats;
    } catch (error) {
      console.error('Error calculating security stats:', error);
      // Return a default stats object if there's an error
      return {
        total: 0,
        completed: 0,
        essential: 0,
        optional: 0,
        advanced: 0,
        criticalRemaining: 0,
        recommendedRemaining: 0
      };
    }
  }, [categories, threatLevel, getOverallScore, changeCount]);

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
    changeCount,
  };
};
