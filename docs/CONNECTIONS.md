# VidYT — File Connections Map

> Ye file batati hai ki project ka kaun sa file/folder kis dusre folder se connected hai.
> Architecture samajhne ke liye ise pehle padho.

---

## Project Layer Overview

```
Browser/Client
    ↓
app/  (Next.js Pages + API Routes)
    ↓
components/  (UI Components)
    ↓
lib/  (Core Utilities & Helpers)
    ↓
services/  (Business Logic)
    ↓
models/  (MongoDB Schemas)
    ↓
workers/  (Background Jobs via BullMQ)
    ↓
MongoDB + Redis  (Database & Cache)
```

---

## 1. `middleware.ts` (Root)
**Kya karta hai:** Har request pe run hota hai — auth check, rate limit, geo-block

| Connects To | Kyu |
|-------------|-----|
| `lib/auth-jwt.ts` | JWT token verify karta hai |
| `lib/rateLimiter.ts` | Request rate check karta hai |
| `lib/redis.ts` | Rate limit counter store karta hai |
| `middleware/rateLimitMiddleware.ts` | Rate limit logic delegate karta hai |
| `middleware/usageGuard.ts` | Usage quota check karta hai |
| `lib/geolocation.ts` | Country detect karta hai (geo-block) |

---

## 2. `lib/` — Core Library

### `lib/mongodb.ts`
**Kya karta hai:** MongoDB connection singleton

| Connects To | Kyu |
|-------------|-----|
| Sab `models/*.ts` | Sab models isko import karte hain |
| Sab `app/api/**` routes | API routes DB se baat karne ke liye |
| `services/*.ts` | Services bhi DB use karte hain |

### `lib/redis.ts`
**Kya karta hai:** Redis client (cache + queue)

| Connects To | Kyu |
|-------------|-----|
| `lib/cache.ts` | Cache operations ke liye |
| `lib/queue.ts` | BullMQ queue ke liye |
| `lib/rateLimiter.ts` | Rate limiting ke liye |
| `lib/trackingQueue.ts` | Tracking events queue ke liye |
| `workers/*.ts` | Workers Redis queue consume karte hain |

### `lib/auth.ts`
**Kya karta hai:** Auth helper — session check, user fetch

| Connects To | Kyu |
|-------------|-----|
| `lib/mongodb.ts` | User DB se fetch karta hai |
| `models/User.ts` | User model use karta hai |
| `lib/auth-jwt.ts` | JWT verify karta hai |
| `app/api/auth/**` | Auth routes isko use karte hain |

### `lib/auth-jwt.ts`
**Kya karta hai:** JWT sign/verify

| Connects To | Kyu |
|-------------|-----|
| `middleware.ts` | Token verify hota hai |
| `lib/auth.ts` | Auth helper isko call karta hai |
| `app/api/auth/login/` | Login pe token banta hai |
| `app/api/auth/refresh/` | Token refresh pe use hota hai |

### `lib/adminAuth.ts`
**Kya karta hai:** Admin/Super-Admin auth check

| Connects To | Kyu |
|-------------|-----|
| `lib/auth.ts` | Base auth ke upar build hota hai |
| `models/Role.ts` | Role check karta hai |
| `app/api/admin/**` | Sab admin routes isko use karte hain |

### `lib/queue.ts`
**Kya karta hai:** BullMQ queue setup

| Connects To | Kyu |
|-------------|-----|
| `lib/redis.ts` | Redis queue backend hai |
| `workers/aiWorker.ts` | AI jobs queue se uthata hai |
| `workers/postingWorker.ts` | Scheduled post jobs |
| `workers/bulkEmailWorker.ts` | Email jobs |
| `workers/trackingWorker.ts` | Analytics tracking jobs |

### `lib/rateLimiter.ts`
**Kya karta hai:** API rate limiting logic

| Connects To | Kyu |
|-------------|-----|
| `lib/redis.ts` | Counter Redis mein store hota hai |
| `middleware.ts` | Middleware isko call karta hai |
| `middleware/rateLimitMiddleware.ts` | Delegate karta hai |

### `lib/planLimits.ts`
**Kya karta hai:** Plan ke basis pe feature limits define karta hai

| Connects To | Kyu |
|-------------|-----|
| `lib/usageCheck.ts` | Usage check karte waqt limits compare karta hai |
| `lib/limitChecker.ts` | Limit exceed check karta hai |
| `lib/buildUserFeatureMap.ts` | User ka feature map banta hai |
| `models/Plan.ts` | Plan data ke saath sync |

### `lib/usageCheck.ts`
**Kya karta hai:** User ne kitna use kiya check karta hai

| Connects To | Kyu |
|-------------|-----|
| `models/Usage.ts` | Usage record fetch karta hai |
| `lib/planLimits.ts` | Limit compare karne ke liye |
| `lib/redis.ts` | Cache karta hai |
| `middleware/usageGuard.ts` | Guard isko call karta hai |

### `lib/ai-router.ts`
**Kya karta hai:** AI provider route karta hai (OpenAI / Gemini / etc)

| Connects To | Kyu |
|-------------|-----|
| `lib/ai-composite.ts` | Composite AI calls |
| `lib/ai-image.ts` | Image generation |
| `lib/ai-vision.ts` | Vision analysis |
| `services/ai/*.ts` | AI services isko use karte hain |
| `app/api/ai/**` | AI API routes |

### `lib/socket-server.ts`
**Kya karta hai:** WebSocket server (live features ke liye)

| Connects To | Kyu |
|-------------|-----|
| `server.ts` | Custom server mein initialize hota hai |
| `hooks/useSocket.ts` | Client side socket hook |
| `app/api/admin/super/live/` | Live analytics pe data push |

---

## 3. `models/` — MongoDB Schemas

| Model | Kaha Use Hota Hai |
|-------|-------------------|
| `User.ts` | `lib/auth.ts`, `app/api/auth/**`, `services/email.ts` |
| `Plan.ts` | `lib/planLimits.ts`, `lib/planPricing.ts`, `app/api/admin/plans/` |
| `Subscription.ts` | `app/api/payments/**`, `services/payments/**`, `app/api/admin/subscriptions/` |
| `Payment.ts` | `services/payments/razorpay.ts`, `services/payments/paypal.ts` |
| `Usage.ts` | `lib/usageCheck.ts`, `lib/usageControl.ts`, `app/api/admin/analytics/usage/` |
| `Channel.ts` | `services/youtube.ts`, `services/youtubeAnalytics.ts`, `app/api/channel/**` |
| `Video.ts` | `services/youtubeUpload.ts`, `services/youtubeVideoStats.ts` |
| `ScheduledPost.ts` | `workers/postingWorker.ts`, `services/scheduler/**`, `app/api/schedule/**` |
| `AIScript.ts` | `app/api/ai/script-generator/`, `services/ai/aiStudio.ts` |
| `AIShorts.ts` | `app/api/ai/shorts-creator/`, `workers/aiWorker.ts` |
| `AIThumbnail.ts` | `app/api/ai/thumbnail-generator/`, `services/ai/thumbnailAnalysis.ts` |
| `AIHook.ts` | `app/api/ai/hook-generator/` |
| `TrackingLog.ts` | `workers/trackingWorker.ts`, `app/api/admin/super/tracking/` |
| `UserSession.ts` | `lib/auth.ts`, `app/api/auth/me/` |
| `Role.ts` | `lib/adminAuth.ts`, `lib/permissions.ts`, `app/api/admin/roles/` |
| `FeatureAccess.ts` | `lib/buildUserFeatureMap.ts`, `lib/assertUserFeature.ts` |
| `Notification.ts` | `app/api/notifications/**`, `components/UsageNotificationsBell.tsx` |
| `BulkEmailCampaign.ts` | `workers/bulkEmailWorker.ts`, `app/api/admin/super/bulk-email/**` |
| `WebsiteAudit.ts` | `services/auditEngine.ts`, `app/api/admin/super/website-audit/**` |
| `AuditAlert.ts` | `services/auditAlertService.ts`, `app/api/admin/super/website-audit/alerts/` |
| `SeoPage.ts` | `lib/autoCreateSeoPage.ts`, `app/api/seo-pages/**` |
| `ApiKey.ts` | `lib/apiKeyAuth.ts`, `app/api/settings/**` |
| `ViralPrediction.ts` | `services/ai/viralPredictionService.ts`, `lib/predictionOutcomeSync.ts` |
| `Competitor.ts` | `services/competitor/intelligence.ts`, `app/api/competitor/**` |
| `Team.ts` / `Workspace.ts` | `app/api/settings/**`, `components/DashboardLayout.tsx` |
| `Ticket.ts` / `TicketReply.ts` | `app/api/admin/super/support/**` |
| `FunnelEvent.ts` | `app/api/admin/super/analytics/funnel/` |

