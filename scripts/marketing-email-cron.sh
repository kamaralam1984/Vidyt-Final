#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VidYT Marketing-Email cron runner
#
# Calls the internal /api/cron/marketing-emails endpoint, which sends:
#   • Welcome emails to users created in the last 24h (idempotent)
#   • Drip emails to free users (5-step sequence, every 2 days)
#   • Upgrade-suggestion emails to starter/pro users 14d+ on plan
#
# CRON_SECRET is read from /var/www/vidyt/.env (or override with env var).
# Recommended cadence: every 6 hours.
#
# Add to the server crontab:
#   crontab -e
#   0 */6 * * *  /var/www/vidyt/scripts/marketing-email-cron.sh >> /var/log/vidyt-marketing-cron.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

set -u

BASE_URL="${VIDYT_BASE_URL:-https://www.vidyt.com}"
ENV_FILE="${VIDYT_ENV_FILE:-/var/www/vidyt/.env}"
TS="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

# Pull CRON_SECRET out of the env file if not already exported.
if [ -z "${CRON_SECRET:-}" ] && [ -r "$ENV_FILE" ]; then
  CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r"' )"
fi

if [ -z "${CRON_SECRET:-}" ]; then
  echo "[$TS] ✗ CRON_SECRET missing — set it in $ENV_FILE or env. Aborting."
  exit 1
fi

echo "[$TS] → marketing-emails"
# Secret is passed as ?secret= query param (not a custom x-* header) because
# Cloudflare / nginx commonly strip non-standard request headers in front of
# the Next.js app, which previously caused 401s. -L follows the http→https
# redirect Next.js middleware enforces.
code=$(curl -sSL -o /tmp/vidyt-marketing-cron.json -w '%{http_code}' --max-time 300 \
  --get \
  --data-urlencode "secret=$CRON_SECRET" \
  "$BASE_URL/api/cron/marketing-emails") || code="000"
echo "[$TS] ← HTTP $code"
head -c 2000 /tmp/vidyt-marketing-cron.json 2>/dev/null
echo
echo "[$TS] DONE"
