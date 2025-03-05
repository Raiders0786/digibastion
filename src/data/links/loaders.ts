
import { SecurityCategory, SecurityTool } from './types';

// Function to load a JSON file containing security category data
export async function loadSecurityCategory(categoryPath: string): Promise<SecurityCategory> {
  try {
    const data = await import(`./json/${categoryPath}.json`);
    return data as SecurityCategory;
  } catch (error) {
    console.error(`Failed to load security category from ${categoryPath}.json:`, error);
    // Return a minimal valid category to prevent application crash
    return {
      name: `Failed to load ${categoryPath}`,
      description: 'Error loading category data. Please check the console for details.',
      tools: []
    };
  }
}

// Load all security categories from the JSON files
export async function loadAllSecurityCategories(): Promise<SecurityCategory[]> {
  const categoryFiles = [
    'applicationSecurity',
    'cloudSecurity',
    'personalSecurity',
    'corporateSecurity',
    'cryptoWalletSecurity',
    'smartContractSecurity',
    'privateKeyManagement',
    'onChainMonitoring',
    'web3BestPractices'
  ];
  
  const categories = await Promise.all(
    categoryFiles.map(file => loadSecurityCategory(file))
  );
  
  return categories;
}

// Helper function to extract all tags from loaded categories
export function extractAllTags(categories: SecurityCategory[]): string[] {
  const tagsSet = new Set<string>();
  
  categories.forEach(category => {
    category.tools.forEach(tool => {
      tool.tags.forEach(tag => tagsSet.add(tag));
    });
  });
  
  return Array.from(tagsSet).sort();
}
