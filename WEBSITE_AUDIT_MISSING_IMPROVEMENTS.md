# Vidyt — Missing Features & Improvement Audit (v3)
_Date: 2026-05-10 — Refreshed after v2 implementation pass_

Legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low · ✅ Done

---

## ✅ Shipped Since v2 (2026-04-22 → 2026-05-10)

**Done in this pass (today):**
- **2FA user-facing UI** — `app/dashboard/security/page.tsx` rebuilt with status badge, enroll (QR + manual secret + copy), 6-digit verify, backup-code display + `.txt` download + copy-all, password-gated disable form (with optional defense-in-depth code).
- **Turnstile CAPTCHA on forgot-password** — `TurnstileWidget` rendered on email step in `app/forgot-password/page.tsx`, token sent to `/api/auth/password-reset`, server-side `verifyTurnstile()` added to the POST handler (matches the login + prepare-signup pattern).

**Confirmed already shipped between v2 and now (audit was stale on these):**
- **Turnstile on login + signup** — `lib/turnstile.ts` + `components/TurnstileWidget.tsx`; widget rendered in both forms in `app/auth/page.tsx`; `verifyTurnstile()` wired in `/api/auth/login` and `/api/auth/prepare-signup`.
- **Onboarding wizard** — `app/onboarding/page.tsx` (3 steps: Profile / Notebook / Preferences) + `app/api/user/onboarding/route.ts`. Notebook captures goal, niche, channelUrl, experienceLevel, postingFrequency for the owner.
- **Dockerfile + docker-compose.yml** at repo root (runnable, not just docs).
- **`.github/dependabot.yml`** present.

---

## ⚠️ Broken / Risky — Verify Before Anything Else

### A. Login challenge bypasses 2FA
`/api/auth/login/route.ts` calls `loginUser(email, password)` and issues tokens directly. Nothing in that path consults `user.twoFactorEnabled` or asks for a TOTP code. If true, **enabling 2FA gives the user a false sense of security** — login still succeeds with email + password alone.
- **Verify:** read `lib/auth.ts → loginUser` for any 2FA branch.
- **Fix if confirmed:** when `twoFactorEnabled`, return a `requires2FA: true` response with a short-lived challenge token; add `/api/auth/2fa/challenge` that accepts that token + a 6-digit code (or a backup code, marked as consumed) before issuing the real session.

