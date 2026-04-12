/**
 * Format amount with currency symbol/label based on currency code.
 * Used for display so user sees their country's currency (e.g. INR → ₹, USD → $).
 */
const CURRENCY_DISPLAY: Record<string, { symbol: string; locale?: string }> = {
  INR: { symbol: 'Rs-', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
};

export function formatAmount(amount: number, currencyCode: string = 'INR'): string {
  const code = (currencyCode || 'INR').toUpperCase();
  const config = CURRENCY_DISPLAY[code] || { symbol: code + ' ', locale: 'en-IN' };
  const formatted = new Intl.NumberFormat(config.locale || 'en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${config.symbol}${formatted}`;
}

export function getCurrencySymbol(currencyCode: string = 'INR'): string {
  const code = (currencyCode || 'INR').toUpperCase();
  return CURRENCY_DISPLAY[code]?.symbol ?? code + ' ';
}

// ──────────────────────────────────────────────────────────────
// Plan pricing constants (USD base – single source of truth)
// ──────────────────────────────────────────────────────────────

/** USD base prices for all plans */
export const PLAN_PRICES_USD: Record<string, number> = {
  free: 0,
  starter: 3,
  pro: 15,
  enterprise: 25,
  custom: 50,
};

/** All valid plan identifiers */
export const VALID_PLANS = ['free', 'starter', 'pro', 'enterprise', 'custom', 'owner'] as const;

export type PlanId = (typeof VALID_PLANS)[number];

/** Maps plan → role after subscription */
export const PLAN_ROLE_MAP: Record<string, string> = {
  free: 'user',
  starter: 'user',
  pro: 'manager',
  enterprise: 'admin',
  custom: 'admin',
  owner: 'superadmin',
};

/** Human-readable plan labels */
export const PLAN_LABELS: Record<string, string> = {
  free: 'Free Plan',
  starter: 'Starter Plan',
  pro: 'Pro Plan',
  enterprise: 'Enterprise Plan',
  custom: 'Custom Plan',
  owner: 'Owner',
};

/** Default plan features */
export const PLAN_FEATURES: Record<string, string[]> = {
  free: ['Limited access'],
  starter: ['Basic tools', 'Limited usage'],
  pro: ['Advanced tools', 'High limits'],
  enterprise: ['Unlimited access'],
  custom: ['Custom features'],
  owner: ['Full platform access'],
};

/**
 * Convert a USD amount to the target currency using pre-fetched exchange rates.
 * @param amountUSD  Price in USD (e.g. 15)
 * @param rates      Exchange rates keyed by ISO code { INR: 83.5, EUR: 0.91 }
 * @param currency   Target ISO currency code (e.g. "INR")
 */
export function convertUSD(amountUSD: number, rates: Record<string, number>, currency: string): number {
  const rate = rates[currency.toUpperCase()] ?? 1;
  return Math.round(amountUSD * rate * 100) / 100;
}

/** Returns true if the given plan string is a valid plan id. */
export function isValidPlan(plan: string): plan is PlanId {
  return VALID_PLANS.includes(plan as PlanId);
}
