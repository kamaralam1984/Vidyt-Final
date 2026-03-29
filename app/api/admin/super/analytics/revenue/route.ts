export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { requireAdminAccess } from '@/lib/adminAuth';
import { PLAN_PRICES, calculateTotalRevenue } from '@/lib/revenueCalc';
import { paymentKindFromDoc, splitSuccessfulRevenueByKind } from '@/lib/paymentMode';

const PAID_SUBSCRIPTIONS = new Set(['starter', 'pro', 'enterprise', 'custom']);

type InferredSubscriptionRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  date: string;
  kind: 'demo_test';
  inferred: true;
  source: string;
};

function inferredRowsFromUsersWithoutPayments(
  users: Array<{
    _id: unknown;
    name?: string;
    email?: string;
    subscription?: string;
    subscriptionPlan?: {
      planId?: string;
      planName?: string;
      billingPeriod?: string;
      price?: number;
      currency?: string;
      startDate?: Date;
      status?: string;
    };
    createdAt?: Date;
  }>
): InferredSubscriptionRow[] {
  return users
    .map((u): InferredSubscriptionRow | null => {
    const planId = String(u.subscriptionPlan?.planId || u.subscription || 'free').toLowerCase();
    if (planId === 'free' || planId === 'owner') return null;
    const billingPeriod = u.subscriptionPlan?.billingPeriod === 'year' ? 'year' : 'month';
    const planMeta = PLAN_PRICES[planId] || PLAN_PRICES.free;
    const amount =
      typeof u.subscriptionPlan?.price === 'number' && u.subscriptionPlan.price > 0
        ? u.subscriptionPlan.price
        : billingPeriod === 'year'
          ? planMeta.year
          : planMeta.month;
    const dateRaw = u.subscriptionPlan?.startDate || u.createdAt || new Date();
    return {
      id: `inferred_${String(u._id)}`,
      userId: String(u._id),
      userName: u.name || 'Unknown',
      userEmail: u.email || '',
      plan: planId,
      amount,
      currency: (u.subscriptionPlan?.currency || planMeta.currency || 'USD').toUpperCase(),
      status: 'on_profile',
      gateway: 'profile',
      date: new Date(dateRaw).toISOString(),
      kind: 'demo_test' as const,
      inferred: true,
      source: 'user_subscription_only',
    };
  })
    .filter((r): r is InferredSubscriptionRow => r !== null);
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const paymentRows = await Payment.find(
      {},
      { amount: 1, status: 1, createdAt: 1, metadata: 1, gateway: 1 }
    ).lean();
    const hasPaymentData = paymentRows.length > 0;

    const userIdsWithPayment = await Payment.distinct('userId');

    const usersWithoutPaymentRow = await User.find({
      _id: { $nin: userIdsWithPayment },
      $or: [
        { subscription: { $in: Array.from(PAID_SUBSCRIPTIONS) } },
        { 'subscriptionPlan.planId': { $in: Array.from(PAID_SUBSCRIPTIONS) } },
      ],
    })
      .select('name email subscription subscriptionPlan createdAt')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const inferredSubscriptionRows = inferredRowsFromUsersWithoutPayments(usersWithoutPaymentRow as any);
    const inferredEstimatedTotal = inferredSubscriptionRows.reduce((sum, r) => sum + r.amount, 0);
    const hasRevenueData = hasPaymentData || inferredSubscriptionRows.length > 0;

    // Treat "paid plan on profile but no Payment document" as successful demo/test for analytics.
    // This makes dashboard KPIs/charts show "real results" instead of only Payment-collection values.
    const inferredPaymentsForAnalytics = inferredSubscriptionRows.map((r) => ({
      amount: r.amount,
      status: 'success',
      createdAt: new Date(r.date),
      metadata: {
        demo: true,
        source: r.source,
      },
      gateway: r.gateway,
    }));

    const paymentInputsForAnalytics = paymentRows.map((row: any) => ({
      amount: Number(row.amount || 0),
      status: String(row.status || ''),
      createdAt: new Date(row.createdAt),
      metadata: row.metadata ?? undefined,
      gateway: row.gateway ?? undefined,
    }));

    const combinedPaymentsForAnalytics = [
      ...paymentInputsForAnalytics,
      ...inferredPaymentsForAnalytics,
    ];

    const revenueSplit = splitSuccessfulRevenueByKind(combinedPaymentsForAnalytics);
    const revenueTotals = calculateTotalRevenue(
      combinedPaymentsForAnalytics.map((p) => ({
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
      }))
    );

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

    const monthWindowStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const monthlyRevenueCombinedMap = new Map<string, { revenue: number; payments: number }>();
    for (const m of monthlyRevenue as any[]) {
      monthlyRevenueCombinedMap.set(String(m._id), { revenue: Number(m.total || 0), payments: Number(m.count || 0) });
    }
    for (const r of inferredSubscriptionRows) {
      const d = new Date(r.date);
      if (!(d instanceof Date) || isNaN(d.getTime()) || d < monthWindowStart) continue;
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      const cur = monthlyRevenueCombinedMap.get(key) || { revenue: 0, payments: 0 };
      monthlyRevenueCombinedMap.set(key, { revenue: cur.revenue + r.amount, payments: cur.payments + 1 });
    }
    const monthlyRevenueCombined = Array.from(monthlyRevenueCombinedMap.entries())
      .map(([month, v]) => ({ month, revenue: v.revenue, payments: v.payments }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Revenue by plan
    const revenueByPlan = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: '$plan', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const revenueByPlanCombinedMap = new Map<string, { revenue: number; payments: number }>();
    for (const p of revenueByPlan as any[]) {
      revenueByPlanCombinedMap.set(String(p._id), { revenue: Number(p.total || 0), payments: Number(p.count || 0) });
    }
    for (const r of inferredSubscriptionRows) {
      const cur = revenueByPlanCombinedMap.get(r.plan) || { revenue: 0, payments: 0 };
      revenueByPlanCombinedMap.set(r.plan, { revenue: cur.revenue + r.amount, payments: cur.payments + 1 });
    }
    const revenueByPlanCombined = Array.from(revenueByPlanCombinedMap.entries())
      .map(([plan, v]) => ({ plan, revenue: v.revenue, payments: v.payments }))
      .sort((a, b) => b.revenue - a.revenue);

    // Payment status breakdown
    const paymentStatus = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);

    const paymentStatusMap = new Map<string, { count: number; total: number }>();
    for (const s of paymentStatus as any[]) {
      paymentStatusMap.set(String(s._id), { count: Number(s.count || 0), total: Number(s.total || 0) });
    }
    // Merge inferred "success" bucket
    const curSuccess = paymentStatusMap.get('success') || { count: 0, total: 0 };
    paymentStatusMap.set('success', {
      count: curSuccess.count + inferredSubscriptionRows.length,
      total: curSuccess.total + inferredEstimatedTotal,
    });

    const paymentStatusCombined = ['success', 'failed', 'pending']
      .map((status) => {
        const v = paymentStatusMap.get(status) || { count: 0, total: 0 };
        return { status, count: v.count, amount: v.total };
      })
      .filter((x) => x.count > 0 || x.status === 'success');

    // Latest 20 payments
    const recentPayments = await Payment.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('userId', 'name email subscription')
      .lean();

    const topEarnersFromPayments = await Payment.aggregate([
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
    ]);

    const inferredEarningsByUser = inferredSubscriptionRows.reduce(
      (acc: Map<string, { _id: string; name: string; email: string; plan: string; total: number; count: number }>, r) => {
        const key = r.userId;
        const cur = acc.get(key);
        if (cur) {
          cur.total += r.amount;
          cur.count += 1;
        } else {
          acc.set(key, {
            _id: key,
            name: r.userName,
            email: r.userEmail,
            plan: r.plan,
            total: r.amount,
            count: 1,
          });
        }
        return acc;
      },
      new Map()
    );

    const topEarnersCombinedMap = new Map<string, any>();
    for (const u of topEarnersFromPayments as any[]) {
      topEarnersCombinedMap.set(String(u._id), u);
    }
    for (const [userId, inferred] of inferredEarningsByUser.entries()) {
      const existing = topEarnersCombinedMap.get(String(userId));
      if (existing) {
        existing.total = Number(existing.total || 0) + inferred.total;
        existing.count = Number(existing.count || 0) + inferred.count;
        existing.plan = existing.plan || inferred.plan;
      } else {
        topEarnersCombinedMap.set(String(userId), inferred);
      }
    }
    const topEarnersCombined = Array.from(topEarnersCombinedMap.values())
      .sort((a: any, b: any) => Number(b.total || 0) - Number(a.total || 0))
      .slice(0, 10);

    return NextResponse.json({
      // Preferred currency for totals
      currency: 'USD',
      // True when MongoDB has at least one Payment row (any status).
      hasPaymentData,
      // True when we have Payment rows OR paid-plan users with no Payment document (legacy/demo).
      hasRevenueData,
      inferredSubscriptionRows,
      inferredCount: inferredSubscriptionRows.length,
      inferredEstimatedTotal,
      // Current calendar month total from successful payments (MTD) — use for dashboard KPIs.
      monthToDateRevenue: revenueTotals.monthly,
      revenueSplit,
      monthlyRevenue: monthlyRevenueCombined,
      revenueByPlan: revenueByPlanCombined,
      paymentStatus: paymentStatusCombined,
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
        kind: paymentKindFromDoc(p),
      })),
      planPrices: Object.entries(PLAN_PRICES).map(([k, v]) => ({
        plan: k,
        monthly: v.month,
        yearly: v.year,
        currency: v.currency,
      })),
      todayRevenue: revenueTotals.daily,
      yesterdayRevenue: revenueTotals.yesterday,
      topEarners: topEarnersCombined
    });
  } catch (error) {
    console.error('[Admin Revenue Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
