export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { requireAdminAccess } from '@/lib/adminAuth';
import { PLAN_PRICES, calculateTotalRevenue } from '@/lib/revenueCalc';
import { paymentKindFromDoc, splitSuccessfulRevenueByKind } from '@/lib/paymentMode';

const PAID_SUBSCRIPTIONS = new Set(['starter', 'pro', 'enterprise', 'custom']);

// Approximate FX rates so multi-currency Payment rows (Razorpay India ships INR,
// PayPal can ship USD, etc.) collapse into one comparable USD figure for KPIs
// and charts. Kept inline so this admin route doesn't add an external rates
// dependency.
const FX_TO_USD: Record<string, number> = {
  USD: 1,
  INR: 1 / 83,
  EUR: 1 / 0.92,
  GBP: 1 / 0.79,
  AED: 1 / 3.67,
  SGD: 1 / 1.34,
  AUD: 1 / 1.52,
  CAD: 1 / 1.36,
  MXN: 1 / 18.0,
  IDR: 1 / 15500,
  PKR: 1 / 278,
};

function toUsd(amount: number, currency: string = 'USD'): number {
  const code = String(currency || 'USD').toUpperCase();
  const rate = FX_TO_USD[code] ?? 1;
  return Number(amount || 0) * rate;
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

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
      currency: (u.subscriptionPlan?.currency || 'USD').toUpperCase(),
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
      { amount: 1, currency: 1, status: 1, createdAt: 1, metadata: 1, gateway: 1, plan: 1, userId: 1 }
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
      // Normalize to USD so KPIs + charts compare apples-to-apples regardless
      // of which gateway / region the payment came from.
      amount: toUsd(Number(row.amount || 0), row.currency),
      status: String(row.status || ''),
      createdAt: new Date(row.createdAt),
      metadata: row.metadata ?? undefined,
      gateway: row.gateway ?? undefined,
      plan: row.plan ?? undefined,
      userId: row.userId ?? undefined,
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

    // ── Aggregations in JS on the USD-normalized list ─────────────────
    // Mongo aggregates summed raw `$amount` which mixes INR + USD on the same
    // axis. Doing it after normalisation keeps every value comparable, and
    // also fixes the broken monthly chart by guaranteeing 12 month buckets.
    const monthWindowStart = new Date(Date.now() - ONE_YEAR_MS);
    const monthlyRevenueCombinedMap = new Map<string, { revenue: number; payments: number }>();
    for (const p of paymentInputsForAnalytics) {
      if (p.status !== 'success' && p.status !== 'captured' && p.status !== 'completed') continue;
      const d = new Date(p.createdAt);
      if (!(d instanceof Date) || isNaN(d.getTime()) || d < monthWindowStart) continue;
      const key = d.toISOString().slice(0, 7);
      const cur = monthlyRevenueCombinedMap.get(key) || { revenue: 0, payments: 0 };
      monthlyRevenueCombinedMap.set(key, { revenue: cur.revenue + Number(p.amount || 0), payments: cur.payments + 1 });
    }
    for (const r of inferredSubscriptionRows) {
      const d = new Date(r.date);
      if (!(d instanceof Date) || isNaN(d.getTime()) || d < monthWindowStart) continue;
      const key = d.toISOString().slice(0, 7);
      const cur = monthlyRevenueCombinedMap.get(key) || { revenue: 0, payments: 0 };
      monthlyRevenueCombinedMap.set(key, { revenue: cur.revenue + r.amount, payments: cur.payments + 1 });
    }
    // Pre-fill the trailing 12 months so the chart never shows a single
    // dominant bar — recharts spaces zero-value buckets too.
    const today = new Date();
    const monthlyRevenueCombined: { month: string; revenue: number; payments: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const v = monthlyRevenueCombinedMap.get(key) || { revenue: 0, payments: 0 };
      monthlyRevenueCombined.push({ month: key, revenue: v.revenue, payments: v.payments });
    }

    // Revenue by plan (USD)
    const revenueByPlanCombinedMap = new Map<string, { revenue: number; payments: number }>();
    for (const p of paymentInputsForAnalytics) {
      if (p.status !== 'success' && p.status !== 'captured' && p.status !== 'completed') continue;
      const planKey = String(p.plan || 'unknown');
      const cur = revenueByPlanCombinedMap.get(planKey) || { revenue: 0, payments: 0 };
      revenueByPlanCombinedMap.set(planKey, { revenue: cur.revenue + Number(p.amount || 0), payments: cur.payments + 1 });
    }
    for (const r of inferredSubscriptionRows) {
      const cur = revenueByPlanCombinedMap.get(r.plan) || { revenue: 0, payments: 0 };
      revenueByPlanCombinedMap.set(r.plan, { revenue: cur.revenue + r.amount, payments: cur.payments + 1 });
    }
    const revenueByPlanCombined = Array.from(revenueByPlanCombinedMap.entries())
      .map(([plan, v]) => ({ plan, revenue: v.revenue, payments: v.payments }))
      .sort((a, b) => b.revenue - a.revenue);

    // Payment status breakdown (USD totals)
    const paymentStatusMap = new Map<string, { count: number; total: number }>();
    for (const p of paymentInputsForAnalytics) {
      const key = String(p.status || '').toLowerCase();
      const cur = paymentStatusMap.get(key) || { count: 0, total: 0 };
      paymentStatusMap.set(key, { count: cur.count + 1, total: cur.total + Number(p.amount || 0) });
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

    // Top earners — aggregate USD-normalized in JS, then resolve user details.
    const earningsByUserMap = new Map<string, { total: number; count: number; plan?: string }>();
    for (const p of paymentInputsForAnalytics) {
      if (p.status !== 'success' && p.status !== 'captured' && p.status !== 'completed') continue;
      if (!p.userId) continue;
      const key = String(p.userId);
      const cur = earningsByUserMap.get(key) || { total: 0, count: 0, plan: p.plan };
      earningsByUserMap.set(key, {
        total: cur.total + Number(p.amount || 0),
        count: cur.count + 1,
        plan: cur.plan || p.plan,
      });
    }
    const topPaymentUserIds = Array.from(earningsByUserMap.keys()).slice(0, 50);
    const topUsersDetails = topPaymentUserIds.length
      ? await User.find({ _id: { $in: topPaymentUserIds } })
          .select('name email subscription')
          .lean()
      : [];
    const userById = new Map(topUsersDetails.map((u: any) => [String(u._id), u]));
    const topEarnersFromPayments = Array.from(earningsByUserMap.entries()).map(([uid, v]) => {
      const u: any = userById.get(uid) || {};
      return {
        _id: uid,
        name: u.name || 'Unknown',
        email: u.email || '',
        plan: u.subscription || v.plan || 'unknown',
        total: v.total,
        count: v.count,
      };
    });

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
        currency: 'USD',
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
