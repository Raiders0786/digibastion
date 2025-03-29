
/**
 * Data Validation Utility
 * 
 * This script validates the data structures used in the application
 * to ensure consistency and catch common errors before build time.
 */

import { initialSecurityData } from '../data/securityData';
import { threatProfiles, getItemsForThreatLevel } from '../data/threatProfiles';
import { ThreatLevel } from '../types/threatProfile';

/**
 * Validates the entire application data structure
 * @returns Object containing validation results
 */
export const validateAppData = () => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate security categories
  initialSecurityData.forEach(category => {
    // Check category has an id
    if (!category.id) {
      errors.push(`Category missing ID: ${category.title || 'Unknown'}`);
    }
    
    // Check items
    if (!category.items || !Array.isArray(category.items)) {
      errors.push(`Category ${category.id} has no items array`);
    } else {
      // Check for duplicate item IDs within category
      const itemIds = new Set<string>();
      category.items.forEach(item => {
        if (!item.id) {
          errors.push(`Item missing ID in category ${category.id}: ${item.title || 'Unknown'}`);
        } else if (itemIds.has(item.id)) {
          errors.push(`Duplicate item ID in category ${category.id}: ${item.id}`);
        } else {
          itemIds.add(item.id);
        }
        
        // Check item has title
        if (!item.title) {
          errors.push(`Item ${item.id} in category ${category.id} has no title`);
        }
        
        // Check priority is valid
        if (!['essential', 'recommended', 'advanced'].includes(String(item.priority))) {
          errors.push(`Item ${item.id} has invalid priority: ${item.priority}`);
        }
      });
    }
  });
  
  // Validate threat profiles
  threatProfiles.forEach(profile => {
    if (!profile.id) {
      errors.push(`Threat profile missing ID: ${profile.name || 'Unknown'}`);
    }
  });
  
  // Validate threat level mappings
  initialSecurityData.forEach(category => {
    // Skip 'all' threat level as it includes everything
    threatProfiles
      .filter(p => p.id !== 'all')
      .forEach(profile => {
        const profileItems = getItemsForThreatLevel(category.id, profile.id as ThreatLevel);
        
        // Check if mapping exists
        if (!profileItems || profileItems.length === 0) {
          warnings.push(`No items mapped for category ${category.id} in threat level ${profile.id}`);
        } else {
          // Check if all mapped items exist in the category
          const categoryItemIds = new Set(category.items.map(item => item.id));
          profileItems.forEach(itemId => {
            if (!categoryItemIds.has(itemId)) {
              errors.push(`Item ${itemId} in threat mapping for ${profile.id} does not exist in category ${category.id}`);
            }
          });
        }
      });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: `Validation complete: ${errors.length} errors, ${warnings.length} warnings`
  };
};

/**
 * Run validation and log results to console
 */
export const runValidation = () => {
  console.log('Validating application data...');
  const results = validateAppData();
  
  if (results.errors.length > 0) {
    console.error('❌ Validation errors:');
    results.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (results.warnings.length > 0) {
    console.warn('⚠️ Validation warnings:');
    results.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (results.isValid) {
    console.log('✅ Validation passed successfully!');
  }
  
  return results;
};

// Enable this to run validation during development
// if (process.env.NODE_ENV === 'development') {
//   runValidation();
// }
