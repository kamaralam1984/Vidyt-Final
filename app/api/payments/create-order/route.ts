export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/services/payments/razorpay';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import { PLAN_PRICES_USD, isValidPlan } from '@/utils/currency';

/**
 * Fetch exchange rates from our internal proxy (cached, with fallback).
 */
async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/public/currency-rates`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data.rates ?? { USD: 1, INR: 83.5 };
  } catch {
    return { USD: 1, INR: 83.5 };
  }
}

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

    // ── Get USD base price ──
    const priceUSD = PLAN_PRICES_USD[planId];
    if (priceUSD === undefined) {
      return NextResponse.json({ error: 'Plan pricing not found' }, { status: 404 });
    }

    // Annual billing: 10× monthly (2 months free)
    const baseAmount = billingPeriod === 'year' ? priceUSD * 10 : priceUSD;

    // ── Currency conversion ──
    const targetCurrency = (userCurrency || 'INR').toUpperCase();
    const rates = await getExchangeRates();
    const rate = rates[targetCurrency] ?? 1;
    const convertedAmount = Math.round(baseAmount * rate * 100) / 100;

    // Razorpay requires amount in smallest currency unit (e.g. paise for INR, cents for USD)
    // Most currencies use 2 decimal places; JPY uses 0 — handle by rounding.
    const amountInSmallestUnit = Math.round(convertedAmount * 100);

    await connectDB();

    const order = await razorpay.orders.create({
      amount: amountInSmallestUnit,
      currency: targetCurrency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: user.id,
        planId,
        billingPeriod: billingPeriod ?? 'month',
        priceUSD: String(baseAmount),
        userCurrency: targetCurrency,
      },
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planId,
      priceUSD: baseAmount,
      convertedPrice: convertedAmount,
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
