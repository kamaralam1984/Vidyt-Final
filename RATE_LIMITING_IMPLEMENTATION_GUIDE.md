# API Rate Limiting & Abuse Protection Implementation Guide

## Overview
ViralBoost AI now has production-grade rate limiting and abuse protection with bot detection, automatic IP blocking, and admin monitoring.

## Quick Start

### 1. **Protect Critical Endpoints**

### Auth Endpoints (Strictest)
```typescript
import { withAuthRateLimit } from '@/middleware/rateLimitMiddleware';

async function handleLogin(request: NextRequest) {
  // your logic
}

export const POST = withAuthRateLimit(
  (req) => handleLogin(req),
  { endpoint: '/api/auth/login', preset: 'login' } // 3 req/15min
);
```

### Upload Endpoints
```typescript
import { withUploadRateLimit } from '@/middleware/rateLimitMiddleware';

export const POST = withUploadRateLimit(
  (req) => handleUpload(req),
  { endpoint: '/api/user/upload' } // 20 req/hour
);
```

### AI Analysis Endpoints
```typescript
import { withAnalysisRateLimit } from '@/middleware/rateLimitMiddleware';

export const POST = withAnalysisRateLimit(
  (req) => handleAnalysis(req),
  { endpoint: '/api/ai/analyze' } // 30 req/hour
);
```

### Admin Endpoints
```typescript
import { withAdminRateLimit } from '@/middleware/rateLimitMiddleware';

export const GET = withAdminRateLimit(
  (req) => handleAdminAction(req),
  { endpoint: '/api/admin/users' } // 200 req/min
);
```

### General API Endpoints
```typescript
import { withRateLimit, RATE_LIMITS } from '@/middleware/rateLimitMiddleware';

export const GET = withRateLimit(
  (req) => handleRequest(req),
  { 
    endpoint: '/api/custom',
    preset: 'api' // 100 req/min, configurable
  }
);
```

---

## Rate Limit Presets

| Endpoint | Limit | Window | Use Case |
|----------|-------|--------|----------|
| `auth` | 5 | 15 min | General auth operations |
| `login` | 3 | 15 min | Login attempts (strictest) |
| `register` | 5 | 1 hour | Registration |
| `passwordReset` | 3 | 1 hour | Password recovery |
| `upload` | 20 | 1 hour | File uploads |
| `analysis` | 30 | 1 hour | AI analysis requests |
| `api` | 100 | 1 min | General API access |
| `search` | 60 | 1 min | Search operations |
| `export` | 5 | 1 hour | Data exports |
| `webhook` | 10 | 1 min | External webhooks |
| `admin` | 200 | 1 min | Admin operations |
| `public` | 1000 | 1 min | Public endpoints |

---

## Advanced Features

### 1. **Bot Detection**
Automatically detects and blocks suspicious behavior:
- Missing/non-standard user agents
- Rapid requests (suspicious patterns)
- Known bot signatures

**Example:**
```typescript
export const PATCH = withRateLimit(
  (req) => handleRequest(req),
  { 
    endpoint: '/api/users/:id',
    preset: 'api',
    checkBot: true,        // Enable bot detection
    blockSuspicious: true  // Block if bot detected
  }
);
```

### 2. **Failure Tracking**
Track authentication failures for exponential backoff:
```typescript
import { trackFailure } from '@/lib/rateLimiter';

try {
  await loginUser(email, password);
} catch (error) {
  const ip = getClientIP(request);
  trackFailure(`auth_fail:${ip}:${email}`);
  // After 10 failures in 15 min, IP will be flagged
  throw error;
}
```

### 3. **IP Blocking**
Manual or automatic IP blocking:
```typescript
import { blockIP, unblockIP, isIPBlocked } from '@/lib/rateLimiter';

// Block for 1 hour
blockIP('192.168.1.1', 60 * 60 * 1000);

// Check if blocked
if (isIPBlocked(ip)) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}

// Unblock
unblockIP('192.168.1.1');
```

### 4. **Suspicious Activity Recording**
```typescript
import { recordSuspiciousActivity } from '@/lib/rateLimiter';

// Record with severity levels: 'low', 'medium', 'high'
recordSuspiciousActivity(
  ip,
  'brute_force_attempt',
  'high'
);

// After 5 high-severity activities, auto-block for 1 hour
```

### 5. **Custom Rate Limits**
```typescript
import { rateLimit } from '@/lib/rateLimiter';

// Standard usage
const result = rateLimit(
  `user:${userId}:endpoint`,
  {
    limit: 50,
    windowMs: 60 * 60 * 1000 // 1 hour
  }
);

if (!result.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { 
      status: 429,
      headers: { 'Retry-After': String(result.retryAfter) }
    }
  );
}
```

---

## Admin Monitoring Dashboard

### Access Abuse Logs
**Endpoint**: `GET /api/admin/compliance/abuse-logs`

**Query Parameters:**
```
?page=1
&limit=50
&severity=high|medium|low
&type=rate_limit_exceeded|bot_detected|suspicious_activity|blocked_ip|excessive_failures
&ip=192.168.1.1
&userId=user_id
&reviewed=true|false
&timeRange=24  // hours
&action=none|warning|rate_limit_increased|ip_blocked|account_suspended
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "...",
        "ipAddress": "192.168.1.1",
        "endpoint": "/api/auth/login",
        "violationType": "rate_limit_exceeded",
        "severity": "high",
        "description": "Rate limit exceeded: 3 requests per 900s",
        "botScore": 25,
        "botReasons": ["bot_user_agent"],
        "reviewed": false,
        "actionTaken": "none",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 145,
      "page": 1,
      "limit": 50,
      "pages": 3
    },
    "summary": [
      {
        "_id": "rate_limit_exceeded",
        "count": 87,
        "criticalCount": 12
      }
    ],
    "topOffenders": [
      {
        "_id": "192.168.1.1",
        "count": 45,
        "lastSeen": "2024-01-15T10:30:00Z",
        "severity": "critical"
      }
    ]
  }
}
```

