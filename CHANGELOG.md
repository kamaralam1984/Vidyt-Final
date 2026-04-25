# Changelog

All notable changes to VidYT are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- `/pricing` public landing page with monthly/yearly toggle
- `/blog` index + three seed articles
- `/help`, `/faq`, `/cookie-policy`, `/data-requests`, `/security` public pages
- `.env.example` documenting all required environment variables
- `public/.well-known/security.txt` for responsible disclosure
- `public/humans.txt` crediting the team
- GitHub Actions CI workflow (lint + test + typecheck)
- Playwright E2E test harness with smoke test suite
- GDPR data-export endpoint (`/api/user/data-export`)
- Account-deletion endpoint (`/api/user/delete-account`)
- TOTP 2FA enroll / verify / disable endpoints

### Changed
- Root-level documentation consolidated into `/docs`
- One-off operational scripts moved into `/scripts`

### Fixed
- Restored CSP directives, tightened CORS, fixed Socket.IO for production (8797d2b)
- Google OAuth redirect flow, auth headers, token security (78bee78)

## [1.0.0] — 2026-04-05

### Added
- Initial public launch
- AI-powered YouTube SEO suite (titles, hashtags, thumbnails, hooks, scripts)
- Multi-platform analytics (YouTube, Instagram, Facebook, TikTok)
- Razorpay billing with free / starter / pro / enterprise plans
- Google OAuth + email/password auth, OTP email verification
- Role-based access control (user / admin / manager / super-admin)
- Cloudflare CDN + WAF integration
- PWA (installable + offline shell)

[Unreleased]: https://github.com/vidyt/vidyt/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/vidyt/vidyt/releases/tag/v1.0.0
