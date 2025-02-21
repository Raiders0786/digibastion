import { Progress } from './ui/progress';
import { Shield, AlertTriangle, CheckCircle, Key, Globe, Mail, MessageSquare, Share2, Network, Smartphone, Laptop, Home, CreditCard, User, Building2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { SecurityStats } from '../types/security';
import { Card } from './ui/card';

interface SecurityScoreProps {
  score: number;
  stats: SecurityStats;
}

interface CategoryProgress {
  name: string;
  icon: JSX.Element;
  progress: number;
}

export const SecurityScore = ({ score, stats }: SecurityScoreProps) => {
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

  const categories: CategoryProgress[] = [
    { name: 'Authentication', icon: <Key className="w-5 h-5" />, progress: 65 },
    { name: 'Web Browsing', icon: <Globe className="w-5 h-5" />, progress: 45 },
    { name: 'Email', icon: <Mail className="w-5 h-5" />, progress: 85 },
    { name: 'Messaging', icon: <MessageSquare className="w-5 h-5" />, progress: 55 },
    { name: 'Social Media', icon: <Share2 className="w-5 h-5" />, progress: 70 },
    { name: 'Networks', icon: <Network className="w-5 h-5" />, progress: 60 },
    { name: 'Mobile Devices', icon: <Smartphone className="w-5 h-5" />, progress: 75 },
    { name: 'Personal Computers', icon: <Laptop className="w-5 h-5" />, progress: 80 },
    { name: 'Smart Home', icon: <Home className="w-5 h-5" />, progress: 40 },
    { name: 'Personal Finance', icon: <CreditCard className="w-5 h-5" />, progress: 90 },
    { name: 'Human Aspect', icon: <User className="w-5 h-5" />, progress: 50 },
    { name: 'Physical Security', icon: <Building2 className="w-5 h-5" />, progress: 65 },
  ];

  const web2Data = [
    { category: 'Authentication', Essential: 80, Optional: 60, Completed: 75 },
    { category: 'Web Browsing', Essential: 65, Optional: 45, Completed: 55 },
    { category: 'Email', Essential: 90, Optional: 70, Completed: 85 },
    { category: 'Mobile Security', Essential: 75, Optional: 55, Completed: 65 },
    { category: 'Social Media', Essential: 85, Optional: 65, Completed: 70 },
  ];

  const web3Data = [
    { category: 'DeFi Security', Essential: 80, Optional: 60, Completed: 70 },
    { category: 'Developer Security', Essential: 85, Optional: 65, Completed: 75 },
    { category: 'Job Security', Essential: 75, Optional: 55, Completed: 65 },
    { category: 'OS Security', Essential: 95, Optional: 75, Completed: 85 },
  ];

  return (
    <div id="score" className="space-y-8 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg shadow-md animate-slide-up border border-white/10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Your Security Score</h2>
              <p className="text-foreground-secondary">
                {stats.completed} out of {stats.total} items completed
              </p>
            </div>
            <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}%</span>
          </div>
          
          <Progress value={score} className="h-3 mb-8" />
          
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-400">{stats.essential}%</span>
                </div>
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-green-500/10" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-green-500" strokeWidth="3"
                    strokeDasharray={`${stats.essential}, 100`}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              </div>
              <p className="text-sm text-center text-foreground-secondary">Essential</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-yellow-400">{stats.optional}%</span>
                </div>
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-yellow-500/10" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-yellow-500" strokeWidth="3"
                    strokeDasharray={`${stats.optional}, 100`}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              </div>
              <p className="text-sm text-center text-foreground-secondary">Optional</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-red-400">{stats.advanced}%</span>
                </div>
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-red-500/10" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-red-500" strokeWidth="3"
                    strokeDasharray={`${stats.advanced}, 100`}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              </div>
              <p className="text-sm text-center text-foreground-secondary">Advanced</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md animate-slide-up border border-white/10">
          <h3 className="text-lg font-semibold text-foreground mb-6">Security Categories Overview</h3>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {category.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{category.name}</span>
                    <span className="text-sm text-foreground-secondary">{category.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(category.progress)}`}
                      style={{ width: `${category.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
    </div>
  );
};
