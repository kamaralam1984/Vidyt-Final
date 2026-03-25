const test = require('node:test');
const assert = require('node:assert/strict');

// Allow requiring TypeScript modules from .cjs tests.
require('ts-node/register/transpile-only');

const {
  SIGNUP_EARLY_BIRD_DISCOUNT,
  computeSignupUsdCharge,
  convertUsdToCurrency,
  toRazorpaySmallestUnit,
  fromRazorpaySmallestUnit,
} = require('../../lib/paymentCurrencyShared.ts');


test('computeSignupUsdCharge: yearly early-bird uses (yearly - monthly) USD base', () => {
  const monthly = 15;
  const yearly = 150; // monthly * 10

  const out = computeSignupUsdCharge({
    planId: 'pro',
    billingPeriod: 'year',
    priceMonthly: monthly,
    priceYearly: yearly,
  });

  assert.equal(out, SIGNUP_EARLY_BIRD_DISCOUNT ? yearly - monthly : yearly);
});

test('computeSignupUsdCharge: month returns monthly USD', () => {
  const out = computeSignupUsdCharge({
    planId: 'pro',
    billingPeriod: 'month',
    priceMonthly: 15,
    priceYearly: 150,
  });
  assert.equal(out, 15);
});

test('convertUsdToCurrency multiplies using provided USD-based rates', () => {
  const out = convertUsdToCurrency(100, 'INR', { INR: 83.5, USD: 1 });
  assert.equal(out, 8350);
});

test('toRazorpaySmallestUnit: INR uses paise (2 decimals)', () => {
  assert.equal(toRazorpaySmallestUnit(10.23, 'INR'), 1023);
});

test('toRazorpaySmallestUnit: JPY uses 0 decimals rounding', () => {
  assert.equal(toRazorpaySmallestUnit(100.7, 'JPY'), 101);
});

test('fromRazorpaySmallestUnit INR back-converts to major', () => {
  assert.equal(fromRazorpaySmallestUnit(1023, 'INR'), 10.23);
});

