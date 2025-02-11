
import { Progress } from './ui/progress';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityScoreProps {
  score: number;
}

export const SecurityScore = ({ score }: SecurityScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg shadow-md mb-8 animate-slide-up border border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Your Security Score</h2>
            <p className="text-foreground-secondary">Complete more items to improve your security</p>
          </div>
          <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}%</span>
        </div>
        
        <Progress value={score} className="h-2 mb-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="text-red-400" />
            <div>
              <p className="text-sm font-medium text-foreground">Critical Tasks</p>
              <p className="text-xs text-foreground-secondary">5 remaining</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Shield className="text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-foreground">Recommended</p>
              <p className="text-xs text-foreground-secondary">8 remaining</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle className="text-green-400" />
            <div>
              <p className="text-sm font-medium text-foreground">Completed</p>
              <p className="text-xs text-foreground-secondary">3 tasks done</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Recent Security Alert</h3>
        <p className="text-sm text-foreground-secondary">
          🚨 March 2024: Crypto users lost over $100M in social engineering attacks. 
          Protect yourself by completing these security checklists.
        </p>
      </div>
    </div>
  );
};
