#!/bin/bash

echo "=== Fixing @repo/db build process ==="

cd packages/db

echo "1. Current build script copies generated client to dist..."

# Update the build script to copy the generated client
node -e "
const fs = require('fs');
const path = require('path');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Update the build script to copy generated files
pkg.scripts.build = 'npm run prisma:generate && tsc && cp -r src/generated dist/';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Updated build script to copy generated client');
"

echo -e "\n2. Rebuilding with new script..."
pnpm run build

echo -e "\n3. Verifying the fix..."
ls -la dist/generated/client/ | head -5

echo -e "\n4. Testing the exports now work..."
node -e "
try {
  const db = require('./dist/index.js');
  const exports = Object.keys(db);
  console.log('✅ @repo/db now exports:', exports.length, 'items including:', exports.slice(0, 5).join(', '));
  
  // Test that Prisma types are available
  if (exports.includes('PrismaClient')) {
    console.log('✅ PrismaClient is available');
  }
  if (exports.includes('Prisma')) {
    console.log('✅ Prisma namespace is available');
  }
} catch(e) {
  console.log('❌ Still having issues:', e.message);
}
"

cd ../..