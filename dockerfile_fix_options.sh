#!/bin/bash

echo "=== Two options to fix the Dockerfile ==="

echo "OPTION 1: Use the existing start:prod script (recommended)"
echo "Change the CMD in apps/api/Dockerfile.api to:"
echo 'CMD ["pnpm", "--filter=api", "run", "start:prod"]'

echo -e "\nOPTION 2: Direct node execution"
echo "Change the CMD to:"
echo 'CMD ["node", "dist/apps/api/src/main.js"]'

echo -e "\nLet's implement Option 1 (cleaner approach)..."

# Backup the original
cp apps/api/Dockerfile.api apps/api/Dockerfile.api.backup

# Replace the CMD line with start:prod
sed -i 's|CMD \["pnpm", "--filter=api", "run", "dev"\]|CMD ["pnpm", "--filter=api", "run", "start:prod"]|' apps/api/Dockerfile.api

echo -e "\nUpdated Dockerfile CMD:"
grep "CMD" apps/api/Dockerfile.api

echo -e "\nVerifying the start:prod script exists:"
grep '"start:prod"' apps/api/package.json

echo -e "\nTesting the fix..."
echo "Building container..."
docker compose -f docker-compose.dev.yml build api --no-cache

if [ $? -eq 0 ]; then
    echo "Build successful! Starting container for 15 seconds to test..."
    timeout 15 docker compose -f docker-compose.dev.yml up api
    docker compose -f docker-compose.dev.yml down
    echo "Test complete!"
else
    echo "Build failed. Let's try Option 2..."
    sed -i 's|CMD \["pnpm", "--filter=api", "run", "start:prod"\]|CMD ["node", "dist/apps/api/src/main.js"]|' apps/api/Dockerfile.api
    echo "Trying direct node execution..."
    docker compose -f docker-compose.dev.yml build api --no-cache
fi