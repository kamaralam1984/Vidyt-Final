#!/bin/bash
set -e

# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cf.deb
dpkg -i /tmp/cf.deb

# Setup tunnel credentials
mkdir -p /etc/cloudflared
cat > /etc/cloudflared/28916fd6-01b0-49eb-a308-135cb812b505.json << 'CREDS'
{"AccountTag":"c433779c92d26ad529e1d2b14c358f85","TunnelSecret":"y3rSHHNhKBEe/fOmxqR5zbf7kNcjev0TufAyKRRGL5Q=","TunnelID":"28916fd6-01b0-49eb-a308-135cb812b505","Endpoint":""}
CREDS

# Setup tunnel config
cat > /etc/cloudflared/config.yml << 'CONFIG'
tunnel: 28916fd6-01b0-49eb-a308-135cb812b505
credentials-file: /etc/cloudflared/28916fd6-01b0-49eb-a308-135cb812b505.json

ingress:
  - hostname: www.vidyt.com
    service: http://localhost:3000
  - hostname: vidyt.com
    service: http://localhost:3000
  - service: http_status:404
CONFIG

# Install as system service and start
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
systemctl status cloudflared --no-pager

echo "=== CLOUDFLARED SETUP COMPLETE ==="
