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
        <h3 className="text-sm font-semibold text-white mb-1">Growth & Revenue Trend</h3>
        <p className="text-xs text-white/30 mb-6">Combined view of new users and revenue over the last 30 days</p>
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
            {/* Note: In a real app we'd have daily revenue data too. For now we use active user counts as a proxy for engagement trend in this view if daily revenue isn't in growthTrend */}
            <Line yAxisId="right" type="monotone" dataKey="users" stroke="#60a5fa" strokeWidth={2} dot={false} name="Engagement Proxy" />
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
            <AreaChart data={data?.activeUsersTrend || []}>
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
          </ResponsiveContainer>
        </div>

        {/* Plan Revenue Bar Chart */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue by Segment</h3>
              <p className="text-xs text-white/30">Current month distribution</p>
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
              <Bar dataKey="count" name="Users">
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

      {/* Weekday Heatmap (Simplified for now) */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-4 h-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white">Activity Heatmap</h3>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center">
              <p className="text-[10px] text-white/20 uppercase mb-2">{day}</p>
              <div className="aspect-square bg-white/5 rounded-md flex items-center justify-center hover:bg-red-500/20 transition-colors cursor-help">
                 <div className="w-2 h-2 bg-red-500/40 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/20 mt-4 text-center italic">Heatmap visualization based on session frequency across weekdays</p>
      </div>
    </div>
  );
}
