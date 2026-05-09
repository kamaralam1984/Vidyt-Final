'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  User as UserIcon, Mail, Phone, Building, Calendar, Target, Compass,
  Youtube, BookOpen, Activity, CreditCard, MapPin, ArrowLeft, Loader2,
  AlertTriangle, RefreshCw, Clock, Globe, BarChart3,
} from 'lucide-react';

interface UserDetail {
  user: {
    id: string;
    name: string;
    email: string;
    uniqueId?: string;
    plan: string;
    status: string;
    expiresAt?: string;
    createdAt: string;
    lastLogin?: string;
    revenue?: number;
    companyName?: string;
    phone?: string;
    bio?: string;
    notebook?: {
      goal?: string;
      niche?: string;
      channelUrl?: string;
      experienceLevel?: string;
      postingFrequency?: string;
      note?: string;
      updatedAt?: string;
    } | null;
    usageStats?: {
      videosAnalyzed?: number;
      analysesThisMonth?: number;
      competitorsTracked?: number;
      hashtagsGenerated?: number;
      requestsToday?: number;
      lastRequestDate?: string;
    } | null;
    onboardingCompleted?: boolean;
  };
  payments: { id: string; amount: number; currency: string; status: string; plan: string; date: string; gateway?: string }[];
  sessions: { id: string; loginTime: string; logoutTime?: string; duration?: number; city?: string; country?: string; ip?: string }[];
  tracking: { id: string; page: string; timestamp: string; timeSpent?: number }[];
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(); } catch { return '—'; }
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

