'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveTracker from '@/components/admin/LiveTracker';
import AdminAlertPanel from '@/components/admin/AdminAlertPanel';
import { getAuthHeaders } from '@/utils/auth';
import { getSocket } from '@/hooks/useSocket';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  PieChart, Pie, LineChart, Line, AreaChart, Area, Legend,
} from 'recharts';
import {
  Flame, Globe, Users, UserPlus, Clock, MapPin, TrendingUp,
  Calendar, Mail, Activity, ChevronDown, BarChart3,
} from 'lucide-react';

const PAGE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
const COUNTRY_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const FLAG_MAP: Record<string, string> = {
  India: '🇮🇳', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧', Canada: '🇨🇦',
  Germany: '🇩🇪', France: '🇫🇷', Australia: '🇦🇺', Japan: '🇯🇵', Brazil: '🇧🇷',
  Russia: '🇷🇺', China: '🇨🇳', Indonesia: '🇮🇩', Pakistan: '🇵🇰', Bangladesh: '🇧🇩',
  Mexico: '🇲🇽', Nigeria: '🇳🇬', 'South Korea': '🇰🇷', Italy: '🇮🇹', Spain: '🇪🇸',
  Netherlands: '🇳🇱', Turkey: '🇹🇷', 'Saudi Arabia': '🇸🇦', 'United Arab Emirates': '🇦🇪',
  Singapore: '🇸🇬', Thailand: '🇹🇭', Vietnam: '🇻🇳', Philippines: '🇵🇭', Malaysia: '🇲🇾',
};

