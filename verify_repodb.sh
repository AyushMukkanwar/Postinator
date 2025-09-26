#!/bin/bash

echo "=== Verifying @repo/db package ==="

echo "1. Checking if Prisma client is generated:"
ls -la packages/db/src/generated/client/ | head -10

echo -e "\n2. Checking what @repo/db exports:"
cat packages/db/src/index.ts

echo -e "\n3. Testing the export works locally:"
cd packages/db
echo "Building db package..."
pnpm run build
echo "Build complete"

echo -e "\n4. Checking generated types are available:"
ls -la src/generated/client/index.d.ts 2>/dev/null && echo "TypeScript definitions found" || echo "No TypeScript definitions found"

echo -e "\n5. Quick test - what types are exported:"
node -e "
try {
  const db = require('./dist/index.js');
  console.log('Available exports:', Object.keys(db));
} catch(e) {
  console.log('Error loading exports:', e.message);
}
" 2>/dev/null || echo "Could not test exports (this is normal if not built yet)"

cd ../..