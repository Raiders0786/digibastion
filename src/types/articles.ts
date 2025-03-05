
export interface ArticleSection {
  type: 'introduction' | 'section' | 'tip' | 'conclusion';
  title: string;
  content: string;
}

export interface Article {
  title: string;
  category: string;
  readTime: string;
  content?: string;
  sections?: ArticleSection[];
}