---

## 4. `services/` — Business Logic

| Service | Connects To |
|---------|-------------|
| `services/youtube.ts` | `models/Channel.ts`, `models/Video.ts`, `lib/mongodb.ts` |
| `services/youtubeAnalytics.ts` | `models/Channel.ts`, `lib/cache.ts`, `lib/redis.ts` |
| `services/youtubeUpload.ts` | `models/Video.ts`, `models/ScheduledPost.ts`, `workers/postingWorker.ts` |
| `services/youtubeVideoStats.ts` | `models/Video.ts`, YouTube Data API |
| `services/email.ts` | `models/User.ts`, `models/MarketingEmail.ts`, SMTP config |
| `services/otp.ts` | `models/PendingUser.ts`, `services/email.ts` |
| `services/payments/razorpay.ts` | `models/Payment.ts`, `models/Subscription.ts`, Razorpay API |
| `services/payments/paypal.ts` | `models/Payment.ts`, `models/Subscription.ts`, PayPal API |
| `services/ai/viralPredictionService.ts` | `models/ViralPrediction.ts`, `lib/ai-router.ts` |
| `services/ai/aiStudio.ts` | `models/AIScript.ts`, `lib/ai-router.ts`, `lib/usageCheck.ts` |
| `services/ai/thumbnailAnalysis.ts` | `models/AIThumbnail.ts`, `lib/ai-vision.ts` |
| `services/ai/supportAI.ts` | `models/ChatMessage.ts`, `lib/secureChatbot.ts` |
| `services/auditEngine.ts` | `models/WebsiteAudit.ts`, `models/MonitoredSite.ts`, `lib/redis.ts` |
| `services/auditAlertService.ts` | `models/AuditAlert.ts`, `services/email.ts` |
| `services/scheduler/uploadScheduledPosts.ts` | `models/ScheduledPost.ts`, `services/youtubeUpload.ts` |
| `services/scheduler/contentCalendar.ts` | `models/ScheduledPost.ts`, `app/api/schedule/calendar/` |
| `services/competitor/intelligence.ts` | `models/Competitor.ts`, YouTube API |
| `services/trendingEngine.ts` | `models/TrendHistory.ts`, `lib/cache.ts` |
| `services/hashtagGenerator.ts` | `lib/ai-router.ts`, `app/api/generate/**` |
| `services/webhooks.ts` | `models/Webhook.ts`, `app/api/payments/webhook/` |
| `services/analytics/advanced.ts` | `models/FunnelEvent.ts`, `models/TrackingLog.ts` |

---

## 5. `workers/` — Background Jobs (BullMQ)

| Worker | Queue Source | Kya Karta Hai |
|--------|-------------|---------------|
| `workers/aiWorker.ts` | `lib/queue.ts` → Redis | AI tasks process karta hai (shorts, thumbnails) |
| `workers/postingWorker.ts` | `lib/queue.ts` → Redis | Scheduled YouTube posts upload karta hai |
| `workers/bulkEmailWorker.ts` | `lib/queue.ts` → Redis | Bulk email campaigns bhejta hai |
| `workers/trackingWorker.ts` | `lib/trackingQueue.ts` → Redis | Analytics events save karta hai |

