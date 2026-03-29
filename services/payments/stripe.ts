/**
 * Stripe Checkout (one-time plan payments), alongside Razorpay.
 * Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in production.
 */

import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getPlanRoll, getSubscriptionLimitsForApi } from '@/lib/planLimits';
import { getActivePlanPricing, usdAmountForBilling } from '@/lib/planPricing';
import { isValidPlan } from '@/utils/currency';

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
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 3,
    currency: 'USD',
    interval: 'month',
    features: getPlanRoll('starter').featureList,
    limits: (() => {
      const L = getSubscriptionLimitsForApi('starter');
      return { videos: L.videos, analyses: L.analyses, competitors: L.competitors };
    })(),
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 15,
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
    price: 25,
    currency: 'USD',
    interval: 'month',
    features: getPlanRoll('enterprise').featureList,
    limits: (() => {
      const L = getSubscriptionLimitsForApi('enterprise');
      return { videos: L.videos, analyses: L.analyses, competitors: L.competitors };
    })(),
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    price: 50,
    currency: 'USD',
    interval: 'month',
    features: getPlanRoll('custom').featureList,
    limits: (() => {
      const L = getSubscriptionLimitsForApi('custom');
      return { videos: L.videos, analyses: L.analyses, competitors: L.competitors };
    })(),
  },
};

let stripeSingleton: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return stripeSingleton;
}

/**
 * Stripe Checkout Session (mode=payment) — same access window as Razorpay (month/year).
 */
export async function createCheckoutSession(
  userId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string,
  billingPeriod: 'month' | 'year' = 'month'
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  if (!isValidPlan(planId) || planId === 'free' || planId === 'owner') {
    throw new Error('Invalid plan for checkout');
  }

  await connectDB();
  const user = await User.findById(userId).select('email name');
  const planPricing = await getActivePlanPricing(planId);
  if (!planPricing) {
    throw new Error('Plan pricing not found');
  }

  const usd = usdAmountForBilling(planPricing, billingPeriod === 'year' ? 'year' : 'month');
  const cents = Math.round(usd * 100);
  if (!Number.isFinite(cents) || cents <= 0) {
    throw new Error('Invalid plan amount');
  }

  const label = planPricing.label || planPricing.name || planId;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user?.email || undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `ViralBoost AI — ${label} (${billingPeriod === 'year' ? 'Annual' : 'Monthly'})`,
          },
          unit_amount: cents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planId,
      billingPeriod: billingPeriod === 'year' ? 'year' : 'month',
    },
    payment_intent_data: {
      metadata: {
        userId,
        planId,
        billingPeriod: billingPeriod === 'year' ? 'year' : 'month',
      },
    },
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return { sessionId: session.id, url: session.url };
}

export function getSubscriptionLimits(planId: string): SubscriptionPlan['limits'] {
  const api = getSubscriptionLimitsForApi(planId || 'free');
  return {
    videos: api.videos,
    analyses: api.analyses,
    competitors: api.competitors,
  };
}

export function canPerformAction(currentUsage: number, limit: number): boolean {
  if (limit === -1) return true;
  return currentUsage < limit;
}
