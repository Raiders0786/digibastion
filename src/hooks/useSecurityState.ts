
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
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(() => loadThreatLevel());
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
  }, [threatLevel]);

  // Handle threat level change - simplified since we're doing a full page reload
  const handleThreatLevelChange = useCallback((newThreatLevel: ThreatLevel) => {
    if (newThreatLevel === threatLevel) return;
    
    // Just update the threat level in localStorage
    setThreatLevel(newThreatLevel);
    
    // Force a re-render by updating change count
    globalThreatLevelChangeCount++;
    setChangeCount(globalThreatLevelChangeCount);
  }, [threatLevel]);

  // Get security statistics and record history
  const getStats = useCallback((): SecurityStats => {
    const stats = calculateSecurityStats(categories, threatLevel);
    
    // Record this score in history
    const score = getOverallScore();
    addScoreHistoryEntry(score, stats);
    
    return stats;
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
