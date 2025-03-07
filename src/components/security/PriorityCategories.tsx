
import { AlertTriangle } from 'lucide-react';
import { useSecurityState } from '../../hooks/useSecurityState';

interface PriorityCategoriesProps {
  getCategoryProgress: (categoryId: string) => number;
}

export const PriorityCategories = ({ getCategoryProgress }: PriorityCategoriesProps) => {
  const { categories } = useSecurityState();

  // This needs to match the same data structure used in SecurityScore
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
