import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/services/payments/stripe';
import connectDB from '@/lib/mongodb';
import PlanDiscount from '@/models/PlanDiscount';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeDiscounts = url.searchParams.get('withDiscounts') === '1';
    const plans = Object.values(SUBSCRIPTION_PLANS);

    if (!includeDiscounts) {
      return NextResponse.json({
        success: true,
        plans,
      });
    }

    await connectDB();
    const now = new Date();
    const discounts = await PlanDiscount.find({ startsAt: { $lte: now }, endsAt: { $gte: now } })
      .lean();

    const plansWithDiscount = plans.map((plan) => {
      const d = discounts.find((disc: any) => disc.planId === plan.id);
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

