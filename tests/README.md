# Tests (Reliability-focused)

This repo uses **Node.js built-in test runner** (`node --test`) for fast, CI-friendly unit tests.

## Current test coverage

- `tests/ai-systems.test.js`: quick sanity checks for metrics helpers.
- `tests/unit/*unit.test.cjs`: unit tests for critical business logic.

### Unit tests added for production correctness

- Payments:
  - `tests/unit/paymentCurrency.unit.test.cjs`: USD→locale conversion helpers and Razorpay minor-unit conversion.
  - `tests/unit/planPricing.unit.test.cjs`: monthly/yearly price math.
- AI labeling:
  - `tests/unit/viralOutcome.unit.test.cjs`: viral-score labeling boundaries and YouTube videoId extraction.
  - `tests/unit/featureUtils.parseFeaturesFromBody.unit.test.cjs`: request payload numeric parsing defaults.

## Next (integration + e2e)

The folder structure below is scaffolded for production-grade integration and e2e tests:

- `tests/integration/*`: API flows (create-order→verify-payment, signup payment, AI predict/outcome/metrics).
- `tests/worker/*`: BullMQ jobs + retry/idempotency.
- `tests/cron/*`: cron endpoints security + updated counts.
- `tests/e2e/*`: Playwright smoke flows (signup→payment→dashboard, upload→analysis).

Integrations require a test harness with:
- MongoDB + Redis (service containers)
- optional Python FastAPI (for predict fallback tests)
- Razorpay sandbox keys (or stubs)

