export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS, getSubscriptionLimits } from '@/services/payments/paypal';
import connectDB from '@/lib/mongodb';
import PlanDiscount from '@/models/PlanDiscount';
import Plan from '@/models/Plan';
import { yearlyUsdFromMonthly } from '@/lib/planPricing';
import { withApiCache } from '@/lib/withApiCache';
import { getPlanRoll } from '@/lib/planLimits';
import { FEATURE_LIMITS_REGISTRY } from '@/lib/featureLimits';

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

      // Build Plan Quotas: only include featureLimits entries where the
      // corresponding boolean feature is enabled for this plan. This keeps
      // Plan Quotas count aligned with the features list — admin enables a
      // feature → its quota automatically appears on the pricing card.
      const roll = getPlanRoll(p.planId);
      const filteredFeatureLimits: Record<string, { value: number; period: string }> = {};
      for (const def of FEATURE_LIMITS_REGISTRY) {
        if (def.featureGate === 'never') continue;
        if (def.featureGate && !roll.features[def.featureGate as keyof typeof roll.features]) continue;
        const dbVal = (p.limits?.featureLimits as any)?.[def.key];
        const value = dbVal?.value ?? def.defaultValue;
        if (value === 0) continue;
        filteredFeatureLimits[def.key] = { value, period: dbVal?.period ?? def.defaultPeriod };
      }
      const quotas = {
        ...(p.limits || {}),
        featureLimits: filteredFeatureLimits,
      };

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
