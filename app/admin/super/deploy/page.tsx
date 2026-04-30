'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  Rocket, RotateCcw, RefreshCw, Clock, HardDrive, Cpu, GitCommit,
  AlertTriangle, CheckCircle2, Loader2, Play, Camera, Activity,
} from 'lucide-react';

interface PM2App {
  name: string; status: string; uptime: number; restarts: number; cpu: number; memory: number;
}
interface Health {
  ok: boolean;
  appDir: string;
  currentCommit: string;
  currentBranch: string;
  lastDeployTime: string;
  snapshotCount: number;
  diskFree: string;
  pm2Apps: PM2App[];
  timestamp: string;
}
interface Snapshot {
  id: string;
  size: string;
  mtime: string;
  readableTime: string;
  kind: 'pre-deploy' | 'hourly' | 'manual';
}

function formatUptime(ms: number): string {
  if (!ms) return '—';
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function DeployPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [snapshotting, setSnapshotting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [confirmRollback, setConfirmRollback] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [h, s] = await Promise.all([
        axios.get('/api/admin/super/deploy/health', { headers: getAuthHeaders() }),
        axios.get('/api/admin/super/deploy/snapshots', { headers: getAuthHeaders() }),
      ]);
      setHealth(h.data);
      setSnapshots(s.data?.snapshots || []);
    } catch (err: any) {
      setLogs(prev => [...prev, `[fetch error] ${err?.response?.data?.error || err?.message}`]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleDeploy = async () => {
    if (!confirm('Pull latest from GitHub main and rebuild. A pre-deploy snapshot will be taken first. Continue?')) return;
    setDeploying(true);
    setLogs(['🚀 Starting deploy…']);
    try {
      const res = await axios.post('/api/admin/super/deploy/trigger', {}, { headers: getAuthHeaders(), timeout: 360000 });
      setLogs(res.data?.logs || []);
      await fetchAll();
    } catch (err: any) {
      const data = err?.response?.data;
      setLogs(data?.logs || [`[error] ${err?.message}`]);
    } finally {
      setDeploying(false);
    }
  };

  const handleRollback = async (snapshotId: string) => {
    setConfirmRollback(null);
    setRollingBack(snapshotId);
    setLogs([`⏪ Rolling back to ${snapshotId}…`]);
    try {
      const res = await axios.post('/api/admin/super/deploy/rollback', { snapshotId }, { headers: getAuthHeaders(), timeout: 360000 });
      setLogs(res.data?.logs || []);
      await fetchAll();
    } catch (err: any) {
      const data = err?.response?.data;
      setLogs(data?.logs || [`[error] ${err?.message}`]);
    } finally {
      setRollingBack(null);
    }
  };

  const handleManualSnapshot = async () => {
    setSnapshotting(true);
    try {
      const res = await axios.post('/api/admin/super/deploy/snapshots', { tag: 'manual' }, { headers: getAuthHeaders(), timeout: 90000 });
      setLogs([`📸 Snapshot created`, res.data?.output || '']);
      await fetchAll();
    } catch (err: any) {
      setLogs([`[error] ${err?.response?.data?.error || err?.message}`]);
    } finally {
      setSnapshotting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Rocket className="w-6 h-6 text-red-500" />
          Deploy & Rollback
        </h1>
        <p className="text-sm text-[#888] mt-1">Push latest code, take snapshots, and roll back if something breaks.</p>
      </div>

      {/* Health bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#181818] border border-[#222] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-[#888] mb-1"><GitCommit className="w-3 h-3" /> Current Commit</div>
          <div className="text-sm font-mono text-white truncate">{health?.currentCommit || (loading ? '…' : '—')}</div>
          <div className="text-[10px] text-[#666] mt-1">branch: {health?.currentBranch || '—'}</div>
        </div>
        <div className="bg-[#181818] border border-[#222] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-[#888] mb-1"><Clock className="w-3 h-3" /> Last Build</div>
          <div className="text-sm text-white">{health?.lastDeployTime || '—'}</div>
        </div>
        <div className="bg-[#181818] border border-[#222] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-[#888] mb-1"><Camera className="w-3 h-3" /> Snapshots</div>
          <div className="text-2xl font-bold text-white">{health?.snapshotCount ?? '—'}</div>
        </div>
        <div className="bg-[#181818] border border-[#222] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-[#888] mb-1"><HardDrive className="w-3 h-3" /> Free Disk</div>
          <div className="text-2xl font-bold text-white">{health?.diskFree || '—'}</div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleDeploy}
          disabled={deploying || rollingBack !== null}
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-red-500/20 transition"
        >
          {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {deploying ? 'Deploying…' : 'Pull & Deploy Now'}
        </button>
        <button
          onClick={handleManualSnapshot}
          disabled={snapshotting || deploying}
          className="px-5 py-2.5 bg-[#222] border border-[#444] text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 hover:bg-[#333] transition"
        >
          {snapshotting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          Take Manual Snapshot
        </button>
        <button
          onClick={fetchAll}
          className="px-5 py-2.5 bg-[#222] border border-[#444] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#333] transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PM2 Apps */}
        <div className="bg-[#181818] border border-[#222] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" /> PM2 Processes
          </h3>
          {!health?.pm2Apps?.length ? (
            <p className="text-xs text-[#666]">No PM2 apps detected.</p>
          ) : (
            <div className="space-y-2">
              {health.pm2Apps.map(app => (
                <div key={app.name} className="flex items-center justify-between p-3 bg-[#111] rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${app.status === 'online' ? 'bg-emerald-400' : 'bg-red-500'}`} />
                    <span className="text-sm font-mono text-white">{app.name}</span>
                  </div>
                  <div className="text-[10px] text-[#888] flex gap-3">
                    <span>up {formatUptime(app.uptime)}</span>
                    <span>↻ {app.restarts}</span>
                    <span>{app.cpu}%</span>
                    <span>{app.memory}MB</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Snapshots */}
        <div className="bg-[#181818] border border-[#222] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" /> Available Snapshots
          </h3>
          {snapshots.length === 0 ? (
            <p className="text-xs text-[#666]">No snapshots yet. Run snapshot-setup script on VPS first.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {snapshots.map(snap => (
                <div key={snap.id} className="flex items-center justify-between p-3 bg-[#111] rounded-lg">
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-white truncate">{snap.readableTime}</div>
                    <div className="text-[10px] text-[#666] flex gap-2">
                      <span className={
                        snap.kind === 'pre-deploy' ? 'text-purple-400' :
                        snap.kind === 'hourly' ? 'text-emerald-400' : 'text-amber-400'
                      }>{snap.kind}</span>
                      <span>•</span>
                      <span>{snap.size}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmRollback(snap.id)}
                    disabled={rollingBack !== null || deploying}
                    className="px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-600/30 disabled:opacity-50 transition flex items-center gap-1"
                  >
                    {rollingBack === snap.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="mt-6 bg-[#0a0a0a] border border-[#222] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Output
            </h3>
            <button onClick={() => setLogs([])} className="text-[10px] text-[#666] hover:text-white">Clear</button>
          </div>
          <pre className="text-[11px] font-mono text-[#aaa] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {logs.join('\n')}
          </pre>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmRollback && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#181818] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-white">Rollback Confirmation</h3>
                <p className="text-sm text-[#888] mt-1">Restore code to <span className="font-mono text-white">{confirmRollback}</span>?</p>
                <p className="text-xs text-amber-400 mt-2">⚠ This swaps the live app folder and reloads PM2. Database is untouched. Any uncommitted VPS changes will be lost.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmRollback(null)} className="px-4 py-2 bg-[#222] text-white rounded-lg text-sm font-bold hover:bg-[#333] transition">Cancel</button>
              <button onClick={() => handleRollback(confirmRollback)} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
