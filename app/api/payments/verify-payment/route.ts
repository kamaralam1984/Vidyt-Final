export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { getUserFromRequest } from '@/lib/auth';
import { PLAN_ROLE_MAP, isValidPlan } from '@/utils/currency';
import { getActivePlanPricing, usdAmountForBilling } from '@/lib/planPricing';
import { razorpay } from '@/services/payments/razorpay';
import { fromRazorpaySmallestUnit } from '@/lib/paymentCurrencyShared';
import { buildRazorpayOrderFromUsd } from '@/lib/paymentCurrency';
import { withRetry } from '@/lib/withRetry';
import { maybeFailpoint } from '@/lib/testFailpoints';
import { buildRazorpayMetadata } from '@/lib/paymentMode';

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
      amountMinor: expectedAmountMinor,
      currency: expectedCurrency,
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

    // Idempotency: if we already verified this order successfully, do not re-extend subscription.
    const dbUser = await User.findById(user.id).select('subscriptionPlan');
    if (
      dbUser?.subscriptionPlan?.razorpayPaymentId === razorpay_payment_id ||
      dbUser?.subscriptionPlan?.razorpayOrderId === razorpay_order_id
    ) {
      const existingPayment = await Payment.findOne({ orderId: razorpay_order_id, status: 'success' });
      if (existingPayment) {
        return NextResponse.json({
          success: true,
          message: 'Payment already applied to subscription (idempotent)',
          plan: dbUser?.subscriptionPlan?.planId,
          role: PLAN_ROLE_MAP[user.subscription as any] || 'user',
        });
      }
      // Partial failure: subscription may be applied but payment doc missing; continue to write payment doc.
    }

    const existing = await Payment.findOne({ orderId: razorpay_order_id, status: 'success' });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified (idempotent)',
        plan: existing.plan,
        role: PLAN_ROLE_MAP[user.subscription as any] || 'user',
      });
    }

    // Fetch charged payment details from Razorpay (prevents currency/amount mismatch)
    const paymentEntity: any = await (razorpay as any).payments.fetch(razorpay_payment_id);
    const paymentOrderId = paymentEntity?.order_id || paymentEntity?.orderId;
    const chargedCurrency = String(paymentEntity?.currency || 'INR').toUpperCase();
    const chargedAmountMinor = Number(paymentEntity?.amount || 0);
    const chargedAmountMajor = fromRazorpaySmallestUnit(chargedAmountMinor, chargedCurrency);

    if (paymentOrderId && paymentOrderId !== razorpay_order_id) {
      return NextResponse.json({ error: 'Razorpay order mismatch' }, { status: 400 });
    }

    // Currency/amount mismatch detection: compare forwarded order charge vs fetched payment charge.
    if (typeof expectedAmountMinor !== 'undefined') {
      const expMinor = Number(expectedAmountMinor);
      if (!Number.isFinite(expMinor) || expMinor !== chargedAmountMinor) {
        return NextResponse.json({ error: 'Razorpay payment amount mismatch' }, { status: 400 });
      }
    }
    if (typeof expectedCurrency === 'string' && expectedCurrency.trim()) {
      const expCur = expectedCurrency.toUpperCase();
      if (expCur !== chargedCurrency) {
        return NextResponse.json({ error: 'Razorpay payment currency mismatch' }, { status: 400 });
      }
    }

    // Currency/amount mismatch detection against expected plan price conversion.
    const planMeta = await getActivePlanPricing(plan);
    const expectedUsd =
      planMeta && plan !== 'free'
        ? usdAmountForBilling(planMeta, billingPeriod === 'year' ? 'year' : 'month')
        : 0;
    if (expectedUsd > 0) {
      const expected = await buildRazorpayOrderFromUsd(expectedUsd, chargedCurrency);
      if (expected.currency !== chargedCurrency || Number(expected.amountMinor) !== chargedAmountMinor) {
        return NextResponse.json(
          { error: 'Payment currency/amount mismatch vs expected plan pricing' },
          { status: 400 }
        );
      }
    }

    // ── Fetch plan label from DB (graceful fallback) ──
    let planName = plan.charAt(0).toUpperCase() + plan.slice(1);
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

    const updatedUser = await withRetry(
      async () => {
        // Prevent duplicate subscription extension on retry:
        // If the same razorpay payment is already applied, do not rewrite the subscription window.
        const userUpdated = await User.findOneAndUpdate(
          {
            _id: user.id,
            'subscriptionPlan.razorpayPaymentId': { $ne: razorpay_payment_id },
            'subscriptionPlan.razorpayOrderId': { $ne: razorpay_order_id },
          },
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
              price: chargedAmountMajor,
              currency: chargedCurrency,
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

        const userAfter = userUpdated || (await User.findById(user.id));
        if (!userAfter) return null;

        // Failpoint injection (tests only) to simulate transient DB write failures.
        maybeFailpoint('payment_db_write');

        await Payment.findOneAndUpdate(
          { orderId: razorpay_order_id },
          {
            $set: {
              userId: userAfter._id,
              paymentId: razorpay_payment_id,
              plan,
              billingPeriod: billingPeriod === 'year' ? 'year' : 'month',
              amount: chargedAmountMajor,
              currency: chargedCurrency,
              status: 'success',
              gateway: 'razorpay',
              metadata: buildRazorpayMetadata({
                source: 'verify-payment',
                razorpay_signature,
              }),
            },
          },
          { upsert: true, new: true }
        );

        return userAfter;
      },
      {
        context: { orderId: razorpay_order_id, paymentId: razorpay_payment_id },
      }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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
