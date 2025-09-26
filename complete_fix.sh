#!/bin/bash

echo "=== Fixing all Prisma import issues ==="

echo "1. Fixing imports in source files..."
find apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/@prisma\/client/@repo\/db/g'

echo "2. Cleaning old build artifacts..."
rm -rf apps/api/dist/
rm -rf packages/db/dist/

echo "3. Checking packages/db tsconfig.json..."
if grep -q '"outDir".*"dist"' packages/db/tsconfig.json; then
    echo "✓ TypeScript outDir is set to dist"
else
    echo "⚠ Adding outDir to packages/db/tsconfig.json"
    # Create a backup and update tsconfig
    cp packages/db/tsconfig.json packages/db/tsconfig.json.bak
    node -e "
    const fs = require('fs');
    const tsconfig = JSON.parse(fs.readFileSync('packages/db/tsconfig.json', 'utf8'));
    if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
    tsconfig.compilerOptions.outDir = './dist';
    fs.writeFileSync('packages/db/tsconfig.json', JSON.stringify(tsconfig, null, 2));
    console.log('Updated tsconfig.json');
    "
fi

echo "4. Rebuilding @repo/db package..."
cd packages/db
pnpm run build
cd ../..

echo "5. Checking what was built..."
ls -la packages/db/dist/

echo "6. Testing local API build..."
cd apps/api
echo "Installing dependencies if needed..."
pnpm install
echo "Building API..."
pnpm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
else
    echo "❌ Local build still failing. Let's check what's wrong..."
fi

cd ../..

echo "7. Verification - checking remaining @prisma/client imports:"
grep -r "from ['\"]@prisma/client['\"]" apps/*/src/ --include="*.ts" --include="*.tsx" || echo "✅ All source imports fixed!"

echo "8. Quick verification of what @repo/db now exports:"
cd packages/db
node -e "
try {
  const db = require('./dist/index.js');
  console.log('✅ @repo/db exports:', Object.keys(db).slice(0, 10).join(', '), '...');
} catch(e) {
  console.log('❌ Error loading @repo/db:', e.message);
}
" || echo "Could not verify exports"
cd ../..