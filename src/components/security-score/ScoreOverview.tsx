
import { Progress } from '../ui/progress';
import { SecurityStats } from '../../types/security';

interface ScoreOverviewProps {
  score: number;
  stats: SecurityStats;
  getScoreColor: (score: number) => string;
}

export const ScoreOverview = ({ score, stats, getScoreColor }: ScoreOverviewProps) => {
  return (
    <div>
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
    </div>
  );
};
