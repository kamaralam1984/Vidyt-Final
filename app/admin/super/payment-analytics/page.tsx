'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  CreditCard, CheckCircle2, XCircle, Clock, TrendingUp, Globe2,
  MapPin, Users, Sparkles, Activity, Zap, Crown, Wallet, Flame,
  Loader2, RefreshCw,
} from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

type Totals = {
  total: number; success: number; failed: number; pending: number;
  successRate: number; failRate: number;
  totalRevenue: number; failedAmount: number; pendingAmount: number;
};

type PaymentRow = {
  id: string; orderId: string; paymentId: string | null;
  userName: string; userEmail: string; userCurrentPlan: string;
  plan: string; billingPeriod: 'month' | 'year';
  amount: number; currency: string;
  status: 'success' | 'failed' | 'pending';
  gateway: string; country: string; city: string;
  createdAt: string;
};

type PaymentAnalytics = {
  totals: Totals;
  timeSeries: Array<{ date: string; success: number; failed: number; pending: number; revenue: number }>;
  byPlan: Array<{ plan: string; count: number; revenue: number }>;
  byGateway: Array<{ gateway: string; count: number; revenue: number }>;
  topCountries: Array<{ country: string; count: number; revenue: number; success: number; failed: number; pending: number }>;
  topCities: Array<{ city: string; country: string; count: number; revenue: number }>;
  recent: PaymentRow[];
};

