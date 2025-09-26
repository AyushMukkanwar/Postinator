#!/bin/bash

echo "=== Simple direct fix ==="

echo "1. The exact error shows it's looking for: /app/apps/api/dist/main"
echo "2. The file actually exists at: /app/apps/api/dist/apps/api/src/main.js"

echo -e "\n3. Let's use the most direct approach - fix the CMD to use absolute path"

# Backup
cp apps/api/Dockerfile.api apps/api/Dockerfile.api.backup3

# Replace the CMD with direct node execution using absolute path
sed -i 's|CMD \["pnpm", "--filter=api", "run", "start:prod"\]|CMD ["node", "/app/apps/api/dist/apps/api/src/main.js"]|' apps/api/Dockerfile.api

echo "4. Updated Dockerfile CMD:"
grep "CMD" apps/api/Dockerfile.api

echo -e "\n5. Testing the fix..."
docker compose -f docker-compose.dev.yml build api

if [ $? -eq 0 ]; then
    echo "Build successful! Testing container startup..."
    echo "Starting container..."
    docker compose -f docker-compose.dev.yml up api -d
    
    echo "Waiting 15 seconds for startup..."
    sleep 15
    
    echo "Container logs:"
    docker compose -f docker-compose.dev.yml logs api --tail 10
    
    echo "Container status:"
    docker compose -f docker-compose.dev.yml ps api
    
    echo "Testing API endpoint:"
    curl -f http://localhost:3001 2>/dev/null && echo "API responding!" || echo "API not responding (might be normal if no root endpoint)"
    
    docker compose -f docker-compose.dev.yml down
    
    echo "Test complete!"
else
    echo "Build failed"
fi