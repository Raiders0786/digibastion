
import { 
  Wallet, CreditCard, Key, Laptop, Mail, 
  Globe, Smartphone, Code, Building2, Share2 
} from 'lucide-react';
import { useSecurityState } from '../../hooks/useSecurityState';

interface CategoriesOverviewProps {
  getProgressColor: (progress: number) => string;
  getCategoryProgress: (categoryId: string) => number;
}

export const CategoriesOverview = ({ 
  getProgressColor, 
  getCategoryProgress 
}: CategoriesOverviewProps) => {
  // Define icons object to map string names to actual components
  const icons = {
    Wallet: <Wallet className="w-4 h-4" />,
    CreditCard: <CreditCard className="w-4 h-4" />,
    Key: <Key className="w-4 h-4" />,
    Laptop: <Laptop className="w-4 h-4" />,
    Mail: <Mail className="w-4 h-4" />,
    Globe: <Globe className="w-4 h-4" />,
    Smartphone: <Smartphone className="w-4 h-4" />,
    Code: <Code className="w-4 h-4" />,
    Building2: <Building2 className="w-4 h-4" />,
    Share2: <Share2 className="w-4 h-4" />
  };

  const categoryData = [
    { id: 'wallet', name: 'Crypto Wallet Security', icon: 'Wallet', priority: 'web3' },
    { id: 'defi', name: 'DeFi Security', icon: 'CreditCard', priority: 'web3' },
    { id: 'authentication', name: 'Authentication', icon: 'Key', priority: 'web3' },
    { id: 'os', name: 'OS Security', icon: 'Laptop', priority: 'web3' },
    { id: 'email', name: 'Email Security', icon: 'Mail', priority: 'web3' },
    { id: 'browsing', name: 'Web Browsing', icon: 'Globe', priority: 'web3' },
    { id: 'mobile', name: 'Mobile Security', icon: 'Smartphone', priority: 'web3' },
    { id: 'developers', name: 'Developer Security', icon: 'Code', priority: 'web3' },
    { id: 'jobs', name: 'Job Security', icon: 'Building2', priority: 'web3' },
    { id: 'social', name: 'Social Media', icon: 'Share2', priority: 'web2' },
  ];

  return (
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
                    {icons[category.icon as keyof typeof icons]}
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
                    {icons[category.icon as keyof typeof icons]}
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
    </div>
  );
};
