#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying KHUB Platform${NC}\n"

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Step 2: Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Step 3: Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm run test

# Step 4: Deploy to Cloudflare Pages
echo -e "${YELLOW}☁️ Deploying to Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name=khub --branch=main

# Step 5: Deploy Supabase Edge Functions
echo -e "${YELLOW}⚡ Deploying Supabase Edge Functions...${NC}"
cd supabase/functions
for func in */; do
    echo -e "Deploying ${func%/}..."
    supabase functions deploy ${func%/}
done

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "\n📊 KHUB is now live at: https://khub.pages.dev"
