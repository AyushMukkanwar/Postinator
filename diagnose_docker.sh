#!/bin/bash

echo "=== Running enhanced diagnostic ==="

# Build and run the diagnostic container to see actual output
docker build -t temp-diagnostic -f- . <<'EOF'
FROM alpine
COPY . /src
WORKDIR /src
EOF

echo -e "\n=== What Docker actually sees ==="
docker run --rm temp-diagnostic sh -c "
echo '--- Files in apps/api/src ---'
find . -name '*.ts' -path '*/apps/api/src/*' | head -10
echo ''
echo '--- Directory structure ---'
ls -la apps/api/src/ 2>/dev/null || echo 'apps/api/src/ directory not found'
echo ''
echo '--- Package.json files ---'
find . -name 'package.json' | grep -E '(apps/api|packages/db)'
echo ''
echo '--- Checking for tsconfig files ---'
find . -name 'tsconfig.json' | grep -E '(apps/api|packages/db)'
echo ''
echo '--- Total TypeScript files in project ---'
find . -name '*.ts' | wc -l
"

# Clean up
docker rmi temp-diagnostic 2>/dev/null

echo -e "\n=== Checking your actual Dockerfile ==="
echo "Contents of apps/api/Dockerfile.api:"
if [ -f "apps/api/Dockerfile.api" ]; then
    cat apps/api/Dockerfile.api
else
    echo "File not found!"
fi

echo -e "\n=== Checking for multiple .dockerignore files ==="
find . -name ".dockerignore" -type f