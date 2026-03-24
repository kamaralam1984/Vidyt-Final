export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import { PLAN_PRICES_USD, PLAN_FEATURES, PLAN_LABELS, VALID_PLANS } from '@/utils/currency';

const VALID_PLAN_IDS = VALID_PLANS.filter((p) => p !== 'owner');

async function seedPlans() {
  const Plan = (await import('@/models/Plan')).default;

  const plans = VALID_PLAN_IDS.map((planId) => ({
    planId,
    name: planId.charAt(0).toUpperCase() + planId.slice(1),
    label: PLAN_LABELS[planId] || planId,
    priceMonthly: PLAN_PRICES_USD[planId] ?? 0,
    priceYearly: (PLAN_PRICES_USD[planId] ?? 0) * 10,
    currency: 'USD',
    features: PLAN_FEATURES[planId] || [],
    isActive: true,
    isCustom: planId === 'custom',
    billingPeriod: 'both' as const,
  }));

  await Plan.deleteMany({});
  await Plan.insertMany(plans);

  return plans.length;
}

async function fixInvalidUsers() {
  const User = (await import('@/models/User')).default;
  const result = await User.updateMany(
    { subscription: { $nin: [...VALID_PLANS] } },
    { $set: { subscription: 'free' } }
  );
  return result.modifiedCount;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !['admin', 'super-admin', 'superadmin'].includes(user.role as string)) {
      return NextResponse.json({ error: 'Forbidden: Super-admin only' }, { status: 403 });
    }

    await connectDB();

    const planCount = await seedPlans();
    const fixedUsers = await fixInvalidUsers();

    return NextResponse.json({
      success: true,
      message: `✅ Seeded ${planCount} plans, fixed ${fixedUsers} users`,
      plans: VALID_PLAN_IDS.map((id) => ({
        planId: id,
        priceUSD: PLAN_PRICES_USD[id],
        label: PLAN_LABELS[id],
      })),
    });
  } catch (error: any) {
    console.error('Seed plans error:', error);
    return NextResponse.json({ error: error.message || 'Seed failed' }, { status: 500 });
  }
}
