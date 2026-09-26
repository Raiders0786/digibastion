import { useParams, Link, Navigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { getArticleBySlug } from '@/data/articlesData';
import { getArticleContent } from '@/data/articleContent';
import { ArticleHeader } from '@/components/article/ArticleHeader';
import { NotFoundView } from '@/components/article/NotFoundView';
import { MetaTags } from '../components/MetaTags';
import { RelatedArticles } from '@/components/article/RelatedArticles';
import { serializeJsonLd } from '@/utils/jsonLd';
import { buildArticleBreadcrumbSchema, buildArticleSchema } from '@/utils/seo';

const retiredArticleRedirects: Record<string, string> = {
  'web3-wallet-security-guide': '/articles/getting-started-web3-security',
  'defi-security-best-practices': '/articles/defi-smart-contract-audit-checklist',
  'nft-security-guide': '/articles/nft-marketplace-security',
};

const ArticleDetail = () => {
  const { slug } = useParams();

  const retiredDestination = slug ? retiredArticleRedirects[slug] : undefined;
  if (retiredDestination) {
    return <Navigate to={retiredDestination} replace />;
  }

  const article = getArticleBySlug(slug || '');

  if (!article) {
    return <NotFoundView />;
  }

  const articleUrl = `https://www.digibastion.com/articles/${slug}`;
  const { title, description, category, readTime, author, tags } = article;
  const publishedDate = article.publishedAt;
  const modifiedDate = article.modifiedAt;
  const schemaArticle = {
    slug: slug || '',
    title,
    description,
    category,
    publishedAt: publishedDate,
    modifiedAt: modifiedDate,
    author,
    tags,
    sources: article.sources,
  };
  const structuredData = [
    buildArticleSchema(schemaArticle),
    buildArticleBreadcrumbSchema(schemaArticle),
  ];

  const content = getArticleContent(slug || '', title);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title={`${title} | Digibastion`}
        description={description}
        image="https://www.digibastion.com/og-image.png"
        type="article"
        canonical={articleUrl}
        keywords={tags.join(', ')}
        publishedTime={publishedDate}
        modifiedTime={modifiedDate}
        author={author}
        imageAlt={`${title} — Digibastion security guide`}
      />
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">Home</Link></li>
              <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
              <li><Link to="/articles" className="hover:text-primary">Security Guides</Link></li>
              <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
              <li className="text-foreground line-clamp-1" aria-current="page">{title}</li>
            </ol>
          </nav>
          
          <ArticleHeader 
            title={title}
            category={category}
            readTime={readTime}
            publishedAt={publishedDate}
            modifiedAt={modifiedDate}
            author={author}
          />

          <aside className="rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6 mb-8" aria-labelledby="article-summary">
            <h2 id="article-summary" className="text-lg font-semibold text-foreground mb-2">In brief</h2>
            <p className="text-foreground/80 leading-relaxed">{article.summary || description}</p>
            {article.keyTakeaways && (
              <ul className="mt-4 list-disc pl-5 space-y-2 text-sm text-foreground/80">
                {article.keyTakeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}
              </ul>
            )}
          </aside>

          <div className="prose prose-invert max-w-none mt-8">
            <div className="text-foreground/80 space-y-6">
              {content}
            </div>
          </div>

          {article.sources && article.sources.length > 0 && (
            <section className="mt-10 rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6" aria-labelledby="article-sources">
              <h2 id="article-sources" className="text-xl font-semibold text-foreground mb-4">Sources</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Incident facts in this guide are based on primary disclosures and public-sector reporting.
              </p>
              <ul className="space-y-3">
                {article.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group inline-flex items-start gap-2 text-primary hover:underline underline-offset-4"
                    >
                      <span><span className="text-foreground">{source.publisher}:</span> {source.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 mt-1 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link
            to="/articles"
            className="inline-flex items-center text-primary hover:text-primary/80 mt-10 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse all security guides
          </Link>

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
