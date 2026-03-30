# Cloudflare CDN & WAF Setup Guide for ViralBoost AI SaaS

**Goal**: Improve performance, security, and uptime for production environment  
**Estimated Setup Time**: 30-45 minutes  
**Difficulty**: Intermediate

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Account Setup](#account-setup)
3. [DNS Configuration](#dns-configuration)
4. [CDN Configuration](#cdn-configuration)
5. [WAF Setup](#waf-setup)
6. [DDoS Protection](#ddos-protection)
7. [Rate Limiting at Edge](#rate-limiting-at-edge)
8. [Security Headers](#security-headers)
9. [Monitoring & Analytics](#monitoring--analytics)
10. [Validation & Testing](#validation--testing)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- [ ] Cloudflare free/pro account (recommended: Pro or Business for WAF)
- [ ] Domain registered (or currently hosted elsewhere)
- [ ] Access to current DNS provider
- [ ] Admin access to ViralBoost AI infrastructure
- [ ] SSL certificate (Cloudflare provides free)

### Recommended
- [ ] Cloudflare Pro or Business plan (WAF features)
- [ ] API token from Cloudflare (for automation)
- [ ] Access to application logs

### Cloudflare Plans Comparison

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| CDN | ✓ | ✓ | ✓ |
| DDoS Protection | ✓ (Basic) | ✓ (Enhanced) | ✓ (Advanced) |
| WAF | ✗ | ✓ | ✓ |
| Bot Management | ✗ | ✗ | ✓ |
| Rate Limiting | ✗ | ✓ | ✓ |
| Page Rules | 3 | 20 | 200 |
| Analytics | Basic | Advanced | Advanced |

**Recommendation**: Start with **Pro** ($20/month) for WAF + Rate Limiting

---

## Account Setup

### Step 1: Create Cloudflare Account

1. Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Sign up with email
3. Verify email
4. Choose Free, Pro, or Business plan

### Step 2: Add Your Domain

1. Click "Add a domain" in Cloudflare dashboard
2. Enter: `viralboost.app` (replace with your actual domain)
3. Select plan (recommended: Pro)
4. Cloudflare will scan your DNS records

### Step 3: Update Nameservers

Cloudflare will provide 2 nameservers:
```
anna.ns.cloudflare.com
ned.ns.cloudflare.com
```

Go to your **Domain Registrar** (GoDaddy, Namecheap, etc.):
1. Find "Nameserver" settings
2. Replace with Cloudflare nameservers
3. Save (propagation: 24-48 hours)

```bash
# Verify propagation with:
nslookup viralboost.app anna.ns.cloudflare.com
```

---

## DNS Configuration

### Step 1: Configure DNS Records in Cloudflare

Go to Cloudflare Dashboard → DNS

#### Add Your API Server Records

```
Type    Name                 Content              Proxied
A       viralboost.app       YOUR_SERVER_IP       ⚡ (proxied)
CNAME   www                  viralboost.app       ⚡ (proxied)
CNAME   api                  viralboost.app       ⚡ (proxied)
CNAME   cdn                  viralboost.app       ⚡ (proxied)
CNAME   admin                viralboost.app       ⚡ (proxied)
```

**Important**: Set to **Orange Cloud** (⚡ Proxied) to use Cloudflare protection.

### Step 2: SSL/TLS Configuration

Go to: **SSL/TLS** → **Overview**

1. **SSL Mode**: Select **"Full (strict)"**
   - Encrypts connection between Cloudflare and your origin
   - Requires valid SSL on origin server

2. **Minimum TLS Version**: Select **TLS 1.2**

3. **Origin Certificate** (if using Cloudflare cert):
   - Go to **Origin Server**
   - Click **Create Certificate**
   - Copy private key and certificate
   - Add to your server's SSL configuration

---

## CDN Configuration

### Step 1: Cache Settings

Go to: **Caching** → **Cache Rules**

Create rule for static assets:
```
Pattern: viralboost.app/static/*
Cache Level: Cache Everything
Browser TTL: 1 year
Edge TTL: 1 year
```

Create rule for API responses:
```
Pattern: viralboost.app/api/*
Cache Level: Standard
Browser TTL: 5 minutes
Edge TTL: 1 hour
```

### Step 2: Page Rules (Alternative - Legacy)

Go to: **Rules** → **Page Rules**

1. **Rule 1 - Cache Static Files**
   ```
   URL: viralboost.app/static/*
   Settings:
   - Cache Level: Cache Everything
   - Browser Cache TTL: 1 year
   - Edge Cache TTL: 1 year
   ```

2. **Rule 2 - API Caching**
   ```
   URL: viralboost.app/api/*
   Settings:
   - Cache Level: Standard
   - Browser Cache TTL: 5 min
   ```

3. **Rule 3 - Admin Bypass**
   ```
   URL: viralboost.app/admin/*
   Settings:
   - Cache Level: Bypass
   - Security Level: High
   ```

### Step 3: Browser Cache Settings

Go to: **Caching** → **Browser Cache TTL**

Select: **30 minutes** (default, adjust as needed)

### Step 4: Enable Compression

Go to: **Speed** → **Optimization**

- ✓ Enable **Brotli** (best compression)
- ✓ Enable **gzip** (fallback)

---

## WAF Setup

### Step 1: Enable WAF

Go to: **Security** → **WAF**

1. Click **"Enable"**
2. Choose protection level: **Medium** (blocks obvious attacks)
3. Monitor for false positives

### Step 2: Import Custom WAF Rules

**Option A: Via Dashboard (Manual)**

Go to: **Security** → **WAF** → **Custom Rules**

Add each rule manually from `cloudflare-waf-rules.json`

**Option B: Via Cloudflare API (Automated)**

```bash
# 1. Get your Zone ID
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "X-Auth-Email: YOUR_EMAIL@example.com" \
  -H "X-Auth-Key: YOUR_GLOBAL_API_KEY"

# 2. Create rule (replace ZONE_ID)
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/firewall/rules" \
  -H "X-Auth-Email: YOUR_EMAIL@example.com" \
  -H "X-Auth-Key: YOUR_GLOBAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "action": "block",
        "expression": "cf.threat_score > 50"
      }
    ]
  }'
```

### Step 3: Configure Managed Rules

Go to: **Security** → **WAF** → **Managed Rules**

Enable the following:
- ✓ **Cloudflare Managed** (OWASP rule set)
- ✓ **Cloudflare OWASP ModSecurity Core Ruleset**

Sensitivity level: **Medium** (balance between blocking and false positives)

### Step 4: Deploy Custom Rules

Rules to enable (from our JSON config):

1. **SQL Injection Protection** - Blocks `UNION SELECT`, etc.
2. **XSS Protection** - Blocks `<script>`, `onerror=`, etc.
3. **Path Traversal** - Blocks `../`, `%2e%2e`, etc.
4. **HTTP Method Restriction** - Blocks `TRACE`, `CONNECT`
5. **Large Upload Blocking** - Blocks >100MB uploads
6. **Suspicious User Agent** - Blocks curl, wget, etc.

---

## DDoS Protection

### Step 1: Enable DDoS Settings

Go to: **Security** → **DDoS Protection**

1. **DDoS Sensitivity**: Select **"High"**
   - Automatically challenge suspicious traffic
   
2. **Advanced DDoS**: Select **"On"** (if available on your plan)

### Step 2: Rate Limiting (Must-Have)

Go to: **Security** → **Rate Limiting**

Create rules:

**Rule 1: Auth Endpoints**
```
Threshold: 5 requests per 60 seconds
Match: Path contains /api/auth/
Action: Block for 15 minutes
```

**Rule 2: Upload Endpoints**
```
Threshold: 20 requests per 3600 seconds
Match: Path contains /api/videos/upload OR /api/user/upload
Action: Block for 1 hour
```

**Rule 3: AI Analysis**
```
Threshold: 30 requests per 3600 seconds
Match: Path contains /api/ai/
Action: Challenge
```

**Rule 4: General API**
```
Threshold: 100 requests per 60 seconds
Match: Path contains /api/ AND (not /api/auth/ AND not /api/ai/)
Action: Challenge
```

### Step 3: Super Bot Fight Mode (Optional)

Go to: **Security** → **Bots** → **Bot Fight Mode**

- ✓ Enable **Super Bot Fight Mode** (Pro/Business)
- Set sensitivity: **Definitely Automated** (strictest)

---

## Rate Limiting at Edge

### Step 1: Create Rate Limit Rules

Go to: **Security** → **Rate Limiting** (or **Firewall** → **Rate Limiting**)

#### Rule Configuration:

**For Authentication (Strictest)**
```
Description: Block auth brute force
Path: Contains /api/auth/login
Threshold: 5 requests per minute
Counting: By IP
Block Duration: 1 hour
Action: Block
```

**For Uploads**
```
Description: Limit video uploads
Path: Contains /api/videos/upload
Threshold: 20 per hour
Counting: By IP
Block Duration: 1 hour
Action: Challenge
```

**For AI Analysis**
```
Description: Limit AI requests
Path: Contains /api/ai/
Threshold: 30 per hour
Counting: By IP
Block Duration: 1 hour
Action: Challenge
```

### Step 2: Custom Headers for Rate Limiting

Your application already has rate limiting (from previous setup). Cloudflare will add headers:

```
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1609459200
```

---

## Security Headers

### Step 1: Configure Security Headers

Go to: **Security** → **Security Headers**

Enable:
- ✓ **X-Content-Type-Options**: `nosniff`
- ✓ **X-Frame-Options**: `DENY` (or `SAMEORIGIN`)
- ✓ **X-XSS-Protection**: `1; mode=block`

### Step 2: HSTS (HTTP Strict Transport Security)

Go to: **SSL/TLS** → **HSTS**

Enable with settings:
- **HSTS Max Age**: 12 months (31536000 seconds)
- **Include Subdomains**: ✓
- **Preload**: ✓ (submit to browser preload lists)

### Step 3: Add Custom Headers

Create transformation rule:

Go to: **Rules** → **Transform Rules** → **Modify Response Header**

Add headers:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'
Permissions-Policy: geolocation=(), microphone=(), camera=()
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Monitoring & Analytics

### Step 1: Enable Analytics & Logging

Go to: **Analytics & Logs** → **Analytics**

Available metrics:
- Page Views
- Bandwidth
- Requests
- Cache Hit Ratio
- Threats Blocked
- Errors

### Step 2: Create Custom Analytics

Go to: **Logs** → **Logpush**

Set up log delivery to:
- [ ] S3 bucket
- [ ] Google Cloud Storage
- [ ] Azure Blob
- [ ] Splunk
- [ ] Sumo Logic

**Recommended**: Send to S3 for long-term analysis

```
Logs to enable:
- HTTP Requests
- Firewall Events
- Cache Analytics
```

### Step 3: Set Up Alerts

Go to: **Notifications** → **Create Alert**

Create alerts for:
1. **High Attack Rate**
   ```
   Trigger: >1000 threat hits in 1 minute
   Action: Email
   ```

2. **Service Degradation**
   ```
   Trigger: Error rate >2%
   Action: Email + Pagerduty
   ```

3. **SSL Certificate Expiring**
   ```
   Trigger: Certificate expires in <30 days
   Action: Email
   ```

### Step 4: Export Analytics

Go to: **Analytics & Logs** → **Analytics**

Create custom dashboards or export to third-party:
- Datadog
- New Relic
- Grafana
- Splunk

---

## Validation & Testing

### Step 1: Verify DNS Propagation

```bash
# Check DNS is using Cloudflare
nslookup viralboost.app

# Should return Cloudflare IP
# Not your origin server IP
```

### Step 2: Test SSL/TLS

```bash
# Verify SSL certificate
curl -I https://viralboost.app

# Should show:
# HTTP/2 200
# CF-RAY: [cloudflare-ray-id]
```

### Step 3: Test WAF Rules

**Test SQL Injection Block**:
```bash
curl "https://viralboost.app/api/users?id=1' OR '1'='1"
# Should return 403 Forbidden
```

**Test XSS Block**:
```bash
curl "https://viralboost.app/api/search?q=<script>alert('xss')</script>"
# Should return 403 Forbidden
```

**Test Rate Limiting**:
```bash
# Run in rapid succession
for i in {1..10}; do curl https://viralboost.app/api/auth/login -X POST; done

# After threshold, should return 429 Too Many Requests
```

### Step 4: Test Caching

```bash
# Check cache headers
curl -I https://viralboost.app/static/style.css

# Should show:
# Cache-Control: public, max-age=31536000
# CF-Cache-Status: HIT (after first request)
```

### Step 5: Performance Test

Use Lighthouse or WebPageTest:

**Before Cloudflare**:
- Expected metrics: Your baseline

**After Cloudflare**:
- TTFB: Should decrease by 20-40%
- Load Time: Should improve by 30-50%
- Cache Hit Ratio: Should be 60-80%

### Step 6: Test Admin Protection

```bash
# Without auth header - should be blocked
curl https://viralboost.app/api/admin/users

# With Cloudflare bypass
curl -H "X-Admin-Token: your-token" https://viralboost.app/api/admin/users
```

---

## Configuration for Application

### Step 1: Update Environment Variables

Add to `.env.production`:

```env
# Cloudflare Configuration
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_KEY=your_api_key
CLOUDFLARE_EMAIL=your_email@example.com

# WAF Settings
WAF_ENABLED=true
WAF_CHALLENGE_LEVEL=medium
WAF_RATE_LIMIT_AUTH=5
WAF_RATE_LIMIT_UPLOAD=20
WAF_RATE_LIMIT_ANALYSIS=30
WAF_RATE_LIMIT_GENERAL=100

# DDoS Settings
DDOS_PROTECTION_ENABLED=true
DDOS_SENSITIVITY=high

# Cache Settings
CDN_ENABLED=true
CACHE_STATIC_TTL=31536000
CACHE_API_TTL=3600
CACHE_BROWSER_TTL=300

# Analytics
CLOUDFLARE_ANALYTICS_ENABLED=true
```

### Step 2: Update Middleware for Headers

See: `Update middleware.ts` section below

### Step 3: Validate Configuration

```bash
# Test connection to API
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID"

# Should return zone information
```

---

## Update middleware.ts

Add to your existing `/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // CSP (adjust as needed)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  // Cloudflare headers passthrough
  const cfRay = request.headers.get('cf-ray');
  const cfCountry = request.headers.get('cf-ipcountry');
  
  if (cfRay) response.headers.set('X-CF-Ray', cfRay);
  if (cfCountry) response.headers.set('X-Client-Country', cfCountry);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Monitoring Checklist

### Daily Monitoring
- [ ] Check Analytics dashboard for anomalies
- [ ] Review blocked requests (false positives?)
- [ ] Monitor cache hit ratio (should be >60%)
- [ ] Check error rates (<2%)

### Weekly Monitoring
- [ ] Review WAF logs for patterns
- [ ] Analyze top blocked endpoints
- [ ] Check for DDoS attempts
- [ ] Verify SSL certificate status

### Monthly Monitoring
- [ ] Audit WAF rules effectiveness
- [ ] Review and update rate limits
- [ ] Optimize cache TTLs
- [ ] Check cost optimization opportunities
- [ ] Review security audit logs

---

## Troubleshooting

### Problem: "SSL Certificate Error"

**Solution**:
1. Go to **SSL/TLS** → **Overview**
2. Verify **SSL Mode** is set to "Full (strict)"
3. Ensure origin server certificate is valid
4. Wait 5-10 minutes for propagation

### Problem: "Page Rule Not Working"

**Solution**:
1. Check rule order (higher priority overrides lower)
2. Verify URL pattern matches exactly
3. Check if WAF rule is blocking before page rule applies
4. Use Transform Rules instead (newer feature)

### Problem: "Too Many False Positives"

**Solution**:
1. Reduce WAF sensitivity (Settings → Medium)
2. Whitelist specific IPs or user agents
3. Check WAF logs for which rule is blocking
4. Disable specific rules if not needed
5. Implement Cloudflare challenge instead of block

### Problem: "Cache Not Working"

**Solution**:
1. Verify **Orange Cloud** (proxied) on DNS record
2. Check browser console for `CF-Cache-Status` header
3. Check Cache Control headers from origin
4. Verify page rule cache settings
5. Clear cache: **Caching** → **Purge Cache** → **Purge Everything**

### Problem: "High False Positives on Legitimate Users"

**Solution**:
1. Check CF logs for which rule is triggering
2. Whitelist legitimate user agents
3. Adjust rate limit thresholds
4. Use **Challenge** (CAPTCHA) instead of **Block**
5. Create exceptions for authenticated users

### Problem: "Performance Not Improved"

**Solution**:
1. Verify Brotli/gzip compression enabled
2. Check cache hit ratio: should be >60%
3. Enable image optimization: **Speed** → **Optimization**
4. Use Rocket Loader if applicable
5. Check origin server response time

---

## API Integration (Optional)

### Script: Cloudflare Health Check

```bash
#!/bin/bash
# cloudflare-health-check.sh

ZONE_ID="your_zone_id"
API_TOKEN="your_api_token"
EMAIL="your_email@example.com"

# Check zone status
echo "=== Cloudflare Zone Status ==="
curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_TOKEN" \
  -H "Content-Type: application/json"

# Get security settings
echo -e "\n=== WAF Status ==="
curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/firewall/waf/overrides" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_TOKEN"

# Check rate limiting
echo -e "\n=== Rate Limiting Rules ==="
curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rate_limit" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_TOKEN"
```

---

## Cost Optimization

### Estimated Monthly Costs

```
Cloudflare Pro: $20/month
- CDN for global delivery
- WAF protection
- Rate limiting (10k/month)
- Basic DDoS protection

Business Plan (Optional): $200/month
- Advanced DDoS (automatic scaling)
- Bot Management (ML-based)
- More page rules (200 vs 20)
- Priority support

Storage (S3 logs):
- ~100GB/month of logs
- Cost: ~$2.30/month
```

### Cost Savings

Expected savings from improved performance:
- Reduced origin bandwidth: 40-60%
- Reduced origin CPU usage: 30-50%
- Faster international access: 30-50% TTFB improvement

**ROI**: Cloudflare typically pays for itself through bandwidth savings within 3-6 months.

---

## Security Best Practices

1. **Regular Audits**
   - Review WAF logs weekly
   - Adjust rules quarterly
   - Test security regularly

2. **Least Privilege**
   - Use API tokens (not global keys)
   - Rotate credentials monthly
   - Limit token scopes

3. **Monitoring**
   - Set up alerts for high attack rates
   - Monitor false positive ratio (<1%)
   - Track performance metrics

4. **Updates**
   - Keep WAF rules current
   - Review Cloudflare security updates
   - Implement new protections quickly

5. **Incident Response**
   - Document response procedures
   - Have runbooks for common issues
   - Test incident response quarterly

---

## Next Steps

1. [ ] Create Cloudflare account (if not done)
2. [ ] Add domain to Cloudflare
3. [ ] Update nameservers at registrar
4. [ ] Wait for DNS propagation (24-48h)
5. [ ] Configure SSL/TLS settings
6. [ ] Enable WAF and import rules
7. [ ] Configure rate limiting rules
8. [ ] Set up DDoS protection
9. [ ] Configure caching rules
10. [ ] Update application middleware
11. [ ] Test all security rules (see Testing section)
12. [ ] Set up monitoring and alerts
13. [ ] Train team on management
14. [ ] Monitor for first week
15. [ ] Optimize based on analytics

---

## Support Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/docs/
- **WAF Rules**: https://developers.cloudflare.com/waf/
- **Rate Limiting**: https://developers.cloudflare.com/rate-limiting/
- **API Reference**: https://developers.cloudflare.com/api/
- **Community**: https://community.cloudflare.com/

---

## Maintenance Checklist

### Weekly
- [ ] Review attack logs
- [ ] Check cache hit ratio
- [ ] Monitor error rates
- [ ] Look for new bot patterns

### Monthly
- [ ] Audit access logs
- [ ] Optimize WAF rules
- [ ] Update rate limits if needed
- [ ] Review security alerts
- [ ] Check certificate expiration

### Quarterly
- [ ] Full security audit
- [ ] Performance review
- [ ] Cost analysis
- [ ] Team training update
- [ ] Update documentation

---

*Last Updated: March 2026*
*Next Review: April 2026*
