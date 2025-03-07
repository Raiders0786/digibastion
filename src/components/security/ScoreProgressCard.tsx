
import { Shield } from 'lucide-react';
import { Progress } from '../ui/progress';
import { SecurityStats } from '../../types/security';
import { SecurityLevelCircles } from './SecurityLevelCircles';
import { SecurityTips } from './SecurityTips';
import { PriorityCategories } from './PriorityCategories';

interface ScoreProgressCardProps {
  score: number;
  stats: SecurityStats;
  getScoreColor: (score: number) => string;
  getCategoryProgress: (categoryId: string) => number;
}

export const ScoreProgressCard = ({ 
  score, 
  stats, 
  getScoreColor, 
  getCategoryProgress 
}: ScoreProgressCardProps) => {
  return (
    <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md animate-slide-up border border-white/10">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold mb-1 text-foreground">Your Security Score</h2>
          <p className="text-sm text-foreground-secondary">
            {stats.completed} out of {stats.total} items completed
          </p>
        </div>
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
      </div>
      
      <Progress value={score} className="h-2 mb-6" />
      
      <SecurityLevelCircles stats={stats} />

      <SecurityTips score={score} />
      
      <PriorityCategories getCategoryProgress={getCategoryProgress} />
    </div>
  );
};
