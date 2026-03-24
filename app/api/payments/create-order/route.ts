export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/services/payments/razorpay';
import { getUserFromRequest } from '@/lib/auth';
import { isValidPlan } from '@/utils/currency';
import { getActivePlanPricing, usdAmountForBilling } from '@/lib/planPricing';
import { buildRazorpayOrderFromUsd } from '@/lib/paymentCurrency';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan: planId, billingPeriod, currency: userCurrency = 'INR' } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // ── Validate plan ──
    if (!isValidPlan(planId) || planId === 'free' || planId === 'owner') {
      return NextResponse.json({ error: 'Invalid plan selected for payment' }, { status: 400 });
    }

    const planPricing = await getActivePlanPricing(planId);
    if (!planPricing) {
      return NextResponse.json({ error: 'Plan pricing not found' }, { status: 404 });
    }

    const baseAmount = usdAmountForBilling(planPricing, billingPeriod === 'year' ? 'year' : 'month');

    const targetCurrency = (userCurrency || 'USD').toUpperCase();
    const { amountMinor, currency: checkoutCurrency, convertedMajor } = await buildRazorpayOrderFromUsd(
      baseAmount,
      targetCurrency
    );

    const order = await razorpay.orders.create({
      amount: amountMinor,
      currency: checkoutCurrency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: user.id,
        planId,
        billingPeriod: billingPeriod ?? 'month',
        priceUSD: String(baseAmount),
        userCurrency: checkoutCurrency,
      },
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planId,
      priceUSD: baseAmount,
      convertedPrice: convertedMajor,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
