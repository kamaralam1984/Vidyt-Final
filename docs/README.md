# VidYT Internal Documentation

This folder holds internal implementation notes, setup guides, and historical decision logs.
Public-facing documentation (governance, security, contribution rules) lives at the repository root.

## Navigation

| Topic | File |
|---|---|
| Setup | `SETUP.md`, `QUICK_START.md`, `RESTART_INSTRUCTIONS.md` |
| MongoDB | `MONGODB_SETUP.md`, `MONGODB_ATLAS_SETUP.md`, `MONGODB_QUICK_START.md` |
| Email / OTP | `EMAIL_SETUP.md`, `OTP_EMAIL_FIX.md` |
| YouTube | `YOUTUBE_API_SETUP.md`, `YOUTUBE_THEME_*.md` |
| Cloudflare | `CLOUDFLARE_SETUP_GUIDE.md`, `CLOUDFLARE_CDN_WAF_COMPLETE.md` |
| Plans / RBAC | `PLAN_*.md`, `RBAC_*.md`, `ROLE_BASED_ACCESS_CONTROL.md` |
| AI / Analytics | `AI_ANALYTICS_IMPLEMENTATION.md`, `AI_INTEGRATION_COMPLETE.md` |
| Rate Limiting | `API_RATE_LIMITING_COMPLETE.md`, `RATE_LIMITING_IMPLEMENTATION_GUIDE.md` |
| Scheduling | `SCHEDULE_POST_*.md` |
| Deployment | `DEPLOYMENT_AND_INTEGRATION.md`, `DOCKER_DELIVERY_REPORT.md` |
| Compliance | `DEPLOYMENT_GUIDE_COMPLIANCE.md`, `PRIVACY_COMPLIANCE_FEATURES.md` |
| Troubleshooting | `TROUBLESHOOTING.md`, `QUICK_FIX.md` |

## Policy

- These docs are **point-in-time snapshots** — the source of truth is the code.
- Before following an old guide, check the most recent git log for the file you intend to change.
- New long-form notes go here (`docs/<topic>.md`). Do not add more top-level `.md` files at the repo root.
