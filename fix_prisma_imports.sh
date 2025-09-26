#!/bin/bash

echo "=== Finding all remaining @prisma/client imports ==="

# Find all files with @prisma/client imports in the apps directory
echo "1. Files still importing from @prisma/client:"
grep -r "from ['\"]@prisma/client['\"]" apps/ --include="*.ts" --include="*.tsx"

echo -e "\n2. All import lines (showing context):"
grep -rn "from ['\"]@prisma/client['\"]" apps/ --include="*.ts" --include="*.tsx"

echo -e "\n=== Creating fix script ==="

cat > fix_imports.sh << 'EOF'
#!/bin/bash

echo "Fixing all @prisma/client imports to @repo/db..."

# Use sed to replace all @prisma/client imports with @repo/db
find apps/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/@prisma\/client/@repo\/db/g'

echo "Done! Checking if any remain:"
grep -r "from ['\"]@prisma/client['\"]" apps/ --include="*.ts" --include="*.tsx" || echo "All imports fixed!"
EOF

chmod +x fix_imports.sh

echo -e "\nScript created! Run ./fix_imports.sh to fix all imports automatically."

echo -e "\n=== Also checking for any require() imports ==="
grep -r "require(['\"]@prisma/client['\"])" apps/ --include="*.ts" --include="*.tsx" || echo "No require() imports found"