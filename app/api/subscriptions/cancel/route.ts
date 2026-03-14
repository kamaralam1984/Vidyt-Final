import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const subscription = await Subscription.findOne({
      userId: user.id,
      status: 'active',
    });
    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
