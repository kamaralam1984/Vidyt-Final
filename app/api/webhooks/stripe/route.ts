import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { getApiConfig } from '@/lib/apiConfig';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { PLAN_ROLE_MAP } from '@/utils/currency';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const stripe = await getStripeClient();
  const config = await getApiConfig();
  const webhookSecret = config.stripeWebhookSecret;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  await connectDB();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata.userId;
        const planId = session.metadata.planId;
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        if (userId && planId) {
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          
          await User.findByIdAndUpdate(userId, {
            subscription: planId,
            stripeCustomerId,
            stripeSubscriptionId,
            role: PLAN_ROLE_MAP[planId] || 'user',
            'subscriptionPlan.status': 'active',
            'subscriptionPlan.startDate': new Date(subscription.current_period_start * 1000),
            'subscriptionPlan.endDate': new Date(subscription.current_period_end * 1000),
          });

          await Payment.create({
            userId,
            amount: session.amount_total / 100,
            currency: session.currency.toUpperCase(),
            status: 'success',
            gateway: 'stripe',
            orderId: session.id,
            plan: planId,
            metadata: { stripeSubscriptionId }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await User.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          { 
            subscription: 'free',
            role: 'user',
            'subscriptionPlan.status': 'cancelled'
          }
        );
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            await User.findOneAndUpdate(
                { stripeSubscriptionId: invoice.subscription },
                { 
                  'subscriptionPlan.status': 'active',
                  'subscriptionPlan.endDate': new Date(subscription.current_period_end * 1000)
                }
            );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
            await User.findOneAndUpdate(
                { stripeSubscriptionId: invoice.subscription },
                { 'subscriptionPlan.status': 'past_due' }
            );
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Webhook handler failed: ${error.message}`);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

