# ViralBoost AI – Recommended APIs (Website aur behtar kaam kre)

Ye document un APIs ko suggest karta hai jo add karne se website zyada stable, powerful aur professional banegi.

---

## 1. YouTube Data API v3 (High priority)

**Kya karega:** Video/channel ka official data – title, description, views, duration, thumbnails, channel info.

**Abhi kya hai:** `ytdl-core` + YouTube oEmbed use ho raha hai. YouTube structure change karte hi ytdl fail ho sakta hai; oEmbed mein views/duration nahi milta.

**Fayda:**
- Reliable metadata har time
- Channel ke last 50 videos, subscriber count, real stats
- YouTube Growth Tracker ko real data mil sakta hai (abhi demo/mock hai)
- Free quota: 10,000 units/day (video list + details ke liye kaafi)

**Env:** `YOUTUBE_API_KEY` (Google Cloud Console se enable karo: YouTube Data API v3)

**Kahan use karein:**  
`services/youtube.ts` – `extractYouTubeMetadata` ko YouTube Data API se implement karo; fallback me ytdl/oEmbed rakho.  
`app/api/tools/youtube-growth/route.ts` – Channel URL se real videos + stats fetch karo.

---

## 2. Resend / SendGrid (Email – High priority)

**Kya karega:** Transactional email (OTP, password reset, payment receipt, broadcast) reliable deliver + tracking.

**Abhi kya hai:** Direct SMTP (Gmail etc.) – rate limit, spam folder, deliverability issue ho sakte hain.

**Fayda:**
- Better deliverability, less spam
- Open/click tracking (optional)
- Simple API, free tier: Resend 100 emails/day, SendGrid 100/day

**Env:** `RESEND_API_KEY` ya `SENDGRID_API_KEY`

**Kahan use karein:**  
`services/email.ts` – Nodemailer ke bajay Resend/SendGrid SDK se send karo.

---

## 3. OpenAI Whisper / AssemblyAI (Auto captions – Medium priority)

**Kya karega:** Audio/video se speech-to-text → Shorts Creator mein **auto captions**.

**Abhi kya hai:** Shorts Creator mein “add captions automatically” likha hai lekin abhi captions generate nahi ho rahe; sirf hook/hashtags.

**Fayda:**
- Har short clip ke liye real captions
- Accessibility + engagement dono badhenge
- Whisper API pay-per-minute; AssemblyAI free tier bhi hai

**Env:** `OPENAI_API_KEY` (Whisper ke liye same key) ya `ASSEMBLYAI_API_KEY`

**Kahan use karein:**  
`app/api/ai/shorts-creator/route.ts` – Video upload pe audio extract karke Whisper/AssemblyAI call; result ko clip caption me save karo.

---

## 4. Google Gemini API (AI fallback – Medium priority)

**Kya karega:** Script/thumbnail/hooks jaisi cheezein generate karna (OpenAI jaisa), with free tier.

**Abhi kya hai:** Sirf OpenAI – key na ho to mock; key expensive ho to koi option nahi.

**Fayda:**
- OpenAI fail/expensive ho to Gemini use ho
- Free tier: 60 requests/min (Gemini 1.5 Flash)
- AI Studio (script, thumbnail, hooks) zyada stable

**Env:** `GOOGLE_GEMINI_API_KEY`

**Kahan use karein:**  
`services/ai/aiStudio.ts` – Pehle OpenAI try karo; fail ya no key pe Gemini call karo (same JSON output).

---

## 5. Sentry (Errors – Medium priority)

**Kya karega:** Frontend/backend errors log + alert; stack trace, user context.

**Abhi kya hai:** Errors sirf console / user ko generic message.

**Fayda:**
- Production me bugs jaldi pakadna
- 500 errors, API failures track karna
- Free tier: 5k errors/month

**Env:** `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`

**Kahan use karein:**  
`next.config.js` + `sentry.client.config.ts` / `sentry.server.config.ts` (Sentry Next.js guide follow karo).

---

## 6. Stripe (Optional – International payments)

**Kya karega:** International cards se payment (USD/EUR); Razorpay India-focused hai.

**Fayda:** Global users ke liye subscription; Razorpay India, Stripe global.

**Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Kahan use karein:**  
Pricing/checkout pe “Pay with Card (International)” option; existing Razorpay flow ke sath parallel.

---

## Priority order (recommended)

| Order | API              | Impact                    | Effort | Free tier     |
|-------|------------------|---------------------------|--------|---------------|
| 1     | YouTube Data v3  | Reliable video + growth   | Medium | 10k units/day |
| 2     | Resend/SendGrid  | Reliable emails           | Low    | 100/day       |
| 3     | Whisper/AssemblyAI | Real auto captions      | Medium | Whisper paid; AssemblyAI free tier |
| 4     | Google Gemini    | AI fallback / cost option | Low    | 60 req/min    |
| 5     | Sentry           | Production debugging      | Low    | 5k errors/mo  |
| 6     | Stripe           | International payments    | Medium | Test mode free |

Pehle **YouTube Data API v3** aur **Resend** add karna sabse zyada faydemand rahega; uske baad captions (Whisper/AssemblyAI) aur Gemini fallback.
