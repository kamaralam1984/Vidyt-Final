# Vidyt — Missing Features & Improvement Audit (v2)
_Date: 2026-04-22 — Refreshed after v1 implementation pass_

Legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low · ✅ Done in v1

---

## ✅ Shipped in the Last Pass

- Public pages: `/faq`, `/help`, `/security` (expanded)
- Governance: `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`
- `.env.example` listing every required secret
- `public/.well-known/security.txt`, `public/humans.txt`
- `.github/workflows/ci.yml` upgraded → lint, typecheck, test (mongo+redis), build, e2e
- Playwright harness: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- 2FA/TOTP **backend**: `/api/auth/2fa/{enroll,verify,disable,status}` + `lib/totp.ts` (AES-GCM encrypted secrets, 10 backup codes)
- Repo cleanup: 67 `.md` → `docs/`, helper scripts → `scripts/` with READMEs
- Confirmed already present: Sentry, Razorpay, Google OAuth, RBAC, rate limiting, Cloudflare WAF, `/api/user/{export-data,delete-account}`, legal pages, sitemap + JSON-LD (Organization + SoftwareApplication)

---

## 🔴 Critical — Ship Next

### 1. 2FA User-Facing Page
Endpoints exist but there is no `/dashboard/security` page for enroll / view backup codes / disable. Users can't turn 2FA on.
- **Fix:** `app/dashboard/security/page.tsx` with QR render, 6-digit verify input, backup-code display + download.

### 2. CAPTCHA on Signup / Login / Password-Reset
Brute-force + credential-stuffing protection. Env vars (`TURNSTILE_*`) are in `.env.example` but nothing is wired.
- **Fix:** Cloudflare Turnstile widget in `app/auth/page.tsx`, `app/signup/page.tsx`, `app/forgot-password/page.tsx` + server-side verification in the three auth routes.

### 3. Onboarding Wizard
New users land on an empty dashboard with no guidance.
- **Fix:** `app/onboarding/page.tsx` — 3 steps (connect channel, set niche/goal, pick a starter tool). Route there on first login when `user.onboardedAt` is unset.

### 4. Dockerfile + docker-compose.yml
`DOCKER_DELIVERY_REPORT.md` exists, but no runnable `Dockerfile` or compose file at root. Blocks reproducible local + staging bring-up.

### 5. Dependabot / Renovate Config
No automated vulnerability alerts. Add `.github/dependabot.yml` for npm + github-actions weekly updates.

---

## 🟠 High — Plan for Current Sprint

### Product / Growth
- **`/status`** public system-status page (incidents + uptime) — even a static "All systems operational" is better than nothing.
- **`/changelog`** public page (render `CHANGELOG.md` from the repo).
- **`/compare`** vs VidIQ + TubeBuddy landing (direct-conversion SEO).
- **Testimonials / social-proof section** on homepage (creator logos + quotes).
- **Newsletter signup** on homepage — waitlist API exists, frontend doesn't use it.
- **Exit-intent modal** on pricing for trial/free users.

### Auth / Security
- **Password strength meter** on signup and password-reset.
- **Breached-password check** (haveibeenpwned k-anonymity API) at set/change password.
- **CSP violation reporter** endpoint `/api/security/csp-report` + wire `report-to` in CSP header.
- **User-facing session list** in `/dashboard/settings/sessions` (API already populates `UserSession`).
- **Email verification resend** UI in `/auth`.

### Dev Experience
- **Husky + lint-staged** for pre-commit `eslint --fix` + `prettier --write`.
- **Commitlint** enforcing Conventional Commits.
- **`@next/bundle-analyzer`** wired into `next.config.js` behind `ANALYZE=true`.
- **Lighthouse CI** GitHub Action — fail PRs that regress LCP/CLS.

---

## 🟡 Medium — Near-Term

### UX / Design
- **Command palette** (Cmd/Ctrl+K) for power users.
- **Dark/light theme toggle** (ThemeContext exists, toggle UI missing).
- **Skeleton loader standardization** across dashboards.
- **Empty-state illustrations** for first-run dashboards.
- **Keyboard navigation + focus-ring audit**.
- **Reduced-motion respect** (`prefers-reduced-motion`).

### Internationalization
- `next-intl` wiring. LocaleProvider exists; no translated strings yet.
- RTL layout support.
- Currency + timezone auto-detect audit.

### Billing
- **Annual/monthly toggle** visibility on `/pricing`.
- **Coupon/promo code** input at checkout.
- **Lifetime deal** offer (AppSumo-ready).
- **Billing portal** — user-facing invoice download + payment-method update.
- **Abandoned-cart email** flow.

### Content
- `/roadmap` public page (Canny/Frill or self-hosted).
- Video demo on landing.
- Interactive product tour (driver.js / shepherd).

### Observability
- **PostHog or Mixpanel** client-side product analytics (funnels, retention).
- **Conversion tracking** events (signup, first analysis, payment) wired through GA4 + PostHog.
- **Session replay** (LogRocket or PostHog).
- **Uptime monitoring** config committed (BetterStack/UptimeRobot).

### Accessibility
- **axe-core** automated checks in Playwright.
- **Contrast audit** of red-on-dark palette against WCAG AA.
- **Screen-reader pass** on dashboard + modals.

### SEO
- **Dynamic OG images** per page using `next/og` — currently a single static `/og-image.png`.
- **More JSON-LD**: BreadcrumbList on blog, Product on pricing, Review when testimonials land.
- **RSS feed** for `/blog`.

---

## 🟢 Low — Nice to Have

- `/careers` page.
- `/affiliate` / partner landing (`/api/referral/apply` exists).
- Public API documentation site.
- Customer case studies.
- "Built with VidYT" badge for customers.
- `CODE_OF_CONDUCT.md`.

---

## 🧹 Tech Debt (Post-Cleanup)

- **Database migrations** — no `migrate-mongo` / equivalent. Schema changes rely on `Schema.models.X || model(...)` idempotency only.
- **Test coverage gaps** — no `.ts` unit tests; only `.cjs`. Add `vitest` or `tsx --test`.
- **No visual regression** (Chromatic / Percy).
- **No load testing** (k6 / artillery).
- **`patch_script.js`** in `scripts/` — origin unclear, inspect + delete if stale.
- **Remove `Logo_original_backup.png`** from `public/` — stale asset.
- **Audit `utils/` vs `lib/`** — two directories for shared helpers; pick one.

---

## 🎯 Top 10 This Sprint

1. 2FA dashboard UI — the backend is wasted without it.
2. Turnstile CAPTCHA on auth forms.
3. Onboarding wizard for first-login UX.
4. `Dockerfile` + `docker-compose.yml` for reproducible env.
5. `dependabot.yml` for supply-chain safety.
6. Session-list + email-resend UI for existing APIs.
7. Password strength + breached-password check.
8. `@next/bundle-analyzer` + first Lighthouse CI run.
9. PostHog wiring + 5 core funnel events.
10. `/status` + `/changelog` + `/compare` public pages.

---

_This audit reflects the repo at commit-time on 2026-04-22. Re-run against the latest tree before planning — files can move quickly._
