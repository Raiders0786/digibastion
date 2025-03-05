
import { SecurityResourcesData } from "./types";
import { applicationSecurity } from "./categories/applicationSecurity";
import { cloudSecurity } from "./categories/cloudSecurity";
import { personalSecurity } from "./categories/personalSecurity";
import { corporateSecurity } from "./categories/corporateSecurity";
import { cryptoWalletSecurity } from "./categories/cryptoWalletSecurity";
import { smartContractSecurity } from "./categories/smartContractSecurity";
import { privateKeyManagement } from "./categories/privateKeyManagement";
import { onChainMonitoring } from "./categories/onChainMonitoring";
import { web3BestPractices } from "./categories/web3BestPractices";

export const securityResources: SecurityResourcesData = {
  metadataVersion: "1.2",
  lastUpdated: "2025-02-26",
  categories: [
    applicationSecurity,
    cloudSecurity,
    personalSecurity,
    corporateSecurity,
    cryptoWalletSecurity,
    smartContractSecurity,
    privateKeyManagement,
    onChainMonitoring,
    web3BestPractices
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

// Re-export types for convenient access
export * from "./types";
