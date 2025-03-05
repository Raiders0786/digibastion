
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";

interface ArticleRendererProps {
  markdown: string;
  slug: string;
  title: string;
}

export const ArticleRenderer: React.FC<ArticleRendererProps> = ({ markdown, slug, title }) => {
  const { toast } = useToast();

  // Process markdown to remove frontmatter
  const cleanMarkdown = React.useMemo(() => {
    // Remove frontmatter if present
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    return markdown.replace(frontmatterRegex, '');
  }, [markdown]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        url: window.location.href,
      })
      .catch(error => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          toast({
            title: "Link copied",
            description: "The article link has been copied to your clipboard.",
          });
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          toast({
            title: "Error",
            description: "Failed to copy the link to clipboard.",
            variant: "destructive"
          });
        });
    }
  };

  return (
    <div className="article-container">
      <div className="flex justify-end mb-6">
        <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </Button>
      </div>
      
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-4xl font-bold mb-6 mt-8 text-foreground" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-3xl font-bold mb-4 mt-8 text-foreground" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-2xl font-bold mb-4 mt-6 text-foreground" {...props} />,
            p: ({node, ...props}) => <p className="mb-4 text-foreground" {...props} />,
            ul: ({node, ...props}) => <ul className="mb-4 ml-6 list-disc text-foreground" {...props} />,
            ol: ({node, ...props}) => <ol className="mb-4 ml-6 list-decimal text-foreground" {...props} />,
            li: ({node, ...props}) => <li className="mb-1 text-foreground" {...props} />,
            blockquote: ({node, ...props}) => (
              <blockquote className="border-l-4 border-primary pl-4 italic my-6 text-foreground" {...props} />
            ),
            code: ({node, className, children, ...props}) => {
              // Check if the code block is inside a paragraph (inline) or standalone
              const isInline = !className;
              return isInline ? (
                <code className="bg-muted px-1 py-0.5 rounded text-sm text-foreground" {...props}>
                  {children}
                </code>
              ) : (
                <code className="block bg-muted p-4 rounded-md text-sm overflow-x-auto my-4 text-foreground" {...props}>
                  {children}
                </code>
              );
            },
            a: ({node, ...props}) => (
              <a className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer" {...props} />
            ),
            img: ({node, ...props}) => (
              <img className="rounded-lg my-6 max-w-full h-auto" alt={props.alt || "Article image"} {...props} />
            ),
            strong: ({node, ...props}) => (
              <strong className="font-bold text-foreground" {...props} />
            ),
            em: ({node, ...props}) => (
              <em className="italic text-foreground" {...props} />
            )
          }}
        >
          {cleanMarkdown}
        </ReactMarkdown>
      </div>

      <div className="mt-12 pt-6 border-t border-white/10">
        <div className="flex justify-between items-center">
          <p className="text-sm text-foreground-secondary">Thanks for reading!</p>
          <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            <span>Share this article</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