const NOTEBOOK_FIELDS: Array<{ key: keyof NonNullable<UserDetail['user']['notebook']>; label: string; icon: any }> = [
  { key: 'goal', label: 'Main goal', icon: Target },
  { key: 'niche', label: 'Niche', icon: Compass },
  { key: 'channelUrl', label: 'Channel URL', icon: Youtube },
  { key: 'experienceLevel', label: 'Experience level', icon: BarChart3 },
  { key: 'postingFrequency', label: 'Posting frequency', icon: Calendar },
];

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!params?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/admin/super/analytics/user-detail/${params.id}`, {
        headers: getAuthHeaders(),
      });
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error || 'User not found'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  const u = data.user;
  const nb = u.notebook;
  const us = u.usageStats;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-emerald-400" />
              {u.name || 'Unnamed user'}
            </h1>
            <p className="text-sm text-white/50">
              {u.email} · {u.uniqueId || u.id} · plan: <span className="text-emerald-300">{u.plan}</span>
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Profile + status strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Plan" value={u.plan} tone="info" />
        <Stat label="Status" value={u.status} tone={u.status === 'active' ? 'good' : 'warn'} />
        <Stat label="Joined" value={formatDate(u.createdAt).split(',')[0]} tone="info" />
        <Stat label="Last login" value={u.lastLogin ? formatDate(u.lastLogin) : 'Never'} tone="info" />
      </div>

      {/* Notebook */}
      <section className="bg-[#181818] border border-[#212121] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-fuchsia-400" /> Notebook
          </h2>
          {nb?.updatedAt && (
            <span className="text-xs text-white/40">Updated {formatDate(nb.updatedAt)}</span>
          )}
        </div>
        {!nb || (!nb.goal && !nb.niche && !nb.channelUrl && !nb.experienceLevel && !nb.postingFrequency && !nb.note) ? (
          <p className="text-sm text-white/40 italic">User hasn&apos;t filled in their notebook yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {NOTEBOOK_FIELDS.map(({ key, label, icon: Icon }) => {
              const v = (nb as any)[key];
              if (!v) return null;
              return (
                <div key={key} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-xs text-white/40 uppercase flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </div>
                  <div className="mt-1 text-sm text-white break-words">
                    {key === 'channelUrl' ? (
                      <a href={v} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{v}</a>
                    ) : v}
                  </div>
                </div>
              );
            })}
            {nb.note && (
              <div className="p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg md:col-span-2">
                <div className="text-xs text-fuchsia-300 uppercase">Note from user</div>
                <div className="mt-1 text-sm text-white/90 whitespace-pre-wrap">{nb.note}</div>
              </div>
            )}
          </div>
        )}
        {/* Profile fallbacks if notebook empty */}
        {(u.companyName || u.phone || u.bio) && (
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {u.companyName && <Field icon={Building} label="Company" value={u.companyName} />}
            {u.phone && <Field icon={Phone} label="Phone" value={u.phone} />}
            {u.bio && <Field icon={UserIcon} label="Bio" value={u.bio} />}
          </div>
        )}
      </section>

      {/* Usage stats */}
      {us && (
        <section className="bg-[#181818] border border-[#212121] rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-amber-400" /> API & Tool Usage
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Videos analyzed" value={us.videosAnalyzed ?? 0} tone="info" />
            <Stat label="Analyses this month" value={us.analysesThisMonth ?? 0} tone="info" />
            <Stat label="Competitors tracked" value={us.competitorsTracked ?? 0} tone="info" />
            <Stat label="Hashtags generated" value={us.hashtagsGenerated ?? 0} tone="info" />
            <Stat label="Requests today" value={us.requestsToday ?? 0} tone="info" />
            <Stat label="Last request" value={us.lastRequestDate ? formatDate(us.lastRequestDate) : '—'} tone="info" />
          </div>
        </section>
      )}

      {/* Recent page visits */}
      <section className="bg-[#181818] border border-[#212121] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-400" /> Recent page activity
          <span className="text-xs text-white/40 font-normal">last {data.tracking.length} events</span>
        </h2>
        {data.tracking.length === 0 ? (
          <p className="text-sm text-white/40 italic">No tracking data yet.</p>
        ) : (
          <div className="space-y-1">
            {data.tracking.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-sm"
              >
                <span className="font-mono text-cyan-300 truncate flex-1">{t.page}</span>
                <span className="text-white/50 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDuration(t.timeSpent)}
                </span>
                <span className="text-white/40 text-xs">{formatDate(t.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sessions */}
      <section className="bg-[#181818] border border-[#212121] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-400" /> Recent sessions
        </h2>
        {data.sessions.length === 0 ? (
          <p className="text-sm text-white/40 italic">No login sessions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-white/40 uppercase border-b border-white/5">
                  <th className="text-left py-2">Login</th>
                  <th className="text-left py-2">Logout</th>
                  <th className="text-left py-2">Duration</th>
                  <th className="text-left py-2">Location</th>
                  <th className="text-left py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((s) => (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="py-2 text-white/80">{formatDate(s.loginTime)}</td>
                    <td className="py-2 text-white/80">{s.logoutTime ? formatDate(s.logoutTime) : '—'}</td>
                    <td className="py-2 text-white/80">{formatDuration(s.duration)}</td>
                    <td className="py-2 text-white/80">
                      {s.city || s.country ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {[s.city, s.country].filter(Boolean).join(', ')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2 text-white/60 font-mono text-xs">{s.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payments */}
      <section className="bg-[#181818] border border-[#212121] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-emerald-400" /> Payments
        </h2>
        {data.payments.length === 0 ? (
          <p className="text-sm text-white/40 italic">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-white/40 uppercase border-b border-white/5">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Plan</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Gateway</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="py-2 text-white/80">{formatDate(p.date)}</td>
                    <td className="py-2 text-white/80">{p.plan}</td>
                    <td className="py-2 text-white/80">{p.amount} {p.currency}</td>
                    <td className={`py-2 ${p.status === 'success' ? 'text-emerald-400' : p.status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>
                      {p.status}
                    </td>
                    <td className="py-2 text-white/60">{p.gateway || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: any; tone: 'good' | 'warn' | 'info' }) {
  const toneCls = tone === 'good' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : 'text-white';
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
      <div className="text-xs text-white/40 uppercase">{label}</div>
      <div className={`mt-1 text-lg font-bold ${toneCls} break-words`}>{value}</div>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
      <div className="text-xs text-white/40 uppercase flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm text-white break-words">{value}</div>
    </div>
  );
}
