import connectDB from '@/lib/mongodb';
import Plan from '@/models/Plan';
import type { IPlan } from '@/models/Plan';
import { PLAN_PRICES_USD, isValidPlan } from '@/utils/currency';
import { yearlyUsdFromMonthly as yearlyFromMonthlyPure, usdAmountForBilling as usdAmountForBillingPure, type BillingPeriod as BillingPeriodPure } from '@/lib/planPricingMath';

export type BillingPeriod = BillingPeriodPure;

export interface ActivePlanPricing {
  planId: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  name: string;
  label: string;
}

export function yearlyUsdFromMonthly(monthly: number, storedYearly?: number | null): number {
  return yearlyFromMonthlyPure(monthly, storedYearly);
}

export function usdAmountForBilling(p: ActivePlanPricing, period: BillingPeriod): number {
  return usdAmountForBillingPure(p, period);
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
