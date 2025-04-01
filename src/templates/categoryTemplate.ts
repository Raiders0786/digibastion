
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
    description: 'Detailed description of what this security item is about and why it matters',
    completed: false,
    level: 'essential', // Must match priority for consistency
    details: 'Detailed description of what this security item is about and why it matters',
    links: [
      { text: 'Official Documentation', url: 'https://example.com/docs' },
      { text: 'Tutorial', url: 'https://example.com/tutorial' }
    ],
    // Removed additionalInfo as it doesn't exist in the SecurityItem type
    threatLevels: ['basic'],
    priority: 1 // Use number for priority
  },
  {
    id: 'category-2',
    title: 'Second security item',
    description: 'Description of the second security item',
    completed: false,
    level: 'recommended', // Must match priority for consistency
    details: 'Description of the second security item',
    links: [
      { text: 'Resource Name', url: 'https://example.com' }
    ],
    // Removed additionalInfo as it doesn't exist in the SecurityItem type
    threatLevels: ['basic'],
    priority: 2 // Use number for priority
  }
  // Add more items as needed
];
