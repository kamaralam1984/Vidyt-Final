#!/bin/bash
# VidYT Production Deploy Script
# Usage: ./deploy.sh
# Run this every time you add new pages or make production changes

set -e

DEPLOY_DIR="/var/www/vidyt"
APP_NAME="vidyt"

echo "🚀 Starting VidYT deployment..."
cd "$DEPLOY_DIR"

# Step 1: Check for any untracked/uncommitted changes (info only)
echo ""
echo "📋 Git status:"
git status --short

# Step 2: Build
echo ""
echo "🔨 Building Next.js production build..."
NODE_OPTIONS=--max_old_space_size=8192 npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed! Deployment aborted."
  exit 1
fi

echo "✅ Build successful!"

# Step 3: Graceful PM2 reload (zero-downtime)
echo ""
echo "🔄 Reloading PM2 with new build..."

# Check if PM2 app is running
if pm2 list | grep -q "$APP_NAME"; then
  pm2 reload "$APP_NAME" --update-env
  echo "✅ PM2 reloaded!"
else
  echo "⚠️  PM2 app '$APP_NAME' not found. Starting fresh..."
  pm2 start ecosystem.config.js
  pm2 save
fi

# Step 4: Verify
sleep 3
echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "🎉 Deployment complete! Live site updated."
echo "   Test: curl -I https://vidyt.com/admin/super/backend-control"
