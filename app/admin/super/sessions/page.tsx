'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Clock, Users, Globe, MapPin, TrendingUp } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-white/10 text-white/50',
  starter: 'bg-blue-500/20 text-blue-400',
  pro: 'bg-violet-500/20 text-violet-400',
  enterprise: 'bg-amber-500/20 text-amber-400',
  custom: 'bg-emerald-500/20 text-emerald-400',
  owner: 'bg-red-500/20 text-red-400',
};

export default function SessionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/super/analytics/sessions', { headers: getAuthHeaders() });
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Session Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Login activity, time spent, and session overview</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Active Today</p>
            <p className="text-3xl font-bold text-white">{data?.stats?.activeToday ?? data?.todayActiveUsers ?? '—'}</p>
          </div>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Avg Session</p>
            <p className="text-3xl font-bold text-white">
              {data?.sessions?.length
                ? Math.round(data.sessions.reduce((s: number, u: any) => s + u.totalDurationMinutes, 0) / data.sessions.length)
                : '—'}
              <span className="text-sm font-normal text-white/40 ml-1">min</span>
            </p>
          </div>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Max Session</p>
            <p className="text-3xl font-bold text-white">
              {data?.stats?.maxSessionMinutes ?? '—'}
              <span className="text-sm font-normal text-white/40 ml-1">min</span>
            </p>
          </div>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Countries</p>
            <p className="text-3xl font-bold text-white">{data?.stats?.countriesCount ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Hourly Activity Chart */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Hourly Activity (Today)</h3>
        <p className="text-xs text-white/30 mb-5">Number of user sessions per hour</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data?.hourlyTrend || []}>
            <defs>
              <linearGradient id="sessionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
            <XAxis dataKey="hour" tick={{ fill: '#ffffff30', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8 }}
              itemStyle={{ color: '#a78bfa' }}
            />
            <Area type="monotone" dataKey="users" stroke="#a78bfa" strokeWidth={2} fill="url(#sessionGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* User Session Table */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Today&apos;s User Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['User', 'Plan', 'Sessions', 'Time Spent', 'First Login', 'Location'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-white/40 uppercase font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/3">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : (data?.sessions || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">No sessions today</td>
                </tr>
              ) : (
                (data.sessions as any[]).map((u: any, i: number) => (
                  <motion.tr
                    key={u.userId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/3 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-white/40 text-xs">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[u.plan] || 'bg-white/5 text-white/50'}`}>{u.plan}</span>
                    </td>
                    <td className="px-4 py-3 text-white/70">{u.totalSessions}</td>
                    <td className="px-4 py-3 text-white/70 font-mono">{u.totalDurationMinutes}m</td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {u.firstLogin ? new Date(u.firstLogin).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {u.city ? (
                        <div className="flex items-center gap-1 text-white/40 text-xs">
                          <MapPin className="w-3 h-3" />
                          {u.city}{u.distanceFromAdmin !== undefined ? `, ${u.distanceFromAdmin.toLocaleString()} km` : ''}
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs">Unknown</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
