# Cloudflare Production Rules — VidYT
Configure these in: Cloudflare Dashboard → vidyt.com → Security / Rules / Cache

---

## 1. WAF Custom Rules (Security → WAF → Custom Rules)

### Rule 1: Block AI Crawlers & Aggressive Bots
**Name:** Block AI Crawlers  
**Order:** 1 (highest priority)

Expression:
```
(cf.client.bot) and not (cf.verified_bot_category in {"Search Engine Crawler" "Monitoring & Analytics"})
or
(http.user_agent contains "GPTBot")
or
(http.user_agent contains "Claude-Web")
or
(http.user_agent contains "Bytespider")
or
(http.user_agent contains "AhrefsBot")
or
(http.user_agent contains "SemrushBot")
or
(http.user_agent contains "MJ12bot")
```
**Action:** Block

---

### Rule 2: Challenge Non-India Traffic on Sensitive APIs
**Name:** Challenge non-IN on auth/payment APIs  
**Order:** 2

Expression:
```
(ip.geoip.country ne "IN") and (
  http.request.uri.path contains "/api/auth/" or
  http.request.uri.path contains "/api/payments/" or
  http.request.uri.path contains "/api/subscriptions/"
) and not cf.verified_bot_category in {"Search Engine Crawler"}
```
**Action:** Managed Challenge (JS Challenge)

> Note: Use "Block" instead of "Managed Challenge" if you want hard blocking.
> Keep as Challenge to allow legitimate international users who manually verify.

---

### Rule 3: Block Direct IP Access (non-Cloudflare)
**Name:** Block direct IP requests  
**Order:** 3

Expression:
```
(not cf.tls_client_hello_had_extensions) or
(http.host matches "^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$")
```
**Action:** Block

---

### Rule 4: Protect Health Endpoints from Automated Polling
**Name:** Rate challenge health endpoint bots  
**Order:** 4

Expression:
```
(http.request.uri.path contains "/api/health") and
(not ip.geoip.country in {"IN" "US" "GB" "SG"}) and
(cf.client.bot)
```
**Action:** Managed Challenge

---

## 2. Rate Limiting Rules (Security → WAF → Rate Limiting)

### Rule 1: API General Rate Limit
**Name:** API rate limit  
**Request match:** `URI Path starts with /api/`  
**Rate:** 100 requests per 10 seconds per IP  
**Action:** Block (duration: 60s)

### Rule 2: Auth Endpoint Rate Limit
**Name:** Auth strict rate limit  
**Request match:** `URI Path starts with /api/auth/`  
**Rate:** 10 requests per 60 seconds per IP  
**Action:** Block (duration: 300s)

---

## 3. Bot Fight Mode (Security → Bots)

- **Bot Fight Mode:** ON ✅
- **Super Bot Fight Mode (if on Pro+):** Enable all toggles
  - Block: Definitely Automated
  - Challenge: Likely Automated
  - Allow: Verified Bots

---

## 4. Cache Rules (Rules → Cache Rules)

### Rule 1: Bypass Cache for API Routes
**Name:** No cache for API  
**Match:** URI Path starts with `/api/`  
**Cache:** Bypass

### Rule 2: Cache Next.js Static Assets
**Name:** Cache _next/static forever  
**Match:** URI Path starts with `/_next/static/`  
**Cache:** Cache everything  
**Edge TTL:** Respect origin (Next.js sends immutable,max-age=31536000)  
**Browser TTL:** Respect origin

### Rule 3: Cache Public Images
**Name:** Cache public images  
**Match:** URI Path extension is in `{png, jpg, jpeg, gif, svg, ico, webp, woff, woff2}`  
**Cache:** Cache everything  
**Edge TTL:** 1 day  
**Browser TTL:** 1 day

### Rule 4: No Cache for HTML Pages
**Name:** No cache HTML  
**Match:** URI Path does NOT start with `/_next/static/` AND does NOT start with `/api/`  
**Cache:** Bypass  
*(This ensures logged-in/logged-out pages are never served stale)*

---

## 5. Network Settings (Network tab)

- **HTTP/3 (QUIC):** On
- **WebSockets:** On ✅ (required for Next.js HMR and any live features)
- **Opportunistic Encryption:** On
- **0-RTT Connection Resumption:** On

---

## 6. SSL/TLS Settings (SSL/TLS tab)

- **Mode:** Full (Strict) ✅ — already configured
- **Always Use HTTPS:** On
- **HSTS:** Enable with `max-age=31536000; includeSubDomains; preload`
- **Minimum TLS Version:** TLS 1.2
- **TLS 1.3:** On

---

## 7. Scrape Shield (Scrape Shield tab)

- **Email Address Obfuscation:** On
- **Server-side Excludes:** On
- **Hotlink Protection:** On (prevents image hotlinking from other sites)
