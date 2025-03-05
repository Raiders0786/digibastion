
import { ReactNode } from 'react';

export interface Article {
  title: string;
  category: string;
  readTime: string;
  content: ReactNode; 
}

export interface ArticleCollection {
  [key: string]: Article;
}

// Function to load the article JSON data
export async function loadArticleData(articleSlug: string): Promise<Article | null> {
  try {
    const data = await import(`./json/${articleSlug}.json`);
    // Note: Content will need to be rendered separately since JSON can't store React components
    return {
      ...data,
      content: null // The actual rendering will be handled by a separate component
    };
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
