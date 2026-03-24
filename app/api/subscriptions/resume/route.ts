export const dynamic = "force-dynamic";

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

    const subscription = await Subscription.findOne({ userId: user.id });
    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    subscription.cancelAtPeriodEnd = false;
    subscription.status = 'active';
    await subscription.save();

    return NextResponse.json({
      success: true,
      message: 'Subscription resumed successfully',
    });
  } catch (error: any) {
    console.error('Resume subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}
