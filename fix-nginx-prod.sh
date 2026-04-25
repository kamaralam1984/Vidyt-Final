#!/usr/bin/env python3
"""Fix nginx config on production — mime types, gzip, proxy headers."""
import subprocess, sys

NGINX_CONF = r"""worker_processes auto;

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

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml image/svg+xml;

    proxy_buffer_size        128k;
    proxy_buffers            4 256k;
    proxy_busy_buffers_size  256k;
    proxy_temp_file_write_size 256k;

    proxy_connect_timeout 60s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
"""

VIDYT_CONF = r"""server {
    listen 80;
    listen [::]:80;
    server_name vidyt.com www.vidyt.com _;

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
"""

print("Writing /etc/nginx/nginx.conf ...")
with open('/etc/nginx/nginx.conf', 'w') as f:
    f.write(NGINX_CONF)

print("Writing /etc/nginx/sites-available/vidyt ...")
with open('/etc/nginx/sites-available/vidyt', 'w') as f:
    f.write(VIDYT_CONF)

print("Testing nginx config ...")
r = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
print(r.stdout, r.stderr)
if r.returncode != 0:
    print("ERROR: nginx config test failed! Not reloading.")
    sys.exit(1)

print("Reloading nginx ...")
r2 = subprocess.run(['nginx', '-s', 'reload'], capture_output=True, text=True)
print(r2.stdout, r2.stderr)
print("Done! nginx updated with gzip + mime types + proxy headers.")
