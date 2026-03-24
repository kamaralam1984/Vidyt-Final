import connectDB from '@/lib/mongodb';
import Plan from '@/models/Plan';
import type { IPlan } from '@/models/Plan';
import { PLAN_PRICES_USD, isValidPlan } from '@/utils/currency';

export type BillingPeriod = 'month' | 'year';

export interface ActivePlanPricing {
  planId: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  name: string;
  label: string;
}

export function yearlyUsdFromMonthly(monthly: number, storedYearly?: number | null): number {
  if (storedYearly != null && storedYearly > 0) return storedYearly;
  return monthly * 10;
}

export function usdAmountForBilling(p: ActivePlanPricing, period: BillingPeriod): number {
  return period === 'year' ? p.priceYearly : p.priceMonthly;
}

/**
 * Canonical prices from Manage Plans (Mongo). Falls back to utils/currency only if no active row exists.
 */
export async function getActivePlanPricing(planId: string): Promise<ActivePlanPricing | null> {
  if (!isValidPlan(planId)) return null;
  if (planId === 'free') {
    return {
      planId: 'free',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'USD',
      name: 'Free',
      label: 'Free',
    };
  }

  await connectDB();
  const raw = await Plan.findOne({ planId, isActive: true }).lean();
  const doc = raw as IPlan | null;
  if (doc && typeof doc.priceMonthly === 'number') {
    const monthly = doc.priceMonthly;
    return {
      planId: doc.planId,
      priceMonthly: monthly,
      priceYearly: yearlyUsdFromMonthly(monthly, doc.priceYearly),
      currency: doc.currency || 'USD',
      name: doc.name,
      label: doc.label || doc.name,
    };
  }

  const fallback = PLAN_PRICES_USD[planId];
  if (fallback === undefined) return null;
  return {
    planId,
    priceMonthly: fallback,
    priceYearly: fallback * 10,
    currency: 'USD',
    name: planId,
    label: planId,
  };
}