**Workers connect karte hain:**
- `lib/redis.ts` — Queue backend
- `lib/mongodb.ts` — Results save karne ke liye
- Respective `models/` — Data read/write
- `services/` — Business logic call

---

## 6. `app/api/` — API Routes

### Auth Routes (`app/api/auth/`)
| Route | Connects To |
|-------|-------------|
| `login/` | `lib/auth.ts`, `lib/auth-jwt.ts`, `models/User.ts` |
| `refresh/` | `lib/auth-jwt.ts`, `models/UserSession.ts` |
| `verify-email/` | `services/otp.ts`, `models/PendingUser.ts` |
| `google/` | Google OAuth, `models/User.ts` |
| `me/` | `lib/auth.ts`, `models/UserSession.ts` |
| `logout/` | `models/UserSession.ts`, `lib/redis.ts` |
| `verify-and-pay/` | `services/otp.ts`, `services/payments/razorpay.ts` |

### Payments Routes (`app/api/payments/`)
| Route | Connects To |
|-------|-------------|
| `create-order/` | `services/payments/razorpay.ts`, `models/Payment.ts` |
| `verify-payment/` | `services/payments/razorpay.ts`, `models/Subscription.ts` |
| `webhook/` | `services/webhooks.ts`, `models/Payment.ts` |

### AI Routes (`app/api/ai/`)
| Route | Connects To |
|-------|-------------|
| `script-generator/` | `services/ai/aiStudio.ts`, `models/AIScript.ts`, `lib/usageCheck.ts` |
| `shorts-creator/` | `workers/aiWorker.ts`, `models/AIShorts.ts` |
| `thumbnail-generator/` | `services/ai/thumbnailAnalysis.ts`, `models/AIThumbnail.ts` |
| `hook-generator/` | `lib/ai-router.ts`, `models/AIHook.ts` |
| `predict/` | `services/ai/viralPredictionService.ts`, `models/ViralPrediction.ts` |

### Schedule Routes (`app/api/schedule/`)
| Route | Connects To |
|-------|-------------|
| `posts/` | `models/ScheduledPost.ts`, `services/scheduler/**` |
| `post/` | `workers/postingWorker.ts`, `models/ScheduledPost.ts` |
| `calendar/` | `services/scheduler/contentCalendar.ts` |

### Admin Super Routes (`app/api/admin/super/`)
| Route | Connects To |
|-------|-------------|
| `analytics/**` | `models/TrackingLog.ts`, `models/FunnelEvent.ts`, `models/UserSession.ts` |
| `bulk-email/**` | `models/BulkEmailCampaign.ts`, `workers/bulkEmailWorker.ts`, `services/email.ts` |
| `website-audit/**` | `models/WebsiteAudit.ts`, `services/auditEngine.ts` |
| `controls/**` | `models/PlatformControl.ts`, `models/ControlLog.ts` |
| `system/` | `lib/redis.ts`, `lib/mongodb.ts`, server stats |
| `live/` | `lib/socket-server.ts`, `models/UserSession.ts` |

---

## 7. `components/` — UI Components

| Component | Connects To |
|-----------|-------------|
| `DashboardLayout.tsx` | `components/Sidebar.tsx`, `context/ThemeContext.tsx`, `hooks/useUser.ts` |
| `Sidebar.tsx` | `hooks/useUser.ts`, `lib/permissions.ts` (RBAC) |
| `TrackingScript.tsx` | `hooks/useTracker.ts`, `app/api/admin/super/tracking/` |
| `FeatureGate.tsx` | `hooks/useUser.ts`, `lib/assertUserFeature.ts` |
| `AuthGuard.tsx` | `hooks/useUser.ts`, `app/api/auth/me/` |
| `UsageBar.tsx` | `app/api/admin/analytics/usage/`, `lib/usageDisplayLimits.ts` |
| `UsageNotificationsBell.tsx` | `models/Notification.ts`, `app/api/notifications/` |
| `PricingCard.tsx` | `models/Plan.ts`, `lib/planPricing.ts` |
| `PricingSection.tsx` | `components/PricingCard.tsx`, `app/api/admin/plans/` |
| `ChatAssistant.tsx` | `services/ai/supportAI.ts`, `app/api/assistant/` |
| `VideoUpload.tsx` | `app/api/schedule/post/`, `models/ScheduledPost.ts` |
| `ViralScoreMeter.tsx` | `app/api/ai/predict/`, `models/ViralPrediction.ts` |

