#!/bin/bash
cd "$(dirname "$0")"

echo "Fixing Next.js files..."
find node_modules/next/dist -name "create-href-from-url.js" -exec sh -c 'cat "$1" > /tmp/temp_fix_$$.js && mv /tmp/temp_fix_$$.js "$1" && chmod 644 "$1"' _ {} \; 2>&1 | head -3

echo "Removing extended attributes..."
xattr -rc node_modules/next/dist/client/components/router-reducer 2>&1 | head -3
xattr -rc node_modules/next/dist/esm/client/components/router-reducer 2>&1 | head -3

echo "Cleaning cache..."
rm -rf .next

echo "Starting server..."
npm run dev
