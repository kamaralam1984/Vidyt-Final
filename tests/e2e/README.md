# E2E Tests (Playwright)

## Run locally

```bash
# one-time: install browsers
npx playwright install

# start the production build in another terminal
npm run build && npm run start

# run tests
npm run test:e2e
```

If you're iterating, use headed mode:

```bash
npx playwright test --headed --project=chromium
```

## CI

`smoke.spec.ts` runs on every pull request via `.github/workflows/ci.yml`.
Failures upload an HTML report as an artifact named `playwright-report`.

## Adding tests

- Keep smoke tests fast (< 30 s total).
- Put feature flows in their own file (e.g. `billing.spec.ts`, `auth.spec.ts`).
- Never hit production APIs — point tests at a staging env or mock.
