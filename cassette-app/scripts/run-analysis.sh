#!/bin/bash

# Media Asset Analysis Runner
# Runs both database and R2 bucket analysis scripts

set -e

echo "Installing tsx for TypeScript execution..."
npm install --save-dev tsx

echo ""
echo "=========================================="
echo "Running Database Analysis..."
echo "=========================================="
npx tsx ./scripts/analyze-media-assets.ts

echo ""
echo "=========================================="
echo "Running R2 Bucket Analysis..."
echo "=========================================="
npx tsx ./scripts/analyze-r2-bucket.ts

echo ""
echo "✓ Analysis complete"
