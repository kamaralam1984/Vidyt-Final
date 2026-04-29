#!/bin/bash
# Auto-deploy script — polls origin/main for new commits, cherry-picks them, runs deploy.sh.
# Installed at /usr/local/bin/vidyt-autodeploy.sh. Triggered by cron every minute.
set -e
cd /var/www/vidyt
git fetch origin main --quiet
REMOTE=$(git rev-parse origin/main)
LAST=$(cat /var/www/vidyt/.last-deployed-sha 2>/dev/null || echo "")
if [ "$REMOTE" = "$LAST" ]; then
  exit 0
fi
echo "[$(date)] Deploying $REMOTE"
COMMITS=$(git rev-list --reverse HEAD..origin/main)
if [ -z "$COMMITS" ]; then
  echo "$REMOTE" > /var/www/vidyt/.last-deployed-sha
  exit 0
fi
for c in $COMMITS; do
  echo "  cherry-pick $c"
  git cherry-pick -X theirs --no-edit "$c" || {
    echo "[$(date)] cherry-pick failed at $c — aborting"
    git cherry-pick --abort || true
    exit 1
  }
done
./deploy.sh
echo "$REMOTE" > /var/www/vidyt/.last-deployed-sha
echo "[$(date)] Auto-deploy complete"
