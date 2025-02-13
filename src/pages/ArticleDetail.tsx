
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { articles } from '@/data/articles';
import { ArticleHeader } from '@/components/article/ArticleHeader';
import { NotFoundView } from '@/components/article/NotFoundView';

const ArticleDetail = () => {
  const { slug } = useParams();
  const article = articles[slug as keyof typeof articles];

  useEffect(() => {
    if (article) {
      const ogImageUrl = `https://og-image.vercel.app/${encodeURIComponent(
        article.title
      )}.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-white.svg`;
      
      const ogImageElement = document.getElementById('og-image');
      if (ogImageElement) {
        ogImageElement.setAttribute('content', ogImageUrl);
      }

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
