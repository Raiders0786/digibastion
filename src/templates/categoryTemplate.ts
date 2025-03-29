
import { SecurityItem } from '../types/security';

/**
 * Template for creating a new security category
 * 
 * Instructions:
 * 1. Copy this file and rename it to your category name (e.g., newCategory.ts)
 * 2. Place it in the src/data/categories/ directory
 * 3. Fill in the items array with your security items
 * 4. Add your category to src/data/securityData.ts
 * 5. Create threat level mappings in src/data/threatProfiles.ts
 */

/**
 * Security items for your category
 */
export const items: SecurityItem[] = [
  {
    id: 'category-1', // Format should be 'categoryPrefix-number'
    title: 'First security item',
    priority: 'essential', // Options: 'essential', 'recommended', 'advanced'
    description: 'Detailed description of what this security item is about and why it matters',
    resources: [
      { name: 'Official Documentation', url: 'https://example.com/docs' },
      { name: 'Tutorial', url: 'https://example.com/tutorial' }
    ],
    actions: [
      'Step 1: First step to implement this security measure',
      'Step 2: Second step to implement this security measure',
      'Step 3: Final step to implement this security measure'
    ],
    additionalInfo: 'Any additional information or context that might be helpful'
  },
  {
    id: 'category-2',
    title: 'Second security item',
    priority: 'recommended',
    description: 'Description of the second security item',
    resources: [
      { name: 'Resource Name', url: 'https://example.com' }
    ],
    actions: [
      'Step 1: Action to take',
      'Step 2: Follow-up action'
    ],
    additionalInfo: 'Additional information about this security measure'
  }
  // Add more items as needed
];
