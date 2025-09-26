#!/bin/bash

echo "=== Checking Docker command and NestJS build output ==="

echo "1. Current Dockerfile CMD:"
tail -5 apps/api/Dockerfile.api

echo -e "\n2. API package.json scripts:"
grep -A 10 '"scripts"' apps/api/package.json

echo -e "\n3. What does 'pnpm --filter=api run dev' actually run?"
cd apps/api
pnpm run dev --help 2>/dev/null || echo "Let's check what dev script does"
cat package.json | grep -A 1 -B 1 '"dev"'

echo -e "\n4. Testing local build output structure:"
pnpm run build
echo "Contents of dist/ after build:"
find dist/ -type f | head -10

echo -e "\n5. The correct path should be:"
if [ -f "dist/main.js" ]; then
    echo "✅ main.js is at: $(pwd)/dist/main.js"
    echo "✅ Docker should look for: /app/apps/api/dist/main.js"
elif [ -f "dist/src/main.js" ]; then
    echo "✅ main.js is at: $(pwd)/dist/src/main.js" 
    echo "✅ Docker should look for: /app/apps/api/dist/src/main.js"
else
    echo "❌ main.js not found, checking all .js files:"
    find dist/ -name "*.js" | grep main
fi

cd ../..