---

## 8. `hooks/` — React Hooks

| Hook | Connects To |
|------|-------------|
| `hooks/useUser.ts` | `app/api/auth/me/`, `lib/auth.ts` — user session fetch |
| `hooks/useSocket.ts` | `lib/socket-server.ts` — WebSocket connection |
| `hooks/useTracker.ts` | `lib/trackingQueue.ts`, `app/api/admin/super/tracking/` |
| `hooks/useTokenRefresh.ts` | `app/api/auth/refresh/`, `lib/auth-jwt.ts` |

---

## 9. `context/` — React Context

| Context | Connects To |
|---------|-------------|
| `context/ThemeContext.tsx` | `components/ThemeToggle.tsx`, `components/DashboardLayout.tsx` |
| `context/LocaleContext.tsx` | `context/translations.ts`, `components/LangDirectionSetter.tsx` |

---

## 10. `server.ts` — Custom Next.js Server

**Kya karta hai:** Express + Next.js custom server (Socket.IO ke liye)

| Connects To | Kyu |
|-------------|-----|
| `lib/socket-server.ts` | WebSocket initialize karta hai |
| `lib/redis.ts` | Redis connection startup pe |
| `lib/mongodb.ts` | MongoDB connection startup pe |
| `lib/queue.ts` | BullMQ workers start karta hai |
| `workers/*.ts` | Sab workers yahan register hote hain |

---

## 11. `middleware/` Folder

| File | Connects To |
|------|-------------|
| `middleware/rateLimitMiddleware.ts` | `lib/rateLimiter.ts`, `lib/redis.ts` |
| `middleware/usageGuard.ts` | `lib/usageCheck.ts`, `models/Usage.ts` |

---

## 12. Quick Reference — Data Flow

### User Login Flow
```
Browser → app/api/auth/login/
  → lib/auth.ts
  → models/User.ts (MongoDB)
  → lib/auth-jwt.ts (JWT token banta hai)
  → models/UserSession.ts (session save)
  → Response with token
```

### AI Tool Use Flow
```
Browser → components/[AITool].tsx
  → app/api/ai/[tool]/route.ts
  → lib/usageCheck.ts (limit check)
  → services/ai/aiStudio.ts
  → lib/ai-router.ts (OpenAI/Gemini call)
  → models/[AIModel].ts (result save)
  → workers/aiWorker.ts (heavy jobs ke liye queue)
  → Response
```

### Scheduled Post Flow
```
Dashboard → components/VideoUpload.tsx
  → app/api/schedule/post/route.ts
  → models/ScheduledPost.ts (save)
  → lib/queue.ts (BullMQ mein add)
  → workers/postingWorker.ts (cron time pe run)
  → services/youtubeUpload.ts
  → YouTube API
```

### Payment Flow
```
Browser → components/PricingCard.tsx
  → app/api/payments/create-order/
  → services/payments/razorpay.ts
  → models/Payment.ts
  → app/api/payments/verify-payment/
  → models/Subscription.ts (activate)
  → services/email.ts (receipt email)
```

### Analytics Tracking Flow
```
Every Page → components/TrackingScript.tsx
  → hooks/useTracker.ts
  → lib/trackingQueue.ts → Redis Queue
  → workers/trackingWorker.ts
  → models/TrackingLog.ts (MongoDB)
  → app/api/admin/super/analytics/** (dashboard mein dikhta hai)
```
