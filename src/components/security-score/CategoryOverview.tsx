
import { AlertTriangle } from 'lucide-react';
import { ThreatLevel } from '../../types/threatProfile';
import { CategoryProgressList } from './CategoryProgressList';

interface CategoryOverviewProps {
  threatLevel: ThreatLevel;
  getValidCategoryProgress: (categoryId: string) => number;
  getProgressColor: (progress: number) => string;
  changeCount: number;
}

export const CategoryOverview = ({ 
  threatLevel, 
  getValidCategoryProgress, 
  getProgressColor,
  changeCount
}: CategoryOverviewProps) => {
  const categoryData = [
    { id: 'wallet', name: 'Crypto Wallet Security', icon: 'Wallet', priority: 'web3' },
    { id: 'defi', name: 'DeFi Security', icon: 'CreditCard', priority: 'web3' },
    { id: 'authentication', name: 'Authentication', icon: 'Key', priority: 'web3' },
    { id: 'developers', name: 'Developer Security', icon: 'User', priority: 'web3' },
    { id: 'os', name: 'OS Security', icon: 'Laptop', priority: 'web3' },
    { id: 'jobs', name: 'Job Security', icon: 'Building2', priority: 'web3' },
    { id: 'opsec', name: 'OpSec', icon: 'ShieldAlert', priority: 'opsec' },
    { id: 'browsing', name: 'Web Browsing', icon: 'Globe', priority: 'web2' },
    { id: 'email', name: 'Email', icon: 'Mail', priority: 'web2' },
    { id: 'mobile', name: 'Mobile Security', icon: 'Smartphone', priority: 'web2' },
    { id: 'social', name: 'Social Media', icon: 'Share2', priority: 'web2' },
  ];

  const lowPerformingCategories = categoryData
    .map(cat => ({ ...cat, progress: getValidCategoryProgress(cat.id) }))
    .filter(cat => cat.progress < 50)
    .slice(0, 3);

  return (
    <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md animate-slide-up border border-white/10">
      <h3 className="text-lg font-semibold text-foreground mb-4">Security Categories Overview</h3>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium text-indigo-400 mb-2">Web3 Security</h4>
        <CategoryProgressList 
          categories={categoryData.filter(cat => cat.priority === 'web3')}
          threatLevel={threatLevel}
          getValidCategoryProgress={getValidCategoryProgress}
          getProgressColor={getProgressColor}
          bgColor="bg-indigo-500/10"
          changeCount={changeCount}
        />
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-orange-400 mb-2">Operational Security</h4>
        <CategoryProgressList 
          categories={categoryData.filter(cat => cat.priority === 'opsec')}
          threatLevel={threatLevel}
          getValidCategoryProgress={getValidCategoryProgress}
          getProgressColor={getProgressColor}
          bgColor="bg-orange-500/10"
          changeCount={changeCount}
        />
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium text-blue-400 mb-2">Web2 Security</h4>
        <CategoryProgressList 
          categories={categoryData.filter(cat => cat.priority === 'web2')}
          threatLevel={threatLevel}
          getValidCategoryProgress={getValidCategoryProgress}
          getProgressColor={getProgressColor}
          bgColor="bg-blue-500/10"
          changeCount={changeCount}
        />
      </div>

      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-sm font-medium mb-2">Priority Categories</h3>
        {lowPerformingCategories.map(cat => (
          <div key={`${cat.id}-${threatLevel}-${changeCount}`} className="flex items-center gap-2 text-xs text-foreground-secondary mb-1">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <span>{cat.name} needs attention ({cat.progress}% complete)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
