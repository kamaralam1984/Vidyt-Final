#!/bin/bash
# Auto-deploy script — polls origin/main for new commits, cherry-picks them, runs deploy.sh.
# Installed at /usr/local/bin/vidyt-autodeploy.sh. Triggered by cron every minute.
# Tracks last-deployed origin/main SHA in /var/www/vidyt/.last-deployed-sha.
# First run: bootstraps baseline (no deploy) so existing 22-commit divergence is skipped.
set -e
cd /var/www/vidyt
git fetch origin main --quiet
REMOTE=$(git rev-parse origin/main)
LAST_FILE=/var/www/vidyt/.last-deployed-sha
LAST=$(cat "$LAST_FILE" 2>/dev/null || echo "")

if [ -z "$LAST" ]; then
  echo "$REMOTE" > "$LAST_FILE"
  echo "[$(date)] Bootstrapped baseline at $REMOTE — no deploy this run"
  exit 0
fi

if [ "$REMOTE" = "$LAST" ]; then
  exit 0
fi

echo "[$(date)] Deploying $LAST..$REMOTE"
COMMITS=$(git rev-list --reverse "$LAST..$REMOTE")
if [ -z "$COMMITS" ]; then
  echo "$REMOTE" > "$LAST_FILE"
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
echo "$REMOTE" > "$LAST_FILE"
echo "[$(date)] Auto-deploy complete"
