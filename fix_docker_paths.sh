#!/bin/bash

echo "=== Diagnosing Docker container paths ==="

# First, let's see what's actually in the container
echo "1. Building container and checking file structure..."
docker build -t debug-api -f- . <<'EOF'
FROM node:20-slim
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter db run build
RUN pnpm --filter api... build

# Debug: Show what was built
RUN echo "=== What's in /app/apps/api/dist/ ===" && ls -la /app/apps/api/dist/ || echo "No dist folder found"
RUN echo "=== What's in /app/apps/api/ ===" && ls -la /app/apps/api/
RUN echo "=== Looking for main.js files ===" && find /app -name "main.js" -o -name "main.ts" 2>/dev/null
RUN echo "=== Nest build output structure ===" && find /app/apps/api/dist -type f 2>/dev/null | head -10
EOF

echo -e "\n2. Running the debug container to see actual paths..."
docker run --rm debug-api

echo -e "\n3. Checking your package.json start commands..."
echo "API package.json scripts:"
grep -A 5 '"scripts"' apps/api/package.json | grep -E "(start|dev|prod)"

echo -e "\n4. Checking what NestJS actually builds to..."
echo "Local build - what's in apps/api/dist/:"
ls -la apps/api/dist/ 2>/dev/null || echo "No local dist found"

# Cleanup
docker rmi debug-api 2>/dev/null