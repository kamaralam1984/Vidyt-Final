import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { getApiConfig } from '@/lib/apiConfig';
import connectDB from '@/lib/mongodb';
import { getActivePlanPricing } from '@/lib/planPricing';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, billingPeriod } = await req.json();
    const plan = await getActivePlanPricing(planId);

    if (!plan || planId === 'free') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const stripe = await getStripeClient();
    const config = await getApiConfig();
    const unitAmount = billingPeriod === 'year' ? plan.priceYearly : plan.priceMonthly;

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email as string,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.label || plan.name,
              description: `VidYT ${plan.name} Plan (${billingPeriod})`,
            },
            unit_amount: Math.round(unitAmount * 100),
            recurring: {
              interval: billingPeriod === 'year' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user.id || (user as any)._id,
        planId: planId,
        billingPeriod: billingPeriod,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
