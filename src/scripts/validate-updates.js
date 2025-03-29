
#!/usr/bin/env node

/**
 * Update Validation Script
 * 
 * This script helps contributors validate their updates to existing content
 * by checking for common issues and inconsistencies.
 * 
 * Run with: node src/scripts/validate-updates.js
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('🔍 Digibastion Update Validator');
console.log('========================================');

// Check for data structure consistency
console.log('\n📋 Checking category files structure...');

const categoriesDir = path.join(__dirname, '../data/categories');
const categoryFiles = fs.readdirSync(categoriesDir).filter(file => file.endsWith('.ts'));

let hasStructureIssues = false;

categoryFiles.forEach(file => {
  const filePath = path.join(categoriesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Simple pattern checks (these are not foolproof but help catch obvious issues)
  const hasExportDefault = content.includes('export const');
  const hasIdField = content.includes('id:');
  const hasTitleField = content.includes('title:');
  const hasItemsArray = content.includes('items:') && content.includes('[');
  
  if (!hasExportDefault || !hasIdField || !hasTitleField || !hasItemsArray) {
    console.log(`  ❌ ${file} may have structure issues`);
    hasStructureIssues = true;
  } else {
    console.log(`  ✅ ${file}`);
  }
});

if (hasStructureIssues) {
  console.log('\n⚠️  Some files may have structure issues. Please review them manually.');
} else {
  console.log('\n✅ All category files appear to have the correct structure.');
}

// Check for broken links (basic check)
console.log('\n📋 Checking for potentially broken links...');
const urlPattern = /url: ['"]([^'"]+)['"]/g;

const checkFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  const urls = [];
  
  while ((match = urlPattern.exec(content)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
};

const allUrls = [];
let filesWithUrls = 0;

// Check categories
categoryFiles.forEach(file => {
  const filePath = path.join(categoriesDir, file);
  const urls = checkFile(filePath);
  
  if (urls.length > 0) {
    filesWithUrls++;
    allUrls.push(...urls);
  }
});

// Check link categories
const linksDir = path.join(__dirname, '../data/links/categories');
if (fs.existsSync(linksDir)) {
  const linkFiles = fs.readdirSync(linksDir).filter(file => file.endsWith('.ts'));
  
  linkFiles.forEach(file => {
    const filePath = path.join(linksDir, file);
    const urls = checkFile(filePath);
    
    if (urls.length > 0) {
      filesWithUrls++;
      allUrls.push(...urls);
    }
  });
}

// Basic URL checks (not comprehensive)
const suspiciousUrls = allUrls.filter(url => {
  return url.includes('localhost') || 
         url.includes('example.com') || 
         !url.startsWith('http');
});

if (suspiciousUrls.length > 0) {
  console.log('\n⚠️  Found potentially problematic URLs:');
  suspiciousUrls.forEach(url => {
    console.log(`  - ${url}`);
  });
} else {
  console.log(`\n✅ Checked ${allUrls.length} URLs across ${filesWithUrls} files. No obvious issues found.`);
}

// Missing resource links check
console.log('\n📋 Checking for items without resource links...');

let itemsWithoutLinks = 0;
let totalItems = 0;

categoryFiles.forEach(file => {
  const filePath = path.join(categoriesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Very basic pattern matching (not foolproof)
  const itemSections = content.match(/{\s*id:\s*['"][^'"]+['"]/g) || [];
  totalItems += itemSections.length;
  
  const itemsWithLinks = (content.match(/links:\s*\[/g) || []).length;
  itemsWithoutLinks += itemSections.length - itemsWithLinks;
});

console.log(`  ${itemsWithoutLinks} out of ${totalItems} items don't have resource links.`);
if (itemsWithoutLinks > 0) {
  console.log('  ⚠️  Consider adding helpful resource links to items where appropriate.');
}

// Summary
console.log('\n========================================');
console.log('✅ Validation complete!');
console.log('');
console.log('Next steps:');
console.log('1. Run the full TypeScript check with: npm run type-check');
console.log('2. Test your changes in the UI with: npm run dev');
console.log('3. Build the project with: npm run build');
console.log('========================================');
