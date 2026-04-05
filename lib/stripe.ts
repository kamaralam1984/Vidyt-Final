import Stripe from 'stripe';
import { getApiConfig } from './apiConfig';

export async function getStripeClient() {
  const config = await getApiConfig();
  if (!config.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-01-27.acacia' as any,
  });
}
