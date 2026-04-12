const test = require('node:test');
const assert = require('node:assert/strict');

require('ts-node/register/transpile-only');

const { yearlyUsdFromMonthly, usdAmountForBilling } = require('../../lib/planPricingMath.ts');

test('yearlyUsdFromMonthly multiplies by 10 when storedYearly missing', () => {
  assert.equal(yearlyUsdFromMonthly(15, null), 150);
  assert.equal(yearlyUsdFromMonthly(3), 30);
});

test('yearlyUsdFromMonthly prefers storedYearly when > 0', () => {
  assert.equal(yearlyUsdFromMonthly(15, 200), 200);
});

test('usdAmountForBilling selects yearly vs monthly', () => {
  const p = { planId: 'pro', priceMonthly: 15, priceYearly: 150, currency: 'USD', name: 'Pro', label: 'Pro' };
  assert.equal(usdAmountForBilling(p, 'month'), 15);
  assert.equal(usdAmountForBilling(p, 'year'), 150);
});

