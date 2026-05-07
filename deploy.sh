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

# Step 3: PM2 startOrReload (config-aware reload)
#  • startOrReload reads ecosystem.config.js fresh each run, so changes to
#    `script`/`args`/`env`/`node_args` (e.g. switching from `next start` to
#    the custom server.ts) actually take effect on the next deploy. Plain
#    `pm2 reload <name>` keeps the old config in PM2's daemon memory.
#  • --update-env ensures env-var changes (NODE_OPTIONS, etc.) propagate.
echo ""
echo "🔄 Reloading PM2 from ecosystem.config.js..."
pm2 startOrReload ecosystem.config.js --update-env --only "$APP_NAME"
echo "✅ PM2 reloaded with current ecosystem config!"
pm2 save --force >/dev/null 2>&1 || true

# Step 4: Verify
sleep 3
echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "🎉 Deployment complete! Live site updated."
echo "   Test: curl -I https://vidyt.com/admin/super/backend-control"
