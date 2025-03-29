
#!/usr/bin/env node

/**
 * Contributor Script Setup
 * 
 * This script adds contribution-related npm scripts to package.json
 * to make it easier for contributors to validate and test their changes.
 * 
 * Run with: node src/scripts/setup-contrib-scripts.js
 */

const fs = require('fs');
const path = require('path');

console.log('Adding contributor scripts to package.json...');

// Read package.json
const packageJsonPath = path.join(__dirname, '../../package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error('Error reading package.json:', error);
  process.exit(1);
}

// Add contribution-related scripts
const contributorScripts = {
  "validate": "node src/utils/validateData.ts",
  "validate-updates": "node src/scripts/validate-updates.js",
  "prepare-contribution": "node src/scripts/prepare-contribution.js",
  "type-check": "tsc --noEmit"
};

// Update scripts in package.json
packageJson.scripts = {
  ...packageJson.scripts,
  ...contributorScripts
};

// Write updated package.json
try {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('✅ Scripts added successfully!');
  console.log('\nYou can now run:');
  console.log('- npm run validate           # Check data integrity');
  console.log('- npm run validate-updates   # Validate content updates');
  console.log('- npm run prepare-contribution # Get guidance for contributions');
  console.log('- npm run type-check         # Run TypeScript type checking');
} catch (error) {
  console.error('Error writing to package.json:', error);
  process.exit(1);
}
