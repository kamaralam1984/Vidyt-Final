'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  ShieldAlert, RefreshCw, Loader2, AlertTriangle, CheckCircle2, XCircle,
  Database, HardDrive, Download, Upload, Trash2, Clock, Server,
  Bug, Check, ChevronDown, ChevronRight, Filter, Cpu, MemoryStick,
  Shield, Archive, RotateCcw, AlertCircle, X,
} from 'lucide-react';

interface ErrorEntry {
  _id: string;
  type: string;
  message: string;
  stack?: string;
  route?: string;
  userId?: string;
  statusCode?: number;
  resolved: boolean;
  resolvedBy?: string;
  resolution?: string;
  createdAt: string;
}

interface BackupEntry {
  _id: string;
  type: string;
  status: string;
  fileName?: string;
  size?: number;
  collections?: string[];
  documentCount?: number;
  createdBy?: string;
  completedAt?: string;
  error?: string;
  createdAt: string;
}

interface SystemInfo {
  database: string;
  uptime: number;
  memory: { used: number; total: number; rss: number };
  nodeVersion: string;
  platform: string;
}

const ERROR_TYPES = ['api', 'client', 'server', 'database', 'payment', 'ai'];
const ERROR_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  api: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  client: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  server: { bg: 'bg-red-500/10', text: 'text-red-400' },
  database: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  payment: { bg: 'bg-green-500/10', text: 'text-green-400' },
  ai: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function SystemManagerPage() {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [errorsByType, setErrorsByType] = useState<any[]>([]);
  const [totalErrors, setTotalErrors] = useState(0);
  const [unresolvedErrors, setUnresolvedErrors] = useState(0);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [lastBackup, setLastBackup] = useState<BackupEntry | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'errors' | 'backups' | 'health'>('errors');
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterResolved, setFilterResolved] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 5000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/super/system?action=dashboard', { headers: getAuthHeaders() });
      const d = res.data;
      setErrors(d.errors.recent || []);
      setErrorsByType(d.errors.byType || []);
      setTotalErrors(d.errors.total || 0);
      setUnresolvedErrors(d.errors.unresolved || 0);
      setBackups(d.backups.recent || []);
      setLastBackup(d.backups.last || null);
      setSystem(d.system || null);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to load system data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolveError = async (errorId: string, resolution?: string) => {
    setActionLoading(`resolve-${errorId}`);
    try {
      await axios.post('/api/admin/super/system', { action: 'resolve-error', errorId, resolution }, { headers: getAuthHeaders() });
      showSuccess('Error resolved');
      load();
    } catch { showError('Failed to resolve error'); }
    finally { setActionLoading(''); }
  };

  const resolveAll = async (type?: string) => {
    if (!confirm(`Resolve all ${type || ''} unresolved errors?`)) return;
    setActionLoading('resolve-all');
    try {
      const res = await axios.post('/api/admin/super/system', { action: 'resolve-all', type }, { headers: getAuthHeaders() });
      showSuccess(`${res.data.count} errors resolved`);
      load();
    } catch { showError('Failed to resolve errors'); }
    finally { setActionLoading(''); }
  };

  const clearOldErrors = async (days: number) => {
    if (!confirm(`Delete resolved errors older than ${days} days?`)) return;
    setActionLoading('clear');
    try {
      const res = await axios.post('/api/admin/super/system', { action: 'clear-errors', days }, { headers: getAuthHeaders() });
      showSuccess(`${res.data.deleted} old errors cleared`);
      load();
    } catch { showError('Failed to clear errors'); }
    finally { setActionLoading(''); }
  };

  const createBackup = async (type: string) => {
    setActionLoading(`backup-${type}`);
    try {
      const res = await axios.post('/api/admin/super/system', { action: 'create-backup', type }, { headers: getAuthHeaders(), timeout: 60000 });
      showSuccess(`Backup created: ${res.data.documents} documents, ${res.data.size}`);
      load();
    } catch (err: any) { showError(err.response?.data?.error || 'Backup failed'); }
    finally { setActionLoading(''); }
  };

  const downloadBackup = async (backupId: string) => {
    setActionLoading(`download-${backupId}`);
    try {
      const res = await axios.post('/api/admin/super/system', { action: 'download-backup', backupId }, { headers: getAuthHeaders() });
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.fileName || 'backup.json';
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Backup downloaded');
    } catch { showError('Failed to download backup'); }
    finally { setActionLoading(''); }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('WARNING: This will REPLACE current data with backup data. Are you sure?')) return;
    if (!confirm('FINAL WARNING: All current data in restored collections will be DELETED. Continue?')) return;
    setActionLoading(`restore-${backupId}`);
    try {
      const res = await axios.post('/api/admin/super/system', { action: 'restore-backup', backupId }, { headers: getAuthHeaders(), timeout: 60000 });
      const summary = Object.entries(res.data.results).map(([col, r]: any) => `${col}: ${r.inserted} docs`).join(', ');
      showSuccess(`Restored: ${summary}`);
      load();
    } catch (err: any) { showError(err.response?.data?.error || 'Restore failed'); }
    finally { setActionLoading(''); }
  };

  const filteredErrors = errors.filter(e => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (filterResolved === 'true' && !e.resolved) return false;
    if (filterResolved === 'false' && e.resolved) return false;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF0000] mx-auto mb-3" />
        <p className="text-[#555] text-sm">Loading System Manager...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#FF0000]" /> System Manager
          </h1>
          <p className="text-xs text-[#555] mt-1">Error tracking, backups, restore, and system health</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#1f1f1f] rounded-lg text-xs text-[#666] hover:text-white transition">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-400 text-sm">
          <Check className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatCard title="Total Errors" value={totalErrors} icon={<Bug className="w-4 h-4 text-red-400" />} />
        <StatCard title="Unresolved" value={unresolvedErrors} icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          highlight={unresolvedErrors > 0} />
        <StatCard title="Backups" value={backups.length} icon={<Archive className="w-4 h-4 text-blue-400" />} />
        <StatCard title="Database" value={system?.database === 'connected' ? 'OK' : 'DOWN'}
          icon={<Database className={`w-4 h-4 ${system?.database === 'connected' ? 'text-green-400' : 'text-red-400'}`} />} />
        <StatCard title="Memory" value={`${system?.memory.used || 0}MB`} icon={<Cpu className="w-4 h-4 text-purple-400" />}
          sub={`/ ${system?.memory.total || 0}MB`} />
        <StatCard title="Uptime" value={formatUptime(system?.uptime || 0)} icon={<Clock className="w-4 h-4 text-cyan-400" />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {[
          { id: 'errors' as const, label: 'Error Log', icon: Bug, count: unresolvedErrors },
          { id: 'backups' as const, label: 'Backup & Restore', icon: Archive },
          { id: 'health' as const, label: 'System Health', icon: Server },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              activeTab === tab.id ? 'bg-[#FF0000] text-white' : 'bg-[#111] text-[#666] hover:text-white border border-[#1f1f1f]'
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count ? <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px]">{tab.count}</span> : null}
          </button>
        ))}
      </div>

      {/* ══════ ERRORS TAB ══════ */}
      {activeTab === 'errors' && (
        <div className="space-y-3">
          {/* Error Type Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {ERROR_TYPES.map(type => {
              const data = errorsByType.find((e: any) => e._id === type);
              const colors = ERROR_TYPE_COLORS[type];
              return (
                <button key={type} onClick={() => setFilterType(filterType === type ? 'all' : type)}
                  className={`p-3 rounded-xl border transition text-left ${
                    filterType === type ? `${colors.bg} border-current ${colors.text}` : 'bg-[#111] border-[#1f1f1f] hover:border-[#333]'
                  }`}>
                  <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold capitalize">{type}</p>
                  <p className="text-lg font-bold text-white mt-0.5">{data?.count || 0}</p>
                  {data?.unresolved > 0 && (
                    <p className="text-[9px] text-amber-400 mt-0.5">{data.unresolved} unresolved</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filters + Actions */}
          <div className="flex flex-wrap gap-2 items-center">
            <select value={filterResolved} onChange={e => setFilterResolved(e.target.value)}
              className="px-3 py-2 bg-[#111] border border-[#1f1f1f] rounded-lg text-white text-xs focus:outline-none">
              <option value="all">All Status</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
            <button onClick={() => resolveAll(filterType !== 'all' ? filterType : undefined)}
              disabled={actionLoading === 'resolve-all' || unresolvedErrors === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50">
              {actionLoading === 'resolve-all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Resolve All
            </button>
            <button onClick={() => clearOldErrors(30)}
              disabled={actionLoading === 'clear'}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#111] border border-[#1f1f1f] text-[#666] hover:text-white rounded-lg text-xs font-bold transition disabled:opacity-50">
              {actionLoading === 'clear' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Clear Old (30d)
            </button>
          </div>

          {/* Error List */}
          <div className="space-y-1.5">
            {filteredErrors.length === 0 && (
              <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500/30 mx-auto mb-3" />
                <p className="text-sm text-[#555]">No errors found</p>
              </div>
            )}
            {filteredErrors.map(err => {
              const isOpen = expandedError === err._id;
              const colors = ERROR_TYPE_COLORS[err.type] || ERROR_TYPE_COLORS.server;
              return (
                <div key={err._id} className={`bg-[#111] border rounded-xl overflow-hidden transition ${
                  err.resolved ? 'border-[#1a1a1a] opacity-60' : 'border-[#1f1f1f]'
                }`}>
                  <button onClick={() => setExpandedError(isOpen ? null : err._id)}
                    className="w-full flex items-center gap-3 p-3 sm:p-4 text-left">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${err.resolved ? 'bg-green-400' : 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>{err.type}</span>
                        {err.statusCode && <span className="text-[9px] text-[#444] font-mono">{err.statusCode}</span>}
                        {err.route && <span className="text-[9px] text-[#444] font-mono truncate max-w-[150px]">{err.route}</span>}
                      </div>
                      <p className="text-xs text-white mt-1 line-clamp-1">{err.message}</p>
                    </div>
                    <span className="text-[10px] text-[#555] shrink-0">{timeAgo(err.createdAt)}</span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-[#444] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#444] shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#1a1a1a] p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div><span className="text-[#555]">Time:</span> <span className="text-white ml-1">{new Date(err.createdAt).toLocaleString()}</span></div>
                        {err.route && <div><span className="text-[#555]">Route:</span> <span className="text-white ml-1 font-mono">{err.route}</span></div>}
                        {err.userId && <div><span className="text-[#555]">User:</span> <span className="text-white ml-1">{err.userId}</span></div>}
                        {err.statusCode && <div><span className="text-[#555]">Status:</span> <span className="text-white ml-1">{err.statusCode}</span></div>}
                      </div>

                      <div>
                        <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">Error Message</p>
                        <pre className="text-xs text-red-300 bg-red-500/5 border border-red-500/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{err.message}</pre>
                      </div>

                      {err.stack && (
                        <div>
                          <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">Stack Trace</p>
                          <pre className="text-[10px] text-[#888] bg-[#0a0a0a] border border-[#181818] rounded-lg p-3 overflow-x-auto max-h-40 whitespace-pre-wrap">{err.stack}</pre>
                        </div>
                      )}

                      {err.resolved ? (
                        <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
                          <p className="text-xs text-green-400">Resolved by {err.resolvedBy}</p>
                          {err.resolution && <p className="text-xs text-[#888] mt-0.5">{err.resolution}</p>}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => resolveError(err._id, 'Fixed')}
                            disabled={actionLoading === `resolve-${err._id}`}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50">
                            {actionLoading === `resolve-${err._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Mark Resolved
                          </button>
                          <button onClick={() => resolveError(err._id, 'Known issue — ignored')}
                            className="px-3 py-2 bg-[#1a1a1a] text-[#888] hover:text-white rounded-lg text-xs font-bold transition">
                            Ignore
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════ BACKUPS TAB ══════ */}
      {activeTab === 'backups' && (
        <div className="space-y-3">
          {/* Create Backup */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-400" /> Create New Backup
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {[
                { type: 'full', label: 'Full Backup', desc: 'All collections', color: 'bg-[#FF0000]' },
                { type: 'users', label: 'Users Only', desc: 'User accounts', color: 'bg-blue-600' },
                { type: 'payments', label: 'Payments', desc: 'Payment records', color: 'bg-green-600' },
                { type: 'plans', label: 'Plans', desc: 'Plan configs', color: 'bg-purple-600' },
                { type: 'settings', label: 'Settings', desc: 'Platform & API', color: 'bg-amber-600' },
              ].map(b => (
                <button key={b.type} onClick={() => createBackup(b.type)}
                  disabled={actionLoading === `backup-${b.type}`}
                  className={`${b.color} hover:opacity-90 text-white rounded-xl p-3 text-left transition disabled:opacity-50`}>
                  {actionLoading === `backup-${b.type}` ? (
                    <Loader2 className="w-4 h-4 animate-spin mb-1" />
                  ) : (
                    <Archive className="w-4 h-4 mb-1" />
                  )}
                  <p className="text-xs font-bold">{b.label}</p>
                  <p className="text-[9px] opacity-70">{b.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Last Backup Info */}
          {lastBackup && (
            <div className="bg-[#111] border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-bold text-white">Last Successful Backup</p>
                    <p className="text-[10px] text-[#555]">
                      {lastBackup.fileName} • {lastBackup.documentCount} docs •
                      {lastBackup.size ? ` ${(lastBackup.size / 1024).toFixed(1)} KB` : ''} •
                      {lastBackup.completedAt ? ` ${timeAgo(lastBackup.completedAt)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => downloadBackup(lastBackup._id)}
                    disabled={actionLoading === `download-${lastBackup._id}`}
                    className="p-2 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition" title="Download">
                    {actionLoading === `download-${lastBackup._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Download className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                  <button onClick={() => restoreBackup(lastBackup._id)}
                    disabled={actionLoading === `restore-${lastBackup._id}`}
                    className="p-2 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition" title="Restore">
                    {actionLoading === `restore-${lastBackup._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup History */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-bold text-white mb-3">Backup History</h3>
            {backups.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="w-8 h-8 text-[#252525] mx-auto mb-2" />
                <p className="text-xs text-[#555]">No backups yet. Create your first backup above.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {backups.map(b => (
                  <div key={b._id} className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#181818] rounded-lg hover:border-[#252525] transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        b.status === 'completed' ? 'bg-green-400' : b.status === 'failed' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white capitalize">{b.type}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            b.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                            b.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>{b.status}</span>
                        </div>
                        <p className="text-[10px] text-[#555]">
                          {b.documentCount ? `${b.documentCount} docs` : ''}
                          {b.size ? ` • ${(b.size / 1024).toFixed(1)} KB` : ''}
                          {b.createdBy ? ` • by ${b.createdBy}` : ''}
                          {` • ${timeAgo(b.createdAt)}`}
                        </p>
                      </div>
                    </div>
                    {b.status === 'completed' && (
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button onClick={() => downloadBackup(b._id)} title="Download"
                          className="p-1.5 hover:bg-[#1a1a1a] rounded transition">
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <button onClick={() => restoreBackup(b._id)} title="Restore"
                          className="p-1.5 hover:bg-[#1a1a1a] rounded transition">
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      </div>
                    )}
                    {b.status === 'failed' && b.error && (
                      <span className="text-[10px] text-red-400 truncate max-w-[150px] shrink-0 ml-2">{b.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════ HEALTH TAB ══════ */}
      {activeTab === 'health' && system && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Database */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-lg ${system.database === 'connected' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <Database className={`w-5 h-5 ${system.database === 'connected' ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">MongoDB</h3>
                  <p className={`text-[10px] font-bold ${system.database === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                    {system.database === 'connected' ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
              </div>
            </div>

            {/* Memory */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10">
                  <Cpu className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Memory Usage</h3>
                  <p className="text-[10px] text-[#555]">{system.memory.used}MB / {system.memory.total}MB heap</p>
                </div>
              </div>
              <div className="w-full bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (system.memory.used / system.memory.total) > 0.8 ? 'bg-red-500' :
                    (system.memory.used / system.memory.total) > 0.6 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((system.memory.used / system.memory.total) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-[#444] mt-2">RSS: {system.memory.rss}MB</p>
            </div>

            {/* Server */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10">
                  <Server className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Server Info</h3>
                  <p className="text-[10px] text-[#555]">Node {system.nodeVersion}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-[#555]">Platform</span><span className="text-white">{system.platform}</span></div>
                <div className="flex justify-between"><span className="text-[#555]">Uptime</span><span className="text-white">{formatUptime(system.uptime)}</span></div>
              </div>
            </div>
          </div>

          {/* Error Distribution */}
          {errorsByType.length > 0 && (
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
              <h3 className="text-sm font-bold text-white mb-3">Error Distribution</h3>
              <div className="space-y-2">
                {errorsByType.map((e: any) => {
                  const pct = totalErrors > 0 ? Math.round((e.count / totalErrors) * 100) : 0;
                  const colors = ERROR_TYPE_COLORS[e._id] || ERROR_TYPE_COLORS.server;
                  return (
                    <div key={e._id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase ${colors.text}`}>{e._id}</span>
                          <span className="text-[10px] text-[#555]">{e.count} errors</span>
                        </div>
                        <span className="text-[10px] text-[#555]">{pct}%</span>
                      </div>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${colors.bg.replace('/10', '/50')}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, sub, highlight }: {
  title: string; value: string | number; icon: React.ReactNode; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-[#111] border rounded-xl p-3 transition ${highlight ? 'border-red-500/30' : 'border-[#1f1f1f]'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold">{title}</p>
        {icon}
      </div>
      <p className={`text-lg font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[9px] text-[#444] mt-0.5">{sub}</p>}
    </div>
  );
}
