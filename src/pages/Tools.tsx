import { Shield, Github } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { toMetaTagsProps, toolsRouteMeta } from '@/seo/routeMeta';
import { CategorySection } from '@/components/tools/CategorySection';
import { toolCategories } from '@/data/tools/categories';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { serializeJsonLd } from '@/utils/jsonLd';
import { GITHUB_ISSUES_URL } from '@/seo/siteFacts';

const toolCount = toolCategories.reduce((sum, category) => sum + category.tools.length, 0);
const toolsMeta = toolsRouteMeta(toolCount);

const Tools = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags {...toMetaTagsProps(toolsMeta)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Web3 Security Tools Directory",
            "description":
              toolsMeta.description,
            "url": "https://www.digibastion.com/tools",
            "mainEntity": {
              "@type": "ItemList",
              "name": "Web3 Security Tools",
              "numberOfItems": toolCount,
              "itemListElement": toolCategories.flatMap((cat, ci) =>
                (cat.tools || []).map((t, ti) => ({
                  "@type": "ListItem",
                  "position": ci * 100 + ti + 1,
                  "item": {
                    "@type": "SoftwareApplication",
                    "name": t.name,
                    "applicationCategory": "SecurityApplication",
                    "operatingSystem": "Web",
                    "url": t.link,
                    "description": t.description,
                  },
                })),
              ),
            },
          }),
        }}
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Web3 Security Tools</h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Tools we link to for checking addresses and contracts, investigating incidents, protecting wallets and keeping
              keys offline. We do not audit these tools; check each one yourself before you trust it with funds.
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

          <Card className="mt-16 p-8 bg-gradient-to-b from-card/80 to-card border border-white/10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Suggest a tool</h2>
                <p className="text-foreground-secondary">
                  Know a tool that belongs here, or one that has gone bad? Open an issue or a pull request on GitHub.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="bg-primary/5 hover:bg-primary/10"
                  asChild
                >
                  <a
                    href={GITHUB_ISSUES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    Open an issue on GitHub
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tools;
