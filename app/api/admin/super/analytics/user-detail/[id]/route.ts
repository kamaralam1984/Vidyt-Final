export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import UserSession from '@/models/UserSession';
import TrackingLog from '@/models/TrackingLog';
import { requireAdminAccess } from '@/lib/adminAuth';
import { estimateUserRevenue } from '@/lib/revenueCalc';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const userId = params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    const [user, payments, sessions, tracking] = await Promise.all([
      User.findById(userId, { password: 0 }).lean(),
      Payment.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
      UserSession.find({ userId }).sort({ loginTime: -1 }).limit(10).lean(),
      TrackingLog.find({ userId }).sort({ timestamp: -1 }).limit(20).lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const revenueEstimate = estimateUserRevenue(
      user.subscription,
      (user as any).subscriptionPlan?.billingPeriod || 'month',
      (user as any).subscriptionPlan?.status
    );

    return NextResponse.json({
      user: {
        id: user._id,
        name: (user as any).name,
        email: (user as any).email,
        uniqueId: (user as any).uniqueId,
        plan: (user as any).subscription,
        status: (user as any).subscriptionPlan?.status || 'active',
        expiresAt: (user as any).subscriptionPlan?.endDate || (user as any).subscriptionExpiresAt,
        createdAt: (user as any).createdAt,
        lastLogin: (user as any).lastLogin,
        revenue: revenueEstimate,
      },
      payments: payments.map((p: any) => ({
        id: p._id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        plan: p.plan,
        date: p.createdAt,
        gateway: p.gateway,
      })),
      sessions: sessions.map((s: any) => ({
        id: s._id,
        loginTime: s.loginTime,
        logoutTime: s.logoutTime,
        duration: s.durationSeconds,
        city: s.city,
        country: s.country,
        distance: s.distanceFromAdmin,
        ip: s.ipAddress,
      })),
      tracking: tracking.map((t: any) => ({
        id: t._id,
        page: t.page,
        timestamp: t.timestamp,
        timeSpent: t.timeSpentSeconds,
      })),
    });
  } catch (error) {
    console.error('[Admin User Detail Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
