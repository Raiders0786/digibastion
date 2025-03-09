
import { ThreatProfile, CategoryThreatMapping } from '@/types/threatProfile';

export const threatProfiles: ThreatProfile[] = [
  {
    id: 'basic',
    name: 'Basic Protection',
    description: 'Essential security measures for everyday users against common threats like phishing and malware',
    icon: 'shield',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'developer',
    name: 'Developer Setup',
    description: 'Security practices for developers to protect code, credentials, and development environments',
    icon: 'code',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'privacy',
    name: 'Privacy Focused',
    description: 'Enhanced measures for users seeking stronger privacy and anonymity protections',
    icon: 'eye-off',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'highValue',
    name: 'High-Value Target',
    description: 'Comprehensive protection for individuals managing significant digital assets or sensitive information',
    icon: 'vault',
    color: 'from-amber-500 to-amber-600'
  },
  {
    id: 'institution',
    name: 'Institutional',
    description: 'Enterprise-grade security for organizations facing sophisticated threat actors like nation-states',
    icon: 'building',
    color: 'from-red-500 to-red-600'
  }
];

// This maps categories and their items to specific threat profiles
export const categoryThreatMappings: CategoryThreatMapping[] = [
  {
    categoryId: 'wallet',
    basicItems: ['wallet-1', 'wallet-2', 'wallet-4'],
    developerItems: ['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5'],
    privacyItems: ['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-7'],
    highValueItems: ['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-6', 'wallet-7'],
    institutionItems: ['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-6', 'wallet-7']
  },
  {
    categoryId: 'authentication',
    basicItems: ['auth-1', 'auth-2', 'auth-3', 'auth-4', 'auth-5', 'auth-6', 'auth-7', 'auth-8', 'auth-9', 'auth-10', 'auth-11'],
    developerItems: ['auth-1', 'auth-2', 'auth-3', 'auth-4', 'auth-5', 'auth-6', 'auth-7', 'auth-8', 'auth-9', 'auth-10', 'auth-11', 'auth-12', 'auth-13', 'auth-14', 'auth-15', 'auth-22'],
    privacyItems: ['auth-1', 'auth-2', 'auth-3', 'auth-4', 'auth-5', 'auth-6', 'auth-7', 'auth-8', 'auth-9', 'auth-10', 'auth-11', 'auth-12', 'auth-13', 'auth-14', 'auth-15', 'auth-16', 'auth-17', 'auth-21', 'auth-22'],
    highValueItems: ['auth-1', 'auth-2', 'auth-3', 'auth-4', 'auth-5', 'auth-6', 'auth-7', 'auth-8', 'auth-9', 'auth-10', 'auth-11', 'auth-12', 'auth-13', 'auth-14', 'auth-15', 'auth-16', 'auth-17', 'auth-18', 'auth-19', 'auth-21', 'auth-22'],
    institutionItems: ['auth-1', 'auth-2', 'auth-3', 'auth-4', 'auth-5', 'auth-6', 'auth-7', 'auth-8', 'auth-9', 'auth-10', 'auth-11', 'auth-12', 'auth-13', 'auth-14', 'auth-15', 'auth-16', 'auth-17', 'auth-18', 'auth-19', 'auth-20', 'auth-21', 'auth-22']
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
  // Add mappings for other categories with appropriate item IDs
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
    basicItems: ['defi-1', 'defi-2', 'defi-3', 'defi-4'],
    developerItems: ['defi-1', 'defi-2', 'defi-3', 'defi-4', 'defi-5', 'defi-6'],
    privacyItems: ['defi-1', 'defi-2', 'defi-3', 'defi-4', 'defi-7', 'defi-8', 'defi-9'],
    highValueItems: ['defi-1', 'defi-2', 'defi-3', 'defi-4', 'defi-5', 'defi-6', 'defi-7', 'defi-8', 'defi-9', 'defi-10', 'defi-11', 'defi-12'],
    institutionItems: ['defi-1', 'defi-2', 'defi-3', 'defi-4', 'defi-5', 'defi-6', 'defi-7', 'defi-8', 'defi-9', 'defi-10', 'defi-11', 'defi-12', 'defi-13', 'defi-14', 'defi-15', 'defi-16', 'defi-17', 'defi-18']
  }
];

export const getItemsForThreatLevel = (categoryId: string, threatLevel: string): string[] => {
  const mapping = categoryThreatMappings.find(m => m.categoryId === categoryId);
  if (!mapping) {
    console.warn(`No threat mapping found for category: ${categoryId}`);
    return [];
  }
  
  console.log(`Getting items for category ${categoryId} with threat level ${threatLevel}`);
  
  switch (threatLevel) {
    case 'basic':
      console.log(`Basic items for ${categoryId}:`, mapping.basicItems);
      return mapping.basicItems;
    case 'developer':
      console.log(`Developer items for ${categoryId}:`, mapping.developerItems);
      return mapping.developerItems;
    case 'privacy':
      console.log(`Privacy items for ${categoryId}:`, mapping.privacyItems);
      return mapping.privacyItems;
    case 'highValue':
      console.log(`High Value items for ${categoryId}:`, mapping.highValueItems);
      return mapping.highValueItems;
    case 'institution':
      console.log(`Institution items for ${categoryId}:`, mapping.institutionItems);
      return mapping.institutionItems;
    default:
      console.warn(`Unknown threat level: ${threatLevel}, defaulting to basic`);
      return mapping.basicItems;
  }
};
