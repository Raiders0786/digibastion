
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../ui/button';
import { Share2, Twitter, Linkedin, Mail, MessageSquare } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";
import { handleShare } from "../../utils/share";

interface ArticleRendererProps {
  markdown: string;
  slug: string;
  title: string;
  hideTitle?: boolean;
  authorName?: string;
}

export const ArticleRenderer: React.FC<ArticleRendererProps> = ({
  markdown,
  slug,
  title,
  hideTitle = false,
  authorName = "Digibastion Team"
}) => {
  const { toast } = useToast();

  // Process markdown to remove frontmatter
  const cleanMarkdown = React.useMemo(() => {
    // Remove frontmatter if present
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    return markdown.replace(frontmatterRegex, '');
  }, [markdown]);

  const url = window.location.href;

  const handleShareAction = (type: 'copy' | 'twitter' | 'linkedin' | 'reddit' | 'email') => {
    handleShare(type, url, title);
  };

  return (
    <div className="article-container animate-fade-in">
      {!hideTitle && (
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">{title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">By {authorName}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-6 space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleShareAction('twitter')}
          className="flex items-center gap-2 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]"
        >
          <Twitter className="w-4 h-4" />
          <span className="hidden sm:inline">Twitter</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleShareAction('linkedin')}
          className="flex items-center gap-2 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]"
        >
          <Linkedin className="w-4 h-4" />
          <span className="hidden sm:inline">LinkedIn</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleShareAction('reddit')}
          className="flex items-center gap-2 hover:bg-[#FF4500]/10 hover:text-[#FF4500]"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Reddit</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleShareAction('email')}
          className="flex items-center gap-2 hover:bg-primary/10"
        >
          <Mail className="w-4 h-4" />
          <span className="hidden sm:inline">Email</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleShareAction('copy')}
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Copy Link</span>
        </Button>
      </div>
      
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-4xl font-bold mb-6 mt-8 text-foreground border-b pb-2 border-border" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-3xl font-bold mb-4 mt-8 text-foreground border-b pb-2 border-border" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-2xl font-bold mb-4 mt-6 text-foreground" {...props} />,
            p: ({node, ...props}) => <p className="mb-4 text-foreground leading-relaxed" {...props} />,
            ul: ({node, ...props}) => <ul className="mb-4 ml-6 list-disc text-foreground" {...props} />,
            ol: ({node, ...props}) => <ol className="mb-4 ml-6 list-decimal text-foreground" {...props} />,
            li: ({node, ...props}) => <li className="mb-2 text-foreground" {...props} />,
            blockquote: ({node, ...props}) => (
              <blockquote className="border-l-4 border-primary pl-4 italic my-6 text-foreground bg-primary/5 p-4 rounded-r" {...props} />
            ),
            code: ({node, className, children, ...props}) => {
              // Check if the code block is inside a paragraph (inline) or standalone
              const isInline = !className;
              return isInline ? (
                <code className="bg-secondary text-foreground px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              ) : (
                <pre className="bg-secondary p-4 rounded-md overflow-x-auto my-4">
                  <code className="text-foreground text-sm font-mono" {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
            a: ({node, ...props}) => (
              <a className="text-primary hover:text-primary/80 underline transition-colors duration-200" target="_blank" rel="noopener noreferrer" {...props} />
            ),
            img: ({node, ...props}) => (
              <img className="rounded-lg my-6 max-w-full h-auto shadow-lg border border-border" alt={props.alt || "Article image"} {...props} />
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

      <div className="mt-12 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Written by <span className="font-medium">{authorName}</span></p>
            <p className="text-sm text-muted-foreground mt-1">Thanks for reading!</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleShareAction('twitter')}
              className="flex items-center gap-2 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]"
            >
              <Twitter className="w-4 h-4" />
              <span>Share on Twitter</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleShareAction('copy')}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Copy Link</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
