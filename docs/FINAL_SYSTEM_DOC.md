# ViralBoost AI – Pura System Documentation (Final Doc)

> Note: Ye document high-level overview hai – code level details ke liye `README.md`, `lib/`, `models/` aur `services/` folder dekhein.

---

## 1. Product Overview

- **ViralBoost AI** ek SaaS platform hai jo creators ko apne **social media videos ko publish karne se pehle analyze, optimize aur predict** karne me help karta hai.
- Supported use‑cases:
  - Video upload / YouTube import
  - Hook, title, thumbnail, hashtags, best posting time analysis
  - AI Studio (Script Generator, AI Coach, Thumbnail Generator, Hook Generator, Shorts Creator, YouTube Growth tools)
  - Analytics, trending topics, posting time heatmap, channel & Facebook audit
  - Subscription plans (Free, Pro, Enterprise) + Super Admin control center

High‑level stack:

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS, Framer Motion
- **Backend**: Next.js API routes (`app/api/**`)
- **Database**: MongoDB + Mongoose models (`models/**`)
- **AI / ML**: OpenAI / Gemini (configurable), TensorFlow.js, internal viral predictor services

---

## 2. High‑Level Architecture

### 2.1 Frontend Routing (App Router)

- Public marketing + auth:
  - `/` – Landing/Home page (hero, features, pricing)
  - `/pricing` – Detailed pricing page
  - `/login`, `/register`, `/auth` – Auth flows
- Authenticated dashboard:
  - `/dashboard` – Main dashboard
  - `/videos` – My Videos
  - `/dashboard/youtube-seo`, `/dashboard/facebook-seo`, `/dashboard/instagram-seo`
  - `/dashboard/viral-optimizer` – AI Viral Optimization Engine
  - `/analytics`, `/calendar`, `/posting-time`, `/trending`, `/hashtags`
  - `/channel-audit`, `/facebook-audit`
- AI Studio:
  - `/ai` – AI Studio home / tools grid
  - `/ai/script-generator` – Script Generator (modes: default, `ideas`, `coach`)
  - `/ai/thumbnail-generator` – Thumbnail ideas
  - `/ai/hook-generator` – Hook generator
  - `/ai/shorts-creator` – Long → shorts clipping tool
- Super Admin / SaaS:
  - `/admin/super` – Super Admin panel (users, AI Studio access, API config, DB tables, plan receipts, notifications, plan discounts)
  - `/dashboard/super` – Super admin dashboard shortcut

### 2.2 Backend API Layout (`app/api/**`)

- **Auth**: `/api/auth/*` – register, login, login‑pin, me, OTP, password reset.
- **Videos**: `/api/videos/*` – upload, YouTube/Facebook/Instagram/TikTok import, bulk analyze, per‑video route.
- **AI Tools**: `/api/ai/*`
  - `script-generator` – single endpoint with `mode` query (`ideas`, `coach`, default script)
  - `thumbnail-generator`, `hook-generator`, `shorts-creator` (+ `/cut`), `daily-ideas`, `train`, `predict`.
- **Analytics**: `/api/analytics/*` – dashboard, overview, insights, benchmark, heatmap, retention, growth.
- **Viral Engine**: `/api/viral/*` – title optimizer, CTR, engagement, retention, thumbnail score, etc.
- **SEO / Keywords / Hashtags**: `/api/youtube/*`, `/api/facebook/*`, `/api/instagram/*`.
- **Scheduling & Calendar**: `/api/schedule/*`, `/api/posting-time`, `/api/posting-time`, `/api/schedule/calendar`.
- **Subscriptions & Payments**:
  - `/api/subscriptions/plans` – subscription plans + active discounts
  - `/api/subscriptions/checkout`, `/api/subscriptions/manage`, `/api/subscriptions/cancel`, `/api/subscriptions/resume`, `/api/subscriptions/invoices`, `/api/subscriptions/usage`
  - `/api/payments/*` – create order, verify payment, webhook
- **User / Usage**:
  - `/api/user/usage` – current plan limits and usage (per user)
  - `/api/user/[uniqueId]` – public user page
- **Admin**:
  - `/api/admin/users`, `/api/admin/users/[id]`
  - `/api/admin/features/ai-studio`, `/api/admin/features/ai-tools`
  - `/api/admin/config`, `/api/admin/api-status`
  - `/api/admin/data/collections`, `/api/admin/data/collections/[name]`
  - `/api/admin/notifications/send`
  - `/api/admin/send-plan-receipts`
  - `/api/admin/plan-discounts` (NEW – plan discount system)

---

## 3. Core Business Concepts

### 3.1 Users, Roles & Plans

