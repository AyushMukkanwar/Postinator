#!/bin/bash

echo "🔧 Fixing local development environment..."

# Go to project root
cd /home/ayush_mukkanwar/Dev/Projects/uploader

echo "📦 Installing dependencies..."
pnpm install

echo "🔍 Checking if turbo is installed..."
if ! command -v turbo &> /dev/null; then
    echo "📥 Installing turbo globally..."
    npm install -g turbo
    # Or if you prefer pnpm:
    # pnpm add -g turbo
fi

echo "✅ Verifying turbo installation..."
turbo --version

echo "🔍 Checking node_modules in post-worker..."
ls -la apps/post-worker/node_modules/ | head -5

echo "🧪 Testing build again from project root..."
pnpm build --filter=post-worker

echo "📁 Checking build outputs after fix:"
if [ -d "dist" ]; then
    echo "- Project root dist:"
    find dist -name "main.js" -type f
fi

if [ -d "apps/post-worker/dist" ]; then
    echo "- Post-worker local dist:"
    find apps/post-worker/dist -name "main.js" -type f
fi

echo ""
echo "🧪 Testing build from post-worker directory..."
cd apps/post-worker
pnpm build

if [ -f "dist/main.js" ]; then
    echo "✅ SUCCESS: Found main.js at apps/post-worker/dist/main.js"
    echo "🐳 Your Docker setup should work now!"
else
    echo "❌ Still having issues. Let's debug further..."
    echo "📋 Post-worker directory contents:"
    ls -la
    echo "📋 Package.json scripts:"
    cat package.json | jq '.scripts'
fi