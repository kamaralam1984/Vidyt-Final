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
        limits: p.limitsDisplay || (basePlan ? basePlan.limits : {
          videos: 'Custom',
          analyses: 'Custom',
          storage: '—',
          support: 'Priority',
        }),
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

// Cache plans for 5 minutes — plans change rarely, this saves significant DB load
export const GET = withApiCache(plansHandler, {
  key: (req) => {
    const url = new URL(req.url);
    const withDiscounts = url.searchParams.get('withDiscounts') ?? '1';
    return `api:plans:${withDiscounts}`;
  },
  ttl: 300, // 5 minutes
  cacheControl: 'public, max-age=60, stale-while-revalidate=240',
});
