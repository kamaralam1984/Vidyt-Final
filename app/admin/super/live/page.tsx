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
  Flame, Globe, Users, UserPlus, Clock, MapPin, TrendingUp, TrendingDown,
  Calendar, Mail, Activity, BarChart3, Zap, AlertTriangle, CheckCircle,
  Eye, MousePointer, ChevronRight, ArrowUp, ArrowDown, Target,
  Wifi, WifiOff, RefreshCw, Layers,
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
type AlertType = 'spike' | 'drop' | null;

interface SmartAlert {
  type: AlertType;
  message: string;
  value: number;
}

export default function LivePage() {
  const [liveData, setLiveData] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [visitorStats, setVisitorStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [activeTab, setActiveTab] = useState<StatsTab>('daily');
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [smartAlert, setSmartAlert] = useState<SmartAlert | null>(null);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [nextUpdateIn, setNextUpdateIn] = useState(2);
  const [prevCount, setPrevCount] = useState<number>(0);
  const [countChanged, setCountChanged] = useState(false);

  const fetchingRef = useRef(false);
  const lastUpdatedRef = useRef<number>(Date.now());
  const countHistoryRef = useRef<number[]>([]);
  const prevCountRef = useRef<number>(0);

  // ─── Fetch helpers ────────────────────────────────────────────
  const fetchLiveData = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await axios.get('/api/admin/super/analytics/live', { headers: getAuthHeaders() });
      const data = res.data;
      const currentCount: number = data.count ?? 0;
      if (currentCount !== prevCountRef.current) {
        setPrevCount(prevCountRef.current);
        setCountChanged(true);
        setTimeout(() => setCountChanged(false), 600);
      }
      setLiveData(data);
      lastUpdatedRef.current = Date.now();
      setSecondsSinceUpdate(0);
      setNextUpdateIn(2);

      // Build activity feed from liveUsers + recentHistory
      const combined: any[] = [
        ...(data.liveUsers || []).map((u: any) => ({ ...u, status: 'online' })),
        ...(data.recentHistory || []).map((u: any) => ({ ...u, status: 'recent' })),
      ];
      setActivityFeed(combined.slice(0, 20));

      // Smart alert detection
      countHistoryRef.current.push(currentCount);
      if (countHistoryRef.current.length > 12) countHistoryRef.current.shift(); // keep last ~1 min

      if (countHistoryRef.current.length >= 4) {
        const recent = countHistoryRef.current.slice(-4);
        const avg = recent.slice(0, 3).reduce((a: number, b: number) => a + b, 0) / 3;
        const prev = prevCountRef.current;
        if (avg > 0) {
          if (currentCount >= avg * 2 && currentCount > prev) {
            setSmartAlert({ type: 'spike', message: `Traffic spike! ${currentCount} users online (${Math.round((currentCount / avg) * 100)}% of avg)`, value: currentCount });
            setAlertDismissed(false);
          } else if (currentCount < avg * 0.5 && prev > 0 && currentCount < prev) {
            setSmartAlert({ type: 'drop', message: `Traffic drop detected. ${currentCount} online vs avg ${Math.round(avg)}`, value: currentCount });
            setAlertDismissed(false);
          } else {
            setSmartAlert(null);
          }
        }
      }
      prevCountRef.current = currentCount;
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

  // ─── Init ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchLiveData();
    fetchHeatmap();
    fetchVisitorStats();
  }, [fetchLiveData, fetchHeatmap, fetchVisitorStats]);

  // Last-updated counter + next-update countdown (ticks every 500ms for smoother feel)
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = (Date.now() - lastUpdatedRef.current) / 1000;
      setSecondsSinceUpdate(Math.round(elapsed));
      setNextUpdateIn(Math.max(0, Math.ceil(2 - elapsed)));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Refresh visitor stats every 15s
  useEffect(() => {
    const interval = setInterval(fetchVisitorStats, 15000);
    return () => clearInterval(interval);
  }, [fetchVisitorStats]);

  // Socket.io real-time updates + 2s polling fallback
  useEffect(() => {
    // 2-second polling for live count + activity feed
    const liveInterval = setInterval(fetchLiveData, 2000);
    // 10-second polling for heatmap (less volatile)
    const heatmapInterval = setInterval(fetchHeatmap, 10000);

    const sock = getSocket();
    if (!sock) return () => { clearInterval(liveInterval); clearInterval(heatmapInterval); };

    setIsSocketLive(sock.connected);
    const onConnect = () => setIsSocketLive(true);
    const onDisconnect = () => setIsSocketLive(false);

    const onActivityUpdate = () => {
      fetchLiveData();
      fetchHeatmap();
    };

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    sock.on('live_users_update', onActivityUpdate);
    sock.on('activity_update', onActivityUpdate);
    sock.on('session_update', onActivityUpdate);

    return () => {
      clearInterval(liveInterval);
      clearInterval(heatmapInterval);
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      sock.off('live_users_update', onActivityUpdate);
      sock.off('activity_update', onActivityUpdate);
      sock.off('session_update', onActivityUpdate);
    };
  }, [fetchLiveData, fetchHeatmap]);

  // ─── Derived data ─────────────────────────────────────────────
  const countryData = visitorStats?.countryStats?.[activeTab] || [];
  const overview = visitorStats?.overview;

  const trendingPage = (() => {
    const entries = Object.entries(
      liveData?.liveUsers?.reduce((acc: any, u: any) => {
        acc[u.currentPage] = (acc[u.currentPage] || 0) + 1;
        return acc;
      }, {}) || {}
    ).sort((a: any, b: any) => b[1] - a[1]);
    return entries[0] ? { page: entries[0][0], count: entries[0][1] } : null;
  })();

  const topCountryLive = (() => {
    const entries = Object.entries(
      liveData?.liveUsers?.reduce((acc: any, u: any) => {
        if (u.country) acc[u.country] = (acc[u.country] || 0) + 1;
        return acc;
      }, {}) || {}
    ).sort((a: any, b: any) => (b[1] as number) - (a[1] as number));
    return entries[0] ? { country: String(entries[0][0]), count: entries[0][1] as number } : null;
  })();

  const avgSessionMinutes = liveData?.liveUsers?.length
    ? Math.round(liveData.liveUsers.reduce((s: number, u: any) => s + u.sessionDurationMinutes, 0) / liveData.liveUsers.length)
    : null;

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatLastUpdated = (secs: number) => {
    if (secs < 5) return 'Just now';
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5 min-h-screen bg-[#080808]">

      {/* ══════════════════ HEADER ══════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-r from-[#0e0e0e] via-[#111] to-[#0e0e0e] p-5"
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute -top-10 right-20 w-36 h-36 bg-emerald-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400/80">Live Dashboard</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Live Tracking <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">&</span> Analytics</h1>
            <p className="text-white/35 text-xs mt-0.5">Real-time user monitoring · growth analytics · smart alerts</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <AdminAlertPanel />

            {/* Socket / polling status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border font-medium ${
              isSocketLive
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-white/[0.04] border-white/[0.08] text-white/30'
            }`}>
              {isSocketLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isSocketLive ? 'Socket' : 'Polling'}
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] bg-white/[0.04] border border-white/[0.08] text-white/30 font-mono">
              <RefreshCw className={`w-3 h-3 ${nextUpdateIn === 0 ? 'animate-spin text-red-400' : ''}`} />
              {nextUpdateIn === 0 ? 'Syncing' : `${nextUpdateIn}s`}
            </div>

            {/* Online badge — glows on change */}
            <motion.div
              animate={countChanged ? { scale: [1, 1.12, 1], boxShadow: ['0 0 0px #22c55e00', '0 0 20px #22c55e60', '0 0 8px #22c55e30'] } : {}}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#22c55e]" />
              </span>
              <span className="text-emerald-400 text-sm font-black">{liveData?.count ?? 0} Online</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════ SMART ALERT BANNER ══════════════════ */}
      <AnimatePresence>
        {smartAlert && !alertDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className={`flex items-center justify-between px-5 py-3 rounded-xl border text-sm ${
              smartAlert.type === 'spike'
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                : 'bg-red-500/10 border-red-500/25 text-red-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {smartAlert.type === 'spike'
                ? <Zap className="w-4 h-4 flex-shrink-0" />
                : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              <span className="font-medium">{smartAlert.message}</span>
            </div>
            <button
              onClick={() => setAlertDismissed(true)}
              className="text-white/30 hover:text-white/60 transition-colors text-xs px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ INSIGHT CARDS ══════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            icon: Flame, color: 'text-orange-400', glow: '#f97316', bg: 'from-orange-500/10 to-transparent',
            label: 'Trending Page',
            value: trendingPage ? trendingPage.page : null,
            sub: trendingPage ? `${trendingPage.count} active now` : 'No live sessions',
            subColor: trendingPage ? 'text-orange-400' : 'text-white/20',
            truncate: true, delay: 0.05,
          },
          {
            icon: Globe, color: 'text-blue-400', glow: '#3b82f6', bg: 'from-blue-500/10 to-transparent',
            label: 'Top Country',
            value: topCountryLive ? `${FLAG_MAP[topCountryLive.country] || '🌐'} ${topCountryLive.country}` : null,
            sub: topCountryLive ? `${topCountryLive.count} users live` : 'No location data',
            subColor: topCountryLive ? 'text-blue-400' : 'text-white/20',
            delay: 0.1,
          },
          {
            icon: Clock, color: 'text-violet-400', glow: '#8b5cf6', bg: 'from-violet-500/10 to-transparent',
            label: 'Avg Session',
            value: avgSessionMinutes !== null ? `${avgSessionMinutes}m` : overview ? formatDuration(overview.avgSessionSeconds) : '—',
            sub: 'Active users', subColor: 'text-white/30', delay: 0.15,
          },
          {
            icon: smartAlert?.type === 'drop' ? TrendingDown : TrendingUp,
            color: smartAlert?.type === 'spike' ? 'text-amber-400' : smartAlert?.type === 'drop' ? 'text-red-400' : 'text-emerald-400',
            glow: smartAlert?.type === 'spike' ? '#f59e0b' : smartAlert?.type === 'drop' ? '#ef4444' : '#22c55e',
            bg: smartAlert?.type === 'spike' ? 'from-amber-500/10 to-transparent' : smartAlert?.type === 'drop' ? 'from-red-500/10 to-transparent' : 'from-emerald-500/10 to-transparent',
            label: 'Traffic',
            value: String(liveData?.count ?? '—'),
            sub: smartAlert?.type === 'spike' ? '↑ Spike detected' : smartAlert?.type === 'drop' ? '↓ Drop detected' : '● Normal',
            subColor: smartAlert?.type === 'spike' ? 'text-amber-400' : smartAlert?.type === 'drop' ? 'text-red-400' : 'text-emerald-400',
            delay: 0.2,
          },
          {
            icon: UserPlus, color: 'text-red-400', glow: '#ef4444', bg: 'from-red-500/10 to-transparent',
            label: 'New Today',
            value: String(overview?.newUsers?.today ?? '—'),
            sub: `This month: ${overview?.newUsers?.month ?? '—'}`, subColor: 'text-white/30', delay: 0.25,
          },
        ].map(({ icon: Icon, color, glow, bg, label, value, sub, subColor, truncate, delay }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            whileHover={{ y: -2, boxShadow: `0 8px 30px ${glow}20` }}
            className={`relative overflow-hidden bg-gradient-to-br ${bg} border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-2 group transition-all duration-300`}
          >
            <div className="absolute inset-0 bg-[#111] -z-10 rounded-2xl" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${glow}18` }}>
                <Icon className={`w-3.5 h-3.5 ${color}`} style={{ filter: `drop-shadow(0 0 4px ${glow}60)` }} />
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">{label}</p>
            </div>
            {value ? (
              <p className={`text-sm font-bold text-white ${truncate ? 'truncate' : ''}`}>{value}</p>
            ) : (
              <p className="text-sm text-white/20">—</p>
            )}
            <p className={`text-[11px] ${subColor}`}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ══════════════════ OVERVIEW METRIC CARDS ══════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Online Now', value: liveData?.count ?? '—', icon: Activity, glow: '#22c55e', textColor: 'text-emerald-400', live: true },
          {
            label: 'Avg Session',
            value: avgSessionMinutes !== null ? `${avgSessionMinutes}m` : overview ? formatDuration(overview.avgSessionSeconds) : '—',
            icon: Clock, glow: '#3b82f6', textColor: 'text-blue-400',
          },
          {
            label: 'Countries',
            value: liveData?.liveUsers?.length ? new Set(liveData.liveUsers.map((u: any) => u.country).filter(Boolean)).size : '—',
            icon: Globe, glow: '#8b5cf6', textColor: 'text-violet-400',
          },
          { label: 'Total Users', value: overview?.totalUsers?.toLocaleString() ?? '—', icon: Users, glow: '#6b7280', textColor: 'text-white/70' },
          { label: 'New Today', value: overview?.newUsers?.today ?? '—', icon: UserPlus, glow: '#f59e0b', textColor: 'text-amber-400' },
          { label: 'This Month', value: overview?.newUsers?.month ?? '—', icon: TrendingUp, glow: '#ef4444', textColor: 'text-red-400' },
        ].map(({ label, value, icon: Icon, glow, textColor, live }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            whileHover={{ y: -2, boxShadow: `0 8px 24px ${glow}25` }}
            className={`relative overflow-hidden bg-[#101010] border rounded-2xl p-4 transition-all duration-300 ${
              live ? 'border-emerald-500/20' : 'border-white/[0.06]'
            }`}
          >
            {live && countChanged && (
              <motion.div initial={{ opacity: 0.5 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }}
                className="absolute inset-0 rounded-2xl" style={{ backgroundColor: `${glow}20` }} />
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${glow}18` }}>
                <Icon className={`w-3.5 h-3.5 ${textColor}`} style={{ filter: `drop-shadow(0 0 3px ${glow}80)` }} />
              </div>
              <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold">{label}</p>
            </div>
            <motion.p key={String(value)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`text-2xl font-black ${live ? textColor : 'text-white'}`}
              style={live ? { textShadow: `0 0 16px ${glow}60` } : {}}>
              {value}
            </motion.p>
          </motion.div>
        ))}
      </div>

      {/* ══════════════════ GROWTH PERIOD TABS ══════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Today', value: overview?.newUsers?.today, period: 'daily' as StatsTab },
          { label: 'This Week', value: overview?.newUsers?.week, period: 'weekly' as StatsTab },
          { label: 'This Month', value: overview?.newUsers?.month, period: 'monthly' as StatsTab },
          { label: 'This Year', value: overview?.newUsers?.year, period: 'yearly' as StatsTab },
        ].map(({ label, value, period }, i) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            whileHover={{ y: -1 }}
            onClick={() => setActiveTab(period)}
            className={`text-left relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${
              activeTab === period
                ? 'border-red-500/35 bg-red-500/[0.06] shadow-[0_0_20px_#ef444420]'
                : 'bg-[#101010] border-white/[0.06] hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">New Users {label}</p>
              {activeTab === period && <ChevronRight className="w-3 h-3 text-red-400" />}
            </div>
            <motion.p key={String(value)} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`text-3xl font-black ${activeTab === period ? 'text-red-400' : 'text-white'}`}>
              {value ?? '—'}
            </motion.p>
          </motion.button>
        ))}
      </div>

      {/* ══════════════════ MAIN GRID: CHARTS + ACTIVITY FEED ══════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: Country + Growth ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Country Analytics */}
          <div className="bg-[#0e0e0e] border border-white/[0.07] rounded-2xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
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
              <div className="h-40 flex flex-col items-center justify-center gap-3">
                <Globe className="w-10 h-10 text-white/10" />
                <p className="text-white/20 text-sm">No visitor data for this period</p>
                <p className="text-white/10 text-xs">Data will appear once sessions are recorded</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={280}>
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
                        tickFormatter={(v) => `${FLAG_MAP[v] || '🌐'} ${v?.length > 13 ? v.slice(0, 13) + '…' : v || 'Unknown'}`}
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

                {/* Pie Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={countryData.slice(0, 8).map((c: any, i: number) => ({
                          name: c.country || 'Unknown',
                          value: c.uniqueUsers,
                          fill: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={100}
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

                {/* Table */}
                <div className="lg:col-span-2">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left text-[10px] text-white/40 uppercase tracking-wider py-2 px-3">Country</th>
                          <th className="text-right text-[10px] text-white/40 uppercase tracking-wider py-2 px-3">Sessions</th>
                          <th className="text-right text-[10px] text-white/40 uppercase tracking-wider py-2 px-3">Users</th>
                          <th className="text-right text-[10px] text-white/40 uppercase tracking-wider py-2 px-3">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {countryData.map((c: any, i: number) => {
                          const total = countryData.reduce((s: number, x: any) => s + x.sessions, 0);
                          const share = total > 0 ? ((c.sessions / total) * 100).toFixed(1) : '0';
                          return (
                            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="py-2.5 px-3 text-sm text-white/70">
                                <span className="mr-2 text-base">{FLAG_MAP[c.country] || '🌐'}</span>
                                {c.country || 'Unknown'}
                              </td>
                              <td className="py-2.5 px-3 text-sm text-white/50 text-right font-mono">{c.sessions.toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-sm text-white/50 text-right font-mono">{c.uniqueUsers.toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-14 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${share}%`, backgroundColor: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                                    />
                                  </div>
                                  <span className="text-xs text-white/40 font-mono w-9 text-right">{share}%</span>
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

          {/* User Growth Chart */}
          {visitorStats?.userGrowth?.length > 0 && (
            <div className="bg-[#0e0e0e] border border-white/[0.07] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">User Growth — Last 12 Months</h3>
                <span className="ml-auto text-xs text-white/20">New signups / month</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
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
                  <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#growthGrad)" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Right: Live Activity Feed ── */}
        <div className="xl:col-span-1">
          <div className="bg-[#0e0e0e] border border-white/[0.07] rounded-2xl p-5 sticky top-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                </div>
                <h3 className="text-sm font-semibold text-white">Live Activity</h3>
              </div>
              <span className="text-[10px] text-white/30 bg-white/5 px-2 py-1 rounded-full">
                {activityFeed.length} events
              </span>
            </div>

            {activityFeed.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <div className="p-4 rounded-full bg-white/3">
                  <Activity className="w-8 h-8 text-white/10" />
                </div>
                <p className="text-white/20 text-sm">No active sessions</p>
                <p className="text-white/10 text-xs">Activity will appear here in real-time</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                <AnimatePresence initial={false}>
                  {activityFeed.map((user, i) => (
                    <motion.div
                      key={user.sessionId || i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: i * 0.02 }}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                        user.status === 'online'
                          ? 'bg-emerald-500/[0.06] border-emerald-500/15 shadow-[0_0_12px_#22c55e0a]'
                          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600/50 to-red-800/50 flex items-center justify-center text-white font-bold text-[10px]">
                          {(user.name || 'U')[0].toUpperCase()}
                        </div>
                        {user.status === 'online' && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-[#141414]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-medium text-white/80 truncate">{user.name || 'Unknown'}</p>
                          <span className={`text-[9px] flex-shrink-0 px-1.5 py-0.5 rounded-full ${
                            user.plan === 'pro' ? 'bg-violet-500/20 text-violet-400' :
                            user.plan === 'starter' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-white/5 text-white/30'
                          }`}>
                            {user.plan || 'free'}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/30 truncate mt-0.5">{user.currentPage}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {user.country && (
                            <span className="text-[9px] text-white/25">
                              {FLAG_MAP[user.country] || '🌐'} {user.city || user.country}
                            </span>
                          )}
                          <span className={`text-[9px] ml-auto ${user.status === 'online' ? 'text-emerald-400' : 'text-white/20'}`}>
                            {user.status === 'online' ? `${user.sessionDurationMinutes}m` : 'Recent'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════ PAGES SECTION ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Page Distribution */}
        <div className="bg-[#0e0e0e] border border-white/[0.07] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Live Page Distribution</h3>
          </div>
          {(() => {
            const pages = Object.entries(
              liveData?.liveUsers?.reduce((acc: any, u: any) => {
                acc[u.currentPage] = (acc[u.currentPage] || 0) + 1;
                return acc;
              }, {}) || {}
            ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 7);
            const total = pages.reduce((s, [, c]) => s + (c as number), 0);
            return pages.length === 0 ? (
              <div className="py-8 text-center">
                <Eye className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-white/20 text-sm">No active sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pages.map(([page, count]: any, i) => (
                  <div key={page}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PAGE_COLORS[i % PAGE_COLORS.length] }} />
                        <span className="text-xs font-mono text-white/60 truncate max-w-[220px]">{page}</span>
                      </div>
                      <span className="text-xs text-white/40 ml-2">{count}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: PAGE_COLORS[i % PAGE_COLORS.length] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / total) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Top Pages (DB, last 7 days) */}
        <div className="bg-[#0e0e0e] border border-white/[0.07] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Top Pages — Last 7 Days</h3>
          </div>
          {(visitorStats?.topPages || []).length === 0 ? (
            <div className="py-8 text-center">
              <BarChart3 className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-white/20 text-sm">No page data yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(visitorStats?.topPages || []).slice(0, 7).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-white/20 w-4 text-right flex-shrink-0">{i + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PAGE_COLORS[i % PAGE_COLORS.length] }} />
                    <span className="text-xs font-mono text-white/60 truncate">{p.page}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-white/40">{p.visits}</span>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{p.uniqueVisitors}u</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════ PAGE HEATMAP ══════════════════ */}
      {heatmap.length > 0 && (
        <div className="bg-[#0e0e0e] border border-white/[0.07] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Page Heatmap</h3>
            <span className="text-xs text-white/30 ml-auto">Last 7 days · visit frequency</span>
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

      {/* ══════════════════ LIVE LOCATION GRID ══════════════════ */}
      <div className="bg-[#0e0e0e] border border-white/[0.07] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Live Users by Location</h3>
          <span className="ml-auto text-xs text-white/20">{liveData?.count ?? 0} online</span>
        </div>
        {!liveData?.liveUsers?.length ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <div className="p-4 rounded-full bg-white/3">
              <MapPin className="w-10 h-10 text-white/10" />
            </div>
            <p className="text-white/20 text-sm">No users currently online</p>
            <p className="text-white/10 text-xs">Location data will appear when users are active</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(
              liveData.liveUsers.reduce((acc: any, u: any) => {
                const key = [u.country, u.state, u.city].filter(Boolean).join(' > ') || 'Unknown';
                if (!acc[key]) acc[key] = { country: u.country, state: u.state, city: u.city, count: 0, users: [] };
                acc[key].count++;
                acc[key].users.push({ name: u.name, email: u.email, distance: u.distanceFromAdmin, page: u.currentPage, duration: u.sessionDurationMinutes, plan: u.plan });
                return acc;
              }, {})
            )
              .sort((a: any, b: any) => b[1].count - a[1].count)
              .map(([key, data]: any) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{FLAG_MAP[data.country] || '🌐'}</span>
                      <div>
                        <p className="text-sm font-medium text-white/80">{data.city || 'Unknown City'}</p>
                        <p className="text-[10px] text-white/30">{[data.state, data.country].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">{data.count}</span>
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
                            <span className="text-[9px] text-white/25">{Math.round(u.distance)} km</span>
                          )}
                          <span className="text-[9px] text-emerald-400 font-medium">{u.duration}m</span>
                        </div>
                      </div>
                    ))}
                    {data.users.length > 3 && (
                      <p className="text-[10px] text-white/20 text-center pt-1">+{data.users.length - 3} more</p>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      {/* ══════════════════ MARKETING EMAILS ══════════════════ */}
      <div className="bg-[#0e0e0e] border border-white/[0.07] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Automated Marketing Emails</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Welcome Emails', desc: 'Sent to new users within 24h', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
            { label: 'Feature Drips', desc: '5-email sequence for free users', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Layers },
            { label: 'Upgrade Nudges', desc: 'Free users → paid plan', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: ArrowUp },
            { label: 'Premium Upgrades', desc: 'Starter/Pro → higher tier', color: 'text-violet-400', bg: 'bg-violet-500/10', icon: Target },
          ].map(({ label, desc, color, bg, icon: Icon }, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <p className={`text-xs font-semibold ${color}`}>{label}</p>
              <p className="text-[10px] text-white/30 mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-white/15 mt-4">
          Triggered via <code className="text-white/25">/api/cron/marketing-emails</code> · Free users receive drip emails every 2 days · Paid users get upgrade prompts after 14 days
        </p>
      </div>

      {/* ══════════════════ LIVE TRACKER TABLE ══════════════════ */}
      <LiveTracker
        users={liveData?.liveUsers || []}
        recentHistory={liveData?.recentHistory || []}
        loading={loading}
        isLive={isSocketLive}
      />
    </div>
  );
}
