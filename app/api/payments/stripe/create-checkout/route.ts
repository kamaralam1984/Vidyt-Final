export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { isValidPlan } from '@/utils/currency';
import { createCheckoutSession, stripeConfigured } from '@/services/payments/stripe';

export async function POST(request: NextRequest) {
  try {
    if (!stripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in the server environment.' },
        { status: 503 }
      );
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const plan = body.plan as string;
    const billingPeriod = body.billingPeriod === 'year' ? 'year' : 'month';

    if (!plan || !isValidPlan(plan) || plan === 'free' || plan === 'owner') {
      return NextResponse.json({ error: 'Invalid plan selected for payment' }, { status: 400 });
    }

    const origin =
      request.headers.get('origin') ||
      (request.headers.get('referer') ? new URL(request.headers.get('referer')!).origin : null) ||
      new URL(request.url).origin;

    const successUrl = `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}&gateway=stripe`;
    const cancelUrl = `${origin}/pricing`;

    const { sessionId, url } = await createCheckoutSession(
      user.id,
      plan,
      successUrl,
      cancelUrl,
      billingPeriod
    );

    return NextResponse.json({ success: true, sessionId, url });
  } catch (error: any) {
    console.error('Stripe create-checkout error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create Stripe checkout session' },
      { status: 500 }
    );
  }
}
