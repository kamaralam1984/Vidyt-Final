#!/usr/bin/env bash
#
# vidyt-snapshot.sh — create a snapshot of the live app folder.
# Usage: vidyt-snapshot.sh [tag]
#   tag is one of: hourly, pre-deploy, manual (default: manual)
#
set -euo pipefail

APP_DIR="${VIDYT_APP_DIR:-/var/www/vidyt}"
SNAPSHOT_DIR="${VIDYT_SNAPSHOT_DIR:-/var/www/vidyt-backups}"
TAG="${1:-manual}"

mkdir -p "$SNAPSHOT_DIR"
TS="$(date +%Y-%m-%d_%H-%M-%S)"
NAME="${TS}_${TAG}"
DEST="${SNAPSHOT_DIR}/${NAME}"

echo "📸 Creating snapshot: ${NAME}"
echo "    src:  ${APP_DIR}"
echo "    dest: ${DEST}"

# rsync excludes: heavy/ephemeral dirs we don't need to restore
rsync -a --delete \
  --exclude='node_modules' \
  --exclude='.next/cache' \
  --exclude='.git/objects/pack' \
  "${APP_DIR}/" "${DEST}/"

# Save current commit so restore can verify
if [ -d "${APP_DIR}/.git" ]; then
  (cd "$APP_DIR" && git rev-parse HEAD) > "${DEST}.commit" 2>/dev/null || true
fi

du -sh "$DEST" | awk '{print "✓ Snapshot size: "$1}'
echo "✓ Done: ${NAME}"
