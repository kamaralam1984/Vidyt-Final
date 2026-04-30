#!/usr/bin/env bash
#
# vidyt-cleanup-snapshots.sh — keep last N snapshots, delete older.
# Usage: vidyt-cleanup-snapshots.sh [keep_count]   (default: 24)
#
set -euo pipefail

SNAPSHOT_DIR="${VIDYT_SNAPSHOT_DIR:-/var/www/vidyt-backups}"
KEEP="${1:-24}"

mkdir -p "$SNAPSHOT_DIR"
cd "$SNAPSHOT_DIR"

# List directories by mtime (newest first), skip the first KEEP, delete the rest
ls -1t | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}_' | tail -n +"$((KEEP+1))" | while read -r snap; do
  if [ -d "$snap" ]; then
    echo "🗑  Removing old snapshot: ${snap}"
    rm -rf "$snap"
    rm -f "${snap}.commit" 2>/dev/null || true
  fi
done

echo "✓ Cleanup done. Keeping latest ${KEEP} snapshots."
