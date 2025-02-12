
export interface SecurityItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface SecurityCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  items: SecurityItem[];
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
