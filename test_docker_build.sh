#!/bin/bash

echo "=== Testing Docker build after fixes ==="

echo "1. First, let's make sure local build still works..."
cd apps/api
pnpm run build
if [ $? -eq 0 ]; then
    echo "✅ Local build still working"
else
    echo "❌ Local build broken - stopping here"
    exit 1
fi
cd ../..

echo -e "\n2. Testing Docker build..."
echo "Building API container..."
docker compose -f docker-compose.dev.yml build api

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    echo -e "\n3. Let's test running the container..."
    docker compose -f docker-compose.dev.yml up api -d
    
    echo "Waiting 10 seconds for container to start..."
    sleep 10
    
    echo "Container status:"
    docker compose -f docker-compose.dev.yml ps api
    
    echo "Container logs (last 20 lines):"
    docker compose -f docker-compose.dev.yml logs api --tail 20
    
    echo -e "\nStopping test container..."
    docker compose -f docker-compose.dev.yml down
else
    echo "❌ Docker build failed"
    echo "Last 20 lines of build output:"
    docker compose -f docker-compose.dev.yml build api 2>&1 | tail -20
fi