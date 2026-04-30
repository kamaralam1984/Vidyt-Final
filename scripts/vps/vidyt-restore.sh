#!/usr/bin/env bash
#
# vidyt-restore.sh — restore the live app folder from a snapshot.
# Usage: vidyt-restore.sh <snapshot-id>
#
set -euo pipefail

APP_DIR="${VIDYT_APP_DIR:-/var/www/vidyt}"
SNAPSHOT_DIR="${VIDYT_SNAPSHOT_DIR:-/var/www/vidyt-backups}"
PM2_NAME="${VIDYT_PM2_NAME:-vidyt}"

if [ -z "${1:-}" ]; then
  echo "❌ Usage: $0 <snapshot-id>"
  exit 1
fi

SNAP_ID="$1"
SRC="${SNAPSHOT_DIR}/${SNAP_ID}"

if [ ! -d "$SRC" ]; then
  echo "❌ Snapshot not found: ${SRC}"
  exit 1
fi

echo "⏪ Restoring from: ${SNAP_ID}"
echo "    src:  ${SRC}"
echo "    dest: ${APP_DIR}"

# Safety: take a "last-known" snapshot of the current state before overwriting
SAFETY_TAG="pre-restore-$(date +%H-%M-%S)"
echo "📸 Taking safety snapshot first: ${SAFETY_TAG}"
"$(dirname "$0")/vidyt-snapshot.sh" "$SAFETY_TAG" || echo "⚠ Safety snapshot failed — continuing anyway"

# Restore: rsync over the live folder. Keep node_modules in place to avoid full reinstall
rsync -a --delete \
  --exclude='node_modules' \
  --exclude='.next/cache' \
  "${SRC}/" "${APP_DIR}/"

echo "✓ Files restored. Rebuilding & reloading PM2…"

cd "$APP_DIR"

# Reinstall deps if package-lock changed
if ! diff -q "${APP_DIR}/package-lock.json" "${SRC}/package-lock.json" >/dev/null 2>&1; then
  echo "📦 package-lock changed — running npm ci"
  npm ci --omit=dev || npm install --omit=dev
fi

# Rebuild Next.js
if [ -f "${APP_DIR}/package.json" ]; then
  npm run build
fi

# Reload PM2
pm2 reload "$PM2_NAME" --update-env || pm2 restart "$PM2_NAME" || true

echo "✅ Restore complete: ${SNAP_ID}"
