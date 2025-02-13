
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
      )}**.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-white.svg&backgroundColor=rgb(26%2C31%2C44)&textColor=rgb(155%2C135%2C245)`;
      
      setOgImage(ogImageUrl);
      
      // Update meta tags
      const ogImageElement = document.getElementById('og-image');
      if (ogImageElement) {
        ogImageElement.setAttribute('content', ogImageUrl);
      }

      // Update other meta tags for better social sharing
      const metaTags = {
        'og:title': `${article.title} - SecureQuest Checklist`,
        'og:description': `Learn about ${article.title} in this comprehensive guide`,
        'og:type': 'article',
        'og:url': window.location.href,
        'twitter:card': 'summary_large_image',
        'twitter:title': article.title,
        'twitter:description': `Learn about ${article.title} in this comprehensive guide`,
        'twitter:image': ogImageUrl
      };

      Object.entries(metaTags).forEach(([property, content]) => {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute('property', property);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      });

      document.title = `${article.title} - SecureQuest Checklist`;
    }
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
