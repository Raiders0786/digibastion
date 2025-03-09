
export interface SecurityItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  level: 'essential' | 'recommended' | 'optional' | 'advanced';
  details: string;
  links?: { text: string; url: string }[];
  ignored?: boolean;
  
  // Enhanced metadata
  threatLevels?: ThreatLevel[]; // List of applicable threat levels
  dependencies?: string[]; // IDs of items this depends on
  priority?: number; // 1-5 priority score (higher = more important)
}

export interface SecurityCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  items: SecurityItem[];
  longDescription?: string;
}

export interface SecurityStats {
  total: number;
  completed: number;
  essential: number;
  optional: number;
  advanced: number;
  criticalRemaining: number;
  recommendedRemaining: number;
}

export interface SecurityState {
  categories: SecurityCategory[];
}
