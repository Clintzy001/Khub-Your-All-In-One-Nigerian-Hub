#!/bin/bash
# cloudflare-pages-build.sh

echo "Starting Cloudflare Pages build..."

# Navigate to frontend directory
cd frontend || exit 1

# Install dependencies
echo "Installing dependencies..."
npm ci --legacy-peer-deps || npm install

# Build the project
echo "Building project..."
npm run build:cloudflare

# Create _redirects for SPA routing
echo "Creating _redirects..."
echo "/* /index.html 200" > dist/_redirects

echo "Build completed successfully!"
