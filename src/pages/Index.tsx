
import { useSecurityState } from '../hooks/useSecurityState';
import { SecurityCard } from '../components/SecurityCard';
import { SecurityScore } from '../components/SecurityScore';
import { Navbar } from '../components/Navbar';

const Index = () => {
  const { categories, toggleItem, getCategoryScore, getOverallScore, getStats } = useSecurityState();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              The Ultimate Web3 Security Checklist
            </h1>
            <p className="text-lg text-foreground-secondary">
              Your comprehensive guide to securing your digital assets and protecting your privacy in the Web3 era
            </p>
          </div>

          <SecurityScore score={getOverallScore()} stats={getStats()} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
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
      </main>
    </div>
  );
};

export default Index;
