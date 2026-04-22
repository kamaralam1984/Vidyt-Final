#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VidYT SEO cron runner
#
# This script hits the internal cron endpoints in the correct order:
#   1. generate-trending-pages  — create ~100 new rich pages from live trends
#   2. promote-seo-pages        — quality-gate: flip top 100 to isIndexable
#   3. ping-google              — IndexNow ping (Bing/Yandex + Google partners)
#
# Add to the server crontab (recommended: 02:00 UTC = 07:30 IST):
#   crontab -e
#   30 2 * * *  /home/yusuf/Documents/www/vidyt/scripts/seo-cron.sh >> /var/log/vidyt-seo-cron.log 2>&1
#
# Output is JSON per endpoint; log rotates via logrotate if configured.
# ─────────────────────────────────────────────────────────────────────────────

set -u
BASE_URL="${VIDYT_BASE_URL:-https://www.vidyt.com}"
TS="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

run_endpoint() {
  local name="$1"
  local path="$2"
  echo "[$TS] → $name"
  # --max-time 600 lets the promote-cron's MongoDB scan finish on large datasets.
  local code
  code=$(curl -sS -o "/tmp/vidyt-cron-$name.json" -w '%{http_code}' --max-time 600 "$BASE_URL$path") || code="000"
  echo "[$TS] ← $name HTTP $code"
  head -c 2000 "/tmp/vidyt-cron-$name.json" 2>/dev/null
  echo
}

run_endpoint "generate-trending-pages" "/api/cron/generate-trending-pages"
run_endpoint "promote-seo-pages"        "/api/cron/promote-seo-pages"
run_endpoint "ping-google"              "/api/cron/ping-google"

echo "[$TS] DONE"
