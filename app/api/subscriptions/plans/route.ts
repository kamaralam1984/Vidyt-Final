export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS, getSubscriptionLimits } from '@/services/payments/stripe';
import connectDB from '@/lib/mongodb';
import PlanDiscount from '@/models/PlanDiscount';
import Plan from '@/models/Plan';
import { PLAN_PRICES_USD } from '@/utils/currency';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeDiscounts = url.searchParams.get('withDiscounts') === '1';

    await connectDB();
    
    // Fetch active plans from the database
    const dbPlans = await Plan.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    
    // Format the dbPlans into the structure expected by the frontend
    const plans = dbPlans.map((p: any) => {
      // If there's a matching hardcoded plan (like free, pro, enterprise), grab its limits
      const basePlan = SUBSCRIPTION_PLANS[p.planId];
      
      return {
        id: p.planId,
        dbId: String(p._id),
        name: p.name,
        label: (p as any).label || p.name,
        price: p.priceMonthly,
        priceUSD: PLAN_PRICES_USD[p.planId] ?? p.priceMonthly, // authoritative USD price
        priceYearly: p.priceYearly,
        currency: p.currency || 'USD',
        interval: p.billingPeriod === 'year' ? 'year' : 'month',
        features: p.features || [],
        description: p.description || '',
        isCustom: p.isCustom,
        limits: basePlan ? basePlan.limits : {
          videos: 'Custom',
          analyses: 'Custom',
          competitors: 'Custom',
        },
      };
    });

    if (!includeDiscounts) {
      return NextResponse.json({
        success: true,
        plans,
      });
    }

    const now = new Date();
    const discounts = await PlanDiscount.find({ startsAt: { $lte: now }, endsAt: { $gte: now } })
      .lean();

    const plansWithDiscount = plans.map((plan) => {
      const d = discounts.find((disc: any) => disc.planId === plan.id || disc.planId === plan.dbId);
      if (!d) return plan;
      const discountedPrice = Math.max(0, plan.price - (plan.price * d.percentage) / 100);
      return {
        ...plan,
        discount: {
          percentage: d.percentage,
          label: d.label || '',
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


