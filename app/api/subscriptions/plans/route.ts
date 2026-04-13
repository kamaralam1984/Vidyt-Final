export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS, getSubscriptionLimits } from '@/services/payments/paypal';
import connectDB from '@/lib/mongodb';
import PlanDiscount from '@/models/PlanDiscount';
import Plan from '@/models/Plan';
import { yearlyUsdFromMonthly } from '@/lib/planPricing';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeDiscounts = url.searchParams.get('withDiscounts') !== '0';

    await connectDB();
    
    // Fetch active plans from the database
    const dbPlans = await Plan.find({ isActive: true }).sort({ priceMonthly: 1 }).lean();
    
    // Format the dbPlans into the structure expected by the frontend
    const plans = dbPlans.map((p: any) => {
      // If there's a matching hardcoded plan (like free, pro, enterprise), grab its limits
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
      return NextResponse.json({
        success: true,
        plans,
      });
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
        // Skip if max uses reached
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

    return NextResponse.json({
      success: true,
      plans: plansWithDiscount,
    });
  } catch (error: any) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription plans' },
      { status: 500 }
    );
  }
}


