'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Activity, Globe, Clock, Smartphone, Monitor, Tablet,
  MapPin, MousePointer2, TrendingUp, RefreshCw, Download,
  ChevronRight, ArrowUpRight, ArrowDownRight, DollarSign,
  Zap, BarChart2, PieChart as PieChartIcon, Eye, Search,
  Wifi, WifiOff, Filter, Flag, X, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line,
} from 'recharts';
import { getAuthHeaders } from '@/utils/auth';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────
const COLORS = ['#FF0000', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280', starter: '#3b82f6', pro: '#8b5cf6',
  enterprise: '#f59e0b', custom: '#ec4899', owner: '#FF0000',
};

const DEVICE_ICONS: Record<string, any> = { Desktop: Monitor, Mobile: Smartphone, Tablet };

function fmt(n: number | undefined, prefix = '') {
  if (n === undefined || n === null) return '—';
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n}`;
}

function fmtCurrency(n: number | undefined) {
  if (!n) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function fmtSeconds(s: number) {
  if (!s) return '0s';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[#181818] border border-[#212121] rounded-2xl p-5 animate-pulse">
      <div className="h-4 bg-[#2a2a2a] rounded w-1/2 mb-4" />
      <div className="h-8 bg-[#2a2a2a] rounded w-2/3 mb-2" />
      <div className="h-3 bg-[#2a2a2a] rounded w-1/3" />
    </div>
  );
}

function StatCard({
  title, value, sub, icon: Icon, color, bg, live, trend,
}: {
  title: string; value: string; sub: string; icon: any;
  color: string; bg: string; live?: boolean; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-[#181818] border border-[#212121] rounded-2xl p-5 hover:border-[#333] transition-all cursor-default"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {live && (
          <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
      <p className={`text-[11px] flex items-center gap-1 ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-[#555]'}`}>
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {sub}
      </p>
    </motion.div>
  );
}

