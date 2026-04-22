# Contributing to VidYT

Thanks for your interest in improving VidYT. This guide covers the workflow for internal contributors and external partners.

## Quick Start

```bash
git clone https://github.com/vidyt/vidyt.git
cd vidyt
cp .env.example .env.local     # fill in secrets
npm install
npm run dev                    # http://localhost:3000
```

You need Node 20+, MongoDB 6+, and Redis 7+ running locally.

## Branching

- `main` — production. Every merge deploys.
- Feature branches: `feat/<short-slug>`, `fix/<short-slug>`, `chore/<short-slug>`.
- Rebase on `main` before opening a PR; avoid merge commits.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add TOTP 2FA enrollment
fix: prevent OAuth redirect loop on Safari
chore: move legacy docs into /docs
```

## Pull Requests

1. Fill in the PR template (summary + test plan).
2. Ensure CI is green: `npm run lint && npm test && npm run test:integration`.
3. For UI changes, attach before/after screenshots.
4. One reviewer approval is required; two for anything touching billing, auth, or RBAC.

## Code Style

- TypeScript strict mode everywhere.
- React Server Components by default; mark client components with `'use client'` only when required.
- Prefer `next/image`, `next/font`, `next/link`.
- No inline comments explaining *what* — only *why* when the reason is non-obvious.
- Keep files <400 lines; extract helpers into `lib/` or `services/`.

## Testing

- **Unit** — `npm test` (Node `--test` runner)
- **Integration** — `npm run test:integration`
- **Worker jobs** — `npm run test:worker`
- **E2E** — `npm run test:e2e` (Playwright)

Add tests for every new API route and every pricing/billing/auth change.

## Security

Never commit `.env*`, service-account JSON, or Razorpay keys. Report vulnerabilities privately — see `SECURITY.md`.

## Questions

- Open a GitHub Discussion for design questions.
- File an Issue for bugs.
- For commercial/partnership topics: `support@vidyt.com`.
