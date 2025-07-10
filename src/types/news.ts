export type NewsCategory = 
  | 'operational-security' 
  | 'supply-chain' 
  | 'personal-protection' 
  | 'web3-security' 
  | 'defi-exploits' 
  | 'vulnerability-disclosure' 
  | 'tools-reviews';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AlertType = 'vulnerability' | 'exploit' | 'tool-update' | 'best-practice' | 'incident';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: NewsCategory;
  tags: string[];
  severity: SeverityLevel;
  sourceUrl?: string;
  publishedAt: Date;
  affectedTechnologies?: string[];
  author?: string;
  imageUrl?: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  affectedTechnologies: string[];
  severity: SeverityLevel;
  alertType: AlertType;
  createdAt: Date;
  actionRequired: boolean;
  cveId?: string;
  references?: string[];
}

export interface Subscription {
  email: string;
  technologies: string[];
  categories: NewsCategory[];
  alertFrequency: 'immediate' | 'daily' | 'weekly';
  severityThreshold: SeverityLevel;
  isActive: boolean;
  createdAt: Date;
}

export interface TechnologyCategory {
  id: string;
  name: string;
  description: string;
  technologies: Technology[];
}

export interface Technology {
  id: string;
  name: string;
  category: string;
  description?: string;
  isPopular?: boolean;
}