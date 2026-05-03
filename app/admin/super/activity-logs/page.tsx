'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  ServerCrash,
  ScrollText,
  Trash2,
  CreditCard,
  Bell,
  RefreshCw,
  Filter,
  Loader2,
} from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

type Severity = 'critical' | 'warning' | 'info';
type Source = 'abuse' | 'audit' | 'control' | 'deletion' | 'payment' | 'notification';

interface LogEvent {
  id: string;
  source: Source;
  severity: Severity;
  type: string;
  title: string;
  message: string;
  actor?: string;
  timestamp: string;
  details?: Record<string, any>;
}

const RANGES: { id: string; label: string }[] = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

const SEVERITY_META: Record<Severity, { label: string; row: string; chip: string; icon: any }> = {
  critical: {
    label: 'Critical',
    row: 'bg-red-500/10 border-red-500/40',
    chip: 'bg-red-500/20 text-red-300 border-red-500/40',
    icon: AlertCircle,
  },
  warning: {
    label: 'Warning',
    row: 'bg-amber-500/8 border-amber-500/30',
    chip: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: AlertTriangle,
  },
  info: {
    label: 'Info',
    row: 'bg-white/[0.02] border-white/10',
    chip: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    icon: Info,
  },
};

const SOURCE_META: Record<Source, { label: string; icon: any; color: string }> = {
  abuse: { label: 'Abuse', icon: Shield, color: 'text-red-300' },
  audit: { label: 'Site Audit', icon: ServerCrash, color: 'text-orange-300' },
  control: { label: 'Admin Action', icon: ScrollText, color: 'text-purple-300' },
  deletion: { label: 'Deletion', icon: Trash2, color: 'text-pink-300' },
  payment: { label: 'Payment', icon: CreditCard, color: 'text-emerald-300' },
  notification: { label: 'Notification', icon: Bell, color: 'text-amber-300' },
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ActivityLogsPage() {
  const [range, setRange] = useState<string>('week');
  const [severity, setSeverity] = useState<'all' | Severity>('all');
  const [source, setSource] = useState<'all' | Source>('all');
  const [data, setData] = useState<{
    events: LogEvent[];
    counts: { total: number; critical: number; warning: number; info: number; bySource: Record<string, number> };
    since: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/admin/super/activity-logs?range=${range}&limit=1000`, {
        headers: getAuthHeaders(),
      });
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.events.filter((e) => {
      if (severity !== 'all' && e.severity !== severity) return false;
      if (source !== 'all' && e.source !== source) return false;
      return true;
    });
  }, [data, severity, source]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" /> Activity Log
          </h1>
          <p className="text-sm text-white/40">
            Unified feed of admin actions, abuse signals, payment failures, deletions, audit alerts, and limit hits.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Events" value={data?.counts.total ?? 0} tone="neutral" />
        <KpiCard label="Critical" value={data?.counts.critical ?? 0} tone="critical" />
        <KpiCard label="Warning" value={data?.counts.warning ?? 0} tone="warning" />
        <KpiCard label="Info" value={data?.counts.info ?? 0} tone="info" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-white/40 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Range
        </span>
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              range === r.id
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            {r.label}
          </button>
        ))}
        <span className="w-px h-5 bg-white/10 mx-1" />
        <span className="text-xs text-white/40 uppercase tracking-wider mr-1">Severity</span>
        {(['all', 'critical', 'warning', 'info'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeverity(s)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize ${
              severity === s
                ? 'bg-white/10 text-white border-white/30'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            {s}
          </button>
        ))}
        <span className="w-px h-5 bg-white/10 mx-1" />
        <span className="text-xs text-white/40 uppercase tracking-wider mr-1">Source</span>
        {(['all', 'abuse', 'audit', 'control', 'deletion', 'payment', 'notification'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize ${
              source === s
                ? 'bg-white/10 text-white border-white/30'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Feed */}
      <div className="space-y-2">
        {loading && !data ? (
          <div className="text-center py-16 text-white/40 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading activity log…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/40 text-sm border border-white/5 rounded-xl">
            No events in this range / filter.
          </div>
        ) : (
          filtered.map((e) => {
            const sev = SEVERITY_META[e.severity];
            const src = SOURCE_META[e.source];
            const SevIcon = sev.icon;
            const SrcIcon = src.icon;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 ${sev.row}`}
              >
                <div className="shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border ${sev.chip}`}>
                    <SevIcon className="w-4 h-4" />
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${sev.chip} px-2 py-0.5 rounded-full border`}>
                    {sev.label}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/40 mb-1">
                    <span className={`inline-flex items-center gap-1 ${src.color} font-medium`}>
                      <SrcIcon className="w-3.5 h-3.5" /> {src.label}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-white/30">{e.type}</span>
                    {e.actor && (
                      <>
                        <span>·</span>
                        <span className="text-white/50 truncate max-w-[260px]">{e.actor}</span>
                      </>
                    )}
                    <span className="ml-auto text-white/40">{timeAgo(e.timestamp)}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1 truncate">{e.title}</div>
                  {e.message && (
                    <div className="text-xs text-white/60 break-words whitespace-pre-wrap">
                      {e.message}
                    </div>
                  )}
                  {e.details && Object.keys(e.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-[10px] text-white/30 cursor-pointer uppercase tracking-wider">
                        Details
                      </summary>
                      <pre className="mt-1 text-[11px] text-white/50 bg-black/30 p-2 rounded border border-white/5 overflow-x-auto">
                        {JSON.stringify(e.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="text-center text-[10px] text-white/30 pt-2">
        Showing {filtered.length} of {data?.counts.total ?? 0} events · range: {range}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'critical' | 'warning' | 'info';
}) {
  const cls =
    tone === 'critical'
      ? 'border-red-500/40 bg-red-500/10 text-red-300'
      : tone === 'warning'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
        : tone === 'info'
          ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
          : 'border-white/10 bg-white/[0.02] text-white';
  return (
    <div className={`border rounded-xl p-4 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
