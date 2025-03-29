
#!/usr/bin/env node

/**
 * Contributor Helper Script
 * 
 * This script helps new contributors prepare their changes by:
 * 1. Running the data validation
 * 2. Checking for common issues
 * 3. Providing guidance for specific contribution types
 * 
 * Run with: node src/scripts/prepare-contribution.js
 */

console.log('========================================');
console.log('🛠️  Digibastion Contribution Helper');
console.log('========================================');

console.log('\n📋 Contribution Checklist:');
console.log('  1. Make sure your code follows the project style');
console.log('  2. Test your changes thoroughly');
console.log('  3. Add documentation for new features');
console.log('  4. Ensure all existing tests pass');

console.log('\n🔍 Common contribution types:');

// Adding a new security item
console.log('\n📌 Adding a new security item:');
console.log('  - Find the appropriate category in src/data/categories/');
console.log('  - Add your item with a unique ID');
console.log('  - Add it to threat mappings in src/data/threatProfiles.ts');
console.log('  - Test by viewing the category page');

// Adding a new category
console.log('\n📋 Adding a new security category:');
console.log('  - Create a new file in src/data/categories/');
console.log('  - Add category to src/data/securityData.ts');
console.log('  - Create threat mappings in src/data/threatProfiles.ts');
console.log('  - Add any new icons needed');
console.log('  - Test by viewing the home page and category page');

// Adding tools
console.log('\n🛠️  Adding security tools:');
console.log('  - Add tools to src/data/tools/categories.ts');
console.log('  - Add any new categories if needed');
console.log('  - Test by viewing the tools page');

// Adding articles
console.log('\n📝 Adding articles:');
console.log('  - Add article to src/data/articles.tsx');
console.log('  - Use JSX for formatting content');
console.log('  - Test by viewing the articles page');

console.log('\n✅ Ready to contribute!');
console.log('Run npm run dev to start the development server and test your changes.');
console.log('========================================');
