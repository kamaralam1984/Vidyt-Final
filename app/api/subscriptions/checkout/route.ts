export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createCheckoutSession, SUBSCRIPTION_PLANS } from '@/services/payments/stripe';

export async function POST(request: NextRequest) {
  try {
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

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/subscription/cancel`;

    const session = await createCheckoutSession(
      authUser.id,
      planId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
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
