/**
 * Stripe Payment Integration
 * Handles subscriptions, payments, and billing
 */

// Note: Install stripe package: npm install stripe
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
//   apiVersion: '2024-06-20',
// });

import { getPlanRoll, getSubscriptionLimitsForApi } from '@/lib/planLimits';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    videos: number;
    analyses: number;
    competitors: number;
  };
}

/** Subscription plans: prices from pricing page; features and limits from plan roll. */
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: getPlanRoll('free').featureList,
    limits: (() => {
      const L = getSubscriptionLimitsForApi('free');
      return { videos: L.videos, analyses: L.analyses, competitors: L.competitors };
    })(),
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 5,
    currency: 'USD',
    interval: 'month',
    features: getPlanRoll('pro').featureList,
    limits: (() => {
      const L = getSubscriptionLimitsForApi('pro');
      return { videos: L.videos, analyses: L.analyses, competitors: L.competitors };
    })(),
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 12,
    currency: 'USD',
    interval: 'month',
    features: getPlanRoll('enterprise').featureList,
    limits: (() => {
      const L = getSubscriptionLimitsForApi('enterprise');
      return { videos: L.videos, analyses: L.analyses, competitors: L.competitors };
    })(),
  },
};

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  userId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  // TODO: Implement Stripe checkout session creation
  // const session = await stripe.checkout.sessions.create({
  //   customer_email: userEmail,
  //   payment_method_types: ['card'],
  //   line_items: [{
  //     price_data: {
  //       currency: 'usd',
  //       product_data: { name: plan.name },
  //       unit_amount: plan.price * 100,
  //       recurring: { interval: plan.interval },
  //     },
  //     quantity: 1,
  //   }],
  //   mode: 'subscription',
  //   success_url: successUrl,
  //   cancel_url: cancelUrl,
  //   metadata: { userId, planId },
  // });
  
  // For now, return mock data
  return {
    sessionId: 'mock_session_id',
    url: `${successUrl}?session_id=mock_session_id`,
  };
}

/**
 * Handle Stripe webhook
 */
export async function handleStripeWebhook(event: any): Promise<void> {
  // TODO: Implement webhook handling
  // switch (event.type) {
  //   case 'checkout.session.completed':
  //     await handleSubscriptionCreated(event.data.object);
  //     break;
  //   case 'customer.subscription.updated':
  //     await handleSubscriptionUpdated(event.data.object);
  //     break;
  //   case 'customer.subscription.deleted':
  //     await handleSubscriptionCancelled(event.data.object);
  //     break;
  //   case 'invoice.payment_succeeded':
  //     await handlePaymentSucceeded(event.data.object);
  //     break;
  //   case 'invoice.payment_failed':
  //     await handlePaymentFailed(event.data.object);
  //     break;
  // }
}

/**
 * Get subscription limits for user (from plan roll).
 */
export function getSubscriptionLimits(planId: string): SubscriptionPlan['limits'] {
  const api = getSubscriptionLimitsForApi(planId || 'free');
  return {
    videos: api.videos,
    analyses: api.analyses,
    competitors: api.competitors,
  };
}

/**
 * Check if user can perform action based on subscription
 */
export function canPerformAction(
  currentUsage: number,
  limit: number
): boolean {
  if (limit === -1) return true; // Unlimited
  return currentUsage < limit;
}
