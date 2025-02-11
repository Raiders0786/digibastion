
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

export interface SecurityState {
  categories: SecurityCategory[];
}
