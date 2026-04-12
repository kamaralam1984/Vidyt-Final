/**
 * PayPal Checkout (one-time plan payments for given subscription duration).
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getPlanRoll, getSubscriptionLimitsForApi } from '@/lib/planLimits';
import { getActivePlanPricing, usdAmountForBilling } from '@/lib/planPricing';
import { isValidPlan } from '@/utils/currency';
import { getApiConfig } from '@/lib/apiConfig';

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

export async function paypalConfigured(): Promise<boolean> {
  const config = await getApiConfig();
  return Boolean(config.paypalClientId?.trim() && config.paypalClientSecret?.trim());
}

async function getPaypalAccessToken(): Promise<string> {
  const config = await getApiConfig();
  const clientId = config.paypalClientId || process.env.PAYPAL_CLIENT_ID;
  const clientSecret = config.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const PAYPAL_API = 'https://api-m.paypal.com';

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) {
    throw new Error('Failed to obtain PayPal access token');
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Creates a PayPal Order for the given plan.
 */
export async function createPaypalOrder(
  userId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string,
  billingPeriod: 'month' | 'year' = 'month'
): Promise<{ orderId: string; url: string }> {
  if (!isValidPlan(planId) || planId === 'free' || planId === 'owner') {
    throw new Error('Invalid plan for checkout');
  }

  await connectDB();
  const planPricing = await getActivePlanPricing(planId);
  if (!planPricing) {
    throw new Error('Plan pricing not found');
  }

  const usd = usdAmountForBilling(planPricing, billingPeriod === 'year' ? 'year' : 'month');
  const amountStr = usd.toFixed(2);
  const label = planPricing.label || planPricing.name || planId;
  const dsc = `ViralBoost AI — ${label} (${billingPeriod === 'year' ? 'Annual' : 'Monthly'})`;

  const accessToken = await getPaypalAccessToken();

  const PAYPAL_API = 'https://api-m.paypal.com';

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `user_${userId}_plan_${planId}`,
          description: dsc,
          custom_id: JSON.stringify({ userId, planId, billingPeriod }),
          amount: {
            currency_code: 'USD',
            value: amountStr
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: successUrl,
            cancel_url: cancelUrl,
            brand_name: "ViralBoost AI"
          }
        }
      }
    })
  });

  if (!res.ok) {
    const errData = await res.text();
    console.error('PayPal Order Error', errData);
    throw new Error('Failed to create PayPal Order');
  }

  const data = await res.json();
  const approveLink = data.links?.find((link: any) => link.rel === 'payer-action' || link.rel === 'approve');
  
  if (!approveLink) {
      throw new Error('No approve link from PayPal');
  }

  return { orderId: data.id, url: approveLink.href };
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
