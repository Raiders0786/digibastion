import { ThreatLevel, ThreatProfile, CategoryThreatMapping } from "../types/threatProfile";

export const threatProfiles: ThreatProfile[] = [
  {
    id: "all",
    name: "All Items",
    description: "Show all security items regardless of threat profile",
    icon: "shield",
    color: "from-gray-600 to-gray-800",
  },
  {
    id: "basic",
    name: "Basic",
    description: "General security for everyday users",
    icon: "shield",
    color: "from-blue-600 to-blue-800",
  },
  {
    id: "developer",
    name: "Developer",
    description: "For Web3 developers and builders",
    icon: "code",
    color: "from-purple-600 to-purple-800",
  },
  {
    id: "privacy",
    name: "Privacy",
    description: "Focus on privacy and anonymity",
    icon: "eye-off",
    color: "from-green-600 to-green-800",
  },
  {
    id: "highValue",
    name: "High Value",
    description: "For users with significant assets",
    icon: "disc-3",
    color: "from-amber-600 to-amber-800",
  },
  {
    id: "institution",
    name: "Institution",
    description: "For organizations and DAOs",
    icon: "building",
    color: "from-red-600 to-red-800",
  }
];

// Category and threat level mappings
const categoryThreatMappings: CategoryThreatMapping[] = [
  {
    categoryId: 'wallet',
    basicItems: ['wallet-1', 'wallet-2', 'wallet-4'],
    developerItems: ['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5'],
    privacyItems: ['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-7'],
    highValueItems: ['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-6', 'wallet-7'],
    institutionItems: ['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-6', 'wallet-7']
  },
  {
    categoryId: 'opsec',
    basicItems: ['opsec-1', 'opsec-2', 'opsec-4', 'opsec-11', 'opsec-21', 'opsec-22', 'opsec-24', 'opsec-25', 'opsec-28', 'opsec-29'],
    developerItems: ['opsec-1', 'opsec-2', 'opsec-4', 'opsec-5', 'opsec-6', 'opsec-7', 'opsec-11', 'opsec-12', 'opsec-13', 'opsec-14', 'opsec-15', 'opsec-16', 'opsec-17', 'opsec-18', 'opsec-19', 'opsec-28', 'opsec-29', 'opsec-30', 'opsec-31'],
    privacyItems: ['opsec-1', 'opsec-2', 'opsec-3', 'opsec-4', 'opsec-7', 'opsec-11', 'opsec-12', 'opsec-20', 'opsec-21', 'opsec-22', 'opsec-23', 'opsec-24', 'opsec-25', 'opsec-26', 'opsec-27', 'opsec-28', 'opsec-29'],
    highValueItems: ['opsec-1', 'opsec-2', 'opsec-3', 'opsec-4', 'opsec-5', 'opsec-6', 'opsec-7', 'opsec-8', 'opsec-9', 'opsec-10', 'opsec-11', 'opsec-12', 'opsec-20', 'opsec-21', 'opsec-22', 'opsec-23', 'opsec-24', 'opsec-25', 'opsec-26', 'opsec-27', 'opsec-28', 'opsec-29', 'opsec-30', 'opsec-31', 'opsec-32', 'opsec-33', 'opsec-34'],
    institutionItems: ['opsec-1', 'opsec-2', 'opsec-3', 'opsec-4', 'opsec-5', 'opsec-6', 'opsec-7', 'opsec-8', 'opsec-9', 'opsec-10', 'opsec-11', 'opsec-12', 'opsec-13', 'opsec-14', 'opsec-15', 'opsec-16', 'opsec-17', 'opsec-18', 'opsec-19', 'opsec-20', 'opsec-21', 'opsec-22', 'opsec-23', 'opsec-24', 'opsec-25', 'opsec-26', 'opsec-27', 'opsec-28', 'opsec-29', 'opsec-30', 'opsec-31', 'opsec-32', 'opsec-33', 'opsec-34']
  },
  {
    categoryId: 'authentication',
    basicItems: ['auth-1', 'auth-2', 'auth-3'],
    developerItems: ['auth-1', 'auth-2', 'auth-3', 'auth-4', 'auth-5'],
    privacyItems: ['auth-1', 'auth-2', 'auth-3', 'auth-4', 'auth-6'],
    highValueItems: ['auth-1', 'auth-2', 'auth-3', 'auth-4', 'auth-5', 'auth-6', 'auth-7'],
    institutionItems: ['auth-1', 'auth-2', 'auth-3', 'auth-4', 'auth-5', 'auth-6', 'auth-7', 'auth-8']
  },
  {
    categoryId: 'developers',
    basicItems: ['dev-1', 'dev-2'],
    developerItems: ['dev-1', 'dev-2', 'dev-3', 'dev-4', 'dev-5'],
    privacyItems: ['dev-1', 'dev-2', 'dev-4'],
    highValueItems: ['dev-1', 'dev-2', 'dev-3', 'dev-4', 'dev-5'],
    institutionItems: ['dev-1', 'dev-2', 'dev-3', 'dev-4', 'dev-5']
  },
  {
    categoryId: 'jobs',
    basicItems: ['job-1', 'job-2', 'job-4'],
    developerItems: ['job-1', 'job-2', 'job-3', 'job-4', 'job-5'],
    privacyItems: ['job-1', 'job-2', 'job-3', 'job-4'],
    highValueItems: ['job-1', 'job-2', 'job-3', 'job-4', 'job-5'],
    institutionItems: ['job-1', 'job-2', 'job-3', 'job-4', 'job-5']
  },
  {
    categoryId: 'email',
    basicItems: ['email-1', 'email-2', 'email-3'],
    developerItems: ['email-1', 'email-2', 'email-3', 'email-4'],
    privacyItems: ['email-1', 'email-2', 'email-3', 'email-4', 'email-5', 'email-6'],
    highValueItems: ['email-1', 'email-2', 'email-3', 'email-4', 'email-5', 'email-6'],
    institutionItems: ['email-1', 'email-2', 'email-3', 'email-4', 'email-5', 'email-6', 'email-7']
  },
  {
    categoryId: 'social',
    basicItems: ['social-1', 'social-2'],
    developerItems: ['social-1', 'social-2', 'social-3'],
    privacyItems: ['social-1', 'social-2', 'social-3', 'social-4', 'social-5'],
    highValueItems: ['social-1', 'social-2', 'social-3', 'social-4', 'social-5'],
    institutionItems: ['social-1', 'social-2', 'social-3', 'social-4', 'social-5', 'social-6']
  },
  {
    categoryId: 'mobile',
    basicItems: ['mobile-1', 'mobile-2', 'mobile-3'],
    developerItems: ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4'],
    privacyItems: ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4', 'mobile-5', 'mobile-6'],
    highValueItems: ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4', 'mobile-5', 'mobile-6'],
    institutionItems: ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4', 'mobile-5', 'mobile-6', 'mobile-7']
  },
  {
    categoryId: 'browsing',
    basicItems: ['browsing-1', 'browsing-2', 'browsing-3'],
    developerItems: ['browsing-1', 'browsing-2', 'browsing-3', 'browsing-4'],
    privacyItems: ['browsing-1', 'browsing-2', 'browsing-3', 'browsing-4', 'browsing-5', 'browsing-6'],
    highValueItems: ['browsing-1', 'browsing-2', 'browsing-3', 'browsing-4', 'browsing-5', 'browsing-6'],
    institutionItems: ['browsing-1', 'browsing-2', 'browsing-3', 'browsing-4', 'browsing-5', 'browsing-6', 'browsing-7']
  },
  {
    categoryId: 'os',
    basicItems: ['os-1', 'os-2', 'os-3'],
    developerItems: ['os-1', 'os-2', 'os-3', 'os-4', 'os-5'],
    privacyItems: ['os-1', 'os-2', 'os-3', 'os-4', 'os-5', 'os-6'],
    highValueItems: ['os-1', 'os-2', 'os-3', 'os-4', 'os-5', 'os-6', 'os-7'],
    institutionItems: ['os-1', 'os-2', 'os-3', 'os-4', 'os-5', 'os-6', 'os-7', 'os-8']
  },
  {
    categoryId: 'defi',
    basicItems: ['defi-1', 'defi-2'],
    developerItems: ['defi-1', 'defi-2', 'defi-3'],
    privacyItems: ['defi-1', 'defi-2', 'defi-3', 'defi-4'],
    highValueItems: ['defi-1', 'defi-2', 'defi-3', 'defi-4', 'defi-5', 'defi-6'],
    institutionItems: ['defi-1', 'defi-2', 'defi-3', 'defi-4', 'defi-5', 'defi-6', 'defi-7']
  }
];

/**
 * Get the items that are relevant for a specific threat level and category
 */
export const getItemsForThreatLevel = (categoryId: string, threatLevel: ThreatLevel): string[] => {
  if (threatLevel === 'all') {
    return [];
  }
  
  const mapping = categoryThreatMappings.find(m => m.categoryId === categoryId);
  
  if (!mapping) {
    console.warn(`No threat mapping found for category: ${categoryId}`);
    return [];
  }
  
  switch (threatLevel) {
    case 'basic':
      return mapping.basicItems;
    case 'developer':
      return mapping.developerItems;
    case 'privacy':
      return mapping.privacyItems;
    case 'highValue':
      return mapping.highValueItems;
    case 'institution':
      return mapping.institutionItems;
    default:
      return [];
  }
};
