# Vidyt — Policy Compliance Audit (2026-05-14)

Audit scope: Google Ads/AdSense, YouTube ToS + API, Meta (Facebook/Instagram), TikTok, GDPR/DPDP. Reviewed app routes, components, services, CSP, robots, privacy policy, terms, cookie consent.

---

## 🔴 CRITICAL — account ban / blacklist risk

### 1. `ytdl-core` + `yt-dlp` + scraping of YouTube / FB / IG / TikTok
- `services/youtube.ts` uses `ytdl-core` + `yt-dlp` (lines 3, 196, 425, 463)
- `services/tiktok.ts` says: "TikTok doesn't have a public API, so we use oEmbed, scraping, or yt-dlp"
- `services/multiplatform/metadata.ts` shells out: `yt-dlp --dump-json …`
- `app/api/videos/facebook/route.ts` calls `extractFacebookMetadata` (unofficial)
- `app/api/videos/instagram/route.ts` calls `extractInstagramMetadata` (unofficial)

**Violates:** YouTube ToS §III-E (no scraping / no unauthorized downloaders), Meta Platform Terms (scraping prohibited), Instagram ToS, TikTok ToS.
**Consequence:** YouTube Data API key revocation; Google Ads + AdSense account termination (Google links accounts via business identity); Meta business asset ban.
**Fix:** Replace with official APIs only — YouTube Data API v3, Meta Graph API with proper OAuth, Instagram Graph API for Business. For TikTok use TikTok for Developers API. Remove `ytdl-core` and `yt-dlp` paths entirely, or restrict to user's own connected channel via OAuth.

### 2. Tracking pixels fire BEFORE cookie consent (GDPR/Consent Mode v2)
- `components/RetargetingPixels.tsx` loads Meta Pixel, Google Ads (gtag), TikTok pixel on every page mount with `strategy="afterInteractive"` — independent of `components/CookieConsent.tsx` choice.
- `CookieConsent.tsx` writes preference to localStorage but **does not gate any script tag**.

**Violates:** GDPR Art. 7, ePrivacy Directive, Google Consent Mode v2 (mandatory March 2024 for EEA traffic), Meta EU User Consent Policy.
**Consequence:** Google Ads suspends accounts serving EU traffic without Consent Mode v2 since 2024; ICO/CNIL fines.
**Fix:** Conditionally render `<RetargetingPixels />` only when consent.marketing === true; implement Google Consent Mode v2 default `denied` → `granted` flow.

### 3. Hardcoded pixel IDs as fallback
`components/RetargetingPixels.tsx`:
```ts
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '957730893901659';
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-17845449983';
```
If env vars are unset in any deployment, these fire to whatever account owns those IDs. If those IDs don't belong to vidyt.com → policy violation (data sent to unrelated account = unauthorized tracking).
**Fix:** Return `null` when env var is missing — never use hardcoded fallback for ad/tracking IDs.

### 4. AdSense loaded site-wide (incl. auth/dashboard/admin pages)
- `app/layout.tsx:290-293` injects `adsbygoogle.js` in the root layout if `NEXT_PUBLIC_ADSENSE_ID` is set.
- This means ads attempt to render on `/auth`, `/login`, `/dashboard/*`, `/admin/*`, error pages.

**Violates:** AdSense Program Policies — "no ads on screens without publisher content," "no ads on login/registration/error/thank-you pages."
**Fix:** Move AdSense script + `<AdUnit />` to specific public content pages only (`/blog/*`, `/k/[keyword]`, `/tools/*`, `/help`, `/changelog`). Exclude `/auth`, `/dashboard`, `/admin`, `/settings`, `/onboarding`, `/upgrade`, `/preview`, `/unauthorized`, `/maintenance`.

---

## 🟡 MEDIUM RISK

### 5. No DMCA / Copyright takedown page
Privacy Policy and Terms exist, but no dedicated `/dmca` or `/copyright` page with takedown contact. Required for AdSense + safe-harbour protection (DMCA §512(c) in US, IT Rules 2021 §3 in India).
**Fix:** Add `app/dmca/page.tsx` with takedown contact + counter-notice procedure.

### 6. `/api/test-youtube` exposed
A test/debug route shipped to production can leak diagnostics or quota. Confirm it requires auth or remove.

### 7. `/get-app` advertises "Coming Soon to Google Play Store"
Marketing a Play Store listing that doesn't yet exist is fine *if* the app is genuinely in submission. If launch is delayed >90 days, Google may treat the copy as misleading. `robots: { index: false }` is set — good, but visible to direct visitors.

### 8. Retargeting pixels on auth/login pages
Even after fixing consent gating, firing Meta Pixel on `/auth`, `/reset-password`, `/forgot-password` is a privacy red flag (sensitive flow tracking) — Meta has flagged this in past audits. Exclude these paths in RetargetingPixels.

### 9. Cookie consent banner skips auth paths
`CookieConsent.tsx` returns early on `/auth`, `/login`, `/signup` etc. → users who land directly on those pages and convert never see the consent prompt, yet pixels fire. Combined with #2 above, this compounds the GDPR issue.

---

## 🟢 ALREADY GOOD

- Privacy Policy: covers YouTube API disclosure, GDPR, DPDP Act 2023, CCPA, Google myaccount.google.com/permissions revocation link ✓
- Terms of Service: prohibited-use clause, YouTube ToS compliance section, GST disclosure ✓
- `robots.ts`: properly disallows `/api/`, `/admin/`, `/dashboard/`, `/auth`, payment paths; blocks GPTBot/CCBot/ClaudeBot ✓
- Sitemap excludes private paths ✓
- CSP headers configured in `next.config.js` with `connect-src`, `frame-src` allowlists ✓
- HSTS, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin ✓
- Permissions-Policy disables camera/mic/payment/geo ✓
- `/cookie-policy`, `/refund-policy`, `/data-requests` pages exist ✓

---

## Priority action list

1. **Stop all scraping of YouTube/FB/IG/TikTok** — switch to official APIs only. This is the single biggest blacklist risk. (`services/youtube.ts`, `services/tiktok.ts`, `services/multiplatform/metadata.ts`, `app/api/videos/{facebook,instagram,tiktok}/route.ts`)
2. **Gate RetargetingPixels behind cookie consent** + implement Google Consent Mode v2.
3. **Remove hardcoded Meta/Google Ads ID fallbacks** in `RetargetingPixels.tsx`.
4. **Move AdSense out of root layout** — only inject on public content pages.
5. **Add `/dmca` page** with takedown contact.
6. **Audit `/api/test-youtube`** — auth-gate or delete.

Items 1–4 are the ones that actually trigger blacklisting. 5–6 are hygiene.
