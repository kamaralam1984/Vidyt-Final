export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS, getSubscriptionLimits } from '@/services/payments/paypal';
import connectDB from '@/lib/mongodb';
import PlanDiscount from '@/models/PlanDiscount';
import Plan from '@/models/Plan';
import { yearlyUsdFromMonthly } from '@/lib/planPricing';
import { withApiCache } from '@/lib/withApiCache';

async function plansHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const includeDiscounts = url.searchParams.get('withDiscounts') !== '0';

    await connectDB();

    const dbPlans = await Plan.find({ isActive: true }).sort({ priceMonthly: 1 }).lean();

    const plans = dbPlans.map((p: any) => {
      const basePlan = SUBSCRIPTION_PLANS[p.planId];
      const priceMonthly = p.priceMonthly;
      const priceYearly = yearlyUsdFromMonthly(priceMonthly, p.priceYearly);

      // Friendly display strings (videos / analyses / storage / support) — admin-set in Manage Plans, hardcoded fallback only if missing.
      const limitsDisplay = p.limitsDisplay || (basePlan ? basePlan.limits : {
        videos: 'Custom',
        analyses: 'Custom',
        storage: '—',
        support: 'Priority',
      });

      // Numeric quotas the admin set in Manage Plans (analysesLimit, titleSuggestions, hashtagCount, competitorsTracked, featureLimits map).
      // Surface them so PricingCard can render real "Plan Quotas" instead of just friendly strings.
      const quotas = p.limits || {};

      return {
        id: p.planId,
        dbId: String(p._id),
        name: p.name,
        label: (p as any).label || p.name,
        price: priceMonthly,
        priceUSD: priceMonthly,
        priceYearly,
        currency: p.currency || 'USD',
        interval: p.billingPeriod === 'year' ? 'year' : 'month',
        features: p.features || [],
        description: p.description || '',
        isCustom: p.isCustom,
        // BACK-COMPAT: keep `limits` as the friendly display strings for old callers.
        limits: limitsDisplay,
        limitsDisplay,
        quotas,
      };
    });

    if (!includeDiscounts) {
      return NextResponse.json({ success: true, plans });
    }

    const now = new Date();
    const discounts = await PlanDiscount.find({
      startsAt: { $lte: now },
      endsAt: { $gte: now },
      isActive: { $ne: false },
    }).lean();

    const plansWithDiscount = plans.map((plan) => {
      const d = discounts.find((disc: any) => {
        const matchesPlan = disc.planId === plan.id || disc.planId === plan.dbId;
        if (!matchesPlan) return false;
        if (disc.maxUses > 0 && (disc.usageCount || 0) >= disc.maxUses) return false;
        return true;
      });
      if (!d) return plan;
      const discountedPrice = Math.max(0, plan.price - (plan.price * d.percentage) / 100);
      return {
        ...plan,
        discount: {
          percentage: d.percentage,
          label: d.label || '',
          couponCode: d.couponCode || '',
          billingPeriod: d.billingPeriod || 'both',
          startsAt: d.startsAt,
          endsAt: d.endsAt,
          discountedPrice,
        },
      };
    });

    return NextResponse.json({ success: true, plans: plansWithDiscount });
  } catch (error: any) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription plans' },
      { status: 500 }
    );
  }
}

// Cache plans for 30s — admin endpoints invalidate explicitly via
// invalidatePublicPlanCache(), but TTL acts as a safety net so any save path
// that forgets to invalidate still propagates within half a minute.
export const GET = withApiCache(plansHandler, {
  key: (req) => {
    const url = new URL(req.url);
    const withDiscounts = url.searchParams.get('withDiscounts') ?? '1';
    return `api:plans:${withDiscounts}`;
  },
  ttl: 30,
  cacheControl: 'public, max-age=15, stale-while-revalidate=15',
});
