
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

export const securityResources: SecurityResourcesData = {
  metadataVersion: "1.2",
  lastUpdated: "2025-02-26",
  categories: [
    // ... your provided JSON data here
  ]
};

export const getAllTags = (): string[] => {
  const tagsSet = new Set<string>();
  securityResources.categories.forEach(category => {
    category.tools.forEach(tool => {
      tool.tags.forEach(tag => tagsSet.add(tag));
    });
  });
  return Array.from(tagsSet).sort();
};
