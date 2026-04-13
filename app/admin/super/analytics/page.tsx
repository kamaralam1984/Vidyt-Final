'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ComposedChart, Line, Area, AreaChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, BarChart, PieChart, Pie
} from 'recharts';
import {
  BarChart2, TrendingUp, Users, Activity, Calendar, RefreshCw, Loader2,
  DollarSign, Zap, Eye, CreditCard, ArrowUpRight, ArrowDownRight, Crown,
} from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';
import PaymentFunnel from '@/components/admin/PaymentFunnel';

function formatCurrency(n: number): string {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + n.toLocaleString();
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<'7d' | '30d' | '90d' | '365d' | 'all'>('30d');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [overviewRes, revenueRes] = await Promise.all([
        axios.get(`/api/admin/super/analytics/overview?range=${range}`, { headers }),
        axios.get('/api/admin/super/analytics/revenue', { headers }).catch(() => ({ data: null })),
      ]);
      setData(overviewRes.data);
      setRevenueData(revenueRes.data);
      setError('');
    } catch (e) {
      console.error(e);
      setError('Failed to load analytics data.');
    }
    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // Derived data
  const totalUsers = data?.totalUsers || 0;
  const newToday = data?.newToday || 0;
  const activeNow = data?.activeNow || 0;
  const totalRevenue = data?.revenue?.total || 0;
  const monthlyRevenue = data?.revenue?.monthly || 0;
  const dailyRevenue = data?.revenue?.daily || 0;
  const yesterdayRevenue = data?.revenue?.yesterday || 0;
  const paidUsers = data?.planDistribution?.filter((p: any) => p.plan && p.plan !== 'free').reduce((s: number, p: any) => s + p.count, 0) || 0;
  const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers * 100).toFixed(1) : '0';
  const successPayments = data?.revenue?.successPayments || 0;
  const failedPayments = data?.revenue?.failedPayments || 0;
  const pendingPayments = data?.revenue?.pendingPayments || 0;

  // Revenue trend from real API data
  const revenueTrend = useMemo(() => {
    const apiData = revenueData?.monthlyRevenue;
    if (apiData && apiData.length > 0) {
      return apiData.map((m: any) => ({
        month: new Date(m.month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        revenue: Math.round(m.revenue),
        payments: m.payments || 0,
      }));
    }
    return [];
  }, [revenueData]);

  // Revenue by plan
  const revenueByPlan = useMemo(() => {
    return (revenueData?.revenueByPlan || []).map((p: any) => ({
      plan: (p.plan || 'free').charAt(0).toUpperCase() + (p.plan || 'free').slice(1),
      revenue: Math.round(p.revenue || 0),
      payments: p.payments || 0,
    }));
  }, [revenueData]);

  // Recent payments
  const recentPayments = revenueData?.recentPayments || [];

  // Top earners
  const topEarners = revenueData?.topEarners || [];

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
      <p className="text-[#888] text-sm">Loading analytics...</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#FF0000]" /> Advanced Analytics
          </h1>
          <p className="text-xs text-[#555] mt-1">Deep dive into growth, revenue, and engagement</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex gap-0.5 p-1 bg-[#111] border border-[#1f1f1f] rounded-lg flex-1 sm:flex-none">
            {(['7d', '30d', '90d', '365d', 'all'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition ${
                  range === r ? 'bg-[#FF0000] text-white' : 'text-[#666] hover:text-white'
                }`}>
                {r === '7d' ? '7D' : r === '30d' ? '30D' : r === '90d' ? '90D' : r === '365d' ? '1Y' : 'All'}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 bg-[#111] border border-[#1f1f1f] rounded-lg text-[#666] hover:text-white transition shrink-0">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <StatCard label="Total Users" value={totalUsers.toLocaleString()} icon={Users} color="#3EA6FF" sub={`+${newToday} today`} />
        <StatCard label="Active Now" value={activeNow.toLocaleString()} icon={Activity} color="#2BA640" sub="Live sessions" />
        <StatCard label="Paid Users" value={paidUsers.toLocaleString()} icon={Zap} color="#A855F7" sub={`${conversionRate}% conversion`} />
        <StatCard label="Monthly Revenue" value={formatCurrency(monthlyRevenue)} icon={DollarSign} color="#FFD700"
          sub={dailyRevenue > 0 ? `Today: ${formatCurrency(dailyRevenue)}` : `Total: ${formatCurrency(totalRevenue)}`} />
        <StatCard label="Payments" value={successPayments.toLocaleString()} icon={CreditCard} color="#2BA640"
          sub={failedPayments > 0 ? `${failedPayments} failed` : 'All successful'} />
        <StatCard label="New Today" value={newToday.toLocaleString()} icon={Eye} color="#FF0000" sub="Registered today" />
      </div>

      {/* Growth & Engagement Chart */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">Growth & Engagement Trend</h3>
            <p className="text-[10px] text-[#555]">New users and session activity over time</p>
          </div>
          <div className="flex gap-3 text-[10px] text-[#888]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF0000]" /> New Users</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3EA6FF]" /> Active Users</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data?.growthTrend || []}>
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF0000" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f1f1f" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false}
              tickFormatter={v => { try { return new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' }); } catch { return v; } }} />
            <YAxis yAxisId="left" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #252525', borderRadius: '8px' }}
              labelStyle={{ color: '#888', fontSize: 11 }} itemStyle={{ color: '#FFF', fontSize: 12 }} />
            <Area yAxisId="left" type="monotone" dataKey="users" fill="url(#growthGrad)" stroke="#FF0000" strokeWidth={2} name="New Users" />
            <Line yAxisId="right" type="monotone" data={data?.activeUsersTrend} dataKey="count" stroke="#3EA6FF" strokeWidth={2} dot={false} name="Active Users" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* DAU + Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* DAU */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Active Users</h3>
              <p className="text-[10px] text-[#555]">Unique active users per day</p>
            </div>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            {data?.activeUsersTrend?.length ? (
              <AreaChart data={data.activeUsersTrend}>
                <defs>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => { try { return new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' }); } catch { return v; } }} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #252525', borderRadius: '8px' }}
                  itemStyle={{ color: '#FFF' }} labelStyle={{ color: '#888' }} />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#activeGrad)" strokeWidth={2} name="Active Users" />
              </AreaChart>
            ) : (
              <div className="h-full flex items-center justify-center text-[#444] text-xs">No activity data available</div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Plan Distribution</h3>
              <p className="text-[10px] text-[#555]">Users per subscription plan</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="space-y-2.5">
            {(data?.planDistribution || []).map((plan: any, i: number) => {
              const total = data?.totalUsers || 1;
              const pct = Math.round((plan.count / total) * 100);
              const colors = ['#3EA6FF', '#A855F7', '#FFD700', '#2BA640', '#FF0000', '#f59e0b'];
              const color = colors[i % colors.length];
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs text-[#ccc] capitalize">{plan.plan || 'free'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{plan.count}</span>
                      <span className="text-[10px] text-[#555]">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Funnel */}
      <PaymentFunnel />

      {/* Revenue Trend + Payment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Revenue Trend — Real Data */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Revenue Trend</h3>
              <p className="text-[10px] text-[#555]">Monthly revenue from payments</p>
            </div>
            <DollarSign className="w-4 h-4 text-[#FFD700]" />
          </div>
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => formatCurrency(v)} />
                <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #252525', borderRadius: '8px' }}
                  itemStyle={{ color: '#FFF' }} formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#FFD700" fill="url(#revGrad)" strokeWidth={2.5} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[#444] text-xs">
              No payment data yet. Revenue will appear after first payment.
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Payment Status</h3>
              <p className="text-[10px] text-[#555]">Success vs Failed vs Pending</p>
            </div>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center justify-center mb-4">
            <div className="w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Success', value: successPayments || 1, fill: '#2BA640' },
                      { name: 'Failed', value: failedPayments || 0, fill: '#FF0000' },
                      { name: 'Pending', value: pendingPayments || 0, fill: '#FFD700' },
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value"
                  >
                    <Cell fill="#2BA640" />
                    <Cell fill="#FF0000" />
                    <Cell fill="#FFD700" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #252525', borderRadius: '8px' }}
                    itemStyle={{ color: '#FFF' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { label: 'Successful', value: successPayments, color: '#2BA640', amount: formatCurrency(totalRevenue) },
              { label: 'Failed', value: failedPayments, color: '#FF0000', amount: '—' },
              { label: 'Pending', value: pendingPayments, color: '#FFD700', amount: '—' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-[#0a0a0a] rounded-lg border border-[#181818]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-[#888]">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white">{item.value}</span>
                  <span className="text-[10px] text-[#555]">{item.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by Plan + Top Earners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Revenue by Plan */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Revenue by Plan</h3>
              <p className="text-[10px] text-[#555]">Which plans generate the most revenue</p>
            </div>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          {revenueByPlan.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByPlan} barGap={4}>
                <CartesianGrid stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="plan" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => formatCurrency(v)} />
                <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #252525', borderRadius: '8px' }}
                  itemStyle={{ color: '#FFF' }} formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']} />
                <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {revenueByPlan.map((_: any, i: number) => (
                    <Cell key={i} fill={['#A855F7', '#FFD700', '#3EA6FF', '#2BA640', '#FF0000'][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[#444] text-xs">No revenue data yet</div>
          )}
        </div>

        {/* Top Earners */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Top Paying Users</h3>
              <p className="text-[10px] text-[#555]">Highest revenue contributors</p>
            </div>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          {topEarners.length > 0 ? (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              {topEarners.slice(0, 8).map((user: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-[#0a0a0a] rounded-lg border border-[#181818] hover:border-[#252525] transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-[10px] font-bold w-5 text-center shrink-0 ${
                      i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-[#555]'
                    }`}>#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-white font-medium truncate">{user.name || 'Unknown'}</p>
                      <p className="text-[10px] text-[#555] truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-bold text-green-400">{formatCurrency(user.total || 0)}</p>
                    <p className="text-[9px] text-[#555] capitalize">{user.plan || 'free'} • {user.count || 0} payments</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[#444] text-xs">No payment data yet</div>
          )}
        </div>
      </div>

      {/* User Growth + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* User Growth */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">User Growth</h3>
              <p className="text-[10px] text-[#555]">New registrations per day</p>
            </div>
            <Users className="w-4 h-4 text-[#3EA6FF]" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data?.growthTrend || []}>
              <defs>
                <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3EA6FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3EA6FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => { try { return new Date(v).toLocaleDateString('en', { day: 'numeric', month: 'short' }); } catch { return v; } }} />
              <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #252525', borderRadius: '8px' }}
                itemStyle={{ color: '#FFF' }} labelStyle={{ color: '#888' }}
                formatter={(v: any) => [`${v} users`, 'New Signups']} />
              <Area type="monotone" dataKey="users" fill="url(#userGrowthGrad)" stroke="#3EA6FF" strokeWidth={2.5} name="New Users" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Payments */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Payments</h3>
              <p className="text-[10px] text-[#555]">Latest transactions</p>
            </div>
            <CreditCard className="w-4 h-4 text-green-400" />
          </div>
          {recentPayments.length > 0 ? (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              {recentPayments.slice(0, 8).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-[#0a0a0a] rounded-lg border border-[#181818]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      p.status === 'success' ? 'bg-green-400' : p.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate">{p.userName || 'Unknown'}</p>
                      <p className="text-[10px] text-[#555]">
                        {p.date ? new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
                        {p.gateway ? ` • ${p.gateway}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-xs font-bold ${p.status === 'success' ? 'text-green-400' : p.status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>
                      {formatCurrency(p.amount || 0)}
                    </p>
                    <p className="text-[9px] text-[#555] capitalize">{p.plan || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[#444] text-xs">No payments recorded yet</div>
          )}
        </div>
      </div>

      {/* Weekly Heatmap */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Weekly Activity Heatmap</h3>
            <p className="text-[10px] text-[#555]">Session activity by day of week</p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
            const dayNum = i + 1;
            const activity = data?.weekdayActivity?.find((w: any) => w.day === dayNum)?.count || 0;
            const maxActivity = Math.max(...(data?.weekdayActivity?.map((w: any) => w.count) || [1]));
            const intensity = activity > 0 ? Math.max(0.2, activity / maxActivity) : 0.05;
            return (
              <div key={day} className="text-center group cursor-pointer">
                <p className="text-[10px] text-[#555] uppercase mb-1.5 group-hover:text-white transition">{day}</p>
                <div className="aspect-square rounded-xl flex items-center justify-center transition-all relative overflow-hidden"
                  style={{ backgroundColor: `rgba(239, 68, 68, ${intensity * 0.3})`, border: `1px solid rgba(239, 68, 68, ${intensity * 0.5})` }}>
                  <span className="text-sm font-bold text-white" style={{ opacity: activity > 0 ? 0.8 : 0.2 }}>{activity}</span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#111]/90 transition-opacity rounded-xl">
                    <span className="text-[10px] font-bold text-white">{activity} sessions</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: any; color: string; sub: string;
}) {
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3 sm:p-4 hover:border-[#292929] transition">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] font-bold text-[#555] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg sm:text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-[#444] mt-0.5">{sub}</p>
    </div>
  );
}
