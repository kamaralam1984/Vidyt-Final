# 🚀 Vid YT

<p align="center">
  <strong>AI-Powered Video Analysis Platform</strong>
</p>

<p align="center">
  Analyze, optimize, and predict the viral potential of your social media videos.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-endpoints">API</a> •
  <a href="#license">License</a>
</p>

---

## 📖 Description

**Vid YT** is a SaaS platform that helps content creators and marketers analyze their videos before publishing. Upload a video or paste a YouTube link to get AI-powered insights: hook strength, thumbnail appeal, title optimization, viral probability, trending hashtags, and the best time to post—all in a modern, interactive dashboard.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| **📤 Video Upload & YouTube Import** | Upload video files or paste YouTube links for instant analysis. |
| **🎣 AI Video Hook Analyzer** | Analyzes the first 3 seconds for faces, motion intensity, scene changes, and brightness. |
| **🖼️ Thumbnail Analyzer** | Detects faces, emotions, color contrast, and text readability. |
| **📝 Title Optimizer** | Uses NLP to analyze titles and generate optimized viral title suggestions. |
| **📈 Viral Prediction Engine** | Calculates viral probability from hook, thumbnail, title, trending score, and length. |
| **🔥 Trending Topic Engine** | Detects trending keywords and viral hashtags. |
| **#️⃣ Hashtag Generator** | Generates optimized hashtags based on video content. |
| **⏰ Best Posting Time Predictor** | Recommends optimal posting times with heatmap visualization. |
| **📊 Modern Dashboard** | Interactive dashboard with animations, charts (Recharts), and insights. |
| **🤖 AI Studio** | Script generator, thumbnail ideas, hook generator, Shorts creator, YouTube growth tracker. |
| **📅 Content Calendar** | Schedule and manage posts across platforms. |
| **👥 Team & Subscriptions** | Role-based access, plans, and API key management. |

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Framework** | Next.js 14 (App Router) |
| **UI** | React, TailwindCSS, Framer Motion, Recharts |
| **Backend** | Next.js API Routes |
| **Database** | MongoDB with Mongoose |
| **AI / Processing** | Sharp (image/video), Natural (NLP), Compromise (text), ytdl-core (YouTube) |
| **ML** | TensorFlow.js (viral prediction model) |

---

## 📸 Screenshots

| Dashboard | Viral Optimizer | Analytics |
|-----------|-----------------|-----------|
| *Add screenshot of dashboard* | *Add screenshot of viral optimizer* | *Add screenshot of analytics* |

*Replace with actual screenshots from your app. Suggested paths: `docs/screenshots/dashboard.png`, `docs/screenshots/optimizer.png`, `docs/screenshots/analytics.png`.*

---

## 📥 Installation

### Prerequisites

- **Node.js** 18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **npm** or **yarn**

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/kamaralam1984/vidyt.git
   cd vidyt
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**

   Copy the example env and edit with your values:

   ```bash
   cp .env.example .env.local
   ```

   See [Environment variables](#-environment-variables) below.

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create a `.env.local` in the project root with:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT auth | Yes |
| `SMTP_HOST` | SMTP host (e.g. `smtp.gmail.com`) | For emails |
| `SMTP_PORT` | SMTP port (e.g. `587`) | For emails |
| `SMTP_USER` | SMTP username | For emails |
| `SMTP_PASS` | SMTP password | For emails |
| `OPENAI_API_KEY` | OpenAI API key (AI features) | Optional |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini (fallback AI) | Optional |
| `YOUTUBE_API_KEY` | YouTube Data API v3 | Optional |
| `RESEND_API_KEY` | Resend (transactional email) | Optional |
| `RAZORPAY_KEY_ID` | Razorpay payment key | For payments |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | For payments |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `https://yourdomain.com`) | For emails/links |

*Additional keys (Stripe, Sentry, AssemblyAI, etc.) can be configured via the Super Admin panel.*

---

## 📁 Project Structure

