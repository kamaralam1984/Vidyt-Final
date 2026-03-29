export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getStripe } from '@/services/payments/stripe';
import { fulfillStripePlanPurchase } from '@/lib/stripeFulfillment';

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (session.metadata?.userId !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to this account' }, { status: 403 });
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', status: session.payment_status },
        { status: 400 }
      );
    }

    const plan = session.metadata?.planId;
    const billingPeriod = session.metadata?.billingPeriod === 'year' ? 'year' : 'month';
    if (!plan) {
      return NextResponse.json({ error: 'Missing plan in session' }, { status: 400 });
    }

    const piRaw = session.payment_intent;
    const paymentIntentId =
      typeof piRaw === 'string' ? piRaw : (piRaw && typeof piRaw === 'object' && 'id' in piRaw ? String((piRaw as { id: string }).id) : '');
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing payment intent' }, { status: 400 });
    }

    const currency = (session.currency || 'usd').toLowerCase();
    const amountMajor = (session.amount_total || 0) / 100;

    const result = await fulfillStripePlanPurchase({
      userId: user.id,
      sessionId: session.id,
      paymentIntentId,
      plan,
      billingPeriod,
      amountMajor,
      currency,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Plan upgraded successfully',
      plan: result.plan,
      role: result.role,
    });
  } catch (error: any) {
    console.error('Stripe verify-session error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to verify session' },
      { status: 500 }
    );
  }
}
