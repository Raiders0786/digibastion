
import { SecurityCategory, SecurityItem, SecurityStats } from './security';
import { ThreatLevel } from './threatProfile';

// Interface for storing completion state - global completion status regardless of threat level
export interface CompletionState {
  [itemId: string]: boolean;
}

// Interface for score cache structure
export interface ScoreCache {
  [threatLevel: string]: {
    overall: number;
    categories: { [categoryId: string]: number };
  };
}

export interface SecurityStateContextType {
  categories: SecurityCategory[];
  originalCategories: SecurityCategory[];
  threatLevel: ThreatLevel;
  setThreatLevel: (newThreatLevel: ThreatLevel) => void;
  toggleItem: (categoryId: string, itemId: string) => void;
  getCategoryScore: (category: SecurityCategory) => number;
  getOverallScore: () => number;
  getStats: () => SecurityStats;
  isLoading: boolean;
  changeCount: number; // Add change counter to force re-renders
}
