
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
