'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Activity, DollarSign, TrendingUp, Sparkles, AlertCircle,
  RefreshCw, Download, ChevronUp, ChevronDown, Search, Filter,
  Brain, Globe, BarChart2, Zap, ArrowUpRight, ArrowDownRight,
  Clock, Star, ChevronsUpDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Constants ────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280', starter: '#3b82f6', pro: '#8b5cf6',
  enterprise: '#f59e0b', custom: '#ec4899', owner: '#FF0000',
};
const CHART_COLORS = ['#FF0000', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899'];

function fmt(n: number | undefined) {
  if (n === undefined || n === null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function fmtMoney(n: number | undefined, currency = '₹') {
  if (!n) return `${currency}0`;
  if (n >= 1_000_000) return `${currency}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${currency}${(n / 1_000).toFixed(1)}K`;
  return `${currency}${n}`;
}

// ─── Sparkline ────────────────────────────────
function Sparkline({ data, color = '#FF0000' }: { data: number[]; color?: string }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 80;
    const y = 28 - ((v - min) / range) * 24;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
      <polyline points={pts} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────
function StatCard({
  title, value, sub, icon: Icon, color, bg, spark, trend,
}: {
  title: string; value: string; sub: string; icon: any;
  color: string; bg: string; spark?: number[]; trend?: 'up' | 'down' | 'neutral';
}) {
  const sparkColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280';
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 0 24px rgba(255,0,0,0.08)' }}
      transition={{ type: 'spring', stiffness: 260 }}
      className="bg-[#111]/80 backdrop-blur border border-[#222] rounded-2xl p-5 cursor-default relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
        {spark && spark.length > 1 && <Sparkline data={spark} color={sparkColor} />}
      </div>
      <p className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
      <p className={`text-[11px] flex items-center gap-1 ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-[#444]'}`}>
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
        {sub}
      </p>
    </motion.div>
  );
}

// ─── Tooltip ──────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-xs shadow-2xl">
      <p className="text-[#666] mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('rev') ? fmtMoney(p.value) : fmt(p.value)}</p>
      ))}
    </div>
  );
};

