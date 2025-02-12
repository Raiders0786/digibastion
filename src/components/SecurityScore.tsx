
import { Progress } from './ui/progress';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { SecurityStats } from '../types/security';

interface SecurityScoreProps {
  score: number;
  stats: SecurityStats;
}

export const SecurityScore = ({ score, stats }: SecurityScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const radarData = [
    { category: 'Authentication', Essential: 80, Optional: 60, Advanced: 40 },
    { category: 'Web Browsing', Essential: 65, Optional: 45, Advanced: 30 },
    { category: 'Email', Essential: 90, Optional: 70, Advanced: 50 },
    { category: 'Messaging', Essential: 75, Optional: 55, Advanced: 35 },
    { category: 'Social Media', Essential: 85, Optional: 65, Advanced: 45 },
    { category: 'Networks', Essential: 70, Optional: 50, Advanced: 30 },
    { category: 'Mobile Devices', Essential: 95, Optional: 75, Advanced: 55 },
    { category: 'Physical Security', Essential: 60, Optional: 40, Advanced: 20 },
  ];

  return (
    <div id="score" className="space-y-6 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg shadow-md animate-slide-up border border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Your Security Score</h2>
              <p className="text-foreground-secondary">
                {stats.completed} out of {stats.total} items completed
              </p>
            </div>
            <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}%</span>
          </div>
          
          <Progress value={score} className="h-2 mb-6" />
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-2">
                <span className="text-xl font-bold text-green-400">{stats.essential}%</span>
              </div>
              <p className="text-sm text-foreground-secondary">Essential</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-2">
                <span className="text-xl font-bold text-yellow-400">{stats.optional}%</span>
              </div>
              <p className="text-sm text-foreground-secondary">Optional</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-2">
                <span className="text-xl font-bold text-red-400">{stats.advanced}%</span>
              </div>
              <p className="text-sm text-foreground-secondary">Advanced</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md animate-slide-up border border-white/10">
          <h3 className="text-lg font-semibold text-foreground mb-4">Security Coverage</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} className="text-xs">
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis dataKey="category" stroke="#94a3b8" />
                <Radar
                  name="Essential"
                  dataKey="Essential"
                  stroke="#34d399"
                  fill="#34d39920"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Optional"
                  dataKey="Optional"
                  stroke="#eab308"
                  fill="#eab30820"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Advanced"
                  dataKey="Advanced"
                  stroke="#ef4444"
                  fill="#ef444420"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="text-red-400" />
          <div>
            <p className="text-sm font-medium text-foreground">Critical Tasks</p>
            <p className="text-xs text-foreground-secondary">{stats.criticalRemaining} remaining</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <Shield className="text-yellow-400" />
          <div>
            <p className="text-sm font-medium text-foreground">Recommended</p>
            <p className="text-xs text-foreground-secondary">{stats.recommendedRemaining} remaining</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="text-green-400" />
          <div>
            <p className="text-sm font-medium text-foreground">Completed</p>
            <p className="text-xs text-foreground-secondary">{stats.completed} tasks done</p>
          </div>
        </div>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Next Steps</h3>
        <p className="text-sm text-foreground-secondary">
          Consider switching to more secure and privacy-respecting apps and services.
        </p>
      </div>
    </div>
  );
};
