export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import connectDB from '@/lib/mongodb';

/**
 * Get user's subscription details
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(authUser.id);
    const subscription = await Subscription.findOne({ 
      userId: authUser.id,
      status: 'active'
    });

    return NextResponse.json({
      success: true,
      subscription: {
        plan: user?.subscription || 'free',
        status: subscription?.status || 'active',
        expiresAt: subscription?.currentPeriodEnd || user?.subscriptionExpiresAt,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
        usage: subscription?.usage || user?.usageStats,
      },
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

/**
 * Cancel subscription
 */
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
    const { action } = body;

    await connectDB();

    if (action === 'cancel') {
      const subscription = await Subscription.findOne({ 
        userId: authUser.id,
        status: 'active'
      });

      if (subscription) {
        subscription.cancelAtPeriodEnd = true;
        await subscription.save();
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription will be cancelled at the end of the billing period',
      });
    } else if (action === 'reactivate') {
      const subscription = await Subscription.findOne({ 
        userId: authUser.id,
      });

      if (subscription) {
        subscription.cancelAtPeriodEnd = false;
        subscription.status = 'active';
        await subscription.save();
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription reactivated',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Subscription management error:', error);
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}