function SectionCard({ title, icon: Icon, children, action }: {
  title: string; icon?: any; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-[#181818] border border-[#212121] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#FF0000]" />}
          {title}
        </h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-[#888] mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

function SessionDetailModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/admin/super/analytics/session?sessionId=${sessionId}`, { headers: getAuthHeaders() });
        const json = await res.data || await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#121212] border border-[#222] w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-[#222] flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Visitor Journey</h3>
              <p className="text-xs text-[#666] font-mono">{sessionId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#222] rounded-xl text-[#666] hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#0c0c0c] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-[#444]">
              <Loader2 className="w-10 h-10 animate-spin text-red-500" />
              <p className="text-sm animate-pulse">Reconstructing timeline...</p>
            </div>
          ) : !data?.logs?.length ? (
            <div className="text-center py-20 text-[#444]">No activity logs found.</div>
          ) : (
            <div className="relative space-y-8 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#222]">
              {data.logs.map((log: any, i: number) => {
                const isPage = log.eventType === 'page' || !log.eventType;
                return (
                  <div key={i} className="relative pl-12 group">
                    <div className={`absolute left-0 top-1 w-9 h-9 rounded-full border-4 border-[#0c0c0c] flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${
                      log.eventType === 'start' ? 'bg-emerald-500 text-black' : 
                      log.eventType === 'end' ? 'bg-red-500 text-white' : 
                      'bg-[#222] text-[#888]'
                    }`}>
                      {log.eventType === 'start' ? <Zap className="w-4 h-4" /> : 
                       log.eventType === 'end' ? <X className="w-4 h-4" /> : 
                       <MousePointer2 className="w-4 h-4" />}
                    </div>
                    <div className="bg-[#181818] border border-[#222] rounded-2xl p-4 hover:border-[#333] transition-all">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div>
                          <p className="text-xs font-bold text-[#666] uppercase tracking-widest flex items-center gap-2">
                            {log.eventType === 'start' ? 'Session Started' : 
                             log.eventType === 'end' ? 'Session Ended' : 'Page Visit'}
                            <span className="text-[10px] lowercase text-[#444]">· {new Date(log.timestamp).toLocaleTimeString()}</span>
                          </p>
                          <h4 className="text-sm font-semibold text-white mt-1 font-mono">{log.page}</h4>
                        </div>
                        {log.timeSpentSeconds > 0 && (
                          <div className="px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] text-[#888] font-bold">
                            {fmtSeconds(log.timeSpentSeconds)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 pt-3 border-t border-[#222]/50">
                        {log.city && (
                          <div className="flex items-center gap-1.5 text-[10px] text-[#666]">
                            <MapPin className="w-3 h-3" /> {log.city}, {log.country}
                          </div>
                        )}
                        {log.userAgent && (
                          <div className="flex items-center gap-1.5 text-[10px] text-[#666] truncate max-w-[200px]">
                            <Monitor className="w-3 h-3" /> {log.userAgent.split(') ')[0].replace('Mozilla/5.0 (', '')}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-[#666]">
                          <Globe className="w-3 h-3" /> {log.ipAddress || '0.0.0.0'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-[#222] bg-[#181818] flex items-center justify-between text-xs text-[#555]">
          <p>Total Session Duration: <span className="text-emerald-400 font-bold">{fmtSeconds(data?.totalDurationSeconds || 0)}</span></p>
          <p>Location: {data?.logs?.[0]?.city || 'Unknown'}</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function PlatformAnalytics() {
  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [live, setLive] = useState<any>(null);
  const [traffic, setTraffic] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [sessions, setSessions] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const headers = getAuthHeaders();

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [ovRes, liveRes, trafficRes, revRes, sessRes] = await Promise.allSettled([
        fetch('/api/admin/super/analytics/overview', { headers }).then(r => r.json()),
        fetch('/api/admin/super/analytics/live', { headers }).then(r => r.json()),
        fetch(`/api/admin/super/live-analytics?range=${range}`, { headers }).then(r => r.json()),
        fetch('/api/admin/super/analytics/revenue', { headers }).then(r => r.json()),
        fetch('/api/admin/super/analytics/sessions', { headers }).then(r => r.json()),
      ]);
      if (ovRes.status === 'fulfilled') setOverview(ovRes.value);
      if (liveRes.status === 'fulfilled') setLive(liveRes.value);
      if (trafficRes.status === 'fulfilled') setTraffic(trafficRes.value?.data);
      if (revRes.status === 'fulfilled') setRevenue(revRes.value);
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Analytics fetch error', e);
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

  // Derived data
  const liveUsers = live?.liveUsers || [];
  const liveCount = live?.count ?? 0;
  const geoDistribution = traffic?.geoDistribution || [];
  const trafficTrend = traffic?.trafficTrend || [];
  const deviceBreakdown = traffic?.deviceBreakdown || [];
  const topPages = traffic?.topPages || [];
  const trafficSources = traffic?.trafficSources || [
    { _id: 'Direct', count: 40 }, { _id: 'Search', count: 30 },
    { _id: 'Social', count: 20 }, { _id: 'Referral', count: 10 },
  ];
  const hourlyTrend = sessions?.hourlyTrend || [];

  // Plan distribution for pie
  const planData = (overview?.planDistribution || []).map((p: any) => ({
    name: p.plan, value: p.count,
  }));

  // Export CSV helper
  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Users', overview?.totalUsers],
      ['New Today', overview?.newToday],
      ['Active Now', liveCount],
      ['Total Revenue', revenue?.monthToDateRevenue],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `analytics-${range}.csv`; a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#181818] border border-[#212121] rounded-2xl p-6 animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* ─── Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-[#FF0000]" />
            Super Admin Analytics
          </h1>
          <p className="text-sm text-[#666] mt-0.5">
            Platform-wide intelligence dashboard
            {lastUpdated && (
              <span className="ml-2 text-[#444]">· Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            className="bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FF0000] transition-colors text-[#ccc]"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={() => fetchAll(true)}
            className="p-2 bg-[#111] border border-[#333] rounded-xl hover:border-[#FF0000] transition-all group"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-[#888] group-hover:text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-white rounded-xl text-sm font-medium hover:bg-[#cc0000] transition-all shadow-lg shadow-red-900/30"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={fmt(overview?.totalUsers)} sub={`+${overview?.newToday ?? 0} today`} icon={Users} color="text-violet-400" bg="bg-violet-400/10" trend="up" />
        <StatCard title="Online Now" value={String(liveCount)} sub="Active sessions" icon={Wifi} color="text-emerald-400" bg="bg-emerald-400/10" live trend="up" />
        <StatCard title="Total Visits" value={fmt(traffic?.overview?.totalVisits)} sub={`${fmt(traffic?.overview?.uniqueVisitors)} unique`} icon={Eye} color="text-sky-400" bg="bg-sky-400/10" trend="neutral" />
        <StatCard title="Revenue (MTD)" value={fmtCurrency(revenue?.monthToDateRevenue)} sub={`Today: ${fmtCurrency(revenue?.todayRevenue)}`} icon={DollarSign} color="text-amber-400" bg="bg-amber-400/10" trend="up" />
        <StatCard title="Avg. Session" value={fmtSeconds(Math.round(traffic?.overview?.avgTimeSpent || 0))} sub="Per user per visit" icon={Clock} color="text-pink-400" bg="bg-pink-400/10" trend="neutral" />
        <StatCard title="Countries" value={String(sessions?.stats?.countriesCount || 0)} sub="Global reach" icon={Globe} color="text-blue-400" bg="bg-blue-400/10" trend="up" />
        <StatCard title="Active Today" value={String(sessions?.todayActiveUsers ?? 0)} sub="Unique users logged" icon={Zap} color="text-orange-400" bg="bg-orange-400/10" trend="neutral" />
        <StatCard title="Payments" value={String(revenue?.paymentStatus?.find((p: any) => p.status === 'success')?.count ?? 0)} sub="Successful transactions" icon={BarChart2} color="text-teal-400" bg="bg-teal-400/10" trend="neutral" />
      </div>

      {/* ─── Live Users + Geo ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Users */}
        <div className="lg:col-span-2">
          <SectionCard title="Live Users" icon={Wifi} action={
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">{liveCount} Online</span>
          }>
            {liveUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#444]">
                <WifiOff className="w-10 h-10 mb-3" />
                <p className="text-sm">No users online right now</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                <AnimatePresence>
                  {liveUsers.slice(0, 10).map((u: any, i: number) => (
                    <motion.div
                      key={u.sessionId || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#111] border border-[#222] hover:border-[#333] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF0000]/20 to-[#FF0000]/5 border border-[#333] flex items-center justify-center text-[#FF0000] font-bold text-sm">
                          {u.name?.[0] || 'A'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white leading-tight">{u.name || 'Anonymous'}</p>
                          <p className="text-[11px] text-[#555]">{u.city || '–'}, {u.country || '–'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-xs text-[#888] font-mono truncate max-w-[120px]">{u.currentPage || '/'}</p>
                          <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                            {u.sessionDurationMinutes}m online
                          </span>
                        </div>
                        <button 
                          onClick={() => setSelectedSession(u.sessionId)}
                          className="p-2 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors group/btn"
                          title="View Journey"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#666] group-hover/btn:text-[#FF0000]" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Geographic Distribution */}
        <SectionCard title="Top Countries" icon={Globe}>
          {geoDistribution.length === 0 ? (
            <p className="text-center text-[#444] py-10 text-sm">No geo data yet</p>
          ) : (
            <div className="space-y-4">
              {geoDistribution.slice(0, 7).map((geo: any, i: number) => {
                const max = geoDistribution[0]?.visits || 1;
                const pct = Math.round((geo.visits / max) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#888] w-5">{i + 1}</span>
                        <span className="text-sm text-white font-medium">{geo._id?.country || 'Unknown'}</span>
                      </div>
                      <span className="text-xs text-white font-bold">{geo.visits}</span>
                    </div>
                    <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ─── Traffic Trend + Device ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="Traffic Trend" icon={TrendingUp}>
            {trafficTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-[#444] text-sm">No traffic data yet</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficTrend}>
                    <defs>
                      <linearGradient id="gradVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF0000" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                    <XAxis dataKey="_id" stroke="#333" fontSize={10}
                      tickFormatter={v => v?.includes('T') ? v.split('T')[1].slice(0, 5) : v?.slice(5)} />
                    <YAxis stroke="#333" fontSize={10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="visits" stroke="#FF0000" strokeWidth={2} fill="url(#gradVisits)" name="Visits" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Device Breakdown */}
        <SectionCard title="Device Breakdown" icon={Smartphone}>
          {deviceBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-[#444] text-sm">No data</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceBreakdown} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                    paddingAngle={4} dataKey="count" nameKey="_id">
                    {deviceBreakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span className="text-xs text-[#aaa]">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ─── Hourly Traffic + Traffic Sources ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Hourly Activity (Today)" icon={BarChart2}>
          {hourlyTrend.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-[#444] text-sm">No session data today</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                  <XAxis dataKey="hour" stroke="#333" fontSize={9} />
                  <YAxis stroke="#333" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="users" name="Users" radius={[4, 4, 0, 0]}>
                    {hourlyTrend.map((h: any, i: number) => {
                      const max = Math.max(...hourlyTrend.map((x: any) => x.users));
                      return <Cell key={i} fill={h.users === max ? '#FF0000' : '#2a2a2a'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Traffic Sources" icon={PieChartIcon}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trafficSources} cx="50%" cy="45%" outerRadius={75}
                  dataKey="count" nameKey="_id" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {trafficSources.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* ─── User Growth + Plan Distribution ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="User Growth (30 days)" icon={TrendingUp}>
            {(overview?.growthTrend || []).length === 0 ? (
              <div className="h-56 flex items-center justify-center text-[#444] text-sm">No growth data</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={overview?.growthTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                    <XAxis dataKey="date" stroke="#333" fontSize={9} tickFormatter={v => v?.slice(5)} />
                    <YAxis stroke="#333" fontSize={10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2} dot={false} name="New Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Plan Distribution" icon={PieChartIcon}>
          {planData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-[#444] text-sm">No plan data</div>
          ) : (
            <div className="space-y-3 pt-1">
              {planData.map((p: any, i: number) => {
                const total = planData.reduce((s: number, x: any) => s + x.value, 0);
                const pct = total ? Math.round((p.value / total) * 100) : 0;
                const color = PLAN_COLORS[p.name] || '#6b7280';
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize font-medium" style={{ color }}>{p.name}</span>
                      <span className="text-[#888]">{p.value} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="h-full rounded-full" style={{ backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ─── Revenue Trend ───────────────────────── */}
      {(revenue?.monthlyRevenue || []).length > 0 && (
        <SectionCard title="Monthly Revenue Trend" icon={DollarSign}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                <XAxis dataKey="month" stroke="#333" fontSize={9} />
                <YAxis stroke="#333" fontSize={10} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} formatter={(v: any) => [fmtCurrency(v), 'Revenue']} />
                <Bar dataKey="revenue" name="Revenue" fill="#FF0000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* ─── Top Pages Table ─────────────────────── */}
      <div className="bg-[#181818] border border-[#212121] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MousePointer2 className="w-4 h-4 text-[#FF0000]" />
            Top Pages
          </h3>
          <span className="text-xs text-[#555]">{topPages.length} pages tracked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[#555] text-xs border-b border-[#222]">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Page</th>
                <th className="px-6 py-3 font-medium">Views</th>
                <th className="px-6 py-3 font-medium">Avg. Time</th>
                <th className="px-6 py-3 font-medium text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {topPages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#444]">No page tracking data</td>
                </tr>
              )}
              {topPages.slice(0, 10).map((page: any, i: number) => (
                <tr key={i} className="hover:bg-[#111] transition-colors group">
                  <td className="px-6 py-4 text-[#555] text-xs">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MousePointer2 className="w-3 h-3 text-[#333] group-hover:text-[#FF0000] transition-colors" />
                      <span className="font-mono text-white/80 text-xs truncate max-w-xs">{page._id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-semibold">{fmt(page.visits)}</span>
                  </td>
                  <td className="px-6 py-4 text-[#888]">{fmtSeconds(Math.round(page.avgTime || 0))}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full text-[10px]">
                      <TrendingUp className="w-2.5 h-2.5" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Recent Payments ─────────────────────── */}
      {(revenue?.recentPayments || []).length > 0 && (
        <div className="bg-[#181818] border border-[#212121] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#FF0000]" />
              Recent Payments
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[#555] text-xs border-b border-[#222]">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {revenue.recentPayments.slice(0, 8).map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-[#111] transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-white text-xs font-medium">{p.userName}</p>
                      <p className="text-[#555] text-[11px]">{p.userEmail}</p>
                    </td>
                    <td className="px-6 py-3"><span className="capitalize text-[#aaa] text-xs">{p.plan || '—'}</span></td>
                    <td className="px-6 py-3 text-white font-semibold text-xs">{fmtCurrency(p.amount)}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-[#555] text-[11px]">
                      {p.date ? new Date(p.date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Top Earners ─────────────────────────── */}
      {(revenue?.topEarners || []).length > 0 && (
        <SectionCard title="Top Revenue Contributors" icon={DollarSign}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {revenue.topEarners.slice(0, 6).map((u: any, i: number) => (
              <motion.div
                key={i}
                whileHover={{ y: -2 }}
                className="bg-[#111] border border-[#222] rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: `${COLORS[i % COLORS.length]}22`, color: COLORS[i % COLORS.length] }}>
                    {u.name?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.name || 'Unknown'}</p>
                    <p className="text-[11px] text-[#555] truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="capitalize text-xs px-2 py-0.5 rounded-full" style={{ background: `${PLAN_COLORS[u.plan] || '#6b7280'}22`, color: PLAN_COLORS[u.plan] || '#6b7280' }}>
                    {u.plan || 'free'}
                  </span>
                  <span className="text-white font-bold text-sm">{fmtCurrency(u.total)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
