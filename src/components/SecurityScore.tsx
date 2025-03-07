import { Progress } from './ui/progress';
import { Shield, AlertTriangle, CheckCircle, Key, Globe, Mail, MessageSquare, Share2, Network, Smartphone, Laptop, Home, CreditCard, User, Building2, Wallet } from 'lucide-react';
import { SecurityStats } from '../types/security';
import { Card } from './ui/card';
import { useSecurityState } from '../hooks/useSecurityState';

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

  const categoryData = [
    { id: 'wallet', name: 'Crypto Wallet Security', icon: <Wallet className="w-4 h-4" />, priority: 'web3' },
    { id: 'defi', name: 'DeFi Security', icon: <CreditCard className="w-4 h-4" />, priority: 'web3' },
    { id: 'authentication', name: 'Authentication', icon: <Key className="w-4 h-4" />, priority: 'web3' },
    { id: 'developers', name: 'Developer Security', icon: <User className="w-4 h-4" />, priority: 'web3' },
    { id: 'os', name: 'OS Security', icon: <Laptop className="w-4 h-4" />, priority: 'web3' },
    { id: 'jobs', name: 'Job Security', icon: <Building2 className="w-4 h-4" />, priority: 'web3' },
    { id: 'browsing', name: 'Web Browsing', icon: <Globe className="w-4 h-4" />, priority: 'web2' },
    { id: 'email', name: 'Email', icon: <Mail className="w-4 h-4" />, priority: 'web2' },
    { id: 'mobile', name: 'Mobile Security', icon: <Smartphone className="w-4 h-4" />, priority: 'web2' },
    { id: 'social', name: 'Social Media', icon: <Share2 className="w-4 h-4" />, priority: 'web2' },
  ];

  const getSecurityTips = (score: number) => {
    if (score < 50) {
      return [
        'Focus on completing essential security tasks first.',
        'Set up hardware wallets for your crypto assets.',
        'Enable 2FA on all your Web3 accounts.',
        'Use wallet-based authentication where available.',
        'Create secure backups of your wallet seed phrases.',
        `Use a secure password manager (see https://www.privacyguides.org/en/passwords/).`,
      ];
    } else if (score < 80) {
      return [
        'Good progress! Consider implementing recommended security measures.',
        'Set up multi-signature wallets for extra protection.',
        'Use separate hot and cold wallets for different purposes.',
        'Regularly audit your Web3 platform permissions.',
        'Consider using hardware security keys for critical accounts.',
        'Consider using a dedicated device for crypto transactions.',
      ];
    } else {
      return [
        'Excellent security practices! Keep maintaining and updating your measures.',
        'Regularly review and rotate your backup strategies.',
        'Stay updated with the latest Web3 security practices.',
        'Consider advanced features like hardware security keys.',
        'Consider wallet-based authentication for all compatible services.',
        'Help others improve their security practices.',
      ];
    }
  };

  const securityLevels = [
    { label: 'Essential', value: stats.essential, color: 'green', description: 'Must-have security measures' },
    { label: 'Recommended', value: stats.optional, color: 'yellow', description: 'Additional protection layers' },
    { label: 'Advanced', value: stats.advanced, color: 'blue', description: 'Expert-level security' }
  ];

  return (
    <div id="score" className="space-y-6 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {securityLevels.map(({ label, value, color, description }) => (
              <div key={label} className="relative group">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="45"
                        className={`stroke-${color}-500/10`}
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="45"
                        className={`stroke-${color}-500`}
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - value / 100)}`}
                        style={{
                          transition: 'stroke-dashoffset 0.5s ease-in-out'
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold text-${color}-400`}>{value}%</span>
                    </div>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-foreground">{label}</h3>
                  <p className="text-xs text-foreground-secondary mt-1">{description}</p>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full bg-background p-2 rounded shadow-lg text-xs w-48 text-center pointer-events-none z-10">
                  {description}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-medium mb-2">Security Tips</h3>
            <div className="space-y-2">
              {getSecurityTips(score).map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-foreground-secondary">
                  <Shield className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md animate-slide-up border border-white/10">
          <h3 className="text-lg font-semibold text-foreground mb-4">Security Categories Overview</h3>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-indigo-400 mb-2">Web3 Security</h4>
            <div className="grid gap-3 pr-2">
              {categoryData
                .filter(cat => cat.priority === 'web3')
                .map((category) => {
                  const progress = getCategoryProgress(category.id);
                  return (
                    <div key={category.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{category.name}</span>
                          <span className="text-xs text-foreground-secondary">{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-blue-400 mb-2">Web2 Security</h4>
            <div className="grid gap-3 pr-2">
              {categoryData
                .filter(cat => cat.priority === 'web2')
                .map((category) => {
                  const progress = getCategoryProgress(category.id);
                  return (
                    <div key={category.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{category.name}</span>
                          <span className="text-xs text-foreground-secondary">{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-medium mb-2">Priority Categories</h3>
            {categoryData
              .map(cat => ({ ...cat, progress: getCategoryProgress(cat.id) }))
              .filter(cat => cat.progress < 50)
              .slice(0, 3)
              .map(cat => (
                <div key={cat.id} className="flex items-center gap-2 text-xs text-foreground-secondary mb-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  <span>{cat.name} needs attention ({cat.progress}% complete)</span>
                </div>
              ))}
          </div>
        </div>
      </div>

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
    </div>
  );
};
