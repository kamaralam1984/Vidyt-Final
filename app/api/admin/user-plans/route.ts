export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    let targetUser;
    if (userId) {
      targetUser = await User.findById(userId);
    } else {
      targetUser = await User.findOne({ email });
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = await Subscription.findOne({ userId: targetUser._id });

    return NextResponse.json({
      success: true,
      user: {
        id: String(targetUser._id),
        email: targetUser.email,
        name: targetUser.name,
        subscription: targetUser.subscription,
        subscriptionPlan: targetUser.subscriptionPlan,
      },
      subscription: subscription ? {
        id: String(subscription._id),
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      } : null,
    });
  } catch (e: any) {
    console.error('Get user plan error:', e);
    return NextResponse.json({ error: 'Failed to load user plan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, email, plan, billingPeriod = 'month', duration = 30 } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      );
    }

    if (!plan || !['free', 'pro', 'enterprise', 'owner'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be free, pro, enterprise, or owner' },
        { status: 400 }
      );
    }

    await connectDB();

    let targetUser;
    if (userId) {
      targetUser = await User.findById(userId);
    } else {
      targetUser = await User.findOne({ email });
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user subscription
    const now = new Date();
    const endDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

    targetUser.subscription = plan;
    targetUser.subscriptionExpiresAt = endDate;
    targetUser.subscriptionPlan = {
      planId: plan,
      planName: plan.charAt(0).toUpperCase() + plan.slice(1),
      billingPeriod: billingPeriod as 'month' | 'year',
      price: 0, // Admin assigned, free
      currency: 'USD',
      status: 'active',
      startDate: now,
      endDate: endDate,
    };

    await targetUser.save();

    // Update or create subscription record
    let subscription = await Subscription.findOne({ userId: targetUser._id });
    if (!subscription) {
      subscription = new Subscription({
        userId: targetUser._id,
        plan,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
      });
    } else {
      subscription.plan = plan;
      subscription.status = 'active';
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = endDate;
    }
    await subscription.save();

    return NextResponse.json({
      success: true,
      message: `User plan updated to ${plan}`,
      user: {
        id: String(targetUser._id),
        email: targetUser.email,
        name: targetUser.name,
        subscription: targetUser.subscription,
        subscriptionPlan: targetUser.subscriptionPlan,
      },
    });
  } catch (e: any) {
    console.error('Assign user plan error:', e);
    return NextResponse.json({ error: 'Failed to assign plan' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, email, action, duration } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required: extend, cancel, or upgrade' },
        { status: 400 }
      );
    }

    await connectDB();

    let targetUser;
    if (userId) {
      targetUser = await User.findById(userId);
    } else {
      targetUser = await User.findOne({ email });
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = await Subscription.findOne({ userId: targetUser._id });

    if (action === 'extend' && duration) {
      // Extend subscription expiry
      const newEndDate = new Date(
        (targetUser.subscriptionExpiresAt || new Date()).getTime() + duration * 24 * 60 * 60 * 1000
      );

      targetUser.subscriptionExpiresAt = newEndDate;
      if (targetUser.subscriptionPlan) {
        targetUser.subscriptionPlan.endDate = newEndDate;
      }

      if (subscription) {
        subscription.currentPeriodEnd = newEndDate;
        await subscription.save();
      }

      await targetUser.save();

      return NextResponse.json({
        success: true,
        message: `Subscription extended by ${duration} days`,
        newEndDate,
      });
    }

    if (action === 'cancel') {
      // Cancel subscription
      targetUser.subscription = 'free';
      targetUser.subscriptionExpiresAt = new Date();

      if (subscription) {
        subscription.status = 'cancelled';
        subscription.cancelAtPeriodEnd = true;
        await subscription.save();
      }

      await targetUser.save();

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('Update user plan error:', e);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    let targetUser;
    if (userId) {
      targetUser = await User.findById(userId);
    } else {
      targetUser = await User.findOne({ email });
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reset to free plan
    targetUser.subscription = 'free';
    targetUser.subscriptionExpiresAt = undefined;
    targetUser.subscriptionPlan = undefined;

    await targetUser.save();

    // Delete subscription record
    await Subscription.deleteOne({ userId: targetUser._id });

    return NextResponse.json({
      success: true,
      message: 'User plan reset to free',
    });
  } catch (e: any) {
    console.error('Delete user plan error:', e);
    return NextResponse.json({ error: 'Failed to reset plan' }, { status: 500 });
  }
}
