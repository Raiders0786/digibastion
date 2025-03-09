
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { SecurityStats } from '../../types/security';

interface SummaryCardsProps {
  stats: SecurityStats;
}

export const SummaryCards = ({ stats }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="text-red-400 w-4 h-4" />
        <div>
          <p className="text-sm font-medium text-foreground">Critical Tasks</p>
          <p className="text-xs text-foreground-secondary">{stats.criticalRemaining} remaining</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <Shield className="text-yellow-400 w-4 h-4" />
        <div>
          <p className="text-sm font-medium text-foreground">Recommended</p>
          <p className="text-xs text-foreground-secondary">{stats.recommendedRemaining} remaining</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <CheckCircle className="text-green-400 w-4 h-4" />
        <div>
          <p className="text-sm font-medium text-foreground">Completed</p>
          <p className="text-xs text-foreground-secondary">{stats.completed} tasks done</p>
        </div>
      </div>
    </div>
  );
};
