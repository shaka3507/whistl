#!/bin/bash

# Setup script for the prepare library with dynamic routes

echo "Setting up prepare library with dynamic routes..."

# Ensure the prepare data directory exists
mkdir -p public/data/prepare

# Generate JSON data files
node scripts/generate-prepare-json.js

echo "Prepare library setup complete!"
echo ""
echo "Next steps:"
echo "1. Run the development server: npm run dev"
echo "2. Visit http://localhost:3000/prepare to see the main library"
echo "3. Click on a topic to view the dynamic page"
echo "4. Edit the JSON files in public/data/prepare/ to customize content"
echo ""
echo "Note: The old individual page directories (e.g., app/prepare/earthquake/) can be removed"
echo "once you've confirmed the new dynamic routes are working correctly." 