const STATUS_META = {
  success: { label: 'Successful', color: '#10b981', glow: 'shadow-emerald-500/40', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', Icon: CheckCircle2 },
  failed:  { label: 'Failed',     color: '#ef4444', glow: 'shadow-red-500/40',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     Icon: XCircle },
  pending: { label: 'Pending',    color: '#f59e0b', glow: 'shadow-amber-500/40',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   Icon: Clock },
} as const;

const PLAN_COLORS: Record<string, string> = {
  free: '#94a3b8', starter: '#60a5fa', pro: '#a78bfa',
  enterprise: '#fbbf24', custom: '#34d399', owner: '#f87171',
};

function currency(n: number, code = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: code.toUpperCase(), maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${code} ${n}`;
  }
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = value;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{display.toLocaleString('en-IN')}</>;
}

export default function PaymentAnalyticsPage() {
  const [data, setData] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'pending'>('all');

  const load = useCallback(async () => {
    try {
      setErr('');
      const { data } = await axios.get('/api/admin/super/payment-analytics', { headers: getAuthHeaders() });
      setData(data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to load payment analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredRecent = useMemo(() => {
    if (!data) return [];
    if (filterStatus === 'all') return data.recent;
    return data.recent.filter(r => r.status === filterStatus);
  }, [data, filterStatus]);

  const statusDonutData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Success', value: data.totals.success, color: STATUS_META.success.color },
      { name: 'Failed',  value: data.totals.failed,  color: STATUS_META.failed.color  },
      { name: 'Pending', value: data.totals.pending, color: STATUS_META.pending.color },
    ].filter(d => d.value > 0);
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] text-white p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/60">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading payment analytics…</span>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="min-h-screen bg-[#060608] text-white p-8">
        <div className="max-w-xl mx-auto bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300 font-medium">{err || 'No data available'}</p>
          <button onClick={load} className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const t = data.totals;

  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden">
      {/* Animated VFX background */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <motion.div
          className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-emerald-500/30 via-emerald-500/10 to-transparent blur-3xl"
          animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-32 -right-40 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-purple-500/25 via-fuchsia-500/10 to-transparent blur-3xl"
          animate={{ x: [0, -60, 0], y: [0, 60, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 w-[600px] h-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative p-6 md:p-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-white via-emerald-200 to-purple-200 bg-clip-text text-transparent">
                  Payment Advanced Analytics
                </h1>
                <p className="text-white/40 text-sm mt-0.5">Live payment intelligence · plan insights · geo-distribution</p>
              </div>
            </div>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm backdrop-blur transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </motion.div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HeroStat
            index={0}
            label="Total Payments"
            value={t.total}
            icon={CreditCard}
            accent="from-blue-500 to-cyan-500"
          />
          <HeroStat
            index={1}
            label="Successful"
            value={t.success}
            sub={`${t.successRate}% success rate`}
            icon={CheckCircle2}
            accent="from-emerald-500 to-green-500"
            pulse
          />
          <HeroStat
            index={2}
            label="Failed"
            value={t.failed}
            sub={`${t.failRate}% failure rate`}
            icon={XCircle}
            accent="from-red-500 to-pink-500"
          />
          <HeroStat
            index={3}
            label="Pending"
            value={t.pending}
            icon={Clock}
            accent="from-amber-500 to-orange-500"
          />
        </div>

        {/* Revenue strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-cyan-500/10 p-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_55%)]" />
          <div className="relative flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/40">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-xs text-white/50 uppercase tracking-wider">Total Revenue Captured</div>
                <div className="text-4xl font-black text-white mt-1">
                  ₹<AnimatedCounter value={t.totalRevenue} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-white/40 uppercase">Failed Value</div>
                <div className="text-xl font-bold text-red-400 mt-0.5">₹<AnimatedCounter value={t.failedAmount} /></div>
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase">Pending Value</div>
                <div className="text-xl font-bold text-amber-400 mt-0.5">₹<AnimatedCounter value={t.pendingAmount} /></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Status donut */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
            className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Status Mix
              </h3>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Last 2000</span>
            </div>
            <div className="h-52">
              {statusDonutData.length === 0 ? (
                <EmptyBlock />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDonutData} dataKey="value" innerRadius={52} outerRadius={82} paddingAngle={4} stroke="none">
                      {statusDonutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f0f12', border: '1px solid #ffffff1a', borderRadius: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs mt-1">
              {statusDonutData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-white/60">{d.name}</span>
                  <span className="text-white/40">{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Time series */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> 30-Day Payment Flow
              </h3>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Success · Failed · Pending</span>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries}>
                  <defs>
                    <linearGradient id="gSuc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickFormatter={d => d.slice(5)} />
                  <YAxis stroke="#ffffff40" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0f0f12', border: '1px solid #ffffff1a', borderRadius: 10 }} />
                  <Area type="monotone" dataKey="success" stroke="#10b981" fill="url(#gSuc)" strokeWidth={2} />
                  <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#gFail)" strokeWidth={2} />
                  <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Plans + Gateways */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur p-5"
          >
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
              <Crown className="w-4 h-4 text-yellow-400" /> Revenue by Plan
            </h3>
            {data.byPlan.length === 0 ? <EmptyBlock /> : (
              <div className="space-y-3">
                {data.byPlan.map((p, i) => {
                  const maxRev = Math.max(...data.byPlan.map(x => x.revenue), 1);
                  const pct = (p.revenue / maxRev) * 100;
                  const color = PLAN_COLORS[p.plan] || '#94a3b8';
                  return (
                    <motion.div
                      key={p.plan}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                    >
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize font-medium text-white/80">{p.plan}</span>
                        <span className="text-white/50">
                          {p.count} · <span className="text-emerald-400 font-semibold">{currency(p.revenue)}</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.4 + i * 0.05, duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur p-5"
          >
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-purple-400" /> Gateways
            </h3>
            <div className="h-48">
              {data.byGateway.length === 0 ? <EmptyBlock /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byGateway}>
                    <CartesianGrid stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="gateway" stroke="#ffffff40" fontSize={11} />
                    <YAxis stroke="#ffffff40" fontSize={10} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#0f0f12', border: '1px solid #ffffff1a', borderRadius: 10 }} />
                    <Bar dataKey="count" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

        {/* Countries + Cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur p-5"
          >
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
              <Globe2 className="w-4 h-4 text-cyan-400" /> Top Countries
            </h3>
            {data.topCountries.length === 0 ? <EmptyBlock /> : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {data.topCountries.map((c, i) => {
                  const max = Math.max(...data.topCountries.map(x => x.count), 1);
                  const pct = (c.count / max) * 100;
                  return (
                    <motion.div
                      key={c.country}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.04 }}
                      className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl px-3 py-2 overflow-hidden transition-colors"
                    >
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/20 to-transparent"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5 + i * 0.04, duration: 0.6 }}
                      />
                      <div className="relative flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-white/80 font-medium">{c.country}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-400">✓{c.success}</span>
                          <span className="text-red-400">✗{c.failed}</span>
                          <span className="text-amber-400">○{c.pending}</span>
                          <span className="text-white/60 font-semibold">{c.count}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur p-5"
          >
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-pink-400" /> Top Cities / Areas
            </h3>
            {data.topCities.length === 0 ? <EmptyBlock /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {data.topCities.map((c, i) => (
                  <motion.div
                    key={`${c.city}-${c.country}-${i}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.03 }}
                    className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-white/80 truncate font-medium">{c.city}</div>
                      <div className="text-[10px] text-white/30 truncate">{c.country}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-pink-300">{c.count}</div>
                      <div className="text-[10px] text-emerald-400/80">{currency(c.revenue)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Advanced Activity Stream */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Advanced Activity
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                LIVE
              </span>
            </h3>
            <div className="flex gap-1">
              {(['all', 'success', 'failed', 'pending'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg capitalize transition-colors ${
                    filterStatus === s ? 'bg-white/15 text-white' : 'bg-white/5 text-white/50 hover:text-white/80'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/5 max-h-[520px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {filteredRecent.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-white/40">No payments match this filter.</div>
              )}
              {filteredRecent.map((r, idx) => {
                const meta = STATUS_META[r.status];
                const StatusIcon = meta.Icon;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: Math.min(idx * 0.015, 0.4) }}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] group transition-colors"
                  >
                    {/* status dot with pulse */}
                    <div className={`relative w-9 h-9 rounded-xl ${meta.bg} ${meta.border} border flex items-center justify-center shrink-0`}>
                      <StatusIcon className={`w-4 h-4 ${meta.text}`} />
                      {r.status === 'success' && (
                        <motion.div
                          className={`absolute inset-0 rounded-xl ${meta.border} border`}
                          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity, delay: idx * 0.1 }}
                        />
                      )}
                    </div>

                    {/* user + plan */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate max-w-[180px]">{r.userName}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                          style={{
                            background: `${PLAN_COLORS[r.plan] || '#94a3b8'}22`,
                            color: PLAN_COLORS[r.plan] || '#94a3b8',
                          }}
                        >
                          {r.plan}
                        </span>
                        <span className="text-[10px] text-white/30">{r.billingPeriod}</span>
                      </div>
                      <div className="text-[11px] text-white/40 truncate mt-0.5">
                        {r.userEmail} · <span className="text-white/30">#{r.orderId.slice(-10)}</span>
                      </div>
                    </div>

                    {/* location */}
                    <div className="hidden md:block text-right min-w-0">
                      <div className="text-[11px] text-white/60 flex items-center gap-1 justify-end">
                        <MapPin className="w-3 h-3 text-pink-400" />
                        <span className="truncate max-w-[120px]">{r.city}</span>
                      </div>
                      <div className="text-[10px] text-white/30">{r.country}</div>
                    </div>

                    {/* amount */}
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-black ${meta.text}`}>
                        {currency(r.amount, r.currency)}
                      </div>
                      <div className="text-[10px] text-white/30 uppercase tracking-wider">{r.gateway}</div>
                    </div>

                    {/* time */}
                    <div className="text-[10px] text-white/30 shrink-0 w-16 text-right">
                      {timeAgo(r.createdAt)}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="text-center text-[11px] text-white/20">
          Data refreshed {timeAgo(new Date().toISOString())} · Showing up to 2000 recent payment records
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub components
// ─────────────────────────────────────────────

function HeroStat({ label, value, sub, icon: Icon, accent, index, pulse }: {
  label: string; value: number; sub?: string; icon: any; accent: string; index: number; pulse?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 140 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5 overflow-hidden group"
    >
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wider">{label}</div>
          <div className="text-3xl font-black text-white mt-2">
            <AnimatedCounter value={value} />
          </div>
          {sub && <div className="text-[11px] text-white/40 mt-1">{sub}</div>}
        </div>
        <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
          {pulse && (
            <motion.div
              className={`absolute inset-0 rounded-xl bg-gradient-to-br ${accent}`}
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyBlock() {
  return (
    <div className="h-full flex items-center justify-center text-white/30 text-xs">
      <Users className="w-4 h-4 mr-2" /> No data yet
    </div>
  );
}
