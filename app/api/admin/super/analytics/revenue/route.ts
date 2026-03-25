export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { requireAdminAccess } from '@/lib/adminAuth';
import { PLAN_PRICES, calculateTotalRevenue } from '@/lib/revenueCalc';

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const paymentRows = await Payment.find({}, { amount: 1, status: 1, createdAt: 1 })
      .lean();
    const hasPaymentData = paymentRows.length > 0;
    const revenueInputs = paymentRows.map((row: any) => ({
      amount: Number(row.amount || 0),
      status: String(row.status || ''),
      createdAt: new Date(row.createdAt),
    }));
    const revenueTotals = calculateTotalRevenue(revenueInputs);

    // Last 12 months revenue breakdown
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Revenue by plan
    const revenueByPlan = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: '$plan', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Payment status breakdown
    const paymentStatus = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);

    // Latest 20 payments
    const recentPayments = await Payment.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('userId', 'name email subscription')
      .lean();

    return NextResponse.json({
      // True when MongoDB has at least one Payment row (any status).
      hasPaymentData,
      // Current calendar month total from successful payments (MTD) — use for dashboard KPIs.
      monthToDateRevenue: revenueTotals.monthly,
      monthlyRevenue: monthlyRevenue.map((m: any) => ({
        month: m._id,
        revenue: m.total,
        payments: m.count,
      })),
      revenueByPlan: revenueByPlan.map((p: any) => ({
        plan: p._id,
        revenue: p.total,
        payments: p.count,
      })),
      paymentStatus: paymentStatus.map((s: any) => ({
        status: s._id,
        count: s.count,
        amount: s.total,
      })),
      recentPayments: recentPayments.map((p: any) => ({
        id: p._id,
        userName: (p.userId as any)?.name || 'Unknown',
        userEmail: (p.userId as any)?.email || '',
        plan: p.plan,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        gateway: p.gateway,
        date: p.createdAt,
      })),
      planPrices: Object.entries(PLAN_PRICES).map(([k, v]) => ({
        plan: k,
        monthly: v.month,
        yearly: v.year,
        currency: v.currency,
      })),
      todayRevenue: revenueTotals.daily,
      yesterdayRevenue: revenueTotals.yesterday,
      topEarners: await Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: '$userId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            email: '$user.email',
            plan: '$user.subscription',
            total: 1,
            count: 1
          }
        }
      ])
    });
  } catch (error) {
    console.error('[Admin Revenue Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
