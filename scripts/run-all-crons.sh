#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VidYT — consolidated misc-cron runner
#
# Hits the cron endpoints that previously had no crontab entry. Each endpoint
# is independent: failures are logged, but the script continues so one bad
# endpoint never blocks the others. Order is intentional — cleanup before
# rotation, rotation before re-rank, re-rank before AI work.
#
# Endpoints called:
#   1. /api/cron/cleanup-low-quality      — drop sub-70 quality SeoPages
#   2. /api/cron/freshness-rotation       — re-publish stale SeoPages
#   3. /api/cron/seo-rerank-weekly        — re-score + re-prioritize sitemap
#   4. /api/cron/ai-retrain               — refresh AI scoring models
#   5. /api/cron/sync-prediction-outcomes — reconcile predicted vs actual
#   6. /api/cron/daily                    — misc daily housekeeping
#   7. /api/cron/website-audit            — automated audit run
#
# CRON_SECRET is read from /var/www/vidyt/.env (or override via env var).
# Secret is passed as ?secret= query param (not a header) — Cloudflare/nginx
# strip non-standard request headers in front of the Next.js app.
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

ENDPOINTS=(
  "cleanup-low-quality"
  "freshness-rotation"
  "seo-rerank-weekly"
  "ai-retrain"
  "sync-prediction-outcomes"
  "daily"
  "website-audit"
)

OVERALL_FAILED=0

for endpoint in "${ENDPOINTS[@]}"; do
  start=$(date +%s)
  echo "[$(TS)] → $endpoint"

  http_code=$(curl -sSL -o "/tmp/vidyt-cron-${endpoint}.json" -w '%{http_code}' \
    --max-time 300 \
    --get \
    --data-urlencode "secret=$CRON_SECRET" \
    "$BASE_URL/api/cron/$endpoint" 2>/dev/null) || http_code="000"

  elapsed=$(( $(date +%s) - start ))

  if [ "$http_code" = "200" ]; then
    echo "[$(TS)] ✓ $endpoint — HTTP $http_code (${elapsed}s)"
  else
    echo "[$(TS)] ✗ $endpoint — HTTP $http_code (${elapsed}s)"
    OVERALL_FAILED=$((OVERALL_FAILED + 1))
    # Tail of the response body helps diagnose 401/500/timeout.
    head -c 500 "/tmp/vidyt-cron-${endpoint}.json" 2>/dev/null
    echo
  fi
done

echo "[$(TS)] DONE — failed: $OVERALL_FAILED / ${#ENDPOINTS[@]}"
# Non-zero exit only if every endpoint failed — partial success is still success.
if [ "$OVERALL_FAILED" -eq "${#ENDPOINTS[@]}" ]; then
  exit 1
fi
exit 0