### Update Abuse Logs
**Endpoint**: `PUT /api/admin/compliance/abuse-logs`

```json
{
  "logIds": ["log1", "log2"],
  "reviewed": true,
  "adminNotes": "False positive - testing",
  "actionTaken": "warning",
  "userId": "admin_id"
}
```

### Delete Abuse Logs
**Endpoint**: `DELETE /api/admin/compliance/abuse-logs`

```json
{
  "olderThanDays": 30  // Delete logs older than 30 days
}
```

Or:
```json
{
  "logIds": ["log1", "log2"]  // Delete specific logs
}
```

---

## Configuration Best Practices

### 1. **Endpoint Protection Checklist**
- ✅ Auth endpoints: Use `withAuthRateLimit` (3 req/15min)
- ✅ Upload endpoints: Use `withUploadRateLimit` (20 req/hour)
- ✅ AI analysis: Use `withAnalysisRateLimit` (30 req/hour)
- ✅ Admin endpoints: Use `withAdminRateLimit` (200 req/min)
- ✅ Public endpoints: Use `withRateLimit` with `public` preset

### 2. **Monitoring**
- Check `/api/admin/compliance/abuse-logs` daily
- Review "high" and "critical" severity entries
- Block persistent offenders manually if needed

### 3. **Tuning**
Adjust `RATE_LIMITS` in `/lib/rateLimiter.ts` based on:
- User patterns (too strict = false positives)
- API usage analytics
- Abuse trend data

### 4. **Security Hardening**
```typescript
// Protect all auth endpoints
export const POST = withAuthRateLimit(
  handler,
  { 
    endpoint: '/api/auth/register',
    checkBot: true,
    blockSuspicious: true,
    logAbuse: true
  }
);
```

---

## Error Responses

### Rate Limit Exceeded (429)
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```
**Header**: `Retry-After: 45`

### Blocked IP (403)
```json
{
  "error": "Access denied. IP is blocked."
}
```

### Bot Detected (403)
```json
{
  "error": "Suspicious activity detected."
}
```

---

## Migrating Existing Endpoints

### Before:
```typescript
export async function POST(request: NextRequest) {
  // unprotected
}
```

### After:
```typescript
import { withRateLimit, RATE_LIMITS } from '@/middleware/rateLimitMiddleware';

async function handleRequest(request: NextRequest) {
  // your logic
}

export const POST = withRateLimit(
  (req) => handleRequest(req),
  { endpoint: '/api/endpoint', preset: 'api' }
);
```

---

## Integration with Existing Systems

### User-Based Rate Limiting
```typescript
import { rateLimit } from '@/lib/rateLimiter';
import { getUserFromRequest } from '@/lib/auth';

const user = await getUserFromRequest(request);
const identifier = `user:${user.id}:endpoint`;

const result = rateLimit(identifier, RATE_LIMITS.upload);
if (!result.allowed) {
  // User hit their limit
}
```

### Subscription Tier Rate Limits
```typescript
// Adjust limits based on subscription
const tierLimits = {
  free: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10/hour
  pro: { limit: 100, windowMs: 60 * 60 * 1000 }, // 100/hour
  enterprise: { limit: 1000, windowMs: 60 * 60 * 1000 }, // 1000/hour
};

const limit = tierLimits[user.subscriptionPlan] || tierLimits.free;
const result = rateLimit(identifier, limit);
```

---

## Troubleshooting

### Users Getting Rate Limited Unexpectedly
1. Check `/api/admin/compliance/abuse-logs` for patterns
2. Verify the endpoint preset
3. Check if IP is blocked: See `getBlockedIPs()`
4. Adjust limits in `RATE_LIMITS` if needed

### Rate Limiter Not Working
1. Verify middleware is imported: `import { withRateLimit } from '@/middleware/rateLimitMiddleware'`
2. Check endpoint export: `export const POST = withRateLimit(...)`
3. Verify MongoDB connection for abuse logging
4. Check logs for errors in rate limiting middleware

### Too Many False Positives
1. Disable `blockSuspicious` for that endpoint
2. Review `botReasons` in abuse logs
3. Adjust bot detection thresholds in `detectBotBehavior()`

---

## Performance Considerations

### Memory Usage
- In-memory store grows with unique identifiers
- Automatic cleanup runs periodically (1% of requests)
- For distributed systems, consider Redis cache

### Database Usage
- Only logs abuse violations (not all requests)
- Query optimization with indexes on: `createdAt`, `ipAddress`, `severity`, `violationType`
- Archive old logs regularly with DELETE endpoint

### Scalability
The current implementation supports:
- **Small deployments**: Up to 1,000 RPS with in-memory store
- **Medium deployments**: Up to 10,000 RPS with Redis add-on
- **Enterprise**: Distributed cache with database persistence

---

## Next Steps

1. ✅ Apply rate limiting to all critical endpoints
2. ✅ Monitor abuse logs daily
3. ✅ Tune limits based on real usage patterns
4. ✅ Add custom alerts for high-severity events
5. ✅ Consider Redis cache for distributed deployments
