'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Server, Database, Cpu, MemoryStick, Radio, Zap, RefreshCw, ShieldAlert,
  Play, Pause, Trash2, Download, Upload, RotateCcw, AlertTriangle, CheckCircle2,
  XCircle, Activity, HardDrive, Layers, Archive, ChevronRight, ChevronDown,
  Network, Bug, Clock, BarChart3, Package, Gauge, Loader2, Terminal,
  TrendingUp, TrendingDown, Minus, GitBranch, Box, AlertCircle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface QueueStat {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  isPaused: boolean;
  error: string | null;
}
interface CollectionStat {
  name: string;
  count: number;
  size: string;
  storageSize: string;
  avgObjSize: string;
  indexCount: number;
  indexSize: string;
}
interface BackendData {
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
    memory: { heapUsed: number; heapTotal: number; rss: number; external: number; heapPercent: number };
    cpu: { user: number; system: number };
  };
  database: {
    status: string;
    host: string;
    name: string;
    collections: CollectionStat[];
    totalDocuments: number;
    totalCollections: number;
  };
  redis: {
    connected: boolean;
    version?: string;
    usedMemory?: string;
    connectedClients?: number;
    keyspaceHits?: number;
    keyspaceMisses?: number;
    uptimeSeconds?: number;
    error?: string;
  };
  queues: QueueStat[];
  errors: {
    total: number;
    unresolved: number;
    byType: Array<{ _id: string; count: number; unresolved: number }>;
    recent: any[];
  };
  backups: { total: number; last: any };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
function statusColor(status: string) {
  if (status === 'connected') return 'text-emerald-400';
  if (status === 'connecting') return 'text-amber-400';
  return 'text-red-400';
}

// ── Sub-Components ──────────────────────────────────────────────────────────

// Animated circular gauge
function Gauge360({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const r = 36, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="90" height="90" className="rotate-[-90deg]">
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <motion.circle
          cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="-mt-[70px] flex flex-col items-center">
        <span className="text-xl font-bold text-white">{pct}%</span>
        <span className="text-[10px] text-white/40 mt-1">{label}</span>
      </div>
      <div className="mt-8 text-xs text-white/50">{value}/{max} MB</div>
    </div>
  );
}

// Pulsing status dot
function PulseDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
    </span>
  );
}

