
import { useSecurityState } from '../../hooks/useSecurityState';
import { AlertTriangle } from 'lucide-react';

export const PriorityCategories = () => {
  const { categories } = useSecurityState();
  
  const getCategoryProgress = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;
    const completed = category.items.filter(item => item.completed).length;
    return Math.round((completed / category.items.length) * 100);
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
  );
};
