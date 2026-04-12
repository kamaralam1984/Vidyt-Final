export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createPaypalOrder, SUBSCRIPTION_PLANS, paypalConfigured } from '@/services/payments/paypal';

export async function POST(request: NextRequest) {
  try {
    if (!(await paypalConfigured())) {
      return NextResponse.json(
        { error: 'PayPal is not configured. Set PayPal Auth on the server.' },
        { status: 503 }
      );
    }

    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Check if the plan exists in the database or is 'free'
    let plan = null;
    if (planId === 'free') {
      plan = { id: 'free', name: 'Free', price: 0 };
    } else {
      const PlanModel = (await import('@/models/Plan')).default;
      await (await import('@/lib/mongodb')).default();
      plan = await PlanModel.findOne({ 
        $or: [
          { planId: planId }, 
          { dbId: planId }, 
          { _id: planId.match(/^[0-9a-fA-F]{24}$/) ? planId : null }
        ] 
      });
    }

    if (!plan && !SUBSCRIPTION_PLANS[planId]) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    if (planId === 'free') {
      return NextResponse.json({ error: 'Free plan does not require checkout' }, { status: 400 });
    }

    const billingPeriod = body.billingPeriod === 'year' ? 'year' : 'month';

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/subscription/success?gateway=paypal`;
    const cancelUrl = `${origin}/subscription/cancel`;

    const session = await createPaypalOrder(
      authUser.id,
      planId,
      successUrl,
      cancelUrl,
      billingPeriod
    );

    return NextResponse.json({
      success: true,
      sessionId: session.orderId,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
