# Security Policy

VidYT (operated by Kvl Business Solutions) takes the security of our platform and our users' data seriously. This document describes how to report vulnerabilities and what you can expect in return.

## Supported Versions

Only the currently deployed production version at `https://www.vidyt.com` is supported. Older tags are not patched.

## Reporting a Vulnerability

**Please do not file public GitHub issues for security reports.**

Email `security@vidyt.com` with:

- A clear description of the vulnerability
- Steps to reproduce (proof-of-concept where possible)
- The affected endpoint / component / commit hash
- Your disclosure timeline preference

Encrypt sensitive details with our PGP key (fingerprint in `/.well-known/security.txt`).

### What to expect

| Stage | Target |
|---|---|
| Acknowledgement | within 48 hours |
| Triage + severity rating | within 5 business days |
| Fix for Critical / High | within 14 days |
| Fix for Medium / Low | within 60 days |
| Public disclosure | coordinated after a fix ships |

## Scope

**In scope**
- `*.vidyt.com` web application and APIs
- Mobile app (Capacitor build)
- Browser extension (`public/vidyt-extension`)
- Authentication, billing, RBAC, data-export, and account-deletion flows

**Out of scope**
- Third-party SaaS (Razorpay, Google, Cloudflare, Sentry) — report to those vendors
- Physical attacks, social engineering of staff
- Denial-of-service / volumetric attacks
- Self-XSS, clickjacking on pages without sensitive actions
- Missing security headers on static marketing pages
- Automated scanner output without a working PoC

## Safe Harbor

We will not pursue legal action against researchers who:
- Report in good faith via `security@vidyt.com`
- Avoid privacy violations, data destruction, and service disruption
- Do not access accounts other than their own
- Give us reasonable time to fix before public disclosure

## Recognition

Valid reports are acknowledged in the release notes. We do not currently run a paid bug-bounty program, but high-impact reports receive a one-year Pro-plan credit and a listing on our Hall of Fame page.
