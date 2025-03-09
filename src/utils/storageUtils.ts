
import { CompletionState } from '../types/securityState';
import { ThreatLevel } from '../types/threatProfile';

// Keys for localStorage
const STORAGE_KEY = 'security-checklist-state';
const THREAT_LEVEL_KEY = 'security-threat-level';
const COMPLETION_KEY = 'security-completion-state';

export const loadThreatLevel = (): ThreatLevel => {
  const stored = localStorage.getItem(THREAT_LEVEL_KEY);
  return (stored as ThreatLevel) || 'all';
};

export const saveThreatLevel = (threatLevel: ThreatLevel): void => {
  localStorage.setItem(THREAT_LEVEL_KEY, threatLevel);
};

export const loadCompletionState = (): CompletionState => {
  const stored = localStorage.getItem(COMPLETION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      
      // Handle old format (per threat level) vs new format (global)
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed[loadThreatLevel()]) {
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
};

export const saveCompletionState = (completionState: CompletionState): void => {
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(completionState));
};
