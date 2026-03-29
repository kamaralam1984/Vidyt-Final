/**
 * Apply a successful Stripe Checkout (one-time plan payment) to the user.
 * Shared by webhook and verify-session (idempotent).
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { PLAN_ROLE_MAP, isValidPlan } from '@/utils/currency';
import { getActivePlanPricing, usdAmountForBilling } from '@/lib/planPricing';
import { withRetry } from '@/lib/withRetry';

export interface StripeFulfillInput {
  userId: string;
  sessionId: string;
  paymentIntentId: string;
  plan: string;
  billingPeriod: 'month' | 'year';
  /** Amount charged in major units (e.g. dollars), not cents */
  amountMajor: number;
  currency: string;
}

export async function fulfillStripePlanPurchase(
  input: StripeFulfillInput
): Promise<{ ok: true; plan: string; role: string } | { ok: false; error: string; status: number }> {
  const { userId, sessionId, paymentIntentId, plan, billingPeriod, amountMajor, currency } = input;

  if (!plan || !isValidPlan(plan) || plan === 'free' || plan === 'owner') {
    return { ok: false, error: 'Invalid plan', status: 400 };
  }

  await connectDB();

  const existingPay = await Payment.findOne({
    orderId: sessionId,
    gateway: 'stripe',
    status: 'success',
  });
  if (existingPay) {
    const u = await User.findById(userId);
    return {
      ok: true,
      plan: existingPay.plan || u?.subscription || plan,
      role: String(u?.role || PLAN_ROLE_MAP[existingPay.plan || plan] || 'user'),
    };
  }

  const planMeta = await getActivePlanPricing(plan);
  const expectedUsd = planMeta
    ? usdAmountForBilling(planMeta, billingPeriod === 'year' ? 'year' : 'month')
    : 0;
  if (expectedUsd > 0) {
    const cur = currency.toLowerCase();
    if (cur !== 'usd') {
      return { ok: false, error: 'Unexpected checkout currency', status: 400 };
    }
    const diff = Math.abs(amountMajor - expectedUsd);
    if (diff > 0.02) {
      return { ok: false, error: 'Payment amount mismatch vs plan pricing', status: 400 };
    }
  }

  let planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  try {
    const PlanModel = (await import('@/models/Plan')).default;
    const dbPlan = await PlanModel.findOne({ planId: plan });
    if (dbPlan) planName = (dbPlan as any).label || dbPlan.name || planName;
  } catch {
    // ignore
  }

  const expiryDays = billingPeriod === 'year' ? 365 : 30;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  const newRole = PLAN_ROLE_MAP[plan] || 'user';
  const curUpper = currency.toUpperCase();

  const updatedUser = await withRetry(
    async () => {
      const userUpdated = await User.findOneAndUpdate(
        {
          _id: userId,
          'subscriptionPlan.stripeCheckoutSessionId': { $ne: sessionId },
        },
        {
          subscription: plan,
          role: newRole,
          subscriptionExpiresAt: expiryDate,
          subscriptionPlan: {
            planId: plan,
            planName,
            billingPeriod: billingPeriod === 'year' ? 'year' : 'month',
            status: 'active',
            startDate: new Date(),
            endDate: expiryDate,
            price: amountMajor,
            currency: curUpper,
            paymentId: paymentIntentId,
            stripeCheckoutSessionId: sessionId,
            stripePaymentIntentId: paymentIntentId,
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

      const userAfter = userUpdated || (await User.findById(userId));
      if (!userAfter) return null;

      await Payment.findOneAndUpdate(
        { orderId: sessionId },
        {
          $set: {
            userId: userAfter._id,
            paymentId: paymentIntentId,
            plan,
            billingPeriod: billingPeriod === 'year' ? 'year' : 'month',
            amount: amountMajor,
            currency: curUpper,
            status: 'success',
            gateway: 'stripe',
            metadata: {
              source: 'stripe-checkout',
              stripeCheckoutSessionId: sessionId,
              stripePaymentIntentId: paymentIntentId,
            },
          },
        },
        { upsert: true, new: true }
      );

      return userAfter;
    },
    { context: { orderId: sessionId, paymentId: paymentIntentId } }
  );

  if (!updatedUser) {
    const u = await User.findById(userId);
    if (u?.subscriptionPlan?.stripeCheckoutSessionId === sessionId) {
      return { ok: true, plan: u.subscription, role: String(u.role) };
    }
    return { ok: false, error: 'User not found', status: 404 };
  }

  return {
    ok: true,
    plan: updatedUser.subscription,
    role: String(updatedUser.role),
  };
}
