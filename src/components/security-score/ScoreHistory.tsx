
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { ScoreHistory as ScoreHistoryType } from '../../types/security';
import { loadScoreHistory } from '../../utils/storageUtils';

interface ScoreHistoryProps {
  className?: string;
}

export const ScoreHistory = ({ className }: ScoreHistoryProps) => {
  const [history, setHistory] = useState<ScoreHistoryType>({ entries: [] });
  
  useEffect(() => {
    setHistory(loadScoreHistory());
  }, []);
  
  // No history data or too few entries
  if (history.entries.length < 2) {
    return null;
  }
  
  const latestEntry = history.entries[history.entries.length - 1];
  const previousEntry = history.entries[history.entries.length - 2];
  const firstEntry = history.entries[0];
  
  // Calculate changes
  const scoreDiff = latestEntry.score - previousEntry.score;
  const totalChange = latestEntry.score - firstEntry.score;
  const isPositive = scoreDiff >= 0;
  
  // Format dates
  const latestDate = format(new Date(latestEntry.date), 'MMM d, yyyy');
  const firstDate = format(new Date(firstEntry.date), 'MMM d, yyyy');
  
  return (
    <div className={`mt-6 pt-4 border-t border-white/10 ${className}`}>
      <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
        <Clock className="w-4 h-4 text-foreground-secondary" />
        Progress History
      </h3>
      
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-foreground-secondary">Recent change:</span>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
              {isPositive ? '+' : ''}{scoreDiff}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-foreground-secondary">Since {firstDate}:</span>
          <div className="flex items-center gap-1">
            {totalChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={totalChange >= 0 ? 'text-green-400' : 'text-red-400'}>
              {totalChange >= 0 ? '+' : ''}{totalChange}%
            </span>
          </div>
        </div>
        
        <div className="text-xs text-foreground-secondary mt-1">
          Last updated: {latestDate}
        </div>
      </div>
    </div>
  );
};