- **User model** (`models/User.ts`):
  - Fields: email, password hash, role, subscription plan, subscription expiry, usage stats, login PIN, uniqueId, etc.
- **Roles**:
  - `user` – normal creator
  - `manager` – team manager
  - `admin` – admin
  - `super-admin` – full SaaS / infra control
- **Plans** (logical definition – not billing provider specific):
  - `free`, `pro`, `enterprise`, `owner` (owner = super‑admin special unlimited plan)
  - Single source of truth in `lib/planLimits.ts`:
    - **Limits**: analyses per day/month, title suggestions count, hashtag count, competitors tracked
    - **Features flags**: advanced AI viral prediction, real‑time trends, best posting time, competitor analysis, advanced analytics dashboard, team collaboration, etc.
    - **Display labels** & `featureList` – used in pricing UIs.

### 3.2 Plan Limits & Usage

- `lib/planLimits.ts`:
  - `getPlanRoll(planId)` → full config (limits + features + labels)
  - `getPlanLimits(planId)` / `getPlanFeatures(planId)` – helpers for code.
  - `getSubscriptionLimitsForApi(planId)` – numeric limits for APIs.
- Usage calculation:
  - `getAnalysisUsageCount(userId, period)` from `lib/usageCheck.ts`.
  - `/api/user/usage` – combines:
    - active plan (`subscription.plan`, `planName`)
    - how many analyses used vs limit
    - competitors tracking usage

### 3.3 AI Studio Access Control

- `lib/aiStudioAccess.ts`:
  - `requireAIStudioAccess(request)`:
    - Reads user from token (`getUserFromRequest`)
    - Loads `FeatureAccess` doc with feature `ai_studio`
    - Checks allowedRoles (defaults: `manager`, `admin`, `super-admin`)
  - `requireAIToolAccess(request, featureKey)`:
    - Re‑uses studio access above
    - Loads `FeatureAccess` for specific AI tool key (`daily_ideas`, `ai_coach`, `script_writer`, etc.)
    - Restricts access per role.
- `models/FeatureAccess.ts`:
  - Stores mapping `feature` → `allowedRoles[]`.
- Super Admin UI (`/admin/super`, viewMode = `aiStudio`):
  - Section to **toggle AI Studio for roles**.
  - Section to configure each AI tool’s allowed roles.

---

## 4. Key Features – How They Work

### 4.1 Marketing Homepage (`app/page.tsx`)

- **Hero section**:
  - Big tagline “Make Your Videos Go Viral”
  - CTA buttons:
    - `Start Free Trial` → `/register`
    - `Watch Demo` → `/login` (demo placeholder)
  - Animated background (Framer Motion + Tailwind gradients).
  - Logo from `/public/logo.png`.
- **Features section**:
  - Card grid with tools like AI‑Powered Predictions, Real‑Time Trends, Advanced Analytics, Smart Scheduling, Competitor Analysis, Secure & Private.
  - **Dynamic visibility based on plan**:
    - On mount, attempts `GET /api/user/usage` with auth headers.
    - If user logged‑in, reads `subscription.plan` → `getPlanFeatures(planId)`.
    - `HOME_FEATURES` list has `requiresFeature` keys; cards where feature flag = `false` are hidden.
    - Anonymous visitors see full marketing features.
- **Pricing preview**:
  - Uses local `PRICING_PLANS` (Free/Pro/Enterprise) for marketing site.
  - Toggle monthly/yearly prices.
  - Does not depend on live subscription backend (but text is aligned with `lib/planLimits`).

### 4.2 Subscription & Plan Discounts

- Base subscription plans are defined in `services/payments/stripe.ts`:
  - `SUBSCRIPTION_PLANS` (`free`, `pro`, `enterprise`) with:
    - `price` (USD), `interval`, `features` (from plan roll), `limits` (videos/analyses/competitors).
- API: `/api/subscriptions/plans`:
  - `GET` without params:
    - Returns `{ success, plans }` directly from `SUBSCRIPTION_PLANS`.
  - `GET ?withDiscounts=1`:
    - Loads active `PlanDiscount` docs from DB.
    - For each plan, if matching discount found:
      - Calculates `discountedPrice = price - (price * percentage / 100)`.
      - Adds `discount` object to plan:
        - `{ percentage, label, startsAt, endsAt, discountedPrice }`.
- **PlanDiscount model** (`models/PlanDiscount.ts`):
  - Fields:
    - `planId` – `free` / `pro` / `enterprise`
    - `label` – optional (e.g. "Holi Offer", "New Year Sale")
    - `percentage` – 1–100
    - `startsAt`, `endsAt` – discount validity window
  - Indexes:
    - Composite index on `{ planId, startsAt, endsAt }`
    - TTL‑like index on `endsAt` (with partial filter) so old discounts can auto‑expire (implementation depends on Mongo server config).
