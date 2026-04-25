#!/bin/bash
# VidYT VPS Setup Script
# Ye script VPS pe sab kuch automatically setup karta hai
# Usage: bash vps-setup.sh

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

log "=== VidYT VPS Setup Starting ==="

# 1. System update
log "System update kar raha hai..."
apt-get update -qq && apt-get upgrade -y -qq

# 2. Dependencies install
log "Dependencies install kar raha hai..."
apt-get install -y -qq curl wget git build-essential nginx

# 3. Node.js 20 install
log "Node.js 20 install kar raha hai..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - -qq
apt-get install -y -qq nodejs
node --version && npm --version

# 4. PM2 install
log "PM2 install kar raha hai..."
npm install -g pm2 -q
pm2 --version

# 5. MongoDB install
log "MongoDB 7 install kar raha hai..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update -qq
apt-get install -y -qq mongodb-org
systemctl start mongod
systemctl enable mongod
log "MongoDB started"

# 6. Redis install
log "Redis install kar raha hai..."
apt-get install -y -qq redis-server
systemctl start redis-server
systemctl enable redis-server
log "Redis started"

# 7. Project directory
log "Project directory setup kar raha hai..."
mkdir -p /var/www/vidyt

# 8. Cloudflared install
log "Cloudflare Tunnel install kar raha hai..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb
cloudflared --version

log "=== Base setup complete! ==="
log "Ab project files copy karni hain (scp se)"
log "Phir: cd /var/www/vidyt && npm install && npm run build"
log "Phir: cloudflare tunnel config copy karni hai"
