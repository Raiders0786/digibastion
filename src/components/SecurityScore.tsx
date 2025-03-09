
import { SecurityStats } from '../types/security';
import { useSecurityState } from '../hooks/useSecurityState';
import { useMemo } from 'react';
import { ScoreOverview } from './security-score/ScoreOverview';
import { ScoreCircles } from './security-score/ScoreCircles';
import { SecurityTips } from './security-score/SecurityTips';
import { CategoryOverview } from './security-score/CategoryOverview';
import { SummaryCards } from './security-score/SummaryCards';

interface SecurityScoreProps {
  score: number;
  stats: SecurityStats;
}

export const SecurityScore = ({ score, stats }: SecurityScoreProps) => {
  const { categories, threatLevel, changeCount } = useSecurityState();
  
  // Handle and validate score
  const validScore = useMemo(() => {
    if (isNaN(score) || score < 0) return 0;
    if (score > 100) return 100;
    return score;
  }, [score]);
  
  // Handle and validate stats
  const validStats = useMemo(() => {
    const validatePercentage = (num: number) => {
      if (isNaN(num) || num < 0) return 0;
      if (num > 100) return 100;
      return num;
    };
    
    return {
      ...stats,
      essential: validatePercentage(stats.essential),
      optional: validatePercentage(stats.optional),
      advanced: validatePercentage(stats.advanced),
      total: stats.total || 0,
      completed: stats.completed || 0,
      criticalRemaining: stats.criticalRemaining || 0,
      recommendedRemaining: stats.recommendedRemaining || 0
    };
  }, [stats]);
  
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
    if (!category || category.items.length === 0) return 0;
    const completed = category.items.filter(item => item.completed).length;
    return Math.round((completed / category.items.length) * 100);
  };

  // validate category progress to catch NaN and Infinity
  const getValidCategoryProgress = (categoryId: string) => {
    const progress = getCategoryProgress(categoryId);
    if (isNaN(progress) || progress < 0) return 0;
    if (progress > 100) return 100;
    return progress;
  };

  return (
    <div id="score" className="space-y-6 scroll-mt-24" key={`security-score-${threatLevel}-${changeCount}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md animate-slide-up border border-white/10">
          <ScoreOverview 
            score={validScore} 
            stats={validStats} 
            getScoreColor={getScoreColor} 
          />
          
          <ScoreCircles 
            threatLevel={threatLevel} 
            stats={validStats} 
          />

          <SecurityTips score={validScore} threatLevel={threatLevel} />
        </div>

        <CategoryOverview 
          threatLevel={threatLevel} 
          getValidCategoryProgress={getValidCategoryProgress} 
          getProgressColor={getProgressColor} 
          changeCount={changeCount}
        />
      </div>

      <SummaryCards stats={validStats} />
    </div>
  );
};