- **Admin API for discounts**: `/api/admin/plan-discounts`
  - `GET`:
    - **Only `super-admin`** via `getUserFromRequest`.
    - Returns list of future/active discounts.
  - `POST`:
    - Body: `{ planId, label?, percentage, startsAt, endsAt }`.
    - Validates:
      - valid plan, 1–100%, dates, `endsAt > startsAt`.
    - Creates `PlanDiscount` document and returns created discount.
- **Super Admin UI** (in progress, base wired):
  - Left sidebar → **Billing & Plans → Plan Discounts**.
  - Uses Framer Motion for sliding section + item hover animations.
  - Intended UX:
    - Top animated card showing active discounts with glow / timer effect.
    - Form to create new discount (plan select, % slider, date range, label).
    - Table listing all upcoming offers.

### 4.3 AI Studio – Script Generator & AI Coach

#### 4.3.1 Frontend (`app/ai/script-generator/page.tsx`)

- Uses `useSearchParams()` to read `mode`:
  - `''` (default) → normal Script Generator.
  - `'ideas'` → **Daily Ideas** mode.
  - `'coach'` → **AI Coach** mode.
- Internal flags:
  - `isIdeasMode = mode === 'ideas'`
  - `isCoachMode = mode === 'coach'`
- UI behaviour:
  - Page title:
    - `AI Script Generator` (default / ideas)
    - `AI Coach` (coach mode)
  - Description text:
    - Explains mode in Hinglish (Daily Ideas / AI Coach).
  - Topic label + placeholder:
    - Default: `Video topic *` + example
    - Ideas: `Channel niche / topic *` + niche examples
    - Coach: `Channel / content question *` + question‑style example
  - Submit button:
    - Text: `'Get today’s ideas'` (ideas) / `'Ask AI Coach'` (coach) / `'Generate'` (default)
  - Results:
    - Ideas mode: clickable list of ideas with viral score + best posting time.
    - Script/Coach mode: 3 hooks, full script, 5 titles, 15 hashtags, CTA suggestion; each with **copy** buttons and micro‑feedback (`Copied`).

#### 4.3.2 Backend (`app/api/ai/script-generator/route.ts`)

- Reads mode from query:
  - `mode === 'ideas'` → feature key `daily_ideas`
  - `mode === 'coach'` → feature key `ai_coach`
  - otherwise `script_writer`.
- Calls `requireAIToolAccess(request, featureKey)`:
  - Ensures user has allowed role for that tool.
- Reads body `{ topic, platform, duration, language }`, validates, then:
  - Calls `generateScript()` from `services/ai/aiStudio`.
  - Saves generated script to `AIScript` collection with metadata.

### 4.4 Super Admin Panel (`/admin/super`)

Single page but **view modes**:

- `viewMode === 'users'`:
  - Users table (email, unique ID, role, subscription, PIN, created date).
  - Actions:
    - Modify user (name, role, PIN).
    - Reset password (prompt).
    - Set/Clear login PIN.
    - Delete user.
  - Bulk actions:
    - Create User modal.
    - Send plan receipts to Pro/Enterprise via `/api/admin/send-plan-receipts`.
    - Notify all users via `/api/admin/notifications/send`.
- `viewMode === 'tables'`:
  - Database explorer for any Mongo collection:
    - Collection list from `/api/admin/data/collections`.
    - Paginated table view; search via query string.
- `viewMode === 'aiStudio'`:
  - AI Studio access panel (explained above).
- `viewMode === 'apiConfig'`:
  - API config for YouTube/Gemini/OpenAI/Resend/Stripe/Sentry etc.
  - Shows health + limit info from `/api/admin/api-status`.
  - Saves keys to DB via `/api/admin/config`.
- `viewMode === 'discounts'` (new):
  - Entry point to Plan Discount management (animated billing section).

Animations:

- Left sidebar sections (User Management, AI Studio, SaaS, Billing & Plans) use `AnimatePresence` + `motion.div` for smooth expand/collapse.
- Tables, loaders, icons use subtle motion / spinners to keep panel lively.

---

## 5. Security & Access Control

- **Authentication**:
  - JWT based; tokens stored client‑side (usually in localStorage).
  - `/api/auth/me` used to check current user (and for Sidebar AI Studio gating).
- **Route protection**:
  - Dashboard pages use middleware (`middleware.ts`) to ensure auth (see file for logic).
  - Many API routes call `getUserFromRequest(request)` and return `401` for missing/invalid token.
- **Role‑based checks**:
  - Super Admin APIs: explicitly check `user.role === 'super-admin'`.
  - AI Studio & tools: `requireAIStudioAccess` + `requireAIToolAccess`.
  - Plan discounts & config: admin APIs only; not exposed publicly.

