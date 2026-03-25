export type BillingPeriod = 'month' | 'year';

/**
 * Pure helper for yearly price derived from monthly price.
 * - If `storedYearly` is provided and > 0, use it.
 * - Otherwise, use monthly * 10 (existing system rule).
 */
export function yearlyUsdFromMonthly(monthly: number, storedYearly?: number | null): number {
  if (storedYearly != null && storedYearly > 0) return storedYearly;
  return monthly * 10;
}

/**
 * Selects correct amount based on billing period.
 */
export function usdAmountForBilling(p: { priceMonthly: number; priceYearly: number }, period: BillingPeriod): number {
  return period === 'year' ? p.priceYearly : p.priceMonthly;
}