### B. `vidyt/` vs `vidytx/` onboarding drift
`vidytx/onboarding/page.tsx` has a 4-step flow (Profile / Notebook / **Security** / Preferences); `vidyt/onboarding/page.tsx` shipped a 3-step flow with an explicit comment that the Security step was shelved. Either canonicalize on one shape or the next deploy will reintroduce the Security step that was removed on purpose.
- **Decide:** keep dedicated `/dashboard/security` page (recommended now that it's built) and delete the Security step from `vidytx/`, OR re-enable in `vidyt/`. Don't leave them divergent.

### C. `recovery` codes path
2FA backup codes are hashed at issuance, but I didn't see a route that **consumes** one at login time. Without that, backup codes are decorative. Audit needs a `/api/auth/2fa/recover` (or equivalent) that accepts `{ email, code }`, bcrypt-compares against `twoFactorBackupCodes`, removes the matched hash, and issues the session.

---

## 🔴 Critical — Ship Next

### 1. 2FA login challenge + backup-code consumption
See Risky §A and §C above. The new dashboard UI is wasted if login doesn't enforce the second factor.

### 2. Password strength + breached-password check
On signup + password-reset flows: zxcvbn meter for visible feedback, plus a haveibeenpwned k-anonymity range check on submit. Free, ~30 min of work, blocks the most common credential-stuffing wins.

### 3. User-facing session list
`UserSession` collection is already populated. Build `app/dashboard/settings/sessions/page.tsx` (or similar) showing device/IP/last-used and a per-row "Sign out" button + a "Sign out everywhere" action. Without this, a stolen JWT cannot be revoked by the user.

### 4. Email verification resend UI
`emailVerified`, `emailVerificationToken`, `emailOtp` fields exist on the User model; `/api/auth/verify-email` exists. There is no in-app UI to resend the verification email after signup, so users with typo'd inboxes stay stuck.

---

## 🟠 High — Plan for Current Sprint

### Product / Growth
- **`/status`** public system-status page (start static; upgrade to BetterStack/UptimeRobot embed later).
- **`/changelog`** public page rendering `CHANGELOG.md`.
- **`/compare`** vs VidIQ + TubeBuddy (head-to-head SEO landing).
- **Testimonials / social-proof section** on homepage.
- **Newsletter signup** on homepage (waitlist API exists, frontend doesn't use it).
- **Exit-intent modal** on `/pricing` for trial/free users.

### Auth / Security
- **CSP violation reporter** endpoint `/api/security/csp-report` + wire `report-to` in CSP header.
- **Account-deletion grace period** review — `deletionRequestCode/Expiry/RequestedAt/deletedAt/isDeleted` fields exist; verify the cron actually purges and that grace-period UX is exposed.
- **Refresh-token rotation audit** — confirm `generateRefreshToken` invalidates the prior token on rotate, not just issues a new one.

### Dev Experience
- **Husky + lint-staged** for pre-commit `eslint --fix` + `prettier --write`.
- **Commitlint** enforcing Conventional Commits (commitlint config already at root — wire it to a hook).
- **`@next/bundle-analyzer`** behind `ANALYZE=true`.
- **Lighthouse CI** GitHub Action — fail PRs that regress LCP/CLS.

---

## 🟡 Medium — Near-Term

### UX / Design
- Command palette (Cmd/Ctrl+K).
- Dark/light theme toggle (ThemeContext exists, toggle UI missing).
- Skeleton loader standardization across dashboards.
- Empty-state illustrations for first-run dashboards.
- Keyboard navigation + focus-ring audit.
- `prefers-reduced-motion` respect.

### Internationalization
- `next-intl` wiring. LocaleProvider exists; no translated strings yet.
- RTL layout support.
- Currency + timezone auto-detect audit.

### Billing
- Annual/monthly toggle visibility on `/pricing`.
- Coupon / promo code input at checkout.
- Lifetime deal offer (AppSumo-ready).
- Billing portal — invoice download + payment-method update.
- Abandoned-cart email flow.

### Content
- `/roadmap` public page (Canny/Frill or self-hosted).
- Video demo on landing.
- Interactive product tour (driver.js / shepherd) gated to first-login.

### Observability
- PostHog or Mixpanel client-side product analytics (funnels, retention).
- Conversion tracking events (signup, first analysis, payment) wired through GA4 + PostHog.
- Session replay (LogRocket or PostHog).
- Uptime monitoring config committed (BetterStack/UptimeRobot).

### Accessibility
- axe-core automated checks in Playwright.
- Contrast audit of red-on-dark palette against WCAG AA.
- Screen-reader pass on dashboard + modals.

### SEO
- Dynamic OG images per page using `next/og` (currently single static `/og-image.png`).
- More JSON-LD: BreadcrumbList on blog, Product on pricing, Review when testimonials land.
- RSS feed for `/blog`.

---

## 🟢 Low — Nice to Have

- `/careers` page.
- `/affiliate` / partner landing (`/api/referral/apply` exists).
- Public API documentation site.
- Customer case studies.
- "Built with VidYT" badge for customers.
- `CODE_OF_CONDUCT.md`.

---

## 🧹 Tech Debt

- **Database migrations** — no `migrate-mongo` / equivalent. Schema changes rely on `Schema.models.X || model(...)` idempotency only.
- **Test coverage gaps** — no `.ts` unit tests; only `.cjs`. Add `vitest` or `tsx --test`.
- **No visual regression** (Chromatic / Percy).
- **No load testing** (k6 / artillery).
- **`vidyt/` vs `vidytx/` drift** — laptop has two trees with diverged onboarding (and historically middleware/auth/SW). Pick a canonical source-of-truth and add a sync check.
- **`patch_script.js`** in `scripts/` — origin unclear, inspect + delete if stale.
- **Remove `Logo_original_backup.png`** from `public/` — stale asset.
- **Audit `utils/` vs `lib/`** — two directories for shared helpers; pick one.

---

## 🎯 Top 10 This Sprint

1. **Verify + fix 2FA login challenge** — without it, today's UI is theatre.
2. **Backup-code consumption route** — pair with #1.
3. **Password strength + breached-password check** on signup + reset.
4. **Sessions list UI** for `UserSession` collection.
5. **Email-verification resend** UI in `/auth`.
6. **`/status` + `/changelog` + `/compare`** public pages (one PR).
7. **PostHog wiring + 5 core funnel events** (signup, onboarding-complete, first analysis, payment-attempt, payment-success).
8. **Husky + commitlint + lint-staged** wired to pre-commit.
9. **`@next/bundle-analyzer` + first Lighthouse CI run**.
10. **Resolve `vidyt/` ↔ `vidytx/` drift** (start with onboarding decision).

---

_This audit reflects the repo at 2026-05-10. Re-run against the latest tree before planning — files can move quickly. Items in the "Broken / Risky" block are unverified claims that need a code read before implementation; do not skip._
