#!/bin/bash
set -e

echo "=== Step 1: Updating nginx config ==="
cat > /etc/nginx/nginx.conf << 'NGINXEOF'
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name vidyt.com www.vidyt.com;

        location /.well-known/acme-challenge/ {
            root /var/www/html;
            allow all;
        }

        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 130s;
            proxy_connect_timeout 10s;
        }
    }
}
NGINXEOF

echo "=== Step 2: Testing nginx config ==="
nginx -t

echo "=== Step 3: Reloading nginx ==="
systemctl reload nginx

echo "=== Step 4: Getting SSL certificate ==="
certbot --nginx -d vidyt.com -d www.vidyt.com \
  --non-interactive --agree-tos \
  -m 8rupiya@gmail.com \
  --redirect

echo "=== Step 5: Final nginx reload ==="
systemctl reload nginx

echo ""
echo "=== DONE! SSL setup complete ==="
echo "Test: curl -I https://www.vidyt.com/"
