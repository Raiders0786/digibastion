import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import { articles } from '@/data/articles';
import { getArticleBySlug } from '@/data/articlesData';
import { getArticleContent } from '@/data/articleContent';
import { ArticleHeader } from '@/components/article/ArticleHeader';
import { NotFoundView } from '@/components/article/NotFoundView';
import { MetaTags } from '../components/MetaTags';
import { RelatedArticles } from '@/components/article/RelatedArticles';

const ArticleDetail = () => {
  const { slug } = useParams();
  
  // Try new article system first, fall back to legacy
  const newArticle = getArticleBySlug(slug || '');
  const legacyArticle = articles[slug as keyof typeof articles];
  
  const article = newArticle || legacyArticle;

  if (!article) {
    return <NotFoundView />;
  }

  const articleUrl = `https://www.digibastion.com/articles/${slug}`;
  const title = newArticle ? newArticle.title : legacyArticle?.title || '';
  const description = newArticle ? newArticle.description : `Learn about ${title} in this comprehensive guide from Digibastion`;
  const category = newArticle ? newArticle.category : legacyArticle?.category || 'Security';
  const readTime = newArticle ? newArticle.readTime : legacyArticle?.readTime || '10 min read';
  const publishedDate = newArticle ? newArticle.publishedAt : '2024-06-01';
  const modifiedDate = newArticle ? newArticle.modifiedAt : '2025-01-15';
  const author = newArticle ? newArticle.author : 'Digibastion Security Team';
  const tags = newArticle ? newArticle.tags : ['web3 security', 'crypto security'];
  const difficulty = newArticle ? newArticle.difficulty : 'intermediate';

  // JSON-LD structured data for article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Organization",
      "name": author,
      "url": "https://www.digibastion.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Digibastion",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.digibastion.com/favicon.png"
      }
    },
    "datePublished": publishedDate,
    "dateModified": modifiedDate,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    },
    "keywords": tags.join(', '),
    "articleSection": category,
    "image": "https://www.digibastion.com/og-image.png"
  };

  // Get content - new system or legacy
  const content = newArticle 
    ? getArticleContent(slug || '', title)
    : legacyArticle?.content;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title={`${title} | Digibastion Security Guide`}
        description={description}
        image="https://www.digibastion.com/og-image.png"
        type="article"
        canonical={articleUrl}
        keywords={tags.join(', ')}
      />
      
      {/* Article Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <Link 
            to="/articles"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Link>
          
          <ArticleHeader 
            title={title}
            category={category}
            readTime={readTime}
          />

          <div className="prose prose-invert max-w-none mt-8">
            <div className="text-foreground/80 space-y-6">
              {content}
            </div>
          </div>

          {/* Internal Linking - Related Articles */}
          <RelatedArticles 
            currentSlug={slug || ''}
            category={category}
            tags={tags}
            limit={4}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ArticleDetail;
