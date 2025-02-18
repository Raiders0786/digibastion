
import { Shield } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CategorySection } from '@/components/tools/CategorySection';
import { toolCategories } from '@/data/tools/categories';
import { Badge } from '@/components/ui/badge';

const Tools = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
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

          <div className="mt-16 bg-card p-8 rounded-lg border border-white/10">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Community Contributions</h3>
              <p className="text-foreground-secondary">
                These tools have been carefully curated from various online resources and community contributions. 
                We extend our heartfelt gratitude to all the original creators and contributors who have dedicated 
                their time and expertise in developing and maintaining these invaluable security tools.
              </p>
              <div className="flex justify-center gap-2 pt-4">
                <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20">
                  Open Source
                </Badge>
                <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20">
                  Community Driven
                </Badge>
                <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20">
                  Security First
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tools;
