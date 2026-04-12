'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, CreditCard, Clock, MapPin, ExternalLink, TrendingUp, TrendingDown, Activity, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

interface UserDetailModalProps {
  userId: string | null;
  onClose: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-white/10 text-white/60',
  starter: 'bg-blue-500/20 text-blue-400',
  pro: 'bg-violet-500/20 text-violet-400',
  enterprise: 'bg-amber-500/20 text-amber-400',
  custom: 'bg-emerald-500/20 text-emerald-400',
  owner: 'bg-red-500/20 text-red-400',
};

export default function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      const headers = getAuthHeaders();
      Promise.all([
        axios.get(`/api/admin/super/analytics/user-detail/${userId}`, { headers }),
        axios.get(`/api/admin/super/analytics/timeline?userId=${userId}`, { headers }),
      ])
        .then(([detailRes, timelineRes]) => {
          setData(detailRes.data);
          setTimeline(timelineRes.data?.timeline || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setData(null);
      setTimeline([]);
    }
  }, [userId]);

  if (!userId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Sidebar Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative h-full w-full max-w-xl bg-[#0f0f0f] border-l border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">User Intelligence</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-12 h-12 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto" />
                <p className="text-white/40 text-sm">Aggregating user data...</p>
              </div>
            ) : data ? (
              <div className="p-8 space-y-10">
                {/* Profile Section */}
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-red-500/10">
                    {(data.user.name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white">{data.user.name}</h3>
                    <p className="text-white/40 text-sm">{data.user.email}</p>
                    <div className="flex items-center gap-2 mt-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${PLAN_COLORS[data.user.plan] || 'bg-white/5 text-white/40'}`}>
                        {data.user.plan}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-emerald-500/10 text-emerald-400`}>
                        {data.user.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Revenue Row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Daily', value: data.user.revenue.daily },
                    { label: 'Weekly', value: data.user.revenue.weekly },
                    { label: 'Monthly', value: data.user.revenue.monthly, highlight: true },
                  ].map((rev) => (
                    <div key={rev.label} className={`p-4 rounded-2xl border ${rev.highlight ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/3 border-white/5'}`}>
                      <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider mb-1">{rev.label} Revenue</p>
                      <p className={`text-sm font-mono font-bold ${rev.highlight ? 'text-emerald-400' : 'text-white'}`}>
                        {fmt(rev.value)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                       <Shield className="w-3 h-3" /> Security & Access
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Unique ID</span>
                        <span className="text-white font-mono">{data.user.uniqueId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Joined</span>
                        <span className="text-white">{new Date(data.user.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Last Activity</span>
                        <span className="text-white">{data.user.lastLogin ? new Date(data.user.lastLogin).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                       <Clock className="w-3 h-3" /> Subscription Info
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Expiry</span>
                        <span className="text-red-400 font-bold">{data.user.expiresAt ? new Date(data.user.expiresAt).toLocaleDateString() : 'Lifetime'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Auto-Renew</span>
                        <span className="text-white/60">Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard className="w-3 h-3" /> Recent Financial activity
                  </h4>
                  <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white/3">
                          <th className="text-left px-4 py-2 text-white/30 font-medium">Date</th>
                          <th className="text-left px-4 py-2 text-white/30 font-medium">Amount</th>
                          <th className="text-left px-4 py-2 text-white/30 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.payments.length > 0 ? data.payments.map((p: any) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2 text-white/60">{new Date(p.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-white font-mono">{fmt(p.amount)}</td>
                            <td className="px-4 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={3} className="px-4 py-6 text-center text-white/20 italic">No payment history</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Location Section */}
                {data.sessions[0]?.city && (
                  <div className="p-6 bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-2xl">
                    <h4 className="text-xs font-bold text-white/40 uppercase mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Probable Location
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-white">{data.sessions[0].city}, {data.sessions[0].country}</p>
                        <p className="text-xs text-white/40 mt-1">Distance: {data.sessions[0].distance?.toLocaleString()} km from admin</p>
                      </div>
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-white/20" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Timeline */}
                {timeline.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-3 h-3" /> Activity Timeline
                    </h4>
                    <div className="relative pl-4">
                      {/* Vertical line */}
                      <div className="absolute left-1.5 top-0 bottom-0 w-px bg-white/5" />
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {timeline.slice(0, 20).map((t: any, idx: number) => (
                          <div key={t.id || idx} className="relative flex gap-3">
                            <div className="absolute -left-2.5 top-1 w-2 h-2 rounded-full bg-[#141414] border border-white/20" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-white/30 font-mono whitespace-nowrap">
                                  {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-xs text-white/60 font-mono truncate max-w-[180px]">{t.page}</span>
                              </div>
                              {t.previousPage && (
                                <p className="text-[10px] text-white/20 mt-0.5 flex items-center gap-1">
                                  <ChevronRight className="w-2.5 h-2.5" />
                                  from {t.previousPage}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            ) : (
              <div className="p-12 text-center text-white/20 italic">No data found</div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
