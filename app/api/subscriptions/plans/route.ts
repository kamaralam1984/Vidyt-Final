import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/services/payments/stripe';

export async function GET(request: NextRequest) {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS);
    
    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error: any) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription plans' },
      { status: 500 }
    );
  }
}
