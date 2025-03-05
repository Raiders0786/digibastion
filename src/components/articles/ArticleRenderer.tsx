
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleRendererProps {
  markdown: string;
}

export const ArticleRenderer: React.FC<ArticleRendererProps> = ({ markdown }) => {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-4xl font-bold mb-6 mt-8" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-3xl font-bold mb-4 mt-8" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-2xl font-bold mb-4 mt-6" {...props} />,
          p: ({node, ...props}) => <p className="mb-4" {...props} />,
          ul: ({node, ...props}) => <ul className="mb-4 ml-6 list-disc" {...props} />,
          ol: ({node, ...props}) => <ol className="mb-4 ml-6 list-decimal" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />,
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-6" {...props} />
          ),
          code: ({node, className, children, ...props}) => {
            // Check if the code block is inside a paragraph (inline) or standalone
            const isInline = !className;
            return isInline ? (
              <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-muted p-4 rounded-md text-sm overflow-x-auto my-4" {...props}>
                {children}
              </code>
            );
          },
          a: ({node, ...props}) => (
            <a className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer" {...props} />
          )
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};
