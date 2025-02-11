
import { useSecurityState } from '../hooks/useSecurityState';
import { SecurityCard } from '../components/SecurityCard';
import { SecurityScore } from '../components/SecurityScore';

const Index = () => {
  const { categories, toggleItem, getCategoryScore, getOverallScore } = useSecurityState();

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            The Ultimate Personal Security Checklist
          </h1>
          <p className="text-lg text-foreground-secondary">
            Your guide to securing your digital life and protecting your privacy
          </p>
        </div>

        <SecurityScore score={getOverallScore()} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map(category => (
            <SecurityCard
              key={category.id}
              category={category}
              score={getCategoryScore(category)}
              onItemToggle={(itemId) => toggleItem(category.id, itemId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
