export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { getUserFromRequest } from '@/lib/auth';
import { PLAN_ROLE_MAP, isValidPlan } from '@/utils/currency';
import { getActivePlanPricing, usdAmountForBilling } from '@/lib/planPricing';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      billingPeriod,
    } = await request.json();

    // ── Validate plan ──
    if (!plan || !isValidPlan(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // ── Verify Razorpay signature ──
    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    await connectDB();

    const planMeta = await getActivePlanPricing(plan);
    const recordedPriceUsd =
      planMeta && plan !== 'free'
        ? usdAmountForBilling(planMeta, billingPeriod === 'year' ? 'year' : 'month')
        : 0;

    // ── Fetch plan label from DB (graceful fallback) ──
    let planName = planMeta?.label || plan.charAt(0).toUpperCase() + plan.slice(1);
    try {
      const PlanModel = (await import('@/models/Plan')).default;
      const dbPlan = await PlanModel.findOne({ planId: plan });
      if (dbPlan) planName = dbPlan.label || dbPlan.name || planName;
    } catch {
      // Non-critical: proceed without plan name
    }

    // ── Calculate expiry date ──
    const expiryDays = billingPeriod === 'year' ? 365 : 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const newRole = PLAN_ROLE_MAP[plan] || 'user';

    // ── Update user in DB ──
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      {
        subscription: plan,
        role: newRole,
        subscriptionExpiresAt: expiryDate,
        subscriptionPlan: {
          planId: plan,
          planName,
          status: 'active',
          startDate: new Date(),
          endDate: expiryDate,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          price: recordedPriceUsd,
          currency: 'USD',
        },
        usageStats: {
          videosAnalyzed: 0,
          analysesThisMonth: 0,
          competitorsTracked: 0,
          hashtagsGenerated: 0,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        $set: {
          userId: updatedUser._id,
          paymentId: razorpay_payment_id,
          plan,
          billingPeriod: billingPeriod === 'year' ? 'year' : 'month',
          amount: recordedPriceUsd,
          currency: 'USD',
          status: 'success',
          gateway: 'razorpay',
          metadata: {
            source: 'verify-payment',
            razorpay_signature,
          },
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Plan upgraded successfully',
      plan: updatedUser.subscription,
      role: updatedUser.role,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
