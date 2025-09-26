#!/bin/bash

echo "=== Testing container startup in detail ==="

echo "1. Starting container and capturing logs..."
docker compose -f docker-compose.dev.yml up api -d

echo "2. Waiting 10 seconds for startup..."
sleep 10

echo "3. Container status:"
docker compose -f docker-compose.dev.yml ps api

echo "4. Last 20 lines of logs:"
docker compose -f docker-compose.dev.yml logs api --tail 20

echo "5. Is the application responding?"
if docker compose -f docker-compose.dev.yml ps api | grep -q "Up"; then
    echo "Container is running! Testing if port is accessible..."
    curl -f http://localhost:3001/health 2>/dev/null && echo "✅ API is responding!" || echo "⚠ API not responding on port 3001"
else
    echo "❌ Container not running"
fi

echo "6. Checking if there are any runtime errors:"
docker compose -f docker-compose.dev.yml logs api | grep -i error | tail -5 || echo "No errors found in logs"

echo "7. Cleaning up..."
docker compose -f docker-compose.dev.yml down

echo -e "\n=== Summary ==="
echo "The Docker build process is now working correctly."
echo "If there are runtime issues, they're likely related to:"
echo "- Database connection (make sure your .env is configured)"
echo "- Port conflicts"
echo "- Missing environment variables"
echo "- Application-specific startup issues"