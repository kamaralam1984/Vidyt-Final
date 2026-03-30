# ✨ ViralBoost AI - Docker Deployment Guide

Complete production-ready Docker architecture for ViralBoost AI - Full Stack SaaS Platform.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Local Development Setup](#local-development-setup)
5. [Production Deployment](#production-deployment)
6. [Configuration & Secrets](#configuration--secrets)
7. [Scaling & Performance](#scaling--performance)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## 🚀 Quick Start

### 1. Clone & Setup

```bash
# Navigate to docker setup directory
cd docker-setup

# Make setup script executable
chmod +x setup.sh

# Run setup (creates .env, SSL certs, package.json files)
./setup.sh
```

### 2. Configure Environment

```bash
# Edit the .env file with your actual configuration
nano .env
```

Required values to update:
- `MONGO_ROOT_PASSWORD` → Strong database password
- `REDIS_PASSWORD` → Strong Redis password
- `JWT_SECRET` → Generate with: `openssl rand -base64 32`
- `STRIPE_*` → Your Stripe API keys
- `YOUTUBE_*` → Your YouTube OAuth credentials
- `SENDGRID_*` → Your SendGrid API key

### 3. Start the System

```bash
# Build all images and start services
docker-compose up --build

# Or start in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Verify Everything Works

```bash
# Backend health check
curl http://localhost:5000/api/health

# Frontend
curl http://localhost:3000

# NGINX (through proxy)
curl http://localhost/health
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                      │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────▼─────┐                   ┌────▼─────┐
    │   SSL    │                   │    HTTP  │
    │ (443)    │                   │  (80)    │
    └────┬─────┘                   └────┬─────┘
         │                              │
         └──────────────┬───────────────┘
                        │
                   ┌────▼─────────────┐
                   │  NGINX Proxy     │
                   │  - Rate Limit    │
                   │  - Gzip          │
                   │  - Cache         │
                   │  - SSL/TLS       │
                   └────┬──────┬──────┘
                        │      │
            ┌───────────┘      └────────────┐
            │                               │
       ┌────▼──────┐              ┌────────▼────┐
       │ Frontend  │              │  Backend    │
       │ Next.js   │              │  Express    │
       │ (3000)    │              │  (5000)     │
       │ - SSR     │              │  - API      │
       │ - Auth UI │              │  - Database │
       └───────────┘              │  - Auth     │
                                  └────┬────┬───┘
                                       │    │
                        ┌──────────────┤    ├──────────────┐
                        │              │    │              │
                   ┌────▼────┐   ┌────▼──┴─────┐    ┌─────▼─────┐
                   │ MongoDB  │   │   Redis     │    │AI Service │
                   │ Database │   │   Cache +   │    │ Python    │
                   │          │   │   Queue     │    │ (5001)    │
                   └──────────┘   │   (6379)    │    └───────────┘
                                  └─────┬───────┘
                                        │
                                   ┌────▼──────────┐
                                   │ Worker Service│
                                   │ (2 instances) │
                                   │ - Video proc  │
                                   │ - Shorts gen  │
                                   │ - Email notif │
                                   │ (5002, 5003)  │
                                   └───────────────┘

Networks:
  - viralboost-network (bridge network for inter-service communication)

Volumes:
  - mongodb_data (persistent database)
  - redis_data (persistent cache)
  - worker_logs (worker process logs)
  - nginx_cache (NGINX caching)
```

---

## 📦 Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+, Debian 11+) or macOS 12+
- **CPU**: Minimum 2 cores (4+ recommended for production)
- **RAM**: Minimum 4GB (8GB+ recommended)
- **Disk**: Minimum 10GB free space
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+

### Install Docker & Docker Compose

**Ubuntu/Debian:**
```bash
# Update package manager
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (avoid sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose (included in Docker Desktop on Mac/Windows)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## 💻 Local Development Setup

### 1. Clone Repository

```bash
git clone <your-repo-url> viralboost-ai
cd viralboost-ai/docker-setup
```

### 2. Copy & Configure Environment

```bash
cp .env.example .env

# Edit with your editor (VS Code, nano, vim)
code .env
```

### 3. Start Services

```bash
# First time build (takes 5-10 minutes)
docker-compose up --build

# Logs will be displayed in terminal
# Watch for: "Listening on port X" messages
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **NGINX Proxy**: http://localhost
- **MongoDB**: mongodb://root:password@localhost:27017
- **Redis**: redis://localhost:6379

### 5. Development Workflow

**Update code in real-time with hot-reload:**

```bash
# Make changes to frontend code
# Next.js will auto-reload (already mounted as volume)

# Make changes to backend code
# Either:
# a) Docker will auto-reload (if ts-node is configured)
# b) Restart service: docker-compose restart backend

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f worker
docker-compose logs -f frontend

# Execute command in running container
docker-compose exec backend npm install new-package
docker-compose exec backend npm run build
```

### 6. Database Management

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u root -p rootpassword

# Seed database (if you have scripts)
docker-compose exec backend npm run seed

# Backup database
docker-compose exec mongodb mongodump --out /backup

# Restore database
docker-compose exec mongodb mongorestore /backup
```

---

## 🚀 Production Deployment

### 1. Server Setup

**Rent a VPS** (DigitalOcean, Linode, AWS, etc.)
- Recommended: Ubuntu 22.04 LTS
- Minimum: 4GB RAM, 2 CPUs, 50GB SSD

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt-get update && apt-get upgrade -y

# Install Docker & Docker Compose (see Prerequisites section)
```

### 2. Clone Project on VPS

```bash
cd ~
git clone <your-repo-url> viralboost-ai
cd viralboost-ai/docker-setup

# Setup
chmod +x setup.sh
./setup.sh
```

### 3. Get Real SSL Certificates

```bash
# Option A: Using Let's Encrypt (Recommended - Free)
# Note: You need a domain name pointing to your VPS

sudo apt-get install certbot python3-certbot-nginx -y

# Generate certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# Update permissions
sudo chown $USER:$USER nginx/ssl/*

# Option B: Self-signed (for testing/staging only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### 4. Configure Environment for Production

```bash
nano .env

# Key production changes:
# NODE_ENV=production
# MONGO_ROOT_PASSWORD=<strong-random-password>
# REDIS_PASSWORD=<strong-random-password>
# JWT_SECRET=<strong-random-key-for-signing>
# YOUTUBE_CALLBACK_URL=https://yourdomain.com/api/youtube/callback
# STRIPE_*=<your-live-keys>
# FRONTEND_URL=https://yourdomain.com
# NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### 5. Start Production System

```bash
# Pull latest images
docker-compose pull

# Start services in background
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Verify health
curl https://yourdomain.com/health
```

### 6. DNS Configuration

Update your domain registrar's DNS to point to your VPS IP:

```
A record: yourdomain.com → your-vps-ip
A record: www.yourdomain.com → your-vps-ip
```

### 7. Auto-Renew SSL Certificates

```bash
# Create renewal script
cat > /home/user/renew-cert.sh << 'EOF'
#!/bin/bash
cd /home/user/viralboost-ai/docker-setup
sudo certbot renew --quiet
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chown user:user nginx/ssl/*
docker-compose restart nginx
EOF

chmod +x /home/user/renew-cert.sh

# Add to crontab (renew every month)
# crontab -e
# 0 2 1 * * /home/user/renew-cert.sh
```

---

## 🔐 Configuration & Secrets

### Environment Variables

**Critical Variables** (must be set before production):

```bash
# Security Keys
JWT_SECRET=<use: openssl rand -base64 32>
MONGO_ROOT_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>

# External APIs
YOUTUBE_CLIENT_ID=<from Google Cloud Console>
YOUTUBE_CLIENT_SECRET=<from Google Cloud Console>
STRIPE_SECRET_KEY=<from Stripe dashboard>
SENDGRID_API_KEY=<from SendGrid>

# URLs
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
YOUTUBE_CALLBACK_URL=https://yourdomain.com/api/youtube/callback
```

### Secrets Rotation

```bash
# To rotate secrets, update .env and restart:
docker-compose restart backend worker

# For MongoDB password rotation:
# 1. Create new admin user
docker-compose exec mongodb mongosh
db.createUser({user: "newadmin", pwd: "newpass", roles: ["root"]})

# 2. Update MONGO_ROOT_PASSWORD in .env
# 3. Restart: docker-compose restart backend
```

### Vault Integration (Advanced)

For enterprise deployments:

```bash
# Use HashiCorp Vault, AWS Secrets Manager, or similar
# Update docker-compose.yml to fetch secrets from vault:

environment:
  - MONGO_PASSWORD_FILE=/run/secrets/mongo_password
  
secrets:
  mongo_password:
    external: true
```

---

## 📈 Scaling & Performance

### Scale Worker Service

**Default**: 2 worker instances (worker-1, worker-2)

To add more workers:

```bash
# Edit docker-compose.yml, duplicate worker-2 service:

worker-3:
  build: ./worker
  container_name: viralboost-worker-3
  depends_on:
    - redis
    - backend
  environment:
    WORKER_NAME: worker-3
  # ... rest of config

# Restart
docker-compose up -d
```

### Optimization Tips

**1. Database Indexing**
```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh -u root -p password

# Create indexes
db.videos.createIndex({ "userId": 1, "createdAt": -1 })
db.analyses.createIndex({ "videoId": 1 })
```

**2. Redis Caching**
- API response caching (10m TTL)
- Session storage
- Queue data

**3. NGINX Performance**
- Gzip compression enabled
- HTTP/2 support
- Upstream load balancing

**4. Monitor Resources**
```bash
# Real-time monitoring
docker stats

# Container resource limits (add to docker-compose.yml)
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f worker

# Last 100 lines
docker-compose logs --tail=100 backend

# Follow errors only
docker-compose logs backend 2>&1 | grep ERROR
```

### Log Management

Logs are automatically managed by Docker (json-file driver):
- Max file size: 100MB
- Max files: 10 per service
- Configurable in docker-compose.yml

### Basic Monitoring Setup

```bash
# Check service health
docker-compose ps

# Check resource usage
docker stats

# Inspect service
docker-compose top backend
docker-compose port backend

# Network connectivity
docker network ls
docker network inspect viralboost-network
```

### Advanced Monitoring (Optional)

```yaml
# Add to docker-compose.yml for Prometheus/Grafana setup:

prometheus:
  image: prom/prometheus
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  volumes:
    - grafana_data:/var/lib/grafana
```

### Alerting

Setup recommended for production:
- Slack notifications on deployment
- Email alerts on service failure
- Uptime monitoring (UptimeRobot, Pingdom)

---

## 🔧 Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
docker ps

# View detailed error logs
docker-compose logs --tail=50 service-name

# Rebuild images
docker-compose down
docker-compose up --build

# Check disk space
docker system df
```

### MongoDB Connection Issues

```bash
# Test connection
docker-compose exec mongodb mongosh -u root -p password

# Check MongoDB logs
docker-compose logs mongodb

# Verify network
docker network inspect viralboost-network
```

### Redis Connection Issues

```bash
# Test Redis
docker-compose exec redis redis-cli -a password ping
# Expected output: PONG

# Check Redis memory
docker-compose exec redis redis-cli -a password INFO memory
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "5001:5000"  # Host:Container
```

### Worker Queue Not Processing

```bash
# Check queue status
docker-compose exec backend npm run queue:status

# Flush queue
docker-compose exec redis redis-cli -a password FLUSHDB

# Restart workers
docker-compose restart worker worker-2
```

### Performance Issues

```bash
# Monitor real-time
watch docker stats

# Check for memory leaks
docker-compose exec backend node --inspect=0.0.0.0:9229

# Identify slow queries
docker-compose exec mongodb mongosh
db.setProfilingLevel(1, { slowms: 100 })
```

---

## 🛡️ Security Best Practices

### 1. Secrets Management

```bash
# ❌ DON'T: Commit .env to git
# ❌ DON'T: Use weak passwords

# ✅ DO: Use .gitignore
echo ".env" >> .gitignore

# ✅ DO: Generate strong secrets
openssl rand -base64 32

# ✅ DO: Rotate secrets regularly
# Update .env and restart services
```

### 2. NGINX Security

Already configured in `nginx.conf`:
- SSL/TLS 1.2+ only
- HSTS headers
- X-Frame-Options
- Content Security Policy
- Rate limiting (10 req/s general, 30 req/s API)

### 3. Database Security

```bash
# MongoDB
- Authentication enabled by default
- Non-root container user (uid: 1001)
- Network isolated

# Redis
- Password protection enabled
- No persistence in memory (optional)
- Non-root container user

# Both: Only accessible from internal network
```

### 4. Container Security

- All containers run as non-root users
- Read-only filesystems where possible
- Security opt: no-new-privileges=true
- Resource limits defined

### 5. Regular Updates

```bash
# Update Docker images regularly
docker-compose pull

# Check for vulnerabilities
docker scan viralboost-backend

# Review security advisories
# Visit: https://www.docker.com/blog/
```

### 6. Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# DigitalOcean/AWS: Configure security groups
# Allow: SSH (22), HTTP (80), HTTPS (443)
# Deny: All other ports
```

### 7. Backup Strategy

```bash
# MongoDB backup
docker-compose exec mongodb mongodump --archive=/backup/mongo-`date +%Y%m%d`.archive

# Redis backup
docker-compose exec redis redis-cli BGSAVE

# Full system backup
tar -czf backup-$(date +%Y%m%d).tar.gz docker-setup/

# Store backups offsite
# - AWS S3
# - Google Cloud Storage
# - Digital Ocean Spaces
```

---

## 📋 Deployment Checklist

Production deployment verification:

- [ ] `.env` configured with production values
- [ ] SSL certificates obtained and placed in `nginx/ssl/`
- [ ] Database password changed from default
- [ ] Redis password changed from default
- [ ] JWT_SECRET generated and set
- [ ] All external API keys configured
- [ ] Domain DNS pointing to VPS
- [ ] Firewall configured (allow only 22, 80, 443)
- [ ] Backup strategy in place
- [ ] Monitoring/alerting configured
- [ ] Load tested with production data
- [ ] Rollback plan documented
- [ ] Team access configured (SSH keys)
- [ ] Documentation updated
- [ ] Post-deployment verification completed

---

## 🎯 Quick Commands Reference

```bash
# Start/Stop
docker-compose up -d                    # Start (background)
docker-compose down                     # Stop & remove containers
docker-compose down -v                  # Stop & remove volumes too

# View Status
docker-compose ps                       # Service status
docker-compose logs -f                  # Follow all logs
docker-compose logs -f backend          # Follow specific service

# Maintenance
docker-compose restart backend          # Restart service
docker-compose exec backend npm install # Run command in container
docker-compose pull && docker-compose up -d  # Update images

# Cleanup
docker system prune                     # Remove unused images/containers
docker volume ls                        # List volumes
docker network ls                       # List networks

# Debugging
docker-compose top backend              # Process list
docker-compose stats                    # Resource usage
docker-compose exec mongodb mongosh     # Interactive shell
```

---

## 📞 Support & Resources

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Keep this guide updated
- **Docker Docs**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Security**: Follow OWASP Top 10

---

## License

This Docker setup is part of ViralBoost AI project. See LICENSE file for details.

---

**Last Updated**: 2026-03-30
**Maintained By**: DevOps Team
**Version**: 1.0.0
