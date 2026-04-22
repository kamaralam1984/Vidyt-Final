#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Verify every entry URL redirects to https://www.vidyt.com/
#
# Run after any deploy that touches next.config.js, middleware.ts, or the
# Cloudflare "Always Use HTTPS" / page-rule config. Exits non-zero if any
# case ends up somewhere other than https://www.vidyt.com/.
#
#   Usage:  bash scripts/test-redirects.sh
# ─────────────────────────────────────────────────────────────────────────────

set -u
EXPECTED_PREFIX="https://www.vidyt.com"
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local expected_path="${3:-/}"
  # -L follow redirects, capture final URL
  local final
  final=$(curl -sS -L -o /dev/null -w '%{url_effective}' --max-time 15 "$url" 2>/dev/null || echo "ERROR")
  local code
  code=$(curl -sS -L -o /dev/null -w '%{http_code}' --max-time 15 "$url" 2>/dev/null || echo "000")

  local expected="${EXPECTED_PREFIX}${expected_path}"
  if [[ "$final" == "$expected"* && "$code" =~ ^(200|301|302)$ ]]; then
    printf "  ✅ %-48s → %s (HTTP %s)\n" "$label" "$final" "$code"
  else
    printf "  ❌ %-48s → %s (HTTP %s, expected %s)\n" "$label" "$final" "$code" "$expected"
    FAIL=$((FAIL + 1))
  fi
}

echo "Entry-URL redirect audit"
echo "========================"
echo

echo "— Homepage entry points —"
check "http://vidyt.com/"            "http://vidyt.com/"              "/"
check "https://vidyt.com/"           "https://vidyt.com/"             "/"
check "http://www.vidyt.com/"        "http://www.vidyt.com/"          "/"
check "https://www.vidyt.com/"       "https://www.vidyt.com/"         "/"

echo
echo "— Deep paths (must preserve path + query) —"
check "http://vidyt.com/pricing"     "http://vidyt.com/pricing"       "/pricing"
check "https://vidyt.com/k/test"     "https://vidyt.com/k/test"       "/k/test"
check "http://vidyt.com/pricing?x=1" "http://vidyt.com/pricing?x=1"   "/pricing"

echo
echo "— Trailing slash normalisation —"
check "https://vidyt.com"            "https://vidyt.com"              "/"

echo
if [[ $FAIL -eq 0 ]]; then
  echo "✅ All 8 entry URLs resolve to https://www.vidyt.com/ correctly."
  exit 0
else
  echo "❌ $FAIL failure(s). Check Cloudflare 'Always Use HTTPS', next.config.js redirects, and HSTS config."
  exit 1
fi
