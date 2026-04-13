'use client';

export const dynamic = "force-dynamic";

import { ReactNode, useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  Activity, Brain, Bot, RefreshCcw, Cpu, Zap, Shield, Clock, AlertCircle,
  CheckCircle2, XCircle, Wifi, WifiOff, TrendingUp, BarChart3, PieChart as PieChartIcon,
  Server, Key, Loader2, ChevronDown, ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, Area, AreaChart,
} from 'recharts';

type MonitorData = {
  model?: { version?: string; trainedAt?: string; status?: string; epochs?: number } | null;
  totalPredictions: number;
  labeledPredictions?: number;
  support: { autoReplied: number; escalated: number; avgConfidence: number };
  queue: Array<{ _id: string; count: number }>;
  confidenceDistribution: Array<{ _id: string | number; count: number }>;
  recentModels?: any[];
  generatedAt?: string;
};

type ApiStatusItem = {
  id: string;
  name: string;
  hasKey: boolean;
  status: 'no-key' | 'ok' | 'error';
  message: string;
  limitInfo: string;
  usedBy?: string[];
};

const CONFIDENCE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
const CONFIDENCE_LABELS: Record<string, string> = { '0': '0-25%', '0.25': '25-50%', '0.5': '50-75%', '0.75': '75-100%', 'other': 'N/A' };

