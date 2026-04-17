#!/bin/bash
# Fix nginx proxy buffer settings for large Next.js chunks

set -e

echo "Writing new nginx.conf..."
cat > /etc/nginx/nginx.conf << 'NGINX_CONF'
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml image/svg+xml;

    # Proxy buffer settings — large enough for big JS chunks (1MB+)
    proxy_buffer_size        128k;
    proxy_buffers            4 256k;
    proxy_busy_buffers_size  256k;
    proxy_temp_file_write_size 256k;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
NGINX_CONF

echo "Writing app.conf with HTTPS and HTTP->HTTPS redirect..."
cat > /etc/nginx/conf.d/app.conf << 'APP_CONF'
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name vidyt.com www.vidyt.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vidyt.com www.vidyt.com;

    ssl_certificate     /etc/letsencrypt/live/vidyt.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vidyt.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
APP_CONF

echo "Testing nginx config..."
nginx -t

echo "Reloading nginx..."
nginx -s reload

echo "Done! Nginx reloaded with new buffer settings."
