#!/bin/bash
# Apply the in-repo nginx config to the VPS.
# Run as root on the VPS once after pulling a commit that updates
# deploy/nginx-vidyt.conf. Idempotent — safe to re-run.
#
#   sudo /var/www/vidyt/deploy/apply-nginx.sh
set -e

SRC="/var/www/vidyt/deploy/nginx-vidyt.conf"
DST="/etc/nginx/sites-available/vidyt.conf"
LINK="/etc/nginx/sites-enabled/vidyt.conf"

[ -f "$SRC" ] || { echo "Missing $SRC"; exit 1; }

cp "$SRC" "$DST"
[ -L "$LINK" ] || ln -s "$DST" "$LINK"

nginx -t
systemctl reload nginx
echo "✓ nginx config applied and reloaded"
