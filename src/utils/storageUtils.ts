import { CompletionState } from '../types/securityState';
import { ThreatLevel } from '../types/threatProfile';
import { ScoreHistory } from '../types/security';

// Keys for localStorage
const STORAGE_KEY = 'security-checklist-state';
const THREAT_LEVEL_KEY = 'security-threat-level';
const COMPLETION_KEY = 'security-completion-state';
const SCORE_HISTORY_KEY = 'security-score-history';

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

// New functions for score history management
export const loadScoreHistory = (): ScoreHistory => {
  const stored = localStorage.getItem(SCORE_HISTORY_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing score history:', e);
    }
  }
  return { entries: [] };
};

export const saveScoreHistory = (scoreHistory: ScoreHistory): void => {
  localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(scoreHistory));
};

export const addScoreHistoryEntry = (score: number, stats: any): void => {
  const history = loadScoreHistory();
  
  // Only add a new entry if the score has changed since the last entry
  const lastEntry = history.entries[history.entries.length - 1];
  if (!lastEntry || lastEntry.score !== score) {
    history.entries.push({
      date: new Date().toISOString(),
      score,
      completed: stats.completed,
      total: stats.total
    });
    
    // Keep only the last 30 entries to avoid excessive storage
    if (history.entries.length > 30) {
      history.entries = history.entries.slice(history.entries.length - 30);
    }
    
    saveScoreHistory(history);
  }
};
