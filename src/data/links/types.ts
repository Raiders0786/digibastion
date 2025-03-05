
export interface SecurityTool {
  title: string;
  url: string;
  description: string;
  tags: string[];
  lastReviewed: string;
  active: boolean;
}

export interface SecurityCategory {
  name: string;
  description: string;
  tools: SecurityTool[];
}

export interface SecurityResourcesData {
  metadataVersion: string;
  lastUpdated: string;
  categories: SecurityCategory[];
}