// ─── Section Card ─────────────────────────────
function Card({ title, icon: Icon, children, action, className = '' }: {
  title: string; icon?: any; children: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-[#111]/80 backdrop-blur border border-[#222] rounded-2xl overflow-hidden relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.015] to-transparent pointer-events-none" />
      <div className="px-6 py-4 border-b border-[#1e1e1e] flex items-center justify-between relative">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#FF0000]" />}
          {title}
        </h3>
        {action}
      </div>
      <div className="p-6 relative">{children}</div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────
function Skel({ h = 'h-32' }: { h?: string }) {
  return <div className={`bg-[#1a1a1a] rounded-2xl ${h} animate-pulse`} />;
}

// ─── AI Insight ───────────────────────────────
function generateInsights(overview: any, plans: any[], usageData: any, liveCount: number): string[] {
  const insights: string[] = [];
  if (!overview) return insights;
  const { totalUsers, activeUsers } = overview;
  const paidUsers = plans.filter(p => p.plan !== 'free').reduce((s: number, p: any) => s + p.count, 0);
  const freeUsers = plans.find(p => p.plan === 'free')?.count || 0;
  const paidPct = totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0;
  const actPct = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const proEnt = plans.filter(p => ['pro', 'enterprise'].includes(p.plan)).reduce((s: number, p: any) => s + p.count, 0);
  const proRevPct = paidUsers > 0 ? Math.round((proEnt / paidUsers) * 100) : 0;

  if (paidPct > 0) insights.push(`💰 ${paidPct}% of users are on paid plans — strong monetisation signal.`);
  if (freeUsers > 0 && paidUsers > 0) insights.push(`🎯 ${freeUsers} free users are potential upgrade targets.`);
  if (actPct < 30) insights.push(`⚠️ Only ${actPct}% of users active in last 30 days — engagement needs attention.`);
  else insights.push(`✅ ${actPct}% of total users were active in the last 30 days.`);
  if (proRevPct > 50) insights.push(`🚀 Pro + Enterprise users drive the majority of revenue (${proRevPct}% of paid base).`);
  if (liveCount > 0) insights.push(`🟢 ${liveCount} user${liveCount > 1 ? 's' : ''} active right now on the platform.`);
  const totalAnalyses = usageData?.globalUsageStats?.totalVideos || 0;
  if (totalAnalyses > 0) insights.push(`📊 ${fmt(totalAnalyses)} total analyses performed across all users.`);
  return insights.slice(0, 5);
}

// ─── MAIN ─────────────────────────────────────
export default function AdminAnalyticsDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [sessionsData, setSessionsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [range, setRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'analyses' | 'hashtags' | 'joined'>('analyses');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [tierFilter, setTierFilter] = useState('all');
  const router = useRouter();
  const headers = getAuthHeaders();

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [ovRes, plansRes, usageRes, liveRes, revRes, sessRes] = await Promise.allSettled([
        axios.get('/api/admin/analytics/overview', { headers }),
        axios.get('/api/admin/analytics/plans', { headers }),
        axios.get('/api/admin/analytics/usage', { headers }),
        axios.get('/api/admin/super/analytics/live', { headers }),
        axios.get('/api/admin/super/analytics/revenue', { headers }),
        axios.get('/api/admin/super/analytics/sessions', { headers }),
      ]);
      if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data.data);
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data.data || []);
      if (usageRes.status === 'fulfilled') setUsageData(usageRes.value.data.data);
      if (liveRes.status === 'fulfilled') setLiveData(liveRes.value.data);
      if (revRes.status === 'fulfilled') setRevenueData(revRes.value.data);
      if (sessRes.status === 'fulfilled') setSessionsData(sessRes.value.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (err.response?.status === 401) router.push('/dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
    const iv = setInterval(() => fetchAll(true), 30_000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // Derived
  const liveCount = liveData?.count ?? 0;
  const topUsers: any[] = usageData?.topUsers || [];
  const globalStats = usageData?.globalUsageStats;
  const { totalUsers = 0, activeUsers = 0, monthlyRevenue = 0 } = overview || {};
  const insights = useMemo(() => generateInsights(overview, plans, usageData, liveCount), [overview, plans, usageData, liveCount]);

  // Growth trend dummy-filled from revenue data
  const growthTrend = revenueData?.monthlyRevenue?.map((m: any) => ({
    month: m.month?.slice(5) || m.month,
    revenue: m.revenue || 0,
    payments: m.payments || 0,
  })) || [];

  // Hourly from sessions
  const hourlyData = sessionsData?.hourlyTrend || [];

  // Plan pie
  const planPie = plans.map(p => ({ name: p.plan, value: p.count }));

  // Filtered + sorted top users
  const filteredUsers = useMemo(() => {
    let u = [...topUsers];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      u = u.filter(x => x.name?.toLowerCase().includes(q) || x.email?.toLowerCase().includes(q));
    }
    if (tierFilter !== 'all') u = u.filter(x => x.subscription === tierFilter);
    u.sort((a, b) => {
      const va = sortBy === 'analyses' ? (a.usageStats?.videosAnalyzed || 0)
        : sortBy === 'hashtags' ? (a.usageStats?.hashtagsGenerated || 0)
        : new Date(a.createdAt).getTime();
      const vb = sortBy === 'analyses' ? (b.usageStats?.videosAnalyzed || 0)
        : sortBy === 'hashtags' ? (b.usageStats?.hashtagsGenerated || 0)
        : new Date(b.createdAt).getTime();
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return u;
  }, [topUsers, searchQuery, tierFilter, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => sortBy === col
    ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)
    : <ChevronsUpDown className="w-3 h-3 opacity-30" />;

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Plan', 'Analyses', 'Hashtags', 'Joined'],
      ...topUsers.map(u => [u.name, u.email, u.subscription, u.usageStats?.videosAnalyzed || 0, u.usageStats?.hashtagsGenerated || 0, new Date(u.createdAt).toLocaleDateString()]),
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }));
    a.download = 'growth-analytics.csv'; a.click();
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-[#1a1a1a] rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skel key={i} h="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skel key={i} h="h-64" />)}
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-400 font-medium">Failed to load analytics. Check API permissions.</p>
        <button onClick={() => fetchAll()} className="px-4 py-2 bg-[#FF0000] rounded-lg text-sm text-white hover:bg-[#cc0000]">
          Retry
        </button>
      </div>
    );
  }

  const arpu = totalUsers > 0 ? Math.round(monthlyRevenue / totalUsers) : 0;
  const paidUsers = plans.filter(p => p.plan !== 'free').reduce((s: number, p: any) => s + p.count, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #0f0f0f 0%, #080808 100%)' }}>

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Growth Analytics</h1>
          <p className="text-[#555] text-sm mt-1 flex items-center gap-2">
            Enterprise SaaS performance dashboard
            {lastUpdated && <span className="text-[#333]">· {lastUpdated.toLocaleTimeString()}</span>}
            <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={range} onChange={e => setRange(e.target.value)}
            className="bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FF0000] text-[#ccc]">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button onClick={() => fetchAll(true)}
            className="p-2 bg-[#111] border border-[#2a2a2a] rounded-xl hover:border-[#FF0000] group transition-all">
            <RefreshCw className={`w-4 h-4 text-[#555] group-hover:text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-white rounded-xl text-sm font-medium hover:bg-[#cc0000] shadow-lg shadow-red-900/30">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={fmt(totalUsers)} sub={`+${overview?.newToday || 0} today`}
          icon={Users} color="text-violet-400" bg="bg-violet-400/10"
          spark={[10, 15, 12, 20, 18, 25, totalUsers % 30 + 10]} trend="up" />
        <StatCard title="Active (30d)" value={fmt(activeUsers)} sub={`${totalUsers > 0 ? Math.round(activeUsers / totalUsers * 100) : 0}% of total`}
          icon={Activity} color="text-sky-400" bg="bg-sky-400/10"
          spark={[5, 8, 6, 12, 10, 15, activeUsers % 20 + 5]} trend="up" />
        <StatCard title="Est. MRR" value={fmtMoney(monthlyRevenue)}
          sub={`ARPU ${fmtMoney(arpu)}`}
          icon={DollarSign} color="text-emerald-400" bg="bg-emerald-400/10"
          spark={[100, 150, 200, 180, 250, 300, monthlyRevenue % 400 + 100]} trend="up" />
        <StatCard title="Total Analyses" value={fmt(globalStats?.totalVideos)}
          sub="Platform-wide usage" icon={Sparkles} color="text-amber-400" bg="bg-amber-400/10"
          spark={[2, 5, 3, 8, 6, 10, (globalStats?.totalVideos || 0) % 15 + 2]} trend="up" />
        <StatCard title="Live Users Now" value={String(liveCount)}
          sub="Real-time sessions" icon={Zap} color="text-[#FF0000]" bg="bg-[#FF0000]/10"
          spark={[1, 0, 2, 1, 3, 2, liveCount]} trend="neutral" />
        <StatCard title="Paid Users" value={fmt(paidUsers)}
          sub={`${totalUsers > 0 ? Math.round(paidUsers / totalUsers * 100) : 0}% conversion`}
          icon={Star} color="text-pink-400" bg="bg-pink-400/10"
          spark={[1, 2, 2, 3, 4, 5, paidUsers % 8 + 1]} trend="up" />
        <StatCard title="Hashtags Gen." value={fmt(globalStats?.totalHashtags || 0)}
          sub="Cumulative count" icon={BarChart2} color="text-teal-400" bg="bg-teal-400/10"
          spark={[3, 5, 4, 8, 6, 10, (globalStats?.totalHashtags || 0) % 15 + 2]} trend="up" />
        <StatCard title="Avg Session" value={`${sessionsData?.stats?.maxSessionMinutes || 0}m`}
          sub="Max session length" icon={Clock} color="text-orange-400" bg="bg-orange-400/10"
          spark={[5, 8, 6, 9, 7, 11, sessionsData?.stats?.maxSessionMinutes || 0]} trend="neutral" />
      </div>

      {/* ─── AI Insights ─── */}
      {insights.length > 0 && (
        <Card title="AI Insights" icon={Brain}
          action={<span className="text-[10px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full font-bold">Auto-generated</span>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {insights.map((insight, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl text-sm text-[#ccc] hover:border-[#333] transition-colors">
                  {insight}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {/* ─── Revenue Trend + Plan Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Monthly Revenue Trend" icon={TrendingUp}>
            {growthTrend.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-[#333] text-sm">No revenue data yet</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthTrend}>
                    <defs>
                      <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF0000" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradPay" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#141414" vertical={false} />
                    <XAxis dataKey="month" stroke="#2a2a2a" fontSize={10} />
                    <YAxis stroke="#2a2a2a" fontSize={10} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#FF0000" fill="url(#gradRev)" strokeWidth={2} name="Revenue" />
                    <Area type="monotone" dataKey="payments" stroke="#8b5cf6" fill="url(#gradPay)" strokeWidth={1.5} name="Payments" />
                    <Legend formatter={v => <span className="text-xs text-[#888]">{v}</span>} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <Card title="User Tier Distribution" icon={BarChart2}>
          {planPie.length === 0
            ? <div className="h-56 flex items-center justify-center text-[#333] text-sm">No plan data</div>
            : (
              <div className="space-y-3 pt-1">
                {plans.map((p, i) => {
                  const pct = totalUsers > 0 ? Math.round((p.count / totalUsers) * 100) : 0;
                  const color = PLAN_COLORS[p.plan] || '#6b7280';
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold capitalize" style={{ color }}>{p.plan}</span>
                        <span className="text-[#555]">{p.count} · {pct}%</span>
                      </div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.08, duration: 0.6 }}
                          className="h-full rounded-full" style={{ backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          {/* Pie mini */}
          {planPie.length > 0 && (
            <div className="h-32 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={planPie} cx="50%" cy="50%" outerRadius={48} dataKey="value" nameKey="name" paddingAngle={3}>
                    {planPie.map((p: any, i: number) => (
                      <Cell key={i} fill={PLAN_COLORS[p.name] || CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* ─── Hourly Activity + Revenue By Plan ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Hourly Session Activity (Today)" icon={Activity}>
          {hourlyData.length === 0
            ? <div className="h-52 flex items-center justify-center text-[#333] text-sm">No session data today</div>
            : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#141414" vertical={false} />
                    <XAxis dataKey="hour" stroke="#2a2a2a" fontSize={9} />
                    <YAxis stroke="#2a2a2a" fontSize={10} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="users" name="Users" radius={[4, 4, 0, 0]}>
                      {hourlyData.map((h: any, i: number) => {
                        const max = Math.max(...hourlyData.map((x: any) => x.users));
                        return <Cell key={i} fill={h.users === max ? '#FF0000' : '#1e1e1e'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
        </Card>

        <Card title="Revenue by Plan" icon={DollarSign}>
          {(revenueData?.revenueByPlan || []).length === 0
            ? <div className="h-52 flex items-center justify-center text-[#333] text-sm">No revenue by plan data</div>
            : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData.revenueByPlan} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#141414" horizontal={false} />
                    <XAxis type="number" stroke="#2a2a2a" fontSize={9} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="plan" stroke="#2a2a2a" fontSize={10} width={60} className="capitalize" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                      {revenueData.revenueByPlan.map((p: any, i: number) => (
                        <Cell key={i} fill={PLAN_COLORS[p.plan] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
        </Card>
      </div>

      {/* ─── Top Users Table ─── */}
      <div className="bg-[#111]/80 backdrop-blur border border-[#222] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1e1e1e] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF0000]" /> Top Users by Activity
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#444] absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search users…"
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#FF0000] text-[#ccc] w-36" />
            </div>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
              className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-2 py-1.5 text-xs outline-none text-[#ccc]">
              <option value="all">All tiers</option>
              {['free', 'starter', 'pro', 'enterprise', 'custom'].map(t => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[640px]">
            <thead>
              <tr className="text-[#444] text-xs border-b border-[#1a1a1a]">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Tier</th>
                <th className="px-6 py-3 font-medium cursor-pointer hover:text-white select-none" onClick={() => toggleSort('analyses')}>
                  <span className="flex items-center gap-1">Analyses <SortIcon col="analyses" /></span>
                </th>
                <th className="px-6 py-3 font-medium cursor-pointer hover:text-white select-none" onClick={() => toggleSort('hashtags')}>
                  <span className="flex items-center gap-1">Hashtags <SortIcon col="hashtags" /></span>
                </th>
                <th className="px-6 py-3 font-medium cursor-pointer hover:text-white select-none text-right" onClick={() => toggleSort('joined')}>
                  <span className="flex items-center gap-1 justify-end">Joined <SortIcon col="joined" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#121212]">
              {filteredUsers.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-[#333]">No users found</td></tr>
              )}
              {filteredUsers.slice(0, 15).map((u, i) => {
                const planColor = PLAN_COLORS[u.subscription] || '#6b7280';
                const isTop = i === 0;
                return (
                  <motion.tr key={u.email} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className={`hover:bg-[#0f0f0f] transition-colors group ${isTop ? 'border-l-2 border-l-amber-400' : ''}`}>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${isTop ? 'text-amber-400' : 'text-[#333]'}`}>{i + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${planColor}22`, color: planColor }}>
                          {u.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{u.name || 'Anonymous'}</p>
                          <p className="text-[#444] text-[11px] truncate max-w-[160px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize"
                        style={{ background: `${planColor}18`, color: planColor }}>
                        {u.subscription}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold" style={{ color: '#FF0000' }}>
                      {fmt(u.usageStats?.videosAnalyzed || 0)}
                    </td>
                    <td className="px-6 py-4 text-white">{fmt(u.usageStats?.hashtagsGenerated || 0)}</td>
                    <td className="px-6 py-4 text-right text-[#444] text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length > 15 && (
          <div className="px-6 py-3 border-t border-[#1a1a1a] text-xs text-[#444]">
            Showing 15 of {filteredUsers.length} users
          </div>
        )}
      </div>
    </div>
  );
}
