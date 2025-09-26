#!/bin/bash

echo "=== Testing actual build errors ==="

# Try building just the API locally first to see if the TypeScript issues are resolved
echo "1. Testing local build:"
cd apps/api
pnpm run build 2>&1 | head -20
cd ../..

echo -e "\n2. Testing Docker build with error capture:"
# Build with error capture
docker compose -f docker-compose.dev.yml build api 2>&1 | tail -50

echo -e "\n3. Quick file checks:"
echo "packages/db/src/index.ts exports:"
head -10 packages/db/src/index.ts

echo -e "\nSample import in API:"
grep -r "from.* @repo/db" apps/api/src/ | head -5

echo -e "\nTsconfig paths in API:"
grep -A 5 '"paths"' apps/api/tsconfig.json