// Neon metric card
function MetricCard({ icon: Icon, label, value, sub, color, glow }: {
  icon: any; label: string; value: string | number; sub?: string; color: string; glow: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0d] p-5 group"
      style={{ boxShadow: `0 0 30px ${glow}10` }}
      whileHover={{ boxShadow: `0 0 40px ${glow}30`, y: -2 }}
    >
      {/* scan line */}
      <motion.div
        className="absolute inset-x-0 h-px opacity-0 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white" style={{ textShadow: `0 0 20px ${color}` }}>{value}</p>
          {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: `${glow}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

// Queue card
function QueueCard({ queue, onAction, loading }: { queue: QueueStat; onAction: (a: string, q: string) => void; loading: string }) {
  const total = queue.waiting + queue.active + queue.completed + queue.failed;
  const healthPct = total > 0 ? Math.round(((queue.completed) / total) * 100) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl border border-white/5 bg-[#0d0d0d] p-5 overflow-hidden"
      style={{ boxShadow: queue.error ? '0 0 30px rgba(239,68,68,0.1)' : '0 0 30px rgba(139,92,246,0.05)' }}
    >
      {/* animated border glow on active */}
      {queue.active > 0 && (
        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ border: '1px solid rgba(139,92,246,0.3)', boxShadow: 'inset 0 0 20px rgba(139,92,246,0.05)' }}
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">{queue.name}</span>
          {queue.error && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
        </div>
        <div className="flex items-center gap-1.5">
          <PulseDot ok={!queue.isPaused && !queue.error} />
          <span className={`text-xs ${queue.isPaused ? 'text-amber-400' : queue.error ? 'text-red-400' : 'text-emerald-400'}`}>
            {queue.isPaused ? 'Paused' : queue.error ? 'Error' : 'Running'}
          </span>
        </div>
      </div>

      {queue.error ? (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2 mb-4">{queue.error}</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Waiting', value: queue.waiting, color: 'text-amber-400' },
            { label: 'Active', value: queue.active, color: 'text-blue-400' },
            { label: 'Done', value: queue.completed, color: 'text-emerald-400' },
            { label: 'Failed', value: queue.failed, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-white/30">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Health bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-white/30 mb-1">
          <span>Health</span><span>{healthPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: healthPct > 80 ? '#10b981' : healthPct > 50 ? '#f59e0b' : '#ef4444' }}
            initial={{ width: 0 }} animate={{ width: `${healthPct}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {!queue.error && (
        <div className="flex gap-2">
          <button
            onClick={() => onAction(queue.isPaused ? 'resume-queue' : 'pause-queue', queue.name)}
            disabled={!!loading}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              queue.isPaused
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
            }`}
          >
            {loading === `${queue.isPaused ? 'resume' : 'pause'}-${queue.name}` ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : queue.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {queue.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => onAction('clean-failed', queue.name)}
            disabled={!!loading || queue.failed === 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-40"
          >
            {loading === `clean-${queue.name}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Clean Failed
          </button>
          <button
            onClick={() => onAction('drain-queue', queue.name)}
            disabled={!!loading || queue.waiting === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/5 transition-all disabled:opacity-40"
          >
            Drain
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BackendControlPage() {
  const [data, setData] = useState<BackendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'queues' | 'errors' | 'backup'>('overview');
  const [backupLoading, setBackupLoading] = useState('');
  const [expandedCols, setExpandedCols] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/super/backend-control?action=full', { headers: getAuthHeaders() });
      setData(res.data);
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to load backend data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    refreshTimer.current = setInterval(load, 15000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [load]);

  const queueAction = async (action: string, queueName: string) => {
    const key = `${action.split('-')[0]}-${queueName}`;
    setActionLoading(key);
    try {
      const res = await axios.post('/api/admin/super/backend-control', { action, queueName }, { headers: getAuthHeaders() });
      showToast('success', res.data.message || `Done: ${action}`);
      load();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const createBackup = async (type: string) => {
    setBackupLoading(type);
    try {
      const res = await axios.post('/api/admin/super/backend-control', { action: 'create-backup', type }, { headers: getAuthHeaders(), timeout: 90000 });
      showToast('success', `Backup created: ${res.data.documents} docs, ${res.data.size}`);
      load();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Backup failed');
    } finally {
      setBackupLoading('');
    }
  };

  const downloadBackup = async (backupId: string) => {
    setActionLoading(`dl-${backupId}`);
    try {
      const res = await axios.post('/api/admin/super/backend-control', { action: 'download-backup', backupId }, { headers: getAuthHeaders() });
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = res.data.fileName || 'backup.json'; a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Backup downloaded');
    } catch { showToast('error', 'Download failed'); }
    finally { setActionLoading(''); }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('WARNING: This will replace current data with the backup. Continue?')) return;
    if (!confirm('FINAL WARNING: All matching collections will be overwritten. Are you absolutely sure?')) return;
    setActionLoading(`restore-${backupId}`);
    try {
      await axios.post('/api/admin/super/backend-control', { action: 'restore-backup', backupId }, { headers: getAuthHeaders(), timeout: 120000 });
      showToast('success', 'Restore completed successfully');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Restore failed');
    } finally { setActionLoading(''); }
  };

  const resolveAllErrors = async () => {
    if (!confirm('Resolve all unresolved errors?')) return;
    setActionLoading('resolve-errors');
    try {
      const res = await axios.post('/api/admin/super/backend-control', { action: 'resolve-all-errors' }, { headers: getAuthHeaders() });
      showToast('success', `${res.data.count} errors resolved`);
      load();
    } catch { showToast('error', 'Failed to resolve errors'); }
    finally { setActionLoading(''); }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'queues', label: 'Queues', icon: GitBranch },
    { id: 'errors', label: 'Errors', icon: Bug },
    { id: 'backup', label: 'Backup & Restore', icon: Archive },
  ] as const;

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 space-y-6 relative overflow-hidden">

      {/* ── Background VFX ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        {/* Neon orbs */}
        <motion.div className="absolute w-96 h-96 rounded-full blur-3xl opacity-5"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', top: '-10%', left: '-5%' }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div className="absolute w-80 h-80 rounded-full blur-3xl opacity-5"
          style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)', bottom: '10%', right: '5%' }}
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Horizontal scan line */}
        <motion.div className="absolute left-0 right-0 h-px opacity-20"
          style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, #0ea5e9, transparent)' }}
          animate={{ top: ['0%', '100%'] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* ── Header ── */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #7c3aed20, #0ea5e920)', border: '1px solid rgba(124,58,237,0.3)' }}
            animate={{ boxShadow: ['0 0 20px rgba(124,58,237,0.2)', '0 0 40px rgba(14,165,233,0.2)', '0 0 20px rgba(124,58,237,0.2)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Server className="w-6 h-6 text-violet-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ textShadow: '0 0 30px rgba(124,58,237,0.5)' }}>
              Backend Control Center
            </h1>
            <p className="text-sm text-white/40">Live system analysis, queue management & infrastructure control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <PulseDot ok={data.database.status === 'connected'} />
              <span className="text-xs text-white/50">Auto-refresh 15s</span>
            </div>
          )}
          <motion.button
            onClick={() => { setLoading(true); load(); }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/20 hover:bg-violet-600/30 transition-all text-sm font-medium disabled:opacity-50"
            whileTap={{ scale: 0.96 }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium"
            style={{
              background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
            <span className={toast.type === 'success' ? 'text-emerald-300' : 'text-red-300'}>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading ── */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <motion.div className="w-16 h-16 rounded-2xl border-2 border-violet-500/30 flex items-center justify-center"
            animate={{ rotate: 360, borderColor: ['rgba(124,58,237,0.3)', 'rgba(14,165,233,0.5)', 'rgba(124,58,237,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Server className="w-8 h-8 text-violet-400" />
          </motion.div>
          <p className="text-white/40 text-sm animate-pulse">Analyzing backend systems...</p>
        </div>
      )}

      {data && (
        <>
          {/* ── Quick Status Bar ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 rounded-2xl bg-white/[0.02] border border-white/5"
          >
            {[
              { label: 'Database', value: data.database.status, ok: data.database.status === 'connected', icon: Database },
              { label: 'Redis', value: data.redis.connected ? 'Connected' : 'Offline', ok: data.redis.connected, icon: Network },
              { label: 'Uptime', value: formatUptime(data.system.uptime), ok: true, icon: Clock },
              { label: 'Memory', value: `${data.system.memory.heapPercent}%`, ok: data.system.memory.heapPercent < 85, icon: MemoryStick },
            ].map(({ label, value, ok, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl">
                <PulseDot ok={ok} />
                <Icon className="w-3.5 h-3.5 text-white/30" />
                <span className="text-xs text-white/40">{label}</span>
                <span className={`text-xs font-medium ml-auto ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{value}</span>
              </div>
            ))}
          </motion.div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 p-1 bg-white/[0.02] rounded-2xl border border-white/5 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === id
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === 'errors' && data.errors.unresolved > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/20">
                    {data.errors.unresolved}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ──── TAB: OVERVIEW ──────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* System metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard icon={Clock} label="System Uptime" value={formatUptime(data.system.uptime)} sub={`Node ${data.system.nodeVersion}`} color="#7c3aed" glow="#7c3aed" />
                  <MetricCard icon={MemoryStick} label="Heap Memory" value={`${data.system.memory.heapUsed} MB`} sub={`of ${data.system.memory.heapTotal} MB total`} color="#0ea5e9" glow="#0ea5e9" />
                  <MetricCard icon={HardDrive} label="RSS Memory" value={`${data.system.memory.rss} MB`} sub="Process resident set" color="#a78bfa" glow="#a78bfa" />
                  <MetricCard icon={Database} label="Total Documents" value={data.database.totalDocuments.toLocaleString()} sub={`${data.database.totalCollections} collections`} color="#10b981" glow="#10b981" />
                </div>

                {/* Memory gauges + Redis + Queues summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Memory Gauge */}
                  <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                      <MemoryStick className="w-4 h-4 text-violet-400" /> Memory Usage
                    </h3>
                    <div className="flex justify-around">
                      <Gauge360 value={data.system.memory.heapUsed} max={data.system.memory.heapTotal} label="Heap" color="#7c3aed" />
                      <Gauge360 value={data.system.memory.rss} max={data.system.memory.rss + 200} label="RSS" color="#0ea5e9" />
                    </div>
                  </div>

                  {/* Redis Status */}
                  <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                      <Network className="w-4 h-4 text-sky-400" /> Redis Cache
                    </h3>
                    {data.redis.connected ? (
                      <div className="space-y-3">
                        {[
                          { label: 'Version', value: data.redis.version || '—' },
                          { label: 'Memory Used', value: data.redis.usedMemory || '—' },
                          { label: 'Clients', value: data.redis.connectedClients?.toString() || '0' },
                          { label: 'Uptime', value: data.redis.uptimeSeconds ? formatUptime(data.redis.uptimeSeconds) : '—' },
                          { label: 'Cache Hits', value: data.redis.keyspaceHits?.toLocaleString() || '0' },
                          { label: 'Cache Misses', value: data.redis.keyspaceMisses?.toLocaleString() || '0' },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between text-xs">
                            <span className="text-white/40">{label}</span>
                            <span className="text-white/80 font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 gap-3">
                        <XCircle className="w-8 h-8 text-red-400" />
                        <p className="text-xs text-red-400">Redis Offline</p>
                        {data.redis.error && <p className="text-[10px] text-white/30 text-center">{data.redis.error}</p>}
                      </div>
                    )}
                  </div>

                  {/* Queue summary */}
                  <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-violet-400" /> Queue Summary
                    </h3>
                    <div className="space-y-3">
                      {data.queues.map((q) => (
                        <div key={q.name} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-white/60">{q.name}</span>
                            <span className={q.isPaused ? 'text-amber-400' : q.error ? 'text-red-400' : 'text-emerald-400'}>
                              {q.isPaused ? 'Paused' : q.error ? 'Error' : 'Live'}
                            </span>
                          </div>
                          <div className="flex gap-1 h-2">
                            {[
                              { v: q.active, c: '#3b82f6' },
                              { v: q.waiting, c: '#f59e0b' },
                              { v: q.failed, c: '#ef4444' },
                              { v: q.completed, c: '#10b981' },
                            ].map((bar, i) => {
                              const total = q.active + q.waiting + q.failed + q.completed || 1;
                              return (
                                <motion.div key={i} className="h-full rounded-sm"
                                  style={{ background: bar.c, boxShadow: `0 0 4px ${bar.c}` }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(bar.v / total) * 100}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* System info footer */}
                <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-4">
                  <div className="flex flex-wrap gap-6 text-xs text-white/40">
                    <span><span className="text-white/20">Platform</span> <span className="text-white/70 font-medium">{data.system.platform}/{data.system.arch}</span></span>
                    <span><span className="text-white/20">Node.js</span> <span className="text-white/70 font-medium">{data.system.nodeVersion}</span></span>
                    <span><span className="text-white/20">DB</span> <span className="text-white/70 font-medium">{data.database.name} @ {data.database.host}</span></span>
                    <span><span className="text-white/20">Errors</span> <span className={`font-medium ${data.errors.unresolved > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{data.errors.unresolved} unresolved</span></span>
                    <span><span className="text-white/20">Backups</span> <span className="text-white/70 font-medium">{data.backups.total} total</span></span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──── TAB: DATABASE ──────────────────────────────── */}
            {activeTab === 'database' && (
              <motion.div key="database" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard icon={Layers} label="Collections" value={data.database.totalCollections} color="#0ea5e9" glow="#0ea5e9" />
                  <MetricCard icon={Box} label="Total Documents" value={data.database.totalDocuments.toLocaleString()} color="#7c3aed" glow="#7c3aed" />
                  <MetricCard icon={Database} label="DB Status" value={data.database.status} sub={`${data.database.name} @ ${data.database.host}`} color={data.database.status === 'connected' ? '#10b981' : '#ef4444'} glow={data.database.status === 'connected' ? '#10b981' : '#ef4444'} />
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                      <Database className="w-4 h-4 text-sky-400" /> Collection Analysis
                    </h3>
                    <button
                      onClick={() => setExpandedCols(!expandedCols)}
                      className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {expandedCols ? 'Show less' : 'Show all'} {expandedCols ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/5">
                          {['Collection', 'Documents', 'Data Size', 'Storage', 'Avg Doc', 'Indexes', 'Index Size'].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-white/30 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(expandedCols ? data.database.collections : data.database.collections.slice(0, 8)).map((col, i) => (
                          <motion.tr
                            key={col.name}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                          >
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-white/80 group-hover:text-white transition-colors">{col.name}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-violet-400 font-medium">{col.count.toLocaleString()}</span>
                            </td>
                            <td className="px-4 py-2.5 text-white/50">{col.size}</td>
                            <td className="px-4 py-2.5 text-white/50">{col.storageSize}</td>
                            <td className="px-4 py-2.5 text-white/40">{col.avgObjSize}</td>
                            <td className="px-4 py-2.5 text-sky-400">{col.indexCount}</td>
                            <td className="px-4 py-2.5 text-white/40">{col.indexSize}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!expandedCols && data.database.collections.length > 8 && (
                    <div className="px-5 py-2.5 text-xs text-white/30 border-t border-white/5">
                      +{data.database.collections.length - 8} more collections — click &quot;Show all&quot; to view
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ──── TAB: QUEUES ──────────────────────────────── */}
            {activeTab === 'queues' && (
              <motion.div key="queues" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-4">
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span>BullMQ queue control — pause, resume, drain waiting jobs, or clean failed jobs in realtime.</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.queues.map((q) => (
                    <QueueCard key={q.name} queue={q} onAction={queueAction} loading={actionLoading} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ──── TAB: ERRORS ──────────────────────────────── */}
            {activeTab === 'errors' && (
              <motion.div key="errors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard icon={Bug} label="Total Errors" value={data.errors.total.toLocaleString()} color="#ef4444" glow="#ef4444" />
                  <MetricCard icon={AlertTriangle} label="Unresolved" value={data.errors.unresolved.toLocaleString()} color={data.errors.unresolved > 0 ? '#f59e0b' : '#10b981'} glow={data.errors.unresolved > 0 ? '#f59e0b' : '#10b981'} />
                  <MetricCard icon={CheckCircle2} label="Resolved" value={(data.errors.total - data.errors.unresolved).toLocaleString()} color="#10b981" glow="#10b981" />
                </div>

                {/* Error type breakdown */}
                {data.errors.byType.length > 0 && (
                  <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-red-400" /> Errors by Type
                    </h3>
                    <div className="space-y-3">
                      {data.errors.byType.map((t) => {
                        const pct = data.errors.total > 0 ? Math.round((t.count / data.errors.total) * 100) : 0;
                        const colors: Record<string, string> = { api: '#3b82f6', client: '#a78bfa', server: '#ef4444', database: '#f59e0b', payment: '#10b981', ai: '#06b6d4' };
                        const c = colors[t._id] || '#7c3aed';
                        return (
                          <div key={t._id} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-white/60 capitalize">{t._id}</span>
                              <span className="text-white/40">{t.count} total · <span className="text-red-400">{t.unresolved} open</span></span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div className="h-full rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }}
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent errors */}
                {data.errors.recent.length > 0 && (
                  <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                      <h3 className="text-sm font-semibold text-white/70">Recent Unresolved Errors</h3>
                      {data.errors.unresolved > 0 && (
                        <button
                          onClick={resolveAllErrors}
                          disabled={actionLoading === 'resolve-errors'}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          {actionLoading === 'resolve-errors' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Resolve All
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                      {data.errors.recent.slice(0, 10).map((err: any, i) => {
                        const typeColors: Record<string, string> = { api: 'bg-blue-500/10 text-blue-400', client: 'bg-purple-500/10 text-purple-400', server: 'bg-red-500/10 text-red-400', database: 'bg-amber-500/10 text-amber-400', payment: 'bg-green-500/10 text-green-400', ai: 'bg-cyan-500/10 text-cyan-400' };
                        return (
                          <motion.div key={err._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className="px-5 py-3 hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize mt-0.5 ${typeColors[err.type] || 'bg-white/10 text-white/50'}`}>{err.type}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/70 truncate">{err.message}</p>
                                {err.route && <p className="text-[10px] text-white/30 mt-0.5">{err.route}</p>}
                              </div>
                              <span className="text-[10px] text-white/30 shrink-0">{timeAgo(err.createdAt)}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {data.errors.unresolved === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" style={{ filter: 'drop-shadow(0 0 20px #10b981)' }} />
                    <p className="text-white/50 text-sm">No unresolved errors — system is clean!</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ──── TAB: BACKUP ──────────────────────────────── */}
            {activeTab === 'backup' && (
              <motion.div key="backup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard icon={Archive} label="Total Backups" value={data.backups.total} color="#7c3aed" glow="#7c3aed" />
                  <MetricCard icon={Clock} label="Last Backup"
                    value={data.backups.last ? timeAgo(data.backups.last.createdAt) : 'Never'}
                    sub={data.backups.last ? `${data.backups.last.type} · ${data.backups.last.documentCount || 0} docs` : 'No backups yet'}
                    color="#0ea5e9" glow="#0ea5e9"
                  />
                </div>

                {/* Create backup */}
                <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5">
                  <h3 className="text-sm font-semibold text-white/70 mb-1 flex items-center gap-2">
                    <Download className="w-4 h-4 text-violet-400" /> Create New Backup
                  </h3>
                  <p className="text-xs text-white/30 mb-5">Backup is stored in MongoDB with full restore capability.</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { type: 'full', label: 'Full Backup', desc: 'All collections', color: 'violet' },
                      { type: 'users', label: 'Users', desc: 'users collection', color: 'sky' },
                      { type: 'payments', label: 'Payments', desc: 'payment records', color: 'emerald' },
                      { type: 'plans', label: 'Plans', desc: 'plan configs', color: 'amber' },
                      { type: 'settings', label: 'Settings', desc: 'platform config', color: 'pink' },
                    ].map(({ type, label, desc, color }) => {
                      const colorMap: Record<string, string> = {
                        violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20',
                        sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500/20',
                        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20',
                        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20',
                        pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400 hover:bg-pink-500/20',
                      };
                      return (
                        <motion.button
                          key={type} whileTap={{ scale: 0.96 }}
                          onClick={() => createBackup(type)}
                          disabled={!!backupLoading}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all disabled:opacity-50 ${colorMap[color]}`}
                        >
                          {backupLoading === type ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Archive className="w-5 h-5" />
                          )}
                          <span className="text-xs font-medium">{label}</span>
                          <span className="text-[10px] opacity-60">{desc}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Last backup actions */}
                {data.backups.last && (
                  <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-emerald-400" /> Latest Backup
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-white font-medium">{data.backups.last.fileName || `backup_${data.backups.last.type}`}</p>
                        <div className="flex gap-4 text-xs text-white/40">
                          <span>Type: <span className="text-white/70 capitalize">{data.backups.last.type}</span></span>
                          <span>Docs: <span className="text-white/70">{data.backups.last.documentCount?.toLocaleString() || '—'}</span></span>
                          <span>Size: <span className="text-white/70">{data.backups.last.size ? `${(data.backups.last.size / 1024).toFixed(1)} KB` : '—'}</span></span>
                          <span>Created: <span className="text-white/70">{timeAgo(data.backups.last.createdAt)}</span></span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => downloadBackup(data.backups.last._id)}
                          disabled={actionLoading === `dl-${data.backups.last._id}`}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all text-sm disabled:opacity-50"
                        >
                          {actionLoading === `dl-${data.backups.last._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          Download
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => restoreBackup(data.backups.last._id)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm disabled:opacity-50"
                        >
                          {actionLoading === `restore-${data.backups.last._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                          Restore
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/70">
                    Restore operation will <strong className="text-amber-300">delete and replace</strong> all documents in the restored collections.
                    This action cannot be undone. Always create a new backup before restoring.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