type StatsTab = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function LivePage() {
  const [liveData, setLiveData] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [visitorStats, setVisitorStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [activeTab, setActiveTab] = useState<StatsTab>('daily');
  const fetchingRef = useRef(false);

  const fetchLiveData = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await axios.get('/api/admin/super/analytics/live', { headers: getAuthHeaders() });
      setLiveData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  const fetchHeatmap = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/super/analytics/heatmap', { headers: getAuthHeaders() });
      setHeatmap(res.data.pages || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchVisitorStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await axios.get('/api/admin/super/analytics/visitor-stats', { headers: getAuthHeaders() });
      setVisitorStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLiveData();
    fetchHeatmap();
    fetchVisitorStats();
  }, [fetchLiveData, fetchHeatmap, fetchVisitorStats]);

  // Refresh visitor stats every 60s
  useEffect(() => {
    const interval = setInterval(fetchVisitorStats, 60000);
    return () => clearInterval(interval);
  }, [fetchVisitorStats]);

  // Socket.io real-time updates + 5s polling
  useEffect(() => {
    const sock = getSocket();
    const interval = setInterval(fetchLiveData, 5000);
    if (!sock) return () => clearInterval(interval);

    setIsSocketLive(sock.connected);
    const onConnect = () => setIsSocketLive(true);
    const onDisconnect = () => setIsSocketLive(false);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const onActivityUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchLiveData();
        fetchHeatmap();
      }, 2000);
    };

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    sock.on('live_users_update', onActivityUpdate);
    sock.on('activity_update', onActivityUpdate);
    sock.on('session_update', onActivityUpdate);

    return () => {
      clearInterval(interval);
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      sock.off('live_users_update', onActivityUpdate);
      sock.off('activity_update', onActivityUpdate);
      sock.off('session_update', onActivityUpdate);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [fetchLiveData, fetchHeatmap]);

  const countryData = visitorStats?.countryStats?.[activeTab] || [];
  const overview = visitorStats?.overview;

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Live Tracking & Analytics</h1>
          <p className="text-white/40 text-sm mt-1">Real-time user monitoring, location tracking & growth analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminAlertPanel />
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-emerald-400 text-sm font-medium">
              {liveData?.count ?? 0} Online
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Overview Summary Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Online Now', value: liveData?.count ?? '—', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          {
            label: 'Avg Session',
            value: liveData?.liveUsers?.length
              ? Math.round(liveData.liveUsers.reduce((s: number, u: any) => s + u.sessionDurationMinutes, 0) / liveData.liveUsers.length) + 'm'
              : overview ? formatDuration(overview.avgSessionSeconds) : '—',
            icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10',
          },
          {
            label: 'Countries',
            value: liveData?.liveUsers?.length
              ? new Set(liveData.liveUsers.map((u: any) => u.country).filter(Boolean)).size
              : '—',
            icon: Globe, color: 'text-violet-400', bg: 'bg-violet-500/10',
          },
          { label: 'Total Users', value: overview?.totalUsers?.toLocaleString() ?? '—', icon: Users, color: 'text-white/70', bg: 'bg-white/5' },
          { label: 'New Today', value: overview?.newUsers?.today ?? '—', icon: UserPlus, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'New This Month', value: overview?.newUsers?.month ?? '—', icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#141414] border border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${bg}`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── New Users Growth Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: overview?.newUsers?.today, icon: Calendar, period: 'daily' },
          { label: 'This Week', value: overview?.newUsers?.week, icon: Calendar, period: 'weekly' },
          { label: 'This Month', value: overview?.newUsers?.month, icon: Calendar, period: 'monthly' },
          { label: 'This Year', value: overview?.newUsers?.year, icon: Calendar, period: 'yearly' },
        ].map(({ label, value, icon: Icon, period }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            onClick={() => setActiveTab(period as StatsTab)}
            className={`cursor-pointer bg-[#141414] border rounded-2xl p-5 transition-all ${
              activeTab === period ? 'border-red-500/40 bg-red-500/5' : 'border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">New Users {label}</p>
                <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
              </div>
              <Icon className={`w-5 h-5 ${activeTab === period ? 'text-red-400' : 'text-white/20'}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── Country-wise Analytics ─── */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Visitors by Country</h3>
          </div>
          <div className="flex gap-1">
            {(['daily', 'weekly', 'monthly', 'yearly'] as StatsTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/5 text-white/40 border border-white/5 hover:border-white/10'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {statsLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : countryData.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-8">No data for this period</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Country Bar Chart */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryData.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                  <XAxis type="number" tick={{ fill: '#ffffff30', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="country"
                    width={120}
                    tick={{ fill: '#ffffff50', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${FLAG_MAP[v] || '🌐'} ${v?.length > 14 ? v.slice(0, 14) + '…' : v || 'Unknown'}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8, fontSize: 12 }}
                    formatter={(val: any, name: string) => [val, name === 'sessions' ? 'Sessions' : 'Unique Users']}
                  />
                  <Bar dataKey="sessions" name="Sessions" radius={[0, 4, 4, 0]}>
                    {countryData.slice(0, 10).map((_: any, idx: number) => (
                      <Cell key={idx} fill={COUNTRY_COLORS[idx % COUNTRY_COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Country Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={countryData.slice(0, 8).map((c: any, i: number) => ({
                      name: c.country || 'Unknown',
                      value: c.uniqueUsers,
                      fill: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, value }: any) => `${FLAG_MAP[name] || '🌐'} ${value}`}
                    labelLine={{ stroke: '#ffffff20' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8, fontSize: 12 }}
                    formatter={(val: any) => [`${val} users`, 'Unique Users']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Country Detail Table */}
            <div className="lg:col-span-2">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-[10px] text-white/40 uppercase tracking-wider py-2 px-3">Country</th>
                      <th className="text-right text-[10px] text-white/40 uppercase tracking-wider py-2 px-3">Sessions</th>
                      <th className="text-right text-[10px] text-white/40 uppercase tracking-wider py-2 px-3">Unique Users</th>
                      <th className="text-right text-[10px] text-white/40 uppercase tracking-wider py-2 px-3">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryData.map((c: any, i: number) => {
                      const totalSessions = countryData.reduce((s: number, x: any) => s + x.sessions, 0);
                      const share = totalSessions > 0 ? ((c.sessions / totalSessions) * 100).toFixed(1) : '0';
                      return (
                        <tr key={i} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                          <td className="py-2.5 px-3 text-sm text-white/70">
                            <span className="mr-2 text-lg">{FLAG_MAP[c.country] || '🌐'}</span>
                            {c.country || 'Unknown'}
                          </td>
                          <td className="py-2.5 px-3 text-sm text-white/50 text-right font-mono">{c.sessions.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-sm text-white/50 text-right font-mono">{c.uniqueUsers.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${share}%`,
                                    backgroundColor: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
                                  }}
                                />
                              </div>
                              <span className="text-xs text-white/40 font-mono w-10 text-right">{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── User Growth Chart (Monthly) ─── */}
      {visitorStats?.userGrowth?.length > 0 && (
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">User Growth (Last 12 Months)</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={visitorStats.userGrowth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
              <XAxis dataKey="label" tick={{ fill: '#ffffff30', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8, fontSize: 12 }}
                formatter={(val: any) => [`${val} users`, 'New Users']}
              />
              <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#growthGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─── Live Insights ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages (live aggregation) */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Most Visited Pages (Live)</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(
              liveData?.liveUsers?.reduce((acc: any, u: any) => {
                acc[u.currentPage] = (acc[u.currentPage] || 0) + 1;
                return acc;
              }, {}) || {}
            )
              .sort((a: any, b: any) => b[1] - a[1])
              .slice(0, 7)
              .map(([page, count]: any) => (
                <div key={page} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-red-500" />
                    <span className="text-sm font-mono text-white/70 truncate max-w-[200px]">{page}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/40">{count} live</span>
                </div>
              ))}
            {!liveData?.liveUsers?.length && <p className="text-white/20 text-sm">No active sessions</p>}
          </div>
        </div>

        {/* Top Pages from DB (last 7 days) */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Top Pages (Last 7 Days)</h3>
          </div>
          <div className="space-y-3">
            {(visitorStats?.topPages || []).slice(0, 7).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: PAGE_COLORS[i % PAGE_COLORS.length] }} />
                  <span className="text-sm font-mono text-white/70 truncate max-w-[180px]">{p.page}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/40">{p.visits} visits</span>
                  <span className="px-2 py-0.5 bg-blue-500/10 rounded text-xs text-blue-400">{p.uniqueVisitors} users</span>
                </div>
              </div>
            ))}
            {!visitorStats?.topPages?.length && <p className="text-white/20 text-sm">No data</p>}
          </div>
        </div>
      </div>

      {/* ─── Live Country Breakdown ─── */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Live Users by Location</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(
            liveData?.liveUsers?.reduce((acc: any, u: any) => {
              const key = [u.country, u.state, u.city].filter(Boolean).join(' > ') || 'Unknown';
              if (!acc[key]) acc[key] = { country: u.country, state: u.state, city: u.city, count: 0, users: [] };
              acc[key].count++;
              acc[key].users.push({
                name: u.name,
                email: u.email,
                distance: u.distanceFromAdmin,
                page: u.currentPage,
                duration: u.sessionDurationMinutes,
              });
              return acc;
            }, {}) || {}
          )
            .sort((a: any, b: any) => b[1].count - a[1].count)
            .map(([key, data]: any) => (
              <div key={key} className="bg-white/3 border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{FLAG_MAP[data.country] || '🌐'}</span>
                    <div>
                      <p className="text-sm font-medium text-white/80">{data.city || 'Unknown City'}</p>
                      <p className="text-[10px] text-white/30">{[data.state, data.country].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">{data.count}</span>
                </div>
                <div className="space-y-1.5 mt-2">
                  {data.users.slice(0, 3).map((u: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-600/40 to-red-800/40 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">
                          {(u.name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white/60 truncate">{u.name}</p>
                          <p className="text-white/25 truncate text-[9px]">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {u.distance !== undefined && (
                          <span className="text-[9px] text-white/30">{Math.round(u.distance)} km</span>
                        )}
                        <span className="text-[9px] text-emerald-400">{u.duration}m</span>
                      </div>
                    </div>
                  ))}
                  {data.users.length > 3 && (
                    <p className="text-[10px] text-white/20 text-center">+{data.users.length - 3} more</p>
                  )}
                </div>
              </div>
            ))}
          {!liveData?.liveUsers?.length && (
            <div className="col-span-full py-8 text-center">
              <MapPin className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-white/20 text-sm">No users currently online</p>
            </div>
          )}
        </div>
      </div>

      {/* Page Heatmap (DB-backed, last 7 days) */}
      {heatmap.length > 0 && (
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Page Heatmap</h3>
            <span className="text-xs text-white/30 ml-auto">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={heatmap} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
              <XAxis type="number" tick={{ fill: '#ffffff30', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="page"
                width={140}
                tick={{ fill: '#ffffff50', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v.length > 22 ? v.slice(0, 22) + '…' : v}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8, fontSize: 11 }}
                formatter={(val: any) => [`${val} visits`, 'Visits']}
              />
              <Bar dataKey="visits" name="Visits" radius={[0, 4, 4, 0]}>
                {heatmap.map((_, idx) => (
                  <Cell key={idx} fill={PAGE_COLORS[idx % PAGE_COLORS.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─── Marketing Email Stats ─── */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Automated Marketing Emails</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Welcome Emails', desc: 'Sent to new users within 24h', color: 'text-emerald-400' },
            { label: 'Feature Drips', desc: '5-email sequence for free users', color: 'text-blue-400' },
            { label: 'Upgrade Nudges', desc: 'Free users → paid plan', color: 'text-amber-400' },
            { label: 'Premium Upgrades', desc: 'Starter/Pro → higher tier', color: 'text-violet-400' },
          ].map(({ label, desc, color }, i) => (
            <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-4">
              <p className={`text-xs font-medium ${color}`}>{label}</p>
              <p className="text-[10px] text-white/30 mt-1">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-white/20 mt-4">
          Emails are sent automatically via <code className="text-white/30">/api/cron/marketing-emails</code>.
          Free users receive feature drip emails every 2 days until they upgrade.
          Paid users receive upgrade suggestions after 14 days on their current plan.
        </p>
      </div>

      {/* ─── Live Tracker Table ─── */}
      <LiveTracker
        users={liveData?.liveUsers || []}
        recentHistory={liveData?.recentHistory || []}
        loading={loading}
        isLive={isSocketLive}
      />
    </div>
  );
}
