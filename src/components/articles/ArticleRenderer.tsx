
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ArticleSection {
  type: 'introduction' | 'section' | 'tip' | 'conclusion';
  title: string;
  content: string;
}

interface ArticleRendererProps {
  sections?: ArticleSection[];
  markdown?: string;
}

export const ArticleRenderer: React.FC<ArticleRendererProps> = ({ sections, markdown }) => {
  // If markdown is provided, render it with ReactMarkdown
  if (markdown) {
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
            code: ({node, inline, ...props}) => 
              inline ? (
                <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />
              ) : (
                <code className="block bg-muted p-4 rounded-md text-sm overflow-x-auto my-4" {...props} />
              ),
            a: ({node, ...props}) => (
              <a className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer" {...props} />
            )
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    );
  }

  // Fall back to the original section-based rendering
  return (
    <div className="space-y-8">
      {sections?.map((section, index) => {
        switch (section.type) {
          case 'introduction':
            return (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <div className="bg-card/50 p-6 rounded-lg mb-6">
                  <h3 className="font-bold mb-2">TL;DR</h3>
                  <p>{section.content}</p>
                </div>
              </div>
            );
          
          case 'section':
            return (
              <section key={index}>
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <div className="bg-card/50 p-6 rounded-lg">
                  <p>{section.content}</p>
                </div>
              </section>
            );
          
          case 'tip':
            return (
              <div key={index} className="p-4 bg-primary/10 rounded-lg">
                <strong className="text-primary">{section.title}:</strong> {section.content}
              </div>
            );
          
          case 'conclusion':
            return (
              <section key={index}>
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <div className="bg-card/50 p-6 rounded-lg">
                  <p>{section.content}</p>
                </div>
              </section>
            );
          
          default:
            return <div key={index}>{section.content}</div>;
        }
      })}
    </div>
  );
};
