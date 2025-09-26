#!/bin/bash

echo "Fixing all @prisma/client imports to @repo/db..."

# Use sed to replace all @prisma/client imports with @repo/db
find apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/@prisma\/client/@repo\/db/g'

echo "Done! Checking if any remain:"
grep -r "from ['\"]@prisma/client['\"]" apps/ --include="*.ts" --include="*.tsx" || echo "All imports fixed!"
