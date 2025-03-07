
import { SecurityStats } from '../../types/security';
import { useSecurityState } from '../../hooks/useSecurityState';
import { Shield, AlertTriangle, Gauge } from 'lucide-react';
import { ScoreGaugeChart } from './ScoreGaugeChart';
import { SecurityLevelCircles } from './SecurityLevelCircles';
import { SecurityTips } from './SecurityTips';
import { PriorityCategories } from './PriorityCategories';

interface SecurityScoreCardProps {
  score: number;
  stats: SecurityStats;
}

export const SecurityScoreCard = ({ score, stats }: SecurityScoreCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md animate-slide-up border border-white/10">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold mb-1 text-foreground">Your Security Score</h2>
          <p className="text-sm text-foreground-secondary">
            {stats.completed} out of {stats.total} items completed
          </p>
        </div>
      </div>

      {/* Speedometer Visualization */}
      <ScoreGaugeChart score={score} getScoreColor={getScoreColor} />

      {/* Security Levels */}
      <SecurityLevelCircles stats={stats} />

      {/* Security Tips */}
      <SecurityTips score={score} />

      {/* Priority Categories */}
      <PriorityCategories />
    </div>
  );
};
