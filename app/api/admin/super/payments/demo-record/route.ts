export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { requireSuperAdminAccess } from '@/lib/adminAuth';
import { isValidPlan } from '@/utils/currency';
import { PLAN_PRICES } from '@/lib/revenueCalc';

/**
 * Record a manual demo payment row (shows in Revenue Analytics as demo/test).
 * Super-admin only. Does not run Razorpay or change subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const access = await requireSuperAdminAccess(request);
    if (access.error) return access.error;

    const body = await request.json().catch(() => ({}));
    const plan = String(body.plan || '').toLowerCase();
    const billingPeriod = body.billingPeriod === 'year' ? 'year' : 'month';
    const targetUserId = body.userId ? String(body.userId) : access.user.id;

    if (!plan || !isValidPlan(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    await connectDB();
    const userDoc = await User.findById(targetUserId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const price = PLAN_PRICES[plan];
    const amount =
      typeof body.amount === 'number' && Number.isFinite(body.amount) && body.amount >= 0
        ? body.amount
        : billingPeriod === 'year'
          ? price?.year ?? 0
          : price?.month ?? 0;

    const orderId = `demo_${crypto.randomUUID().replace(/-/g, '')}`;
    const paymentId = `demo_pay_${crypto.randomUUID().replace(/-/g, '')}`;

    const doc = await Payment.create({
      userId: userDoc._id,
      orderId,
      paymentId,
      plan,
      billingPeriod,
      amount,
      currency: (price?.currency || 'INR').toUpperCase(),
      status: 'success',
      gateway: 'manual',
      metadata: {
        demo: true,
        source: 'admin_demo',
        createdBy: access.user.id,
        note: typeof body.note === 'string' ? body.note.slice(0, 500) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: String(doc._id),
      orderId,
      amount,
      plan,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to record demo payment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
