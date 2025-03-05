
import { SecurityResourcesData, SecurityCategory } from "./types";
import { loadAllSecurityCategories, extractAllTags } from './loaders';

// Initialize with empty categories that will be populated asynchronously
export const securityResources: SecurityResourcesData = {
  metadataVersion: "1.2",
  lastUpdated: "2025-02-26",
  categories: []
};

// Load security categories asynchronously
async function initializeSecurityResources() {
  try {
    const categories = await loadAllSecurityCategories();
    securityResources.categories = categories;
    console.log('Security resources loaded successfully:', 
      categories.length, 'categories,',
      categories.reduce((total, cat) => total + cat.tools.length, 0), 'tools');
  } catch (error) {
    console.error('Failed to initialize security resources:', error);
  }
}

// Call the initialization function when the module is loaded
initializeSecurityResources();

// Function to get all unique tags from the loaded security resources
export const getAllTags = (): string[] => {
  return extractAllTags(securityResources.categories);
};

// Re-export types for convenient access
export * from "./types";
