
import React from 'react';

export interface ArticleSection {
  type: 'introduction' | 'section' | 'tip' | 'conclusion';
  title: string;
  content: string;
}

interface ArticleRendererProps {
  sections: ArticleSection[];
}

export const ArticleRenderer: React.FC<ArticleRendererProps> = ({ sections }) => {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => {
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
