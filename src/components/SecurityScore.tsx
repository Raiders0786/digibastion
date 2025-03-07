
import { useSecurityState } from '../hooks/useSecurityState';
import { SecurityStats } from '../types/security';
import { ScoreProgressCard } from './security/ScoreProgressCard';
import { CategoriesOverview } from './security/CategoriesOverview';
import { SecuritySummaryCards } from './security/SecuritySummaryCards';

interface SecurityScoreProps {
  score: number;
  stats: SecurityStats;
}

export const SecurityScore = ({ score, stats }: SecurityScoreProps) => {
  const { categories } = useSecurityState();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCategoryProgress = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;
    const completed = category.items.filter(item => item.completed).length;
    return Math.round((completed / category.items.length) * 100);
  };

  return (
    <div id="score" className="space-y-6 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreProgressCard 
          score={score} 
          stats={stats} 
          getScoreColor={getScoreColor} 
          getCategoryProgress={getCategoryProgress} 
        />
        <CategoriesOverview 
          getProgressColor={getProgressColor} 
          getCategoryProgress={getCategoryProgress} 
        />
      </div>

      <SecuritySummaryCards stats={stats} />
    </div>
  );
};
