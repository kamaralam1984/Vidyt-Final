#!/bin/bash
# VidYT Production NGINX Setup Script
# Run with: sudo bash /var/www/vidyt/deploy/setup-nginx.sh

set -e

echo "=== VidYT NGINX Production Setup ==="

# ── 1. Write nginx.conf ───────────────────────────────────────
cat > /etc/nginx/nginx.conf << 'NGINXCONF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens   off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - "$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'cf_ray=$http_cf_ray country=$http_cf_ipcountry';

    access_log /var/log/nginx/access.log main;
    error_log  /var/log/nginx/error.log warn;

    # Rate limiting zones
    limit_req_zone  $binary_remote_addr zone=api_limit:10m    rate=10r/s;
    limit_req_zone  $binary_remote_addr zone=auth_limit:10m   rate=1r/s;
    limit_req_zone  $binary_remote_addr zone=health_limit:10m rate=5r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    limit_req_status  429;
    limit_conn_status 429;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/javascript application/json application/xml
               application/rss+xml image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
NGINXCONF
echo "[1/5] nginx.conf written"

# ── 2. Remove conflicting conf.d/app.conf ────────────────────
# The old app.conf had a server block for vidyt.com that conflicts
# with sites-available/vidyt. Replace with placeholder.
cat > /etc/nginx/conf.d/app.conf << 'APPCONF'
# VidYT app config is in /etc/nginx/sites-available/vidyt
# This file intentionally left empty to avoid server_name conflicts.
APPCONF
echo "[2/5] conf.d/app.conf cleared"

# ── 3. Write production site config ──────────────────────────
cp /var/www/vidyt/deploy/nginx-vidyt.conf /etc/nginx/sites-available/vidyt
echo "[3/5] sites-available/vidyt written"

# ── 4. Enable site (idempotent) ───────────────────────────────
ln -sf /etc/nginx/sites-available/vidyt /etc/nginx/sites-enabled/vidyt
echo "[4/5] symlink ensured: sites-enabled/vidyt → sites-available/vidyt"

# ── 5. Test config + reload ───────────────────────────────────
nginx -t
systemctl reload nginx
echo "[5/5] NGINX reloaded successfully"
echo ""
echo "=== Done! Verify with: curl -I https://www.vidyt.com/api/health ==="
