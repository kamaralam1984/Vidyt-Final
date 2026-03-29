export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/services/payments/stripe';
import { fulfillStripePlanPurchase } from '@/lib/stripeFulfillment';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    console.error('Stripe webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'payment') {
        return NextResponse.json({ received: true });
      }

      if (session.payment_status !== 'paid') {
        return NextResponse.json({ received: true });
      }

      const userId = session.metadata?.userId;
      const plan = session.metadata?.planId;
      const billingPeriod = session.metadata?.billingPeriod === 'year' ? 'year' : 'month';
      if (!userId || !plan) {
        console.warn('Stripe webhook: missing metadata', session.id);
        return NextResponse.json({ received: true });
      }

      const piRaw = session.payment_intent;
      const paymentIntentId =
        typeof piRaw === 'string' ? piRaw : (piRaw && typeof piRaw === 'object' && 'id' in piRaw ? String((piRaw as { id: string }).id) : '');
      if (!paymentIntentId) {
        console.warn('Stripe webhook: no payment_intent', session.id);
        return NextResponse.json({ received: true });
      }

      const currency = (session.currency || 'usd').toLowerCase();
      const amountMajor = (session.amount_total || 0) / 100;

      const result = await fulfillStripePlanPurchase({
        userId,
        sessionId: session.id,
        paymentIntentId,
        plan,
        billingPeriod,
        amountMajor,
        currency,
      });

      if (!result.ok) {
        console.error('Stripe webhook fulfillment failed:', result.error);
      }
    }
  } catch (e: any) {
    console.error('Stripe webhook handler error:', e);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
