#!/bin/bash

# Run this script in your project root to compare api and post-worker
echo "=== COMPARING API AND POST-WORKER CONFIGURATIONS ==="

echo -e "\n🔍 Checking package.json scripts:"
echo "API scripts:"
cat apps/api/package.json | jq .scripts 2>/dev/null || echo "jq not found, showing raw:"
grep -A 10 '"scripts"' apps/api/package.json

echo -e "\nPOST-WORKER scripts:"
cat apps/post-worker/package.json | jq .scripts 2>/dev/null || echo "jq not found, showing raw:"
grep -A 10 '"scripts"' apps/post-worker/package.json

echo -e "\n🔍 Checking dependencies:"
echo "API dependencies count:"
cat apps/api/package.json | jq '.dependencies | length' 2>/dev/null || grep -c '".*":' apps/api/package.json

echo "POST-WORKER dependencies count:"
cat apps/post-worker/package.json | jq '.dependencies | length' 2>/dev/null || grep -c '".*":' apps/post-worker/package.json

echo -e "\n🔍 Checking if main files exist:"
echo "API main file:"
ls -la apps/api/src/main.ts 2>/dev/null || echo "❌ Not found"

echo "POST-WORKER main file:"
ls -la apps/post-worker/src/main.ts 2>/dev/null || echo "❌ Not found"

echo -e "\n🔍 Checking tsconfig.json differences:"
echo "API tsconfig outDir:"
grep "outDir" apps/api/tsconfig.json || echo "Not specified"

echo "POST-WORKER tsconfig outDir:"
grep "outDir" apps/post-worker/tsconfig.json || echo "Not specified"

echo -e "\n🔍 Checking nest-cli.json (if exists):"
echo "API nest-cli.json:"
cat apps/api/nest-cli.json 2>/dev/null || echo "Not found"

echo "POST-WORKER nest-cli.json:"
cat apps/post-worker/nest-cli.json 2>/dev/null || echo "Not found"

echo -e "\n🔍 Checking actual built files after manual build:"
echo "Building both services locally..."
pnpm build --filter=api && echo "✅ API build successful" || echo "❌ API build failed"
pnpm build --filter=post-worker && echo "✅ POST-WORKER build successful" || echo "❌ POST-WORKER build failed"

echo -e "\nAPI dist contents:"
ls -la apps/api/dist/ 2>/dev/null || echo "No dist directory"

echo "POST-WORKER dist contents:"
ls -la apps/post-worker/dist/ 2>/dev/null || echo "No dist directory"
