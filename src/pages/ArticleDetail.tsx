import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { articles } from '@/data/articles';
import { ArticleHeader } from '@/components/article/ArticleHeader';
import { NotFoundView } from '@/components/article/NotFoundView';
import { MetaTags } from '../components/MetaTags';

const ArticleDetail = () => {
  const { slug } = useParams();
  const article = articles[slug as keyof typeof articles];
  const [ogImage, setOgImage] = useState<string>('');

  useEffect(() => {
    if (article) {
      // Properly encode the title for the OG image URL
      const encodedTitle = encodeURIComponent(article.title)
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/'/g, '%27')
        .replace(/"/g, '%22');

      const ogImageUrl = `https://og-image.vercel.app/${encodedTitle}.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Fsecurequest-checklist.com%2Flovable-uploads%2F01298c2c-83d8-446e-b2e5-9199490d5f4e.png&widths=350&heights=350`;
      setOgImage(ogImageUrl);
    }
  }, [article]);

  if (!article) {
    return <NotFoundView />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title={`${article.title} - Digibastion`}
        description={`Learn about ${article.title} in this comprehensive guide from Digibastion`}
        image={ogImage}
        type="article"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <Link 
            to="/articles"
            className="inline-flex items-center text-primary hover:text-primary-hover mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Link>
          
          {ogImage && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-xl border border-primary/20">
              <img 
                src={ogImage} 
                alt={article.title}
                className="w-full h-auto"
                loading="eager"
                fetchPriority="high"
                width="1200"
                height="630"
              />
            </div>
          )}
          
          <ArticleHeader 
            title={article.title}
            category={article.category}
            readTime={article.readTime}
          />

          <div className="prose prose-invert max-w-none">
            <div className="text-foreground/80 space-y-6">
              {article.content}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ArticleDetail;
