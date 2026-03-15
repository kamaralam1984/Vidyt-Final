import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { sendPaymentReceiptEmail } from '@/services/email';

/**
 * POST: Send payment receipt email to all users who have an active paid plan (Pro or Enterprise).
 * Super-admin only. Used to send receipts to existing subscribers.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await User.find({
      subscription: { $in: ['pro', 'enterprise'] },
      email: { $exists: true, $ne: '' },
      subscriptionPlan: { $exists: true, $ne: null },
    }).select('email name subscription subscriptionPlan');

    let sent = 0;
    const errors: string[] = [];

    for (const user of users) {
      const plan = user.subscriptionPlan;
      if (!plan || !user.email) continue;

      const startDate = plan.startDate || user.subscriptionExpiresAt || new Date();
      const endDate = plan.endDate || user.subscriptionExpiresAt || new Date();

      const ok = await sendPaymentReceiptEmail(
        user.email,
        user.name || undefined,
        {
          planName: plan.planName || plan.planId || user.subscription,
          amount: plan.price ?? (user.subscription === 'pro' ? 5 : 12),
          currency: plan.currency || 'USD',
          billingPeriod: plan.billingPeriod || 'month',
          startDate: startDate instanceof Date ? startDate : new Date(startDate),
          endDate: endDate instanceof Date ? endDate : new Date(endDate),
          paymentId: plan.razorpayPaymentId || plan.paymentId,
        }
      );
      if (ok) sent++;
      else errors.push(user.email);
    }

    return NextResponse.json({
      success: true,
      message: `Receipt emails sent to ${sent} user(s).`,
      sent,
      total: users.length,
      failed: errors.length,
      failedEmails: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Send plan receipts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send receipts' },
      { status: 500 }
    );
  }
}
