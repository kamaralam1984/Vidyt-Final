'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, TrendingUp, CheckCircle2, XCircle, Clock, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';
import RevenueMetricCard from '@/components/admin/RevenueMetricCard';

const PLAN_COLORS: Record<string, string> = {
  free: '#ffffff30', starter: '#60a5fa', pro: '#a78bfa',
  enterprise: '#fbbf24', custom: '#34d399', owner: '#f87171',
};

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
  pending: 'bg-amber-500/20 text-amber-400',
  on_profile: 'bg-sky-500/20 text-sky-300',
};

const formatCurrency = (n: number, currency: string = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(n);

export default function RevenuePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/super/analytics/revenue', { headers: getAuthHeaders() });
      setData(res.data);
      setError('');
    } catch (e) {
      console.error(e);
      setError('Failed to load revenue analytics data.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-64 rounded bg-white/10 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Earnings, payments, and plan distribution</p>
      </motion.div>
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!error && data && data.hasRevenueData === false && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          <p className="font-medium text-amber-50">Abhi tak koi paid plan / payment record nahi hai</p>
          <p className="mt-1 text-xs text-amber-100/70">
            <strong className="text-amber-50">Payment</strong> collection se live/demo charges, aur neeche <strong className="text-amber-50">User</strong> par saved paid plan (bina Payment row) dono dikh sakte hain.
          </p>
        </div>
      )}

      {!error && data && data.hasPaymentData === false && data.inferredCount > 0 && (
        <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm text-sky-100/90">
          <p className="font-medium text-sky-50">Payment documents nahi, lekin demo / purane users ke plan User profile par save hain</p>
          <p className="mt-1 text-xs text-sky-100/70">
            Neeche wali table me un users ki entry dikhegi (amount plan price se estimate). Asli Razorpay history ke liye <code className="text-sky-200">Payment</code> row banani hogi.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueMetricCard
          title="Today's Revenue"
          value={formatCurrency(data?.todayRevenue || 0, data?.currency || 'USD')}
          subtitle={`${data?.paymentStatus?.find((s:any)=>s.status==='success')?.count || 0} success`}
          icon={TrendingUp}
          trend={data?.yesterdayRevenue ? Math.round(((data.todayRevenue - data.yesterdayRevenue) / data.yesterdayRevenue) * 100) : 0}
          gradient="from-emerald-600 to-emerald-800"
        />
        <RevenueMetricCard
          title="Month-to-date revenue"
          value={formatCurrency(typeof data?.monthToDateRevenue === 'number' ? data.monthToDateRevenue : 0, data?.currency || 'USD')}
          subtitle="successful payments, this month"
          icon={DollarSign}
          gradient="from-violet-600 to-violet-800"
        />
        <RevenueMetricCard
          title="Successful"
          value={data?.paymentStatus?.find((s:any)=>s.status==='success')?.count || 0}
          subtitle="total payments"
          icon={CheckCircle2}
          gradient="from-blue-600 to-blue-800"
        />
        <RevenueMetricCard
          title="Failed / Pending"
          value={(data?.paymentStatus?.find((s:any)=>s.status==='failed')?.count || 0) + (data?.paymentStatus?.find((s:any)=>s.status==='pending')?.count || 0)}
          subtitle="action required"
          icon={XCircle}
          gradient="from-red-600 to-red-800"
        />
      </div>

      {/* Live vs Demo/Test split (MTD) */}
      {data?.revenueSplit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">Live (production)</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(data.revenueSplit.live?.monthToDate || 0, data?.currency || 'USD')}</p>
            <p className="text-xs text-white/40 mt-1">
              MTD · {data.revenueSplit.live?.count ?? 0} successful payments · Today {formatCurrency(data.revenueSplit.live?.today || 0, data?.currency || 'USD')}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-300/90">Demo / Test</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(data.revenueSplit.demoTest?.monthToDate || 0, data?.currency || 'USD')}</p>
            <p className="text-xs text-white/40 mt-1">
              MTD · {data.revenueSplit.demoTest?.count ?? 0} successful payments · Today {formatCurrency(data.revenueSplit.demoTest?.today || 0, data?.currency || 'USD')}
            </p>
            {typeof data?.inferredCount === 'number' && data.inferredCount > 0 && (
              <p className="text-xs text-amber-200/80 mt-2 pt-2 border-t border-amber-500/15">
                + {data.inferredCount} account{data.inferredCount === 1 ? '' : 's'} on profile (no Payment row) · ~{formatCurrency(data.inferredEstimatedTotal || 0, data?.currency || 'USD')} plan estimate
              </p>
            )}
          </div>
        </div>
      )}

      {/* Paid plan on User only — no Payment row (legacy demo signups) */}
      {Array.isArray(data?.inferredSubscriptionRows) && data.inferredSubscriptionRows.length > 0 && (
        <div className="bg-[#141414] border border-sky-500/15 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Plan on account (no Payment row)</h3>
            <p className="text-xs text-white/35 mt-1">
              Demo / purane users jinke paas paid plan User document par hai par koi <code className="text-white/50">Payment</code> save nahi hua — yahi entries yahan dikhti hain.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['User', 'Plan', 'Amount (estimate)', 'Type', 'Source', 'Since'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-white/40 uppercase font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.inferredSubscriptionRows.map((row: any) => (
                  <tr key={row.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{row.userName}</p>
                      <p className="text-white/40 text-xs">{row.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize text-white/60 px-2 py-1 bg-white/5 rounded-md">{row.plan}</span>
                    </td>
                    <td className="px-4 py-3 text-sky-300 font-mono text-sm">{formatCurrency(row.amount, row.currency || 'USD')}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-500/15 text-amber-300">Demo / Test</span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">User profile</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{new Date(row.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Revenue Chart */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Monthly Revenue</h3>
        <p className="text-xs text-white/30 mb-5">Last 12 months earned</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data?.monthlyRevenue || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
            <XAxis dataKey="month" tick={{ fill: '#ffffff30', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} tickLine={false} axisLine={false}
              tickFormatter={v => `${data?.currency === 'INR' ? '₹' : '$'}${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8 }}
              labelStyle={{ color: '#ffffff80', fontSize: 11 }}
              formatter={(v: any) => [formatCurrency(v, data?.currency || 'USD'), 'Revenue']}
            />
            <Bar dataKey="revenue" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue by Plan</h3>
          <div className="space-y-3">
            {(data?.revenueByPlan || []).map((p: any) => (
              <div key={p.plan} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: PLAN_COLORS[p.plan] || '#555' }} />
                <span className="flex-1 text-sm text-white/70 capitalize">{p.plan}</span>
                <span className="text-sm font-mono text-white">{formatCurrency(p.revenue, data?.currency || 'USD')}</span>
                <span className="text-xs text-white/30">{p.payments} payments</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Plan Share (Revenue)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data?.revenueByPlan || []} dataKey="revenue" nameKey="plan" innerRadius={55} outerRadius={85} strokeWidth={0}>
                {(data?.revenueByPlan || []).map((p: any) => (
                  <Cell key={p.plan} fill={PLAN_COLORS[p.plan] || '#555'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8 }}
                formatter={(v: any) => [formatCurrency(v, data?.currency || 'USD'), 'Revenue']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Earners Row */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Top Earning Users</h3>
          <p className="text-xs text-white/30 mt-1">Highest cumulative revenue</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['User', 'Plan', 'Total Revenue', 'Payments'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-white/40 uppercase font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.topEarners || []).map((u: any, i: number) => (
                <tr key={u._id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{u.name}</p>
                    <p className="text-white/40 text-xs">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize text-white/60 px-2 py-1 bg-white/5 rounded-md">{u.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-mono font-bold">{formatCurrency(u.total, data?.currency || 'USD')}</td>
                  <td className="px-4 py-3 text-white/40 text-xs font-mono">{u.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['User', 'Plan', 'Amount', 'Type', 'Status', 'Gateway', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-white/40 uppercase font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recentPayments || []).map((p: any, i: number) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/3 hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{p.userName}</p>
                    <p className="text-white/40 text-xs">{p.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize text-white/60 px-2 py-1 bg-white/5 rounded-md">{p.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-white font-mono text-sm">{formatCurrency(p.amount, p.currency || 'USD')}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        p.kind === 'demo_test' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {p.kind === 'demo_test' ? 'Demo / Test' : 'Live'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs capitalize">{p.gateway}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{new Date(p.date).toLocaleString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!data?.recentPayments?.length && (
            <p className="text-center py-12 text-white/30 text-sm">
              {data?.inferredCount > 0
                ? 'No rows in Payment collection — see “Plan on account” section above for demo users.'
                : 'No payment data yet'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
