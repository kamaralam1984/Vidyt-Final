'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, DollarSign, TrendingUp, Activity,
  CheckCircle2, XCircle, Clock, BarChart2, RefreshCw, Loader2,
  Globe, FileText, Search, Wrench
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line
} from 'recharts';
import RevenueMetricCard from '@/components/admin/RevenueMetricCard';
import LiveTracker from '@/components/admin/LiveTracker';
import { getAuthHeaders } from '@/utils/auth';
import { getSocket } from '@/hooks/useSocket';
import axios from 'axios';

const PLAN_COLORS_MAP: Record<string, string> = {
  free: '#ffffff30',
  starter: '#60a5fa',
  pro: '#a78bfa',
  enterprise: '#fbbf24',
  custom: '#34d399',
  owner: '#f87171',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [pageStats, setPageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchOverview = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/super/analytics/overview', { headers: getAuthHeaders() });
      setOverview(res.data);
      setError('');
    } catch (e) {
      console.error(e);
      setError('Failed to load dashboard overview data.');
    }
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/super/analytics/live', { headers: getAuthHeaders() });
      setLiveData(res.data);
      setError('');
    } catch (e) {
      console.error(e);
      setError('Failed to load live tracking data.');
    }
  }, []);

  const fetchPageStats = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/super/page-stats', { headers: getAuthHeaders() });
      setPageStats(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchLive(), fetchPageStats()]);
      setLoading(false);
    };
    init();

    const interval = setInterval(() => {
      fetchLive();
      fetchOverview();
    }, 5000);

    const sock = getSocket();
    if (sock) {
      setIsSocketLive(sock.connected);
      const onUpdate = () => {
        fetchLive();
        fetchOverview();
      };
      const onConnect = () => setIsSocketLive(true);
      const onDisconnect = () => setIsSocketLive(false);
      sock.on('connect', onConnect);
      sock.on('disconnect', onDisconnect);
      sock.on('live_users_update', onUpdate);
      sock.on('activity_update', onUpdate);
      return () => {
        clearInterval(interval);
        sock.off('connect', onConnect);
        sock.off('disconnect', onDisconnect);
        sock.off('live_users_update', onUpdate);
        sock.off('activity_update', onUpdate);
      };
    }
    return () => clearInterval(interval);
  }, [fetchOverview, fetchLive, fetchPageStats]);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-[#FF0000]" /> Dashboard Overview
          </h1>
          <p className="text-[#999] text-sm mt-1">Real-time stats and insights · Auto-refreshes every 5s</p>
        </motion.div>
        <button onClick={() => { fetchOverview(); fetchLive(); }}
          className="p-2.5 bg-[#1a1a1a] border border-[#333] rounded-xl text-[#888] hover:text-white transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueMetricCard
          title="Total Users"
          value={overview?.totalUsers?.toLocaleString() || '—'}
          subtitle={`+${overview?.newToday || 0} today`}
          icon={Users}
          gradient="from-blue-600 to-blue-800"
          index={0}
        />
        <RevenueMetricCard
          title="Active Now"
          value={liveData?.count ?? overview?.activeNow ?? '—'}
          subtitle="online users"
          icon={Activity}
          gradient="from-emerald-600 to-emerald-800"
          trend={Math.round((liveData?.count / (overview?.totalUsers || 1)) * 100)}
          index={1}
        />
        <RevenueMetricCard
          title="Monthly Revenue"
          value={overview ? fmt(overview.revenue.monthly) : '—'}
          subtitle={`${overview?.revenue?.successPayments || 0} payments`}
          icon={DollarSign}
          gradient="from-violet-600 to-violet-800"
          index={2}
        />
        <RevenueMetricCard
          title="Daily Revenue"
          value={overview ? fmt(overview.revenue.daily) : '—'}
          subtitle="today's earnings"
          icon={TrendingUp}
          trend={overview?.revenue?.yesterday ? Math.round(((overview.revenue.daily - overview.revenue.yesterday) / overview.revenue.yesterday) * 100) : 0}
          gradient="from-amber-600 to-amber-800"
          index={3}
        />
      </div>

      {/* Payment Status Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Successful', value: overview?.revenue?.successPayments || 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Failed', value: overview?.revenue?.failedPayments || 0, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Pending', value: overview?.revenue?.pendingPayments || 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          {
            label: 'Avg Page Time',
            value: liveData?.liveUsers?.length
              ? `${Math.floor(
                  liveData.liveUsers.reduce((s: number, u: any) => s + (u.pageTimeSpentSeconds || 0), 0) /
                  liveData.liveUsers.length /
                  60
                )}m`
              : '—',
            icon: BarChart2,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10'
          },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 + 0.3 }}
            className="bg-[#141414] border border-[#272727] rounded-2xl p-5 flex items-center gap-4"
          >
            <div className={`${bg} w-12 h-12 rounded-xl flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-[#999]">{label} Payments</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#272727] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-1">User Growth (30 days)</h3>
          <p className="text-xs text-[#888] mb-5">New registrations per day</p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={overview?.growthTrend || []}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#272727" />
              <XAxis dataKey="date" tick={{ fill: '#999999', fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fill: '#999999', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333333', borderRadius: 8 }}
                labelStyle={{ color: '#CCCCCC', fontSize: 11 }}
                itemStyle={{ fontSize: 12 }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="users" name="New Users" stroke="#ef4444" strokeWidth={2} fill="url(#userGradient)" />
              <Line type="monotone" data={overview?.activeUsersTrend} dataKey="count" name="Active Users" stroke="#60a5fa" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-1">Plan Distribution</h3>
          <p className="text-xs text-[#888] mb-4">Users per plan</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={overview?.planDistribution || []}
                dataKey="count"
                nameKey="plan"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                strokeWidth={0}
              >
                {(overview?.planDistribution || []).map((entry: any) => (
                  <Cell key={entry.plan} fill={PLAN_COLORS_MAP[entry.plan] || '#555'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333333', borderRadius: 8 }}
                itemStyle={{ fontSize: 12, color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {(overview?.planDistribution || []).map((p: any) => (
              <div key={p.plan} className="flex items-center gap-1.5 text-xs text-[#CCC]">
                <span className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS_MAP[p.plan] || '#555' }} />
                {p.plan} ({p.count})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page Stats */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-[#FF0000]" />
          <h2 className="text-sm font-semibold text-white">Website Pages Overview</h2>
          {pageStats?.lastChecked && (
            <span className="text-xs text-[#666] ml-auto">
              Last checked: {new Date(pageStats.lastChecked).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Pages',
              value: pageStats?.totalPages ?? '—',
              sub: 'in sitemap.xml',
              icon: FileText,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
            },
            {
              label: 'Public Pages',
              value: pageStats?.publicPages ?? '—',
              sub: 'no login required',
              icon: Globe,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
            },
            {
              label: 'Google Indexed',
              value: pageStats?.googleIndexedEstimate ?? '—',
              sub: 'submitted to GSC',
              icon: Search,
              color: 'text-violet-400',
              bg: 'bg-violet-500/10',
            },
            {
              label: 'SEO Pages',
              value: pageStats?.seoPages ?? '—',
              sub: `${pageStats?.toolsPages ?? 0} tools · ${pageStats?.keywordPages ?? 0} keywords`,
              icon: Wrench,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
            },
          ].map(({ label, value, sub, icon: Icon, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#141414] border border-[#272727] rounded-2xl p-5 flex items-center gap-4"
            >
              <div className={`${bg} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value?.toLocaleString?.() ?? value}</p>
                <p className="text-xs text-[#999] font-medium">{label}</p>
                <p className="text-xs text-[#666]">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live Tracker */}
      <LiveTracker
        users={liveData?.liveUsers || []}
        loading={!liveData}
        isLive={isSocketLive}
      />
    </div>
  );
}
