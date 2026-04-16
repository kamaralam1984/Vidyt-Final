'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  Globe, Shield, Zap, Search, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Loader2, Plus, Trash2, Play, Clock, Server, Cpu,
  HardDrive, MemoryStick, TrendingUp, TrendingDown, Bell, BellOff,
  ChevronDown, ChevronRight, ExternalLink, Eye, X, Activity,
  BarChart2, Lock, FileText,
} from 'lucide-react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface MonitoredSite {
  _id: string;
  url: string;
  name: string;
  isOwned: boolean;
  isActive: boolean;
  checkInterval: string;
  lastAuditAt?: string;
  lastScore?: number;
  avgScore7d?: number;
  alertThreshold: number;
}

interface AuditIssue {
  category: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  fix: string;
}

interface Audit {
  _id: string;
  url: string;
  type: string;
  status: string;
  overallScore: number;
  scoreDelta?: number;
  previousScore?: number;
  performance: { score: number; responseTime: number; lcp: number; fcp: number; cls: number; tbt: number; ttfb: number; pageSize: number };
  seo: { score: number; hasTitle: boolean; titleLength: number; h1Count: number; hasCanonical: boolean; hasOgTags: boolean; robotsTxt: boolean; sitemapXml: boolean; isHttps: boolean; imagesWithoutAlt: number };
  security: { score: number; isHttps: boolean; hasHSTS: boolean; hasCSP: boolean; hasXFrame: boolean; hasXContentType: boolean; hasReferrerPolicy: boolean; poweredByHeader: string };
  server: { cpuUsage: number; memoryUsed: number; memoryTotal: number; memoryPercent: number; diskUsed: number; diskTotal: number; diskPercent: number; uptime: number; loadAvg: number[] };
  issues: AuditIssue[];
  duration?: number;
  createdAt: string;
}

interface AuditAlert {
  _id: string;
  siteUrl: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

interface ServerMetrics {
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  memoryPercent: number;
  diskUsed: number;
  diskTotal: number;
  diskPercent: number;
  uptime: number;
  loadAvg: number[];
  nodeVersion: string;
  platform: string;
}

interface TrendPoint {
  _id: string;
  avgScore: number;
  avgPerf: number;
  avgSeo: number;
  avgSecurity: number;
  count: number;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function severityColor(s: string) {
  if (s === 'critical') return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (s === 'warning') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function ScoreGauge({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff0d" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={color}
        fontSize={size * 0.24} fontWeight="700" className="rotate-90 origin-center" style={{ transform: `rotate(90deg) translate(0,0)` }}>
      </text>
    </svg>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-full">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SparkLine({ data, color = '#10b981' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100, h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function WebsiteAuditPage() {
  const [tab, setTab] = useState<'dashboard' | 'run-audit' | 'history' | 'alerts' | 'sites' | 'server'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  // Dashboard data
  const [sites, setSites] = useState<MonitoredSite[]>([]);
  const [recentAudits, setRecentAudits] = useState<Audit[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalAlerts, setCriticalAlerts] = useState<AuditAlert[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);

  // Run audit
  const [auditUrl, setAuditUrl] = useState('https://www.vidyt.com');
  const [auditResult, setAuditResult] = useState<Audit | null>(null);
  const [auditError, setAuditError] = useState('');
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  // History
  const [history, setHistory] = useState<Audit[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyUrl, setHistoryUrl] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  // Alerts
  const [alerts, setAlerts] = useState<AuditAlert[]>([]);
  const [alertFilter, setAlertFilter] = useState('false'); // acknowledged filter

  // Sites management
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSite, setNewSite] = useState({ url: '', name: '', isOwned: false, checkInterval: 'daily', alertThreshold: 60 });

  // Server metrics
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const metricsInterval = useRef<NodeJS.Timeout | null>(null);
  const initialized = useRef(false);

  const headers = getAuthHeaders();

  // ── Load dashboard ──
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/super/website-audit?action=dashboard', { headers });
      setSites(data.sites || []);
      setRecentAudits(data.recentAudits || []);
      setUnreadCount(data.unacknowledgedAlerts || 0);
      setCriticalAlerts(data.criticalAlerts || []);
      setTrendData(data.trendData || []);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load history ──
  const loadHistory = useCallback(async (page = 1, url = '') => {
    const params = new URLSearchParams({ action: 'history', page: String(page) });
    if (url) params.set('url', url);
    const { data } = await axios.get(`/api/admin/super/website-audit?${params}`, { headers });
    setHistory(data.audits || []);
    setHistoryTotal(data.total || 0);
    setHistoryPage(page);
  }, []);

  // ── Load alerts ──
  const loadAlerts = useCallback(async () => {
    const params = new URLSearchParams({ acknowledged: alertFilter });
    const { data } = await axios.get(`/api/admin/super/website-audit/alerts?${params}`, { headers });
    setAlerts(data.alerts || []);
    setUnreadCount(data.unreadCount || 0);
  }, [alertFilter]);

  // ── Load server metrics ──
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const { data } = await axios.get('/api/admin/super/website-audit/metrics', { headers });
      setServerMetrics(data.metrics);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadDashboard();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (tab === 'history') loadHistory(1, historyUrl);
    if (tab === 'alerts') loadAlerts();
    if (tab === 'server') {
      loadMetrics();
      interval = setInterval(loadMetrics, 10000);
      metricsInterval.current = interval;
    }
    return () => {
      if (interval) clearInterval(interval);
      metricsInterval.current = null;
    };
  }, [tab, alertFilter]);

