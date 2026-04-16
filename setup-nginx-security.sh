#!/bin/bash
set -e

echo "=== Hiding nginx version ==="
# Add server_tokens off to nginx.conf http block
if ! grep -q "server_tokens off" /etc/nginx/nginx.conf; then
  sed -i 's/http {/http {\n    server_tokens off;/' /etc/nginx/nginx.conf
  echo "server_tokens off added"
else
  echo "server_tokens already off"
fi

echo "=== Adding security headers to nginx ==="
NGINX_CONF="/etc/nginx/nginx.conf"

# Check if security headers already added
if ! grep -q "X-Content-Type-Options" "$NGINX_CONF"; then
  # Add headers to the server block for port 443 (SSL)
  sed -i '/proxy_read_timeout 130s;/a\        \n        # Security headers\n        add_header X-Content-Type-Options "nosniff" always;\n        add_header X-Frame-Options "DENY" always;\n        add_header X-XSS-Protection "1; mode=block" always;\n        add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\n        more_clear_headers "Server";\n        add_header Server "vidyt" always;' "$NGINX_CONF" 2>/dev/null || true
  echo "Security headers added"
fi

echo "=== Removing X-Powered-By via proxy header ==="
if ! grep -q "proxy_hide_header X-Powered-By" "$NGINX_CONF"; then
  sed -i '/proxy_read_timeout 130s;/a\        proxy_hide_header X-Powered-By;' "$NGINX_CONF" 2>/dev/null || true
fi

echo "=== Testing nginx config ==="
nginx -t

echo "=== Reloading nginx ==="
systemctl reload nginx

echo "=== Done! ==="
echo "Verifying headers:"
curl -sI https://www.vidyt.com/ | grep -E "Server:|X-Content|X-Frame|Strict-Trans|X-Powered"
