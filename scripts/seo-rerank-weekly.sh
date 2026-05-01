#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VidYT weekly SEO rerank
#
# Scans ALL SeoPage docs, re-scores them with the latest qualityScorer
# (incl. slug-quality penalty), demotes pages that fell below threshold,
# auto-promotes new high-quality pages (capped 200/week), then IndexNow-pings
# the top 200 indexable pages so Bing/Yandex/Google re-fetch them.
#
# NEVER deletes pages — only flips isIndexable.
#
# Recommended crontab (every Sunday 04:00 UTC = 09:30 IST):
#   crontab -e
#   0 4 * * 0  /home/yusuf/Documents/www/vidyt/scripts/seo-rerank-weekly.sh >> /var/log/vidyt-seo-rerank.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

set -u
BASE_URL="${VIDYT_BASE_URL:-https://www.vidyt.com}"
TS="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

echo "[$TS] → seo-rerank-weekly"
code=$(curl -sS -o /tmp/vidyt-seo-rerank.json -w '%{http_code}' --max-time 1200 "$BASE_URL/api/cron/seo-rerank-weekly") || code="000"
echo "[$TS] ← HTTP $code"
head -c 4000 /tmp/vidyt-seo-rerank.json 2>/dev/null
echo
echo "[$TS] DONE"
