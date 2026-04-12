/** Matches verify-and-pay early-bird behaviour for yearly plans. */
export const SIGNUP_EARLY_BIRD_DISCOUNT = false;

const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'UGX']);

export function convertUsdToCurrency(
  amountUsd: number,
  currency: string,
  rates: Record<string, number>
): number {
  const c = currency.toUpperCase();
  if (c === 'USD') return amountUsd;
  const r = rates[c];
  if (r == null || !Number.isFinite(r) || r <= 0) return amountUsd;
  return amountUsd * r;
}

export function resolveCheckoutCurrency(
  preferred: string,
  rates: Record<string, number>
): string {
  const c = (preferred || 'USD').toUpperCase();
  if (c === 'USD') return 'USD';
  if (rates[c] != null && Number.isFinite(rates[c])) return c;
  return 'USD';
}

export function toRazorpaySmallestUnit(amountMajor: number, currency: string): number {
  const c = currency.toUpperCase();
  if (ZERO_DECIMAL.has(c)) return Math.round(amountMajor);
  return Math.round(amountMajor * 100);
}

export function fromRazorpaySmallestUnit(amountMinor: number, currency: string): number {
  const c = currency.toUpperCase();
  if (ZERO_DECIMAL.has(c)) return amountMinor;
  return amountMinor / 100;
}

export function computeSignupUsdCharge(opts: {
  planId: string;
  billingPeriod: 'month' | 'year';
  priceMonthly: number;
  priceYearly: number;
}): number {
  const { planId, billingPeriod, priceMonthly, priceYearly } = opts;
  if (planId === 'free') return 0;
  if (billingPeriod === 'month') return priceMonthly;
  const year = priceYearly > 0 ? priceYearly : priceMonthly * 10;
  if (SIGNUP_EARLY_BIRD_DISCOUNT) return year - priceMonthly;
  return year;
}