  // ── Run audit ──
  const runAudit = async () => {
    if (!auditUrl.trim()) return;
    setRunning(true);
    setAuditResult(null);
    setAuditError('');
    setExpandedIssue(null);
    try {
      const { data } = await axios.post('/api/admin/super/website-audit/run',
        { url: auditUrl, includeServer: auditUrl.includes('vidyt.com') },
        { headers, timeout: 125000 });
      setAuditResult(data.audit);
    } catch (err: any) {
      setAuditError(err.response?.data?.error || 'Audit failed. Please check the URL and try again.');
    } finally {
      setRunning(false);
    }
  };

  // ── Add site ──
  const addSite = async () => {
    try {
      await axios.post('/api/admin/super/website-audit', { action: 'add-site', ...newSite }, { headers });
      setShowAddSite(false);
      setNewSite({ url: '', name: '', isOwned: false, checkInterval: 'daily', alertThreshold: 60 });
      loadDashboard();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add site');
    }
  };

  // ── Delete site ──
  const deleteSite = async (siteId: string) => {
    if (!confirm('Remove this site from monitoring?')) return;
    await axios.post('/api/admin/super/website-audit', { action: 'delete-site', siteId }, { headers });
    loadDashboard();
  };

  // ── Acknowledge alert ──
  const ackAlert = async (alertId: string) => {
    await axios.post('/api/admin/super/website-audit', { action: 'acknowledge-alert', alertId }, { headers });
    loadAlerts();
    loadDashboard();
  };

  // ── Ack all alerts ──
  const ackAllAlerts = async () => {
    await axios.post('/api/admin/super/website-audit', { action: 'acknowledge-all-alerts' }, { headers });
    loadAlerts();
    loadDashboard();
  };

