export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import UserSession from '@/models/UserSession';
import { requireAdminAccess } from '@/lib/adminAuth';
import { calculateTotalRevenue } from '@/lib/revenueCalc';

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Parallel queries
    const [
      totalUsers,
      newToday,
      activeSessions,
      allPayments,
      planDistribution,
      subscribedUsers,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      UserSession.countDocuments({ isActive: true, lastSeen: { $gte: fiveMinutesAgo } }),
      Payment.find({}, { amount: 1, status: 1, createdAt: 1 }).lean(),
      User.aggregate([
        { $group: { _id: '$subscription', count: { $sum: 1 } } },
      ]),
      User.find({ subscription: { $ne: 'free' } }, { subscription: 1, subscriptionPlan: 1 }).lean(),
    ]);

    let revenue = calculateTotalRevenue(allPayments as any);

    // If no successful payments, calculate projected revenue from active subscriptions
    if (revenue.total === 0 && subscribedUsers.length > 0) {
      const PLAN_PRICES_INR: Record<string, number> = {
        starter: 249,
        pro: 1299,
        enterprise: 2499,
        custom: 4999,
        owner: 0,
      };

      let projectedMonthly = 0;
      subscribedUsers.forEach(u => {
        const sub = u.subscription as string;
        const price = PLAN_PRICES_INR[sub] || 0;
        projectedMonthly += price;
      });

      revenue.monthly = projectedMonthly;
      revenue.total = projectedMonthly; // Fallback for display
    }


    // Growth data: last 30 days new users per day
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [growthData, activeUsersTrend, weekdayActivity] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      UserSession.aggregate([
        { $match: { loginTime: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$loginTime' } },
            count: { $addToSet: '$userId' },
          },
        },
        { $project: { _id: 1, count: { $size: '$count' } } },
        { $sort: { _id: 1 } },
      ]),
      UserSession.aggregate([
        { $match: { loginTime: { $gte: thirtyDaysAgo } } },
        {
          $project: {
            dayOfWeek: { $dayOfWeek: '$loginTime' }, // 1 (Sun) to 7 (Sat)
          }
        },
        { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);


    return NextResponse.json({
      totalUsers,
      newToday,
      activeNow: activeSessions,
      revenue: {
        daily: revenue.daily,
        yesterday: revenue.yesterday,
        weekly: revenue.weekly,
        monthly: revenue.monthly,
        total: revenue.total,
        successPayments: revenue.success,
        failedPayments: revenue.failed,
        pendingPayments: revenue.pending,
      },
      planDistribution: planDistribution.map((p: any) => ({
        plan: p._id || 'free',
        count: p.count,
      })),
      growthTrend: growthData.map((g: any) => ({
        date: g._id,
        users: g.count,
      })),
      activeUsersTrend: activeUsersTrend.map((a: any) => ({
        date: a._id,
        count: a.count,
      })),
      weekdayActivity: weekdayActivity.map((w: any) => ({
        day: w._id,
        count: w.count,
      })),
    });

  } catch (error) {
    console.error('[Admin Analytics Overview Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
