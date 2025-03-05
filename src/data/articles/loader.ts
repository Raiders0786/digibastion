
import { ReactNode } from 'react';

export interface Article {
  title: string;
  category: string;
  readTime: string;
  content: string; // Changed to string for Markdown content
}

export interface ArticleCollection {
  [key: string]: Article;
}

// Function to load the article JSON or MD data
export async function loadArticleData(articleSlug: string): Promise<Article | null> {
  try {
    // Try loading JSON first
    try {
      const data = await import(`./json/${articleSlug}.json`);
      return data as Article;
    } catch (jsonError) {
      // If JSON fails, try loading Markdown
      const markdownModule = await import(`./markdown/${articleSlug}.md?raw`);
      const mdContent = markdownModule.default;
      
      // Extract frontmatter from markdown (simple implementation)
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
      const match = mdContent.match(frontmatterRegex);
      
      let title = articleSlug.replace(/-/g, ' ');
      let category = 'Security';
      let readTime = '5 min read';
      let content = mdContent;
      
      if (match) {
        const frontmatter = match[1];
        const frontmatterLines = frontmatter.split('\n');
        frontmatterLines.forEach(line => {
          const [key, value] = line.split(':').map(part => part.trim());
          if (key === 'title') title = value;
          if (key === 'category') category = value;
          if (key === 'readTime') readTime = value;
        });
        
        // Remove frontmatter from content
        content = mdContent.replace(frontmatterRegex, '');
      }
      
      return {
        title,
        category,
        readTime,
        content
      };
    }
  } catch (error) {
    console.error(`Failed to load article ${articleSlug}:`, error);
    return null;
  }
}

// Function to load all article metadata for listings
export async function loadAllArticleMeta(): Promise<{slug: string, title: string, category: string, readTime: string, featured: boolean}[]> {
  try {
    const { articles } = await import('./json/index.json');
    return articles;
  } catch (error) {
    console.error('Failed to load article index:', error);
    return [];
  }
}
