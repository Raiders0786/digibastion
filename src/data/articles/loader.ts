
import { ReactNode } from 'react';

export interface Article {
  title: string;
  category: string;
  readTime: string;
  content: string;
  slug: string;
  author?: string;
}

export interface ArticleListItem {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  featured: boolean;
  author?: string;
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
        featured: true,
        author: "Digibastion Team"
      },
      {
        slug: "getting-started-web3-security",
        title: "Getting Started with Web3 Security: Essential Guide for Beginners",
        category: "Security",
        readTime: "10 min read",
        featured: false,
        author: "Security Expert"
      },
      {
        slug: "social-engineering-web3",
        title: "Social Engineering in Web3: Complete Guide to Avoiding Scams",
        category: "Security",
        readTime: "12 min read",
        featured: false,
        author: "Cybersecurity Analyst"
      },
      {
        slug: "advanced-wallet-security",
        title: "Advanced Wallet Security: Best Practices for Protecting Your Crypto Assets",
        category: "Security",
        readTime: "15 min read",
        featured: false,
        author: "Crypto Security Specialist"
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
    // Create a mapping of article slugs to their respective import paths
    const articleImports: Record<string, () => Promise<any>> = {
      'privacy-security-web3-opsec': () => import('./markdown/privacy-security-web3-opsec.md?raw'),
      'getting-started-web3-security': () => import('./markdown/getting-started-web3-security.md?raw'),
      'social-engineering-web3': () => import('./markdown/social-engineering-web3.md?raw'),
      'advanced-wallet-security': () => import('./markdown/advanced-wallet-security.md?raw')
    };
    
    if (!articleImports[articleSlug]) {
      console.error(`No article found with slug: ${articleSlug}`);
      return null;
    }
    
    // Load the Markdown content
    const markdownModule = await articleImports[articleSlug]();
    const mdContent = markdownModule.default;
    
    // Extract frontmatter from markdown
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = mdContent.match(frontmatterRegex);
    
    let title = articleSlug.replace(/-/g, ' ');
    let category = 'Security';
    let readTime = '5 min read';
    let author = 'Digibastion Team';
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
        if (key === 'author') author = value;
      });
    }

    // Get author from metadata if not found in frontmatter
    if (!author) {
      const meta = await loadAllArticleMeta();
      const articleMeta = meta.find(item => item.slug === articleSlug);
      if (articleMeta?.author) {
        author = articleMeta.author;
      }
    }
    
    return {
      title,
      category,
      readTime,
      content,
      slug: articleSlug,
      author
    };
  } catch (error) {
    console.error(`Failed to load article ${articleSlug}:`, error);
    return null;
  }
}
