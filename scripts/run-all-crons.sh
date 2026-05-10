#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VidYT — consolidated misc-cron runner
#
# Hits the cron endpoints that previously had no crontab entry. Each endpoint
# is independent: failures are logged, but the script continues so one bad
# endpoint never blocks the others. Order is intentional — cleanup before
# rotation, rotation before re-rank, re-rank before AI work.
#
# Endpoints called (with their auth/method conventions):
#   1. /api/cron/cleanup-low-quality      — GET ?secret=          | drop sub-70 quality SeoPages
#   2. /api/cron/freshness-rotation       — GET ?secret=          | re-publish stale SeoPages
#   3. /api/cron/seo-rerank-weekly        — GET ?secret=          | re-score + re-prioritize sitemap
#   4. /api/cron/ai-retrain               — POST Bearer token     | refresh AI scoring models
#   5. /api/cron/sync-prediction-outcomes — POST Bearer token     | reconcile predicted vs actual
#   6. /api/cron/daily                    — GET  Bearer token     | misc daily housekeeping
#   7. /api/cron/website-audit            — GET  Bearer token     | automated audit run
#
# CRON_SECRET is read from /var/www/vidyt/.env (or override via env var).
#
# Recommended cadence (single line in crontab):
#   crontab -e
#   30 3 * * *  /var/www/vidyt/scripts/run-all-crons.sh >> /var/log/vidyt-misc-cron.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

# NOTE: deliberately NOT `set -e` — we want every endpoint to be attempted
# even if one fails. Per-endpoint exit codes are logged instead.
set -uo pipefail

ENV_FILE="${ENV_FILE:-/var/www/vidyt/.env}"
BASE_URL="${VIDYT_BASE_URL:-https://www.vidyt.com}"
TS() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

# Pull CRON_SECRET out of the env file if not already exported.
if [ -z "${CRON_SECRET:-}" ] && [ -r "$ENV_FILE" ]; then
  CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r"' )"
fi

if [ -z "${CRON_SECRET:-}" ]; then
  echo "[$(TS)] ✗ CRON_SECRET missing — set it in $ENV_FILE or env. Aborting."
  exit 1
fi

# Each row: "endpoint|METHOD|AUTH"
#   AUTH=query  → secret as ?secret=… query param
#   AUTH=bearer → secret as Authorization: Bearer … header
ENDPOINTS=(
  "cleanup-low-quality|GET|query"
  "freshness-rotation|GET|query"
  "seo-rerank-weekly|GET|query"
  "ai-retrain|POST|bearer"
  "sync-prediction-outcomes|POST|bearer"
  "daily|GET|bearer"
  "website-audit|GET|bearer"
)

OVERALL_FAILED=0

for row in "${ENDPOINTS[@]}"; do
  IFS='|' read -r endpoint method auth <<< "$row"
  start=$(date +%s)
  echo "[$(TS)] → $endpoint  ($method/$auth)"

  out_file="/tmp/vidyt-cron-${endpoint}.json"

  if [ "$auth" = "bearer" ]; then
    http_code=$(curl -sSL -o "$out_file" -w '%{http_code}' \
      --max-time 300 \
      -X "$method" \
      -H "Authorization: Bearer $CRON_SECRET" \
      -H "Content-Type: application/json" \
      "$BASE_URL/api/cron/$endpoint" 2>/dev/null) || http_code="000"
  else
    # query-param secret (GET only)
    http_code=$(curl -sSL -o "$out_file" -w '%{http_code}' \
      --max-time 300 \
      --get \
      --data-urlencode "secret=$CRON_SECRET" \
      "$BASE_URL/api/cron/$endpoint" 2>/dev/null) || http_code="000"
  fi

  elapsed=$(( $(date +%s) - start ))

  if [ "$http_code" = "200" ]; then
    echo "[$(TS)] ✓ $endpoint — HTTP $http_code (${elapsed}s)"
  else
    echo "[$(TS)] ✗ $endpoint — HTTP $http_code (${elapsed}s)"
    OVERALL_FAILED=$((OVERALL_FAILED + 1))
    head -c 500 "$out_file" 2>/dev/null
    echo
  fi
done

echo "[$(TS)] DONE — failed: $OVERALL_FAILED / ${#ENDPOINTS[@]}"
if [ "$OVERALL_FAILED" -eq "${#ENDPOINTS[@]}" ]; then
  exit 1
fi
exit 0
