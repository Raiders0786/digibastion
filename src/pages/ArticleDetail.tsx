
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Shield, Clock, Calendar } from 'lucide-react';
import { loadArticleData } from '../data/articles/loader';
import { ArticleRenderer, ArticleSection } from '../components/articles/ArticleRenderer';

interface ArticleData {
  title: string;
  category: string;
  readTime: string;
  sections: ArticleSection[];
}

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) {
        setError('Article not found');
        setLoading(false);
        return;
      }

      try {
        const data = await loadArticleData(slug);
        if (data) {
          setArticle(data as unknown as ArticleData);
        } else {
          setError('Failed to load article');
        }
      } catch (err) {
        console.error('Error loading article:', err);
        setError('Error loading article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-xl">Loading article...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
            <p>{error || 'The requested article could not be found.'}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title={`${article.title} | Digibastion`}
        description={`Read about ${article.title}. A comprehensive guide to Web3 security.`}
        type="article"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">{article.category}</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-6">{article.title}</h1>
            <div className="flex items-center gap-4 text-foreground-secondary">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{article.readTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            {article.sections && <ArticleRenderer sections={article.sections} />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticleDetail;
