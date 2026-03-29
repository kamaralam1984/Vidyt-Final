'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Line, Area, AreaChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, BarChart
} from 'recharts';
import { BarChart2, TrendingUp, Users, Activity, Calendar } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';
import PaymentFunnel from '@/components/admin/PaymentFunnel';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/super/analytics/overview', { headers: getAuthHeaders() });
      setData(res.data);
      setError('');
    } catch (e) {
      console.error(e);
      setError('Failed to load analytics data.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="p-8 text-white/40">Loading analytics...</div>;

  return (
    <div className="p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Advanced Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Deep dive into growth and engagement trends</p>
      </motion.div>
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Main Combined Chart */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Growth & Engagement Trend</h3>
        <p className="text-xs text-white/30 mb-6">Combined view of new users and session activity over the last 30 days</p>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data?.growthTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#ffffff30', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            />
            <YAxis yAxisId="left" tick={{ fill: '#ffffff30', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#ffffff30', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8 }}
              labelStyle={{ color: '#ffffff80', fontSize: 11 }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, color: '#fff' }} />
            <Area yAxisId="left" type="monotone" dataKey="users" fill="#ef4444" stroke="#ef4444" fillOpacity={0.1} name="New Users" />
            <Line yAxisId="right" type="monotone" data={data?.activeUsersTrend} dataKey="count" stroke="#60a5fa" strokeWidth={2} dot={false} name="Active Users" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users Area Chart */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">User Activity (DAU)</h3>
              <p className="text-xs text-white/30">Daily active users over 30 days</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {data?.activeUsersTrend?.length ? (
              <AreaChart data={data.activeUsersTrend}>
                <defs>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#ffffff30', fontSize: 10 }}
                  tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#activeGrad)" strokeWidth={2} name="Active Users" />
              </AreaChart>
            ) : (
              <div className="h-full flex items-center justify-center text-white/10 text-xs italic">
                No activity data available for the selected period
              </div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Plan Revenue Bar Chart */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Plan Distribution</h3>
              <p className="text-xs text-white/30">Users per plan segment</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.planDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
              <XAxis dataKey="plan" tick={{ fill: '#ffffff30', fontSize: 10 }} />
              <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8 }}
                cursor={{ fill: 'white', opacity: 0.05 }}
              />
              <Bar dataKey="count" name="Users" radius={[4, 4, 0, 0]}>
                {(data?.planDistribution || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={['#60a5fa', '#a78bfa', '#fbbf24', '#34d399', '#f87171'][index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Funnel */}
      <PaymentFunnel />

      {/* Weekday Heatmap */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-4 h-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white">Activity Heatmap</h3>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
            const dayNum = i + 1;
            const activity = data?.weekdayActivity?.find((w: any) => w.day === dayNum)?.count || 0;
            const maxActivity = Math.max(...(data?.weekdayActivity?.map((w: any) => w.count) || [1]));
            const intensity = activity > 0 ? Math.max(0.2, activity / maxActivity) : 0.05;
            
            return (
              <div key={day} className="text-center group">
                <p className="text-[10px] text-white/20 uppercase mb-2 group-hover:text-white/40 transition-colors">{day}</p>
                <div 
                  className="aspect-square rounded-lg flex items-center justify-center transition-all duration-300 relative overflow-hidden"
                  style={{ backgroundColor: `rgba(239, 68, 68, ${intensity * 0.3})`, border: `1px solid rgba(239, 68, 68, ${intensity * 0.5})` }}
                >
                   <div 
                    className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                    style={{ opacity: activity > 0 ? 1 : 0.2, transform: `scale(${0.5 + intensity * 0.5})` }}
                   />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#1a1a1a]/80 transition-opacity">
                      <span className="text-[10px] font-bold text-white">{activity} sessions</span>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-white/20 mt-4 text-center italic">Heatmap visualization based on session frequency across weekdays</p>
      </div>

    </div>
  );
}
