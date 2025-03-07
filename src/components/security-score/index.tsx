
import { SecurityStats } from '../../types/security';
import { SecurityScoreCard } from './SecurityScoreCard';
import { SecurityCategoriesOverview } from './SecurityCategoriesOverview';
import { SecuritySummaryCards } from './SecuritySummaryCards';

interface SecurityScoreProps {
  score: number;
  stats: SecurityStats;
}

export const SecurityScore = ({ score, stats }: SecurityScoreProps) => {
  return (
    <div id="score" className="space-y-6 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SecurityScoreCard score={score} stats={stats} />
        <SecurityCategoriesOverview />
      </div>
      <SecuritySummaryCards stats={stats} />
    </div>
  );
};
