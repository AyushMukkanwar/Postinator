#!/bin/bash

echo "=== Checking packages/db configuration ==="

echo "1. Current tsconfig.json:"
cat packages/db/tsconfig.json

echo -e "\n2. Current package.json scripts:"
grep -A 10 '"scripts"' packages/db/package.json

echo -e "\n3. What's currently in dist vs src:"
echo "In packages/db/dist/:"
ls -la packages/db/dist/ 2>/dev/null || echo "No dist folder"

echo -e "\nIn packages/db/src/:"
ls -la packages/db/src/

echo -e "\n4. The actual error - let's see what the compiled JS looks like:"
echo "First few lines of packages/db/dist/index.js:"
head -5 packages/db/dist/index.js 2>/dev/null || echo "No compiled JS found"