```
vidyt/
├── app/
│   ├── api/                    # API routes
│   │   ├── admin/              # Super admin (users, config, notifications)
│   │   ├── ai/                 # AI Studio (script, thumbnail, hook, shorts, train, predict)
│   │   ├── analytics/          # Overview, heatmap, insights, benchmark, retention, growth
│   │   ├── auth/               # Login, register, OTP, password reset, me
│   │   ├── payments/           # Create order, verify, webhook
│   │   ├── schedule/           # Calendar, post
│   │   ├── subscriptions/     # Plans, manage, cancel, resume, invoices, usage
│   │   ├── videos/             # Upload, YouTube, Facebook, Instagram, TikTok, bulk
│   │   ├── trending/           # Trending topics
│   │   ├── posting-time/       # Best posting time
│   │   └── ...
│   ├── (auth|dashboard|videos|analytics|ai|...)/  # Pages
│   ├── layout.tsx
│   └── globals.css
├── components/                 # React components
│   ├── DashboardLayout.tsx
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── VideoUpload.tsx
│   ├── ViralScoreMeter.tsx
│   ├── PostingTimeHeatmap.tsx
│   └── ...
├── lib/                        # Utilities
│   ├── mongodb.ts
│   ├── auth.ts
│   ├── apiConfig.ts
│   └── ...
├── models/                     # Mongoose models
│   ├── User.ts
│   ├── Video.ts
│   ├── Analysis.ts
│   ├── ViralPrediction.ts
│   └── ...
├── services/                   # Business logic
│   ├── ai/                     # aiStudio, videoAnalysis, viralPredictor
│   ├── ml/                     # viralModel, ensemble, featureUtils
│   ├── analytics/              # advanced, insightsEngine
│   ├── email.ts
│   ├── youtube.ts
│   └── ...
└── public/
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/login-pin` | Unique ID + PIN login |
| GET  | `/api/auth/me` | Current user (Bearer token) |
| POST | `/api/auth/password-reset` | Request password reset |
| POST | `/api/auth/send-otp` | Send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/upload` | Upload video |
| POST | `/api/videos/youtube` | Import & analyze YouTube video |
| GET  | `/api/videos` | List user videos |
| GET  | `/api/videos/[id]` | Video + analysis |
| POST | `/api/videos/bulk-analyze` | Bulk analysis |

### AI & Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/trending` | Trending topics |
| GET  | `/api/posting-time` | Best posting time (platform query) |
| POST | `/api/ai/predict` | Viral probability (ensemble) |
| POST | `/api/ai/script-generator` | Generate script |
| POST | `/api/ai/thumbnail-generator` | Thumbnail ideas |
| POST | `/api/ai/hook-generator` | Viral hooks |
| GET  | `/api/analytics/dashboard` | Analytics overview |
| GET  | `/api/analytics/insights` | AI insights |

### Subscriptions & Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/subscriptions/plans` | List plans |
| GET  | `/api/subscriptions/manage` | User subscription (GET/POST) |
| POST | `/api/payments/create-order` | Create order |
| POST | `/api/payments/verify-payment` | Verify payment |

*All protected routes require header: `Authorization: Bearer <token>`.*

---

## 📘 Usage Guide

1. **Sign up / Log in**  
   Register or use Unique ID + PIN or Email + Password.

2. **Upload or import a video**  
   - **Upload**: Drag & drop or select a file.  
   - **YouTube**: Paste a YouTube URL and click Analyze.

3. **View analysis**  
   See viral score, hook/thumbnail/title breakdown, optimized titles, hashtags, and posting time heatmap.

4. **Use AI Studio** (if enabled for your plan)  
   - Script Generator, Thumbnail Generator, Hook Generator.  
   - Shorts Creator (cut clips from long video).  
   - YouTube Growth Tracker.

5. **Analytics**  
   Open the Analytics page for trends, heatmaps, benchmarks, and AI insights.

6. **Subscription**  
   Upgrade from Pricing; manage subscription and invoices from the Subscription page.

---

## 🏃 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server ([http://localhost:3000](http://localhost:3000)) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 📄 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repo.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Commit: `git commit -m 'Add some feature'`.
4. Push: `git push origin feature/your-feature`.
5. Open a Pull Request.

Please ensure tests and lint pass before submitting.

---

<p align="center">
  <strong>Vid YT</strong> — Make your videos go viral.
</p>
# vidyt
