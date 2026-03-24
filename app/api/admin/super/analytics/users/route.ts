export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdminAccess } from '@/lib/adminAuth';
import { estimateUserRevenue } from '@/lib/revenueCalc';

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { uniqueId: { $regex: search, $options: 'i' } },
      ];
    }
    if (plan) query.subscription = plan;

    const [users, total] = await Promise.all([
      User.find(query, {
        password: 0,
        emailVerificationToken: 0,
        passwordResetToken: 0,
        emailOtp: 0,
        twoFactorSecret: 0,
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const usersWithRevenue = users.map((u: any) => {
      const revenue = estimateUserRevenue(
        u.subscription,
        u.subscriptionPlan?.billingPeriod || 'month',
        u.subscriptionPlan?.status
      );
      return {
        id: u._id,
        uniqueId: u.uniqueId,
        name: u.name || 'No Name',
        email: u.email,
        role: u.role,
        plan: u.subscription,
        planName: u.subscriptionPlan?.planName || u.subscription,
        status: u.subscriptionPlan?.status || 'trial',
        expiresAt: u.subscriptionPlan?.endDate || u.subscriptionExpiresAt,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        revenue,
      };
    });

    return NextResponse.json({
      users: usersWithRevenue,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Admin Users Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