  // ─────────────────────────────────────────────
  // RENDER: HEADER
  // ─────────────────────────────────────────────
  const TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { key: 'run-audit', label: 'Run Audit', icon: Play },
    { key: 'history', label: 'History', icon: Clock },
    { key: 'alerts', label: `Alerts${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell },
    { key: 'sites', label: 'Sites', icon: Globe },
    { key: 'server', label: 'Server', icon: Server },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-400" />
            Website Audit & Monitor
          </h1>
          <p className="text-white/40 text-sm mt-1">Automated performance, SEO, security & server monitoring</p>
        </div>
        <button onClick={loadDashboard} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            {key === 'alerts' && unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && tab === 'dashboard' ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-white/30" />
        </div>
      ) : (
        <>
          {/* ─── DASHBOARD TAB ─── */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              {/* Critical alerts banner */}
              {criticalAlerts.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">{criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}</span>
                    <button onClick={ackAllAlerts} className="ml-auto text-xs text-white/40 hover:text-white/70">Acknowledge all</button>
                  </div>
                  <div className="space-y-2">
                    {criticalAlerts.map(a => (
                      <div key={a._id} className="flex items-start justify-between gap-4 text-sm">
                        <div>
                          <span className="text-white/80 font-medium">{a.title}</span>
                          <span className="text-white/40 ml-2">· {a.siteUrl}</span>
                          <p className="text-white/40 text-xs mt-0.5">{a.message}</p>
                        </div>
                        <button onClick={() => ackAlert(a._id)} className="shrink-0 text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded">Ack</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Monitored Sites', value: sites.length, icon: Globe, color: 'text-blue-400' },
                  { label: 'Recent Audits', value: recentAudits.length, icon: FileText, color: 'text-purple-400' },
                  { label: 'Unread Alerts', value: unreadCount, icon: Bell, color: unreadCount > 0 ? 'text-red-400' : 'text-emerald-400' },
                  {
                    label: 'Avg Score (latest)',
                    value: sites.length
                      ? Math.round(sites.filter(s => s.lastScore).reduce((a, s) => a + (s.lastScore || 0), 0) / sites.filter(s => s.lastScore).length) || '—'
                      : '—',
                    icon: TrendingUp, color: 'text-emerald-400',
                  },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white/3 border border-white/8 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/40 text-xs">{label}</span>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Trend chart */}
              {trendData.length > 0 && (
                <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white/70 mb-4">7-Day Score Trend</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Performance', data: trendData.map(t => Math.round(t.avgPerf)), color: '#3b82f6' },
                      { label: 'SEO', data: trendData.map(t => Math.round(t.avgSeo)), color: '#10b981' },
                      { label: 'Security', data: trendData.map(t => Math.round(t.avgSecurity)), color: '#f59e0b' },
                    ].map(({ label, data, color }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-white/40">{label}</span>
                          <span className="text-xs font-bold" style={{ color }}>{data[data.length - 1] ?? '—'}</span>
                        </div>
                        <SparkLine data={data} color={color} />
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-white/20">{trendData[0]?._id}</span>
                          <span className="text-[10px] text-white/20">{trendData[trendData.length - 1]?._id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monitored sites */}
              <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <h3 className="text-sm font-semibold text-white/70">Monitored Sites</h3>
                  <button onClick={() => setTab('sites')} className="text-xs text-blue-400 hover:text-blue-300">Manage →</button>
                </div>
                {sites.length === 0 ? (
                  <div className="px-5 py-8 text-center text-white/30 text-sm">No sites monitored yet. Add your first site.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {sites.map(site => (
                      <div key={site._id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${site.isActive ? 'bg-emerald-400' : 'bg-white/20'}`} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">{site.name}</div>
                            <div className="text-xs text-white/30 truncate">{site.url}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          {site.lastScore !== undefined && (
                            <div className={`text-sm font-bold ${scoreColor(site.lastScore)}`}>{site.lastScore}/100</div>
                          )}
                          <div className="text-xs text-white/30">
                            {site.lastAuditAt ? timeAgo(site.lastAuditAt) : 'Never audited'}
                          </div>
                          <button
                            onClick={() => { setAuditUrl(site.url); setTab('run-audit'); }}
                            className="text-xs px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded"
                          >
                            Audit now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent audits */}
              {recentAudits.length > 0 && (
                <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-white/70">Recent Audits</h3>
                    <button onClick={() => setTab('history')} className="text-xs text-blue-400 hover:text-blue-300">View all →</button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {recentAudits.slice(0, 5).map(a => (
                      <div key={a._id} className="px-5 py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/2"
                        onClick={() => { setSelectedAudit(a); setTab('history'); }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${scoreBg(a.overallScore)} ${scoreColor(a.overallScore)}`}>
                            {a.overallScore}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-white/70 truncate">{a.url}</div>
                            <div className="text-xs text-white/30">{timeAgo(a.createdAt)} · {a.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs text-white/40">
                          {a.scoreDelta !== undefined && a.scoreDelta !== 0 && (
                            <span className={a.scoreDelta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {a.scoreDelta > 0 ? '+' : ''}{a.scoreDelta}
                            </span>
                          )}
                          <span className="text-red-400/80">{a.issues.filter(i => i.severity === 'critical').length} critical</span>
                          <span className="text-amber-400/80">{a.issues.filter(i => i.severity === 'warning').length} warnings</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── RUN AUDIT TAB ─── */}
          {tab === 'run-audit' && (
            <div className="max-w-3xl space-y-6">
              {/* Input */}
              <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white/70 mb-4">Audit Any Website</h3>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={auditUrl}
                    onChange={e => setAuditUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runAudit()}
                    placeholder="https://example.com"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={runAudit}
                    disabled={running}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {running ? 'Auditing...' : 'Run Audit'}
                  </button>
                </div>
                <p className="text-white/25 text-xs mt-2">Runs real Lighthouse audit, SEO, and Security checks. Takes ~60-90s.</p>

                {/* Quick picks */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {['https://www.vidyt.com', ...sites.map(s => s.url)].slice(0, 4).map(u => (
                    <button key={u} onClick={() => setAuditUrl(u)}
                      className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/40 hover:text-white/70 transition-colors">
                      {u.replace(/^https?:\/\//, '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Running indicator */}
              {running && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-400 font-medium">Running full audit...</p>
                  <p className="text-white/30 text-sm mt-1">Checking performance, SEO, security headers & server health</p>
                  <div className="flex justify-center gap-6 mt-4 text-xs text-white/40">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" />PageSpeed API</span>
                    <span className="flex items-center gap-1"><Search className="w-3 h-3" />SEO scan</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Security headers</span>
                  </div>
                </div>
              )}

              {/* Error */}
              {auditError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-red-400 font-medium">Audit failed</div>
                    <div className="text-white/50 text-sm mt-1">{auditError}</div>
                  </div>
                </div>
              )}

              {/* Result */}
              {auditResult && <AuditReport audit={auditResult} expandedIssue={expandedIssue} setExpandedIssue={setExpandedIssue} />}
            </div>
          )}

          {/* ─── HISTORY TAB ─── */}
          {tab === 'history' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex gap-3">
                <input
                  type="url"
                  value={historyUrl}
                  onChange={e => setHistoryUrl(e.target.value)}
                  placeholder="Filter by URL..."
                  className="w-64 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50"
                />
                <button onClick={() => loadHistory(1, historyUrl)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors">
                  Filter
                </button>
              </div>

              {/* Table */}
              <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {history.length === 0 && (
                    <div className="px-5 py-10 text-center text-white/30 text-sm">No audit history yet.</div>
                  )}
                  {history.map(a => (
                    <div key={a._id}
                      className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/2 transition-colors"
                      onClick={() => setSelectedAudit(selectedAudit?._id === a._id ? null : a)}>
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Score */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border ${scoreBg(a.overallScore)} ${scoreColor(a.overallScore)}`}>
                          {a.overallScore}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-white/80 truncate font-medium">{a.url}</div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-white/30">
                            <span>{timeAgo(a.createdAt)}</span>
                            <span className="capitalize">{a.type}</span>
                            {a.duration && <span>{(a.duration / 1000).toFixed(1)}s</span>}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-3 text-xs">
                        <div className="text-center">
                          <div className={scoreColor(a.performance.score)}>{a.performance.score}</div>
                          <div className="text-white/25">Perf</div>
                        </div>
                        <div className="text-center">
                          <div className={scoreColor(a.seo.score)}>{a.seo.score}</div>
                          <div className="text-white/25">SEO</div>
                        </div>
                        <div className="text-center">
                          <div className={scoreColor(a.security.score)}>{a.security.score}</div>
                          <div className="text-white/25">Sec</div>
                        </div>
                        {a.scoreDelta !== undefined && a.scoreDelta !== 0 && (
                          <div className={`flex items-center gap-0.5 ${a.scoreDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {a.scoreDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(a.scoreDelta)}
                          </div>
                        )}
                        <ChevronRight className={`w-4 h-4 text-white/20 transition-transform ${selectedAudit?._id === a._id ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {historyTotal > 20 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 text-sm">
                    <span className="text-white/30">{historyTotal} total audits</span>
                    <div className="flex gap-2">
                      <button disabled={historyPage <= 1} onClick={() => loadHistory(historyPage - 1, historyUrl)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-xs">Prev</button>
                      <span className="px-3 py-1 text-white/40 text-xs">Page {historyPage}</span>
                      <button disabled={historyPage * 20 >= historyTotal} onClick={() => loadHistory(historyPage + 1, historyUrl)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-xs">Next</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected audit detail */}
              {selectedAudit && (
                <div className="border-t border-white/10 pt-4">
                  <AuditReport audit={selectedAudit} expandedIssue={expandedIssue} setExpandedIssue={setExpandedIssue} />
                </div>
              )}
            </div>
          )}

          {/* ─── ALERTS TAB ─── */}
          {tab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {[
                    { label: 'Unread', value: 'false' },
                    { label: 'Resolved', value: 'true' },
                    { label: 'All', value: '' },
                  ].map(({ label, value }) => (
                    <button key={value} onClick={() => setAlertFilter(value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${alertFilter === value ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {unreadCount > 0 && (
                  <button onClick={ackAllAlerts}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                    <BellOff className="w-3.5 h-3.5" />
                    Acknowledge All ({unreadCount})
                  </button>
                )}
              </div>

              <div className="bg-white/3 border border-white/8 rounded-xl divide-y divide-white/5 overflow-hidden">
                {alerts.length === 0 && (
                  <div className="px-5 py-10 text-center text-white/30 text-sm flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/40" />
                    No alerts to show
                  </div>
                )}
                {alerts.map(a => (
                  <div key={a._id} className={`px-5 py-4 flex items-start gap-4 ${a.acknowledged ? 'opacity-50' : ''}`}>
                    <div className={`mt-0.5 shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${severityColor(a.severity)}`}>
                      {a.severity}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/90">{a.title}</div>
                      <div className="text-xs text-white/40 mt-0.5">{a.message}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-white/25">
                        <span>{a.siteUrl}</span>
                        <span>·</span>
                        <span>{timeAgo(a.createdAt)}</span>
                        <span>·</span>
                        <span className="capitalize">{a.type.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    {!a.acknowledged && (
                      <button onClick={() => ackAlert(a._id)}
                        className="shrink-0 text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── SITES TAB ─── */}
          {tab === 'sites' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/60">Monitored Websites</h3>
                <button onClick={() => setShowAddSite(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Add Site
                </button>
              </div>

              {/* Add site form */}
              {showAddSite && (
                <div className="bg-white/3 border border-blue-500/20 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-blue-400">Add New Site</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">URL *</label>
                      <input type="url" placeholder="https://example.com"
                        value={newSite.url}
                        onChange={e => setNewSite(s => ({ ...s, url: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Name *</label>
                      <input type="text" placeholder="My Website"
                        value={newSite.name}
                        onChange={e => setNewSite(s => ({ ...s, name: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Check Interval</label>
                      <select value={newSite.checkInterval}
                        onChange={e => setNewSite(s => ({ ...s, checkInterval: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="manual">Manual only</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Alert threshold (score)</label>
                      <input type="number" min="0" max="100"
                        value={newSite.alertThreshold}
                        onChange={e => setNewSite(s => ({ ...s, alertThreshold: parseInt(e.target.value) || 60 }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                    <input type="checkbox" checked={newSite.isOwned}
                      onChange={e => setNewSite(s => ({ ...s, isOwned: e.target.checked }))}
                      className="rounded" />
                    This is an owned/internal server (enables real server metrics)
                  </label>
                  <div className="flex gap-3">
                    <button onClick={addSite} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">Add Site</button>
                    <button onClick={() => setShowAddSite(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {/* Sites list */}
              <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
                {sites.length === 0 ? (
                  <div className="px-5 py-10 text-center text-white/30 text-sm">No sites yet. Add your first site to start monitoring.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {sites.map(site => (
                      <div key={site._id} className="px-5 py-4 flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${site.isActive ? 'bg-emerald-400' : 'bg-white/20'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{site.name}</span>
                            {site.isOwned && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">Owned</span>}
                          </div>
                          <div className="text-xs text-white/30 mt-0.5">{site.url}</div>
                          <div className="text-xs text-white/20 mt-0.5">
                            {site.checkInterval} · alert if score &lt; {site.alertThreshold}
                            {site.lastAuditAt && ` · last: ${timeAgo(site.lastAuditAt)}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {site.lastScore !== undefined && (
                            <div className={`text-sm font-bold ${scoreColor(site.lastScore)}`}>{site.lastScore}/100</div>
                          )}
                          <a href={site.url} target="_blank" rel="noopener noreferrer"
                            className="text-white/20 hover:text-white/60 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => { setAuditUrl(site.url); setTab('run-audit'); }}
                            className="text-xs px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded transition-colors">
                            Audit
                          </button>
                          <button onClick={() => deleteSite(site._id)}
                            className="text-white/20 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── SERVER TAB ─── */}
          {tab === 'server' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/30">Live server metrics · auto-refresh every 10s</p>
                <button onClick={loadMetrics} disabled={metricsLoading}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {serverMetrics ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* CPU */}
                    <MetricCard
                      icon={Cpu}
                      label="CPU Usage"
                      value={`${serverMetrics.cpuUsage}%`}
                      pct={serverMetrics.cpuUsage}
                      color={serverMetrics.cpuUsage > 80 ? 'bg-red-500' : serverMetrics.cpuUsage > 60 ? 'bg-amber-500' : 'bg-emerald-500'}
                      sub={`Load: ${serverMetrics.loadAvg.map(v => v.toFixed(2)).join(', ')}`}
                    />
                    {/* RAM */}
                    <MetricCard
                      icon={MemoryStick}
                      label="Memory"
                      value={`${serverMetrics.memoryUsed} / ${serverMetrics.memoryTotal} MB`}
                      pct={serverMetrics.memoryPercent}
                      color={serverMetrics.memoryPercent > 85 ? 'bg-red-500' : serverMetrics.memoryPercent > 70 ? 'bg-amber-500' : 'bg-blue-500'}
                      sub={`${serverMetrics.memoryPercent}% used`}
                    />
                    {/* Disk */}
                    <MetricCard
                      icon={HardDrive}
                      label="Disk"
                      value={`${serverMetrics.diskUsed} / ${serverMetrics.diskTotal} GB`}
                      pct={serverMetrics.diskPercent}
                      color={serverMetrics.diskPercent > 85 ? 'bg-red-500' : serverMetrics.diskPercent > 70 ? 'bg-amber-500' : 'bg-purple-500'}
                      sub={`${serverMetrics.diskPercent}% used`}
                    />
                    {/* Uptime */}
                    <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-white/40">Uptime</span>
                      </div>
                      <div className="text-xl font-bold text-emerald-400">{formatUptime(serverMetrics.uptime)}</div>
                      <div className="text-xs text-white/25 mt-1">{serverMetrics.platform} · {serverMetrics.nodeVersion}</div>
                    </div>
                  </div>

                  {/* Risk assessment */}
                  <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4">Server Risk Assessment</h3>
                    <div className="space-y-3">
                      {[
                        {
                          label: 'Crash Risk',
                          value: serverMetrics.cpuUsage > 90 || serverMetrics.memoryPercent > 90 ? 'HIGH' : serverMetrics.cpuUsage > 70 || serverMetrics.memoryPercent > 75 ? 'MEDIUM' : 'LOW',
                          color: serverMetrics.cpuUsage > 90 || serverMetrics.memoryPercent > 90 ? 'text-red-400' : serverMetrics.cpuUsage > 70 ? 'text-amber-400' : 'text-emerald-400',
                        },
                        {
                          label: 'Disk Failure Risk',
                          value: serverMetrics.diskPercent > 90 ? 'HIGH' : serverMetrics.diskPercent > 75 ? 'MEDIUM' : 'LOW',
                          color: serverMetrics.diskPercent > 90 ? 'text-red-400' : serverMetrics.diskPercent > 75 ? 'text-amber-400' : 'text-emerald-400',
                        },
                        {
                          label: 'Load Spike Risk',
                          value: serverMetrics.loadAvg[0] > 4 ? 'HIGH' : serverMetrics.loadAvg[0] > 2 ? 'MEDIUM' : 'LOW',
                          color: serverMetrics.loadAvg[0] > 4 ? 'text-red-400' : serverMetrics.loadAvg[0] > 2 ? 'text-amber-400' : 'text-emerald-400',
                        },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-sm text-white/60">{label}</span>
                          <span className={`text-sm font-bold ${color}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-white/30" />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, pct, color, sub }: {
  icon: any; label: string; value: string; pct: number; color: string; sub: string;
}) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-white/40" />
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <div className="text-sm font-semibold text-white mb-2">{value}</div>
      <MiniBar value={pct} max={100} color={color} />
      <div className="text-xs text-white/25 mt-1.5">{sub}</div>
    </div>
  );
}

function AuditReport({ audit, expandedIssue, setExpandedIssue }: {
  audit: Audit;
  expandedIssue: number | null;
  setExpandedIssue: (i: number | null) => void;
}) {
  const criticalCount = audit.issues.filter(i => i.severity === 'critical').length;
  const warningCount = audit.issues.filter(i => i.severity === 'warning').length;
  const infoCount = audit.issues.filter(i => i.severity === 'info').length;

  return (
    <div className="space-y-5">
      {/* Score overview */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs text-white/40 mb-1">Overall Score</div>
            <div className={`text-5xl font-black ${scoreColor(audit.overallScore)}`}>{audit.overallScore}</div>
            <div className="text-xs text-white/30 mt-1">/100 · {audit.url}</div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {criticalCount > 0 && <span className="flex items-center gap-1 text-red-400"><XCircle className="w-4 h-4" />{criticalCount} critical</span>}
            {warningCount > 0 && <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-4 h-4" />{warningCount} warnings</span>}
            {infoCount > 0 && <span className="flex items-center gap-1 text-blue-400"><Eye className="w-4 h-4" />{infoCount} info</span>}
          </div>
        </div>

        {/* 3 score pillars */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Performance', score: audit.performance.score, icon: Zap, details: [`${(audit.performance.responseTime / 1000).toFixed(1)}s response`, `LCP: ${(audit.performance.lcp / 1000).toFixed(1)}s`, `CLS: ${audit.performance.cls}`] },
            { label: 'SEO', score: audit.seo.score, icon: Search, details: [audit.seo.isHttps ? 'HTTPS ✓' : 'No HTTPS ✗', `H1: ${audit.seo.h1Count}`, audit.seo.sitemapXml ? 'Sitemap ✓' : 'No sitemap'] },
            { label: 'Security', score: audit.security.score, icon: Shield, details: [audit.security.hasCSP ? 'CSP ✓' : 'No CSP ✗', audit.security.hasHSTS ? 'HSTS ✓' : 'No HSTS ✗', audit.security.hasXFrame ? 'X-Frame ✓' : 'No X-Frame ✗'] },
          ].map(({ label, score, icon: Icon, details }) => (
            <div key={label} className={`p-3 rounded-lg border ${scoreBg(score)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs text-white/60"><Icon className="w-3.5 h-3.5" />{label}</div>
                <span className={`text-lg font-bold ${scoreColor(score)}`}>{score}</span>
              </div>
              <div className="space-y-0.5">
                {details.map(d => (
                  <div key={d} className={`text-[11px] ${d.includes('✗') ? 'text-red-400' : d.includes('✓') ? 'text-emerald-400' : 'text-white/40'}`}>{d}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance details */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-400" />Performance Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Response Time', value: `${audit.performance.responseTime}ms`, good: audit.performance.responseTime < 1000 },
            { label: 'LCP', value: `${(audit.performance.lcp / 1000).toFixed(1)}s`, good: audit.performance.lcp < 2500 },
            { label: 'FCP', value: `${(audit.performance.fcp / 1000).toFixed(1)}s`, good: audit.performance.fcp < 1800 },
            { label: 'CLS', value: String(audit.performance.cls), good: audit.performance.cls < 0.1 },
            { label: 'TBT', value: `${audit.performance.tbt}ms`, good: audit.performance.tbt < 200 },
            { label: 'TTFB', value: `${audit.performance.ttfb}ms`, good: audit.performance.ttfb < 600 },
          ].map(({ label, value, good }) => (
            <div key={label} className="bg-white/3 rounded-lg p-3 text-center">
              <div className={`text-lg font-bold ${good ? 'text-emerald-400' : 'text-red-400'}`}>{value}</div>
              <div className="text-xs text-white/30 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues list */}
      {audit.issues.length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Issues & Fixes ({audit.issues.length})
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {audit.issues
              .sort((a, b) => {
                const order = { critical: 0, warning: 1, info: 2 };
                return order[a.severity] - order[b.severity];
              })
              .map((issue, idx) => (
                <div key={idx}>
                  <button
                    className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-white/2 transition-colors"
                    onClick={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
                  >
                    <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${severityColor(issue.severity)}`}>
                      {issue.severity}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/80 font-medium">{issue.title}</div>
                      <div className="text-xs text-white/30 capitalize">{issue.category}</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/20 transition-transform shrink-0 ${expandedIssue === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedIssue === idx && (
                    <div className="px-5 pb-4 bg-white/2 space-y-3">
                      <div>
                        <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">Problem</div>
                        <p className="text-sm text-white/60">{issue.description}</p>
                      </div>
                      <div>
                        <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">Fix</div>
                        <div className="bg-black/30 rounded-lg p-3 text-sm text-emerald-300 font-mono whitespace-pre-wrap break-words">{issue.fix}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {audit.issues.length === 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-emerald-400 font-medium">No issues found!</p>
          <p className="text-white/30 text-sm mt-1">Your website passed all audit checks.</p>
        </div>
      )}
    </div>
  );
}
