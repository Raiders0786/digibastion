
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { articles } from '@/data/articles';
import { ArticleHeader } from '@/components/article/ArticleHeader';
import { NotFoundView } from '@/components/article/NotFoundView';

const ArticleDetail = () => {
  const { slug } = useParams();
  const article = articles[slug as keyof typeof articles];
  const [ogImage, setOgImage] = useState<string>('');

  useEffect(() => {
    if (article) {
      const ogImageUrl = `https://og-image.vercel.app/**${encodeURIComponent(
        article.title
      )}**.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Fsecurequest-checklist.com%2Flovable-uploads%2F01298c2c-83d8-446e-b2e5-9199490d5f4e.png&backgroundColor=rgb(26%2C31%2C44)&textColor=rgb(155%2C135%2C245)`;
      
      setOgImage(ogImageUrl);
      
      // Remove existing meta tags first
      const existingMetaTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
      existingMetaTags.forEach(tag => tag.remove());

      // Add new meta tags
      const metaTags = [
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@securequest' },
        { name: 'twitter:title', content: `${article.title} - SecureQuest Checklist` },
        { name: 'twitter:description', content: `Learn about ${article.title} in this comprehensive guide` },
        { name: 'twitter:image', content: ogImageUrl },
        { property: 'og:title', content: `${article.title} - SecureQuest Checklist` },
        { property: 'og:description', content: `Learn about ${article.title} in this comprehensive guide` },
        { property: 'og:image', content: ogImageUrl },
        { property: 'og:url', content: window.location.href },
        { property: 'og:type', content: 'article' }
      ];

      metaTags.forEach(({ name, property, content }) => {
        const meta = document.createElement('meta');
        if (name) meta.setAttribute('name', name);
        if (property) meta.setAttribute('property', property);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      });

      document.title = `${article.title} - SecureQuest Checklist`;
    }

    // Cleanup function to remove meta tags when component unmounts
    return () => {
      const existingMetaTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
      existingMetaTags.forEach(tag => tag.remove());
    };
  }, [article]);

  if (!article) {
    return <NotFoundView />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
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
    </div>
  );
};

export default ArticleDetail;