export default function AiMonitoringPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'apis' | 'models'>('overview');
  const [expandedApi, setExpandedApi] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const load = useCallback(async () => {
    const errs: string[] = [];
    try {
      const m1 = await axios.get('/api/admin/super/ai-monitoring', { headers: getAuthHeaders() });
      setData(m1.data || null);
    } catch (err: any) {
      errs.push(`Monitoring API: ${err.response?.data?.error || err.message}`);
    }
    try {
      const m2 = await axios.get('/api/ai/metrics?scope=global', { headers: getAuthHeaders() });
      setMetrics(m2.data || null);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      if (err.response?.status !== 403) {
        errs.push(`Metrics API: ${msg}`);
      }
      // 403 = feature access issue, silently skip
    }
    setErrors(errs);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  const loadApiStatus = useCallback(async () => {
    setApiLoading(true);
    setErrors(prev => prev.filter(e => !e.startsWith('API Status:')));
    try {
      const res = await axios.get('/api/admin/api-status', { headers: getAuthHeaders(), timeout: 120000 });
      setApiStatus(res.data.apis || []);
      setApiLoaded(true);
    } catch (err: any) {
      setApiStatus([]);
      setApiLoaded(true);
      const msg = err.code === 'ECONNABORTED' ? 'Request timed out (120s). Try again.' : (err.response?.data?.error || err.message);
      setErrors(prev => [...prev, `API Status: ${msg}`]);
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  useEffect(() => {
    if (activeTab === 'apis' && !apiLoaded && !apiLoading) loadApiStatus();
  }, [activeTab, apiLoaded, apiLoading, loadApiStatus]);

  // Derived stats
  const supportPie = useMemo(() => [
    { name: 'AI Auto-replied', value: data?.support?.autoReplied || 0, color: '#22c55e' },
    { name: 'Escalated to Admin', value: data?.support?.escalated || 0, color: '#f59e0b' },
  ], [data]);

  const confidenceData = useMemo(() =>
    (data?.confidenceDistribution || []).map((d, i) => ({
      range: CONFIDENCE_LABELS[String(d._id)] || String(d._id),
      count: d.count,
      fill: CONFIDENCE_COLORS[i] || '#666',
    })),
  [data]);

  const queueData = useMemo(() => {
    const statusColors: Record<string, string> = { queued: '#3b82f6', processing: '#f59e0b', completed: '#22c55e', failed: '#ef4444' };
    return (data?.queue || []).map(q => ({ ...q, fill: statusColors[q._id] || '#666' }));
  }, [data]);

  const totalQueue = queueData.reduce((s, q) => s + q.count, 0);
  const failedJobs = queueData.find(q => q._id === 'failed')?.count || 0;
  const completedJobs = queueData.find(q => q._id === 'completed')?.count || 0;
  const successRate = totalQueue > 0 ? Math.round((completedJobs / totalQueue) * 100) : 0;

  // API status summary
  const apisOk = apiStatus.filter(a => a.status === 'ok').length;
  const apisError = apiStatus.filter(a => a.status === 'error').length;
  const apisNoKey = apiStatus.filter(a => a.status === 'no-key').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#FF0000] mx-auto mb-3" />
          <p className="text-[#666] text-sm">Loading AI Monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-[#FF0000]" /> AI Monitoring Center
          </h1>
          <p className="text-sm text-[#666] mt-1">
            Model health, API connectivity, queue performance, and support automation
            {lastRefresh && <span className="ml-2 text-[#444]">Last: {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#888] cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="accent-[#FF0000] rounded" />
            Auto-refresh (30s)
          </label>
          <button onClick={() => { setLoading(true); load(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#181818] border border-[#333] text-sm text-[#AAA] hover:text-white hover:border-[#FF0000] transition-colors">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#181818] border border-[#212121] rounded-xl p-1 w-fit">
        {([['overview', 'Overview', Activity], ['apis', 'API Status', Wifi], ['models', 'Models & Jobs', Cpu]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === key ? 'bg-[#FF0000] text-white shadow-lg shadow-red-600/20' : 'text-[#888] hover:text-white hover:bg-[#212121]'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-3 h-3 shrink-0" /> {err}
            </p>
          ))}
        </div>
      )}

      {/* ═══════ OVERVIEW TAB ═══════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard title="Active Model" value={data?.model?.version || 'N/A'} icon={<Brain className="w-4 h-4 text-red-400" />} />
            <StatCard title="Total Predictions" value={String(data?.totalPredictions || 0)} icon={<Activity className="w-4 h-4 text-blue-400" />} />
            <StatCard title="Ground-truth" value={String(data?.labeledPredictions || metrics?.labeledForMetrics || 0)} icon={<CheckCircle2 className="w-4 h-4 text-cyan-400" />} />
            <StatCard
              title="MAE / RMSE"
              value={metrics?.insufficientGroundTruth ? 'Need 5+ labels' : `${metrics?.mae ?? '—'} / ${metrics?.rmse ?? '—'}`}
              icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            />
            <StatCard title="Avg Confidence" value={`${Math.round((data?.support?.avgConfidence || 0) * 100)}%`} icon={<Bot className="w-4 h-4 text-violet-400" />} />
            <StatCard title="Job Success" value={`${successRate}%`} icon={<Zap className="w-4 h-4 text-amber-400" />} sub={`${failedJobs} failed`} />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Support AI: Auto vs Escalated" icon={<PieChartIcon className="w-4 h-4 text-emerald-400" />}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={supportPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={4}>
                      {supportPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: 8 }} />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2 text-xs">
                <span className="text-emerald-400 font-bold">{data?.support?.autoReplied || 0} AI replies</span>
                <span className="text-amber-400 font-bold">{data?.support?.escalated || 0} escalated</span>
              </div>
            </Panel>

            <Panel title="AI Confidence Distribution" icon={<BarChart3 className="w-4 h-4 text-blue-400" />}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                    <XAxis dataKey="range" stroke="#666" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {confidenceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Job Queue Status" icon={<Server className="w-4 h-4 text-amber-400" />}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={queueData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                    <XAxis type="number" stroke="#666" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="_id" type="category" stroke="#666" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {queueData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          {/* Accuracy Trend */}
          <Panel title="Model Accuracy Trend (MAE & RMSE over time)" icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}>
            <div className="h-64">
              {metrics?.trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                    <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="mae" stroke="#22c55e" fill="#22c55e20" strokeWidth={2} name="MAE" />
                    <Area type="monotone" dataKey="rmse" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} name="RMSE" />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[#555] text-sm">
                  <p>No trend data available yet. Need ground-truth labeled predictions.</p>
                </div>
              )}
            </div>
          </Panel>

          {metrics?.definition && (
            <p className="text-[10px] text-[#444] max-w-4xl leading-relaxed">{metrics.definition}</p>
          )}
        </div>
      )}

      {/* ═══════ API STATUS TAB ═══════ */}
      {activeTab === 'apis' && (
        <div className="space-y-4">
          {/* API Summary */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard title="Connected" value={String(apisOk)} icon={<Wifi className="w-4 h-4 text-emerald-400" />} />
            <StatCard title="Errors" value={String(apisError)} icon={<XCircle className="w-4 h-4 text-red-400" />} />
            <StatCard title="Missing Keys" value={String(apisNoKey)} icon={<Key className="w-4 h-4 text-amber-400" />} />
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-[#888]">{apiStatus.length} APIs configured — Live connection test</p>
            <button onClick={() => { setApiLoaded(false); loadApiStatus(); }} disabled={apiLoading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#181818] border border-[#333] text-xs text-[#AAA] hover:border-[#FF0000] disabled:opacity-50">
              {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              {apiLoading ? 'Testing APIs...' : 'Test All APIs'}
            </button>
          </div>

          {/* API List */}
          <div className="space-y-2">
            {apiStatus.map(api => (
              <div key={api.id} className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden hover:border-[#333] transition-colors">
                <button
                  onClick={() => setExpandedApi(expandedApi === api.id ? null : api.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${api.status === 'ok' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : api.status === 'error' ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{api.name}</p>
                      <p className="text-[10px] text-[#555] font-mono">{api.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      api.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400' :
                      api.status === 'error' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {api.status === 'ok' ? 'Connected' : api.status === 'error' ? 'Error' : 'No Key'}
                    </span>
                    {expandedApi === api.id ? <ChevronDown className="w-4 h-4 text-[#666]" /> : <ChevronRight className="w-4 h-4 text-[#666]" />}
                  </div>
                </button>
                {expandedApi === api.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-[#212121] space-y-2">
                    <div className="flex items-center gap-2 text-xs mt-3">
                      <Key className="w-3 h-3 text-[#555]" />
                      <span className="text-[#888]">API Key:</span>
                      <span className={api.hasKey ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{api.hasKey ? 'Configured' : 'Missing'}</span>
                    </div>
                    <div className="text-xs text-[#888] flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-[#555] mt-0.5 shrink-0" />
                      <span>{api.message}</span>
                    </div>
                    <div className="text-xs text-[#666] flex items-start gap-2">
                      <Activity className="w-3 h-3 text-[#555] mt-0.5 shrink-0" />
                      <span>{api.limitInfo}</span>
                    </div>
                    {api.usedBy && api.usedBy.length > 0 && (
                      <div className="text-xs text-[#555] mt-1">
                        <p className="font-bold text-[#666] mb-1">Used by:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {api.usedBy.map((u, i) => <li key={i}>{u}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {apiLoading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF0000] mx-auto mb-3" />
                <p className="text-[#666] text-sm">Testing all API connections... This may take up to 30 seconds.</p>
              </div>
            )}
            {!apiLoading && apiLoaded && apiStatus.length === 0 && (
              <div className="text-center py-12 text-[#555]">
                <WifiOff className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No API configurations found. Check your environment variables or API Config page.</p>
              </div>
            )}
            {!apiLoading && !apiLoaded && (
              <div className="text-center py-12 text-[#555]">
                <Wifi className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Loading API status...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ MODELS & JOBS TAB ═══════ */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          {/* Active Model Details */}
          <Panel title="Active Model" icon={<Brain className="w-4 h-4 text-red-400" />}>
            {data?.model ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-[#555] uppercase tracking-wider">Version</p>
                  <p className="text-lg font-bold text-white mt-1">{data.model.version || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#555] uppercase tracking-wider">Status</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{data.model.status || 'ready'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#555] uppercase tracking-wider">Epochs</p>
                  <p className="text-lg font-bold text-white mt-1">{data.model.epochs || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#555] uppercase tracking-wider">Trained At</p>
                  <p className="text-sm font-medium text-white mt-1">{data.model.trainedAt ? new Date(data.model.trainedAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            ) : (
              <p className="text-[#666] text-sm">No active model found.</p>
            )}
          </Panel>

          {/* Recent Models */}
          <Panel title="Model Version History" icon={<Cpu className="w-4 h-4 text-blue-400" />}>
            {data?.recentModels && data.recentModels.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] text-[#555] uppercase tracking-wider border-b border-[#212121]">
                      <th className="pb-2 text-left">Version</th>
                      <th className="pb-2 text-left">Status</th>
                      <th className="pb-2 text-left">Active</th>
                      <th className="pb-2 text-left">Epochs</th>
                      <th className="pb-2 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {data.recentModels.map((m: any, i: number) => (
                      <tr key={m._id || i} className="hover:bg-[#1A1A1A]">
                        <td className="py-2.5 font-mono text-white text-xs">{m.version || '—'}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            m.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' :
                            m.status === 'training' ? 'bg-amber-500/10 text-amber-400' :
                            m.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {m.status || 'unknown'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          {m.isActive ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-[#444]">—</span>}
                        </td>
                        <td className="py-2.5 text-[#888] text-xs">{m.epochs || '—'}</td>
                        <td className="py-2.5 text-right text-[#666] text-xs">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[#666] text-sm">No model history available.</p>
            )}
          </Panel>

          {/* Job Queue Details */}
          <Panel title="Job Queue Breakdown" icon={<Server className="w-4 h-4 text-amber-400" />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['queued', 'processing', 'completed', 'failed'].map(status => {
                const count = queueData.find(q => q._id === status)?.count || 0;
                const colors: Record<string, string> = { queued: 'text-blue-400', processing: 'text-amber-400', completed: 'text-emerald-400', failed: 'text-red-400' };
                const bgs: Record<string, string> = { queued: 'bg-blue-500/10', processing: 'bg-amber-500/10', completed: 'bg-emerald-500/10', failed: 'bg-red-500/10' };
                return (
                  <div key={status} className={`${bgs[status]} rounded-xl p-4 text-center`}>
                    <p className={`text-2xl font-bold ${colors[status]}`}>{count}</p>
                    <p className="text-[10px] text-[#666] uppercase tracking-wider mt-1 capitalize">{status}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-[#666]">
              <span>Total Jobs: <strong className="text-white">{totalQueue}</strong></span>
              <span>Success Rate: <strong className={successRate >= 90 ? 'text-emerald-400' : successRate >= 70 ? 'text-amber-400' : 'text-red-400'}>{successRate}%</strong></span>
            </div>
          </Panel>

          {/* Metrics Breakdown */}
          {metrics?.byModel && metrics.byModel.length > 0 && (
            <Panel title="Metrics by Model Version" icon={<BarChart3 className="w-4 h-4 text-purple-400" />}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] text-[#555] uppercase tracking-wider border-b border-[#212121]">
                      <th className="pb-2 text-left">Model</th>
                      <th className="pb-2 text-right">MAE</th>
                      <th className="pb-2 text-right">RMSE</th>
                      <th className="pb-2 text-right">Samples</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {metrics.byModel.map((m: any, i: number) => (
                      <tr key={i} className="hover:bg-[#1A1A1A]">
                        <td className="py-2 font-mono text-white text-xs">{m.modelVersion || 'unknown'}</td>
                        <td className="py-2 text-right text-emerald-400 text-xs font-bold">{m.mae?.toFixed(2) ?? '—'}</td>
                        <td className="py-2 text-right text-blue-400 text-xs font-bold">{m.rmse?.toFixed(2) ?? '—'}</td>
                        <td className="py-2 text-right text-[#888] text-xs">{m.count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Reusable Components ────────────────────────────────── */
function StatCard({ title, value, icon, sub }: { title: string; value: string; icon: ReactNode; sub?: string }) {
  return (
    <div className="bg-[#181818] border border-[#212121] rounded-xl p-4 hover:border-[#333] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold">{title}</p>
        {icon}
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-[9px] text-[#555] mt-1">{sub}</p>}
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-[#181818] border border-[#212121] rounded-xl p-5">
      <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}
