'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import LiveTracker from '@/components/admin/LiveTracker';
import AdminAlertPanel from '@/components/admin/AdminAlertPanel';
import { getAuthHeaders } from '@/utils/auth';
import { getSocket } from '@/hooks/useSocket';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import { Flame } from 'lucide-react';

const PAGE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function LivePage() {
  const [liveData, setLiveData] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSocketLive, setIsSocketLive] = useState(false);
  const fetchingRef = useRef(false);

  // Fetch full live data (called on initial load and on socket trigger)
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

  // Fetch page heatmap data
  const fetchHeatmap = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/super/analytics/heatmap', { headers: getAuthHeaders() });
      setHeatmap(res.data.pages || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLiveData();
    fetchHeatmap();
  }, [fetchLiveData, fetchHeatmap]);

  // Socket.io real-time updates + guaranteed 5s refresh
  useEffect(() => {
    const sock = getSocket();
    // Always keep a 5s polling safety net for deterministic freshness.
    const interval = setInterval(fetchLiveData, 5000);
    if (!sock) return () => clearInterval(interval);

    setIsSocketLive(sock.connected);

    const onConnect = () => setIsSocketLive(true);
    const onDisconnect = () => setIsSocketLive(false);

    // Re-fetch on any activity update (debounced — max once per 2s)
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

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Live Tracking</h1>
          <p className="text-white/40 text-sm mt-1">Real-time active user monitoring</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Online Now', value: liveData?.count ?? '—' },
          {
            label: 'Avg Session',
            value: liveData?.liveUsers?.length
              ? Math.round(liveData.liveUsers.reduce((s: number, u: any) => s + u.sessionDurationMinutes, 0) / liveData.liveUsers.length) + 'm'
              : '—',
          },
          {
            label: 'Countries',
            value: liveData?.liveUsers?.length
              ? new Set(liveData.liveUsers.map((u: any) => u.country).filter(Boolean)).size
              : '—',
          },
        ].map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-[#141414] border border-white/5 rounded-2xl p-5"
          >
            <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Live Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages (live aggregation) */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Most Visited Pages (Live Session)</h3>
          <div className="space-y-3">
            {Object.entries(
              liveData?.liveUsers?.reduce((acc: any, u: any) => {
                acc[u.currentPage] = (acc[u.currentPage] || 0) + 1;
                return acc;
              }, {}) || {}
            )
              .sort((a: any, b: any) => b[1] - a[1])
              .slice(0, 5)
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

        {/* Country Breakdown */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Users by Country</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(
              liveData?.liveUsers?.reduce((acc: any, u: any) => {
                const c = u.country || 'Unknown';
                acc[c] = (acc[c] || 0) + 1;
                return acc;
              }, {}) || {}
            )
              .sort((a: any, b: any) => b[1] - a[1])
              .map(([country, count]: any) => (
                <div key={country} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-sm text-white/70">
                  <span className="text-lg">
                    {country === 'India' ? '🇮🇳' : country === 'United States' ? '🇺🇸' : country === 'United Kingdom' ? '🇬🇧' : '🌐'}
                  </span>
                  <span>{country}</span>
                  <span className="text-white/30 text-xs">{count}</span>
                </div>
              ))}
            {!liveData?.liveUsers?.length && <p className="text-white/20 text-sm">No data</p>}
          </div>
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

      {/* Live Tracker Table */}
      <LiveTracker
        users={liveData?.liveUsers || []}
        loading={loading}
        isLive={isSocketLive}
      />
    </div>
  );
}
