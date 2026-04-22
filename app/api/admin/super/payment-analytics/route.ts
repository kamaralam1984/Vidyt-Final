export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import UserSession from '@/models/UserSession';
import { requireAdminAccess } from '@/lib/adminAuth';

type PaymentDoc = {
  _id: any;
  userId: any;
  orderId: string;
  paymentId?: string;
  plan: string;
  billingPeriod?: 'month' | 'year';
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  gateway: string;
  metadata?: Record<string, any>;
  createdAt: Date;
};

type UserLite = {
  _id: any;
  name?: string;
  email?: string;
  subscription?: string;
};

type SessionLite = {
  userId: any;
  country?: string;
  city?: string;
  updatedAt?: Date;
  createdAt?: Date;
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [payments, users, sessions] = await Promise.all([
      Payment.find({}).sort({ createdAt: -1 }).limit(2000).lean<PaymentDoc[]>(),
      User.find({}, { name: 1, email: 1, subscription: 1 }).lean<UserLite[]>(),
      UserSession.find({}, { userId: 1, country: 1, city: 1, updatedAt: 1, createdAt: 1 })
        .sort({ updatedAt: -1 })
        .lean<SessionLite[]>(),
    ]);

    const userMap = new Map<string, UserLite>();
    users.forEach(u => userMap.set(String(u._id), u));

    // Latest session per user (gives country/city)
    const locMap = new Map<string, { country?: string; city?: string }>();
    for (const s of sessions) {
      const uid = String(s.userId);
      if (!locMap.has(uid)) locMap.set(uid, { country: s.country, city: s.city });
    }

    // ── Status counts ──
    const statusCounts = { success: 0, failed: 0, pending: 0 };
    let totalRevenue = 0;
    let failedAmount = 0;
    let pendingAmount = 0;

    // ── Plan / gateway / country / city aggregates ──
    const planAgg: Record<string, { count: number; revenue: number }> = {};
    const gatewayAgg: Record<string, { count: number; revenue: number }> = {};
    const countryAgg: Record<string, { count: number; revenue: number; success: number; failed: number; pending: number }> = {};
    const cityAgg: Record<string, { country: string; count: number; revenue: number }> = {};

    // ── Time series (30 days) ──
    const series: Record<string, { success: number; failed: number; pending: number; revenue: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const k = dayKey(new Date(now.getTime() - i * 86400000));
      series[k] = { success: 0, failed: 0, pending: 0, revenue: 0 };
    }

    const recent: any[] = [];

    for (const p of payments) {
      const status = (p.status || 'pending') as 'success' | 'failed' | 'pending';
      statusCounts[status]++;

      if (status === 'success') totalRevenue += p.amount || 0;
      if (status === 'failed') failedAmount += p.amount || 0;
      if (status === 'pending') pendingAmount += p.amount || 0;

      // plan
      const plan = p.plan || 'unknown';
      if (!planAgg[plan]) planAgg[plan] = { count: 0, revenue: 0 };
      planAgg[plan].count++;
      if (status === 'success') planAgg[plan].revenue += p.amount || 0;

      // gateway
      const gw = p.gateway || 'unknown';
      if (!gatewayAgg[gw]) gatewayAgg[gw] = { count: 0, revenue: 0 };
      gatewayAgg[gw].count++;
      if (status === 'success') gatewayAgg[gw].revenue += p.amount || 0;

      // location
      const loc = locMap.get(String(p.userId)) || {};
      const country = loc.country || 'Unknown';
      const city = loc.city || 'Unknown';

      if (!countryAgg[country]) countryAgg[country] = { count: 0, revenue: 0, success: 0, failed: 0, pending: 0 };
      countryAgg[country].count++;
      countryAgg[country][status]++;
      if (status === 'success') countryAgg[country].revenue += p.amount || 0;

      const cityKey = `${city}|${country}`;
      if (!cityAgg[cityKey]) cityAgg[cityKey] = { country, count: 0, revenue: 0 };
      cityAgg[cityKey].count++;
      if (status === 'success') cityAgg[cityKey].revenue += p.amount || 0;

      // time series
      if (p.createdAt && new Date(p.createdAt) >= thirtyDaysAgo) {
        const k = dayKey(new Date(p.createdAt));
        if (series[k]) {
          series[k][status]++;
          if (status === 'success') series[k].revenue += p.amount || 0;
        }
      }

      // recent activity (first 60)
      if (recent.length < 60) {
        const u = userMap.get(String(p.userId));
        recent.push({
          id: String(p._id),
          orderId: p.orderId,
          paymentId: p.paymentId || null,
          userName: u?.name || 'Unknown',
          userEmail: u?.email || '—',
          userCurrentPlan: u?.subscription || 'free',
          plan: p.plan,
          billingPeriod: p.billingPeriod || 'month',
          amount: p.amount || 0,
          currency: p.currency || 'INR',
          status,
          gateway: p.gateway,
          country,
          city,
          createdAt: p.createdAt,
        });
      }
    }

    const timeSeries = Object.entries(series).map(([date, v]) => ({ date, ...v }));

    const topCountries = Object.entries(countryAgg)
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const topCities = Object.entries(cityAgg)
      .map(([key, v]) => {
        const [city] = key.split('|');
        return { city, ...v };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const byPlan = Object.entries(planAgg)
      .map(([plan, v]) => ({ plan, ...v }))
      .sort((a, b) => b.count - a.count);

    const byGateway = Object.entries(gatewayAgg)
      .map(([gateway, v]) => ({ gateway, ...v }))
      .sort((a, b) => b.count - a.count);

    const total = payments.length;
    const successRate = total > 0 ? Math.round((statusCounts.success / total) * 100) : 0;
    const failRate = total > 0 ? Math.round((statusCounts.failed / total) * 100) : 0;

    return NextResponse.json({
      generatedAt: now.toISOString(),
      totals: {
        total,
        success: statusCounts.success,
        failed: statusCounts.failed,
        pending: statusCounts.pending,
        successRate,
        failRate,
        totalRevenue,
        failedAmount,
        pendingAmount,
      },
      timeSeries,
      byPlan,
      byGateway,
      topCountries,
      topCities,
      recent,
    });
  } catch (err: any) {
    console.error('[payment-analytics] error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to load analytics' }, { status: 500 });
  }
}
