
import { Shield } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { CategorySection } from '@/components/tools/CategorySection';
import { toolCategories } from '@/data/tools/categories';

const Tools = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Web3 Security Tools</h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              A curated collection of essential tools for Web3 security and analysis, gathered from various online resources 
              and community contributions to help secure your digital assets.
            </p>
          </div>

          <div className="grid gap-12 animate-slide-up">
            {toolCategories.map((category, index) => (
              <CategorySection 
                key={index} 
                category={category} 
                isLast={index === toolCategories.length - 1} 
              />
            ))}
          </div>

          <div className="mt-16 text-center text-sm text-foreground-secondary">
            <p>
              These tools have been collected from various online resources and community contributions. 
              Credits are due to all the original creators and contributors who have made efforts in 
              developing and maintaining these valuable security tools.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tools;