---

## 6. How Main Flows Work (Step‑by‑Step)

### 6.1 New User Journey

1. Visitor opens `/` → sees marketing homepage.
2. Clicks **Start Free Trial** → `/register`.
3. After register/login, middleware routes user to `/dashboard`.
4. Sidebar + Navbar show tools based on:
   - Role (user/manager/admin/super‑admin).
   - AI Studio access (`/api/features/ai-studio`).
5. When user visits `/ai` or an AI tool:
   - Frontend calls `/api/features/ai-studio` or directly tool API with auth header.
   - Backend validates plan + role via `requireAIToolAccess`.

### 6.2 Plan & Discount Usage

1. Super Admin creates discount in `/admin/super` → Plan Discounts (when full UI is done):
   - Picks plan (Pro/Enterprise), discount %, start/end date, label.
   - Backend stores `PlanDiscount` document.
2. Pricing/Checkout UI (or any plan display) calls:
   - `GET /api/subscriptions/plans?withDiscounts=1`.
3. API:
   - Loads base plans from `SUBSCRIPTION_PLANS`.
   - Merges current active discounts and returns computed `discountedPrice`.
4. Frontend:
   - If `discount` present:
     - Show badge like “Limited time – 40% OFF till 31 Mar”.
     - Animate price (old price struck‑through + highlighted new price).

### 6.3 AI Coach Flow

1. Sidebar or AI Studio card – **AI Coach** → `/ai/script-generator?mode=coach`.
2. Page:
   - Heading: **AI Coach**, mode description in Hinglish.
   - Default topic: “Channel growth coaching tips for my content”.
3. User enters question and clicks **Ask AI Coach**.
4. Frontend:
   - Sends POST to `/api/ai/script-generator?mode=coach`.
5. Backend:
   - Validates plan/role via `requireAIToolAccess(featureKey='ai_coach')`.
   - Uses `generateScript` configured for coaching style tone.
   - Saves result to `AIScript`, returns structured data.
6. Frontend:
   - Renders hooks, script, titles, hashtags, CTA with copy UX.

---

## 7. Configuration & Environment

Important env keys (see `.env.example` + `README.md`):

- `MONGODB_URI` – MongoDB connection.
- `JWT_SECRET` – auth token secret.
- AI / external services:
  - `OPENAI_API_KEY`, `GOOGLE_GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `RESEND_API_KEY`, etc.
- Payments:
  - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (and optionally Stripe keys via Super Admin API config).

Note: Some API keys can be **overridden from Super Admin → API Config**, where values are stored in DB and take precedence over `.env` (depending on `lib/apiConfig` implementation).

---

## 8. Frontend Design Principles

- **Visual style**:
  - Dark theme (`#050712`, `#0F0F0F`) + primary red `#FF0000` (matching logo).
  - Glassy navbars, gradients, glows for a “creator/YouTube” feel.
  - Red CTA buttons (`Get Started Free`, `Start Free Trial`, etc.) with hover states.
- **Motion / VFX**:
  - Hero logo + headings use Framer Motion for fade/slide/scale.
  - Cards and buttons animate on hover (slight lift/scale).
  - Super Admin sidebar sections slide open/close.
- **Responsiveness**:
  - Mobile nav, mobile feature cards, stacking layouts on small screens.

---

## 9. Where To Extend / Customize

- **Add new AI tools**:
  - Backend: new route under `/api/ai/*`, integrate with `requireAIToolAccess`.
  - Admin: add feature key in AI tools access list in Super Admin (aiStudio section).
  - Frontend: add links/cards in `/ai`, Sidebar, and optionally Marketing homepage.
- **Change plans / limits**:
  - Update `lib/planLimits.ts` (limits, flags, display labels).
  - Adjust `services/payments/stripe.ts` prices if needed.
- **Discount UX**:
  - Build full Framer Motion UI in `viewMode === 'discounts'` section of Super Admin.
  - Hook pricing page to `/api/subscriptions/plans?withDiscounts=1` for real‑time offers.

---

## 10. Summary

- ViralBoost AI ek **role + plan aware** SaaS hai jisme:
  - Marketing homepage anonymous visitors ke liye.
  - Logged‑in creators ke liye plan‑based feature visibility + usage limits.
  - AI Studio + SEO + Analytics tools, sab **central plan/feature config** (`planLimits`) se driven hai.
  - Super Admin panel se **users, roles, AI access, API keys, discounts, DB data** sab manage kiya ja sakta hai.

Ye file project ke overall architecture, main flows, aur admin controls ka **final high‑level documentation** hai, jisse koi bhi developer ya owner jaldi se system samajh kar changes ya customization kar sakta hai.

