
import { ReactNode } from 'react';

export interface Article {
  title: string;
  category: string;
  readTime: string;
  content: string;
  slug: string;
}

export interface ArticleListItem {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  featured: boolean;
}

// Function to load article metadata (for listings)
export async function loadAllArticleMeta(): Promise<ArticleListItem[]> {
  try {
    // Define our articles metadata here for simplicity
    return [
      {
        slug: "privacy-security-web3-opsec",
        title: "Privacy, Security, and Web3 OPSEC: Complete Guide",
        category: "Security",
        readTime: "15 min read",
        featured: true
      },
      {
        slug: "getting-started-web3-security",
        title: "Getting Started with Web3 Security: Essential Guide for Beginners",
        category: "Security",
        readTime: "10 min read",
        featured: false
      },
      {
        slug: "social-engineering-web3",
        title: "Social Engineering in Web3: Complete Guide to Avoiding Scams",
        category: "Security",
        readTime: "12 min read",
        featured: false
      },
      {
        slug: "advanced-wallet-security",
        title: "Advanced Wallet Security: Best Practices for Protecting Your Crypto Assets",
        category: "Security",
        readTime: "15 min read",
        featured: false
      }
    ];
  } catch (error) {
    console.error('Failed to load article index:', error);
    return [];
  }
}

// Function to load the article Markdown data
export async function loadArticleData(articleSlug: string): Promise<Article | null> {
  try {
    // Try loading Markdown
    try {
      const markdownModule = await import(`./markdown/${articleSlug}.md?raw`);
      const mdContent = markdownModule.default;
      
      // Extract frontmatter from markdown
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
          if (!line.includes(':')) return;
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
        content,
        slug: articleSlug
      };
    } catch (error) {
      console.error(`Error loading markdown for ${articleSlug}:`, error);
      return {
        title: "Article not found",
        category: "Error",
        readTime: "1 min read",
        content: "# Article Not Found\n\nThe requested article could not be loaded.",
        slug: articleSlug
      };
    }
  } catch (error) {
    console.error(`Failed to load article ${articleSlug}:`, error);
    return null;
  }
}
