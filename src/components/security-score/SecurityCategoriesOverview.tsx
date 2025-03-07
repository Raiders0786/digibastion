
import { useSecurityState } from '../../hooks/useSecurityState';
import { Shield, Wallet, CreditCard, Key, User, Laptop, Building2, Globe, Mail, Smartphone, Share2 } from 'lucide-react';

export const SecurityCategoriesOverview = () => {
  const { categories } = useSecurityState();
  
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

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'wallet': return <Wallet className="w-4 h-4" />;
      case 'credit-card': return <CreditCard className="w-4 h-4" />;
      case 'key': return <Key className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      case 'laptop': return <Laptop className="w-4 h-4" />;
      case 'building2': return <Building2 className="w-4 h-4" />;
      case 'globe': return <Globe className="w-4 h-4" />;
      case 'mail': return <Mail className="w-4 h-4" />;
      case 'smartphone': return <Smartphone className="w-4 h-4" />;
      case 'share2': return <Share2 className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const categoryData = [
    { id: 'wallet', name: 'Crypto Wallet Security', icon: 'wallet', priority: 'web3' },
    { id: 'defi', name: 'DeFi Security', icon: 'credit-card', priority: 'web3' },
    { id: 'authentication', name: 'Authentication', icon: 'key', priority: 'web3' },
    { id: 'developers', name: 'Developer Security', icon: 'user', priority: 'web3' },
    { id: 'os', name: 'OS Security', icon: 'laptop', priority: 'web3' },
    { id: 'jobs', name: 'Job Security', icon: 'building2', priority: 'web3' },
    { id: 'browsing', name: 'Web Browsing', icon: 'globe', priority: 'web3' },
    { id: 'email', name: 'Email', icon: 'mail', priority: 'web3' },
    { id: 'mobile', name: 'Mobile Security', icon: 'smartphone', priority: 'web3' },
    { id: 'social', name: 'Social Media', icon: 'share2', priority: 'web2' },
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
                    {getCategoryIcon(category.icon)}
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
                    {getCategoryIcon(category.icon)}
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
