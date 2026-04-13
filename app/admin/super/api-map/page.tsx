'use client';

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  Network, RefreshCcw, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, Search, Filter, Zap, Eye, Shield,
  Activity, Clock, Server, Key, ExternalLink, Wifi, WifiOff,
} from 'lucide-react';

interface PageEntry {
  page: string;
  route: string;
  desc: string;
}

interface ApiEntry {
  id: string;
  name: string;
  category: string;
  model: string | null;
  hasKey: boolean;
  purpose: string;
  pages: PageEntry[];
  health: { status: 'ok' | 'fail' | 'no-key'; latencyMs?: number } | null;
  usage: { calls: number; failures: number; lastUsed: number } | null;
}

interface Summary {
  total: number;
  configured: number;
  missing: number;
  aiProviders: number;
  aiHealthy: number;
  aiFailing: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'AI / LLM': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  Platform: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  Transcription: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  Payments: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  Email: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  Search: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  Monitoring: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

function StatusDot({ status }: { status: 'ok' | 'fail' | 'no-key' | 'unknown' }) {
  const colors = {
    ok: 'bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]',
    fail: 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
    'no-key': 'bg-amber-400',
    unknown: 'bg-[#333]',
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status]}`} />;
}

function formatTime(ts: number): string {
  if (!ts) return 'Never';
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export default function ApiMapPage() {
  const [apis, setApis] = useState<ApiEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/admin/super/api-map', { headers: getAuthHeaders(), timeout: 30000 });
      setApis(res.data.apis || []);
      setSummary(res.data.summary || null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load API map');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(filteredApis.map(a => a.id)));
  const collapseAll = () => setExpanded(new Set());

  const categories = useMemo(() => [...new Set(apis.map(a => a.category))], [apis]);

  const filteredApis = useMemo(() => {
    return apis.filter(api => {
      if (filterCategory !== 'all' && api.category !== filterCategory) return false;
      if (filterStatus === 'ok' && !(api.hasKey && (api.health?.status === 'ok' || !api.health))) return false;
      if (filterStatus === 'fail' && !(api.hasKey && api.health?.status === 'fail')) return false;
      if (filterStatus === 'no-key' && api.hasKey) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          api.name.toLowerCase().includes(q) ||
          api.purpose.toLowerCase().includes(q) ||
          api.pages.some(p => p.page.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [apis, filterCategory, filterStatus, searchQuery]);

  const totalPages = useMemo(() => {
    const unique = new Set<string>();
    apis.forEach(api => api.pages.forEach(p => unique.add(p.page)));
    return unique.size;
  }, [apis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#FF0000] mx-auto mb-3" />
          <p className="text-[#555] text-sm">Loading API Map...</p>
          <p className="text-[#333] text-xs mt-1">Testing all provider connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-[#FF0000]" />
            API Map
          </h1>
          <p className="text-xs text-[#555] mt-1">
            Complete mapping of every API service, which pages use it, real-time health, and usage stats
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#181818] border border-[#252525] text-xs text-[#888] hover:text-white hover:border-[#FF0000] transition"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <SummaryCard title="Total APIs" value={summary.total} icon={<Server className="w-4 h-4 text-blue-400" />} />
          <SummaryCard title="Configured" value={summary.configured} icon={<Key className="w-4 h-4 text-green-400" />} />
          <SummaryCard title="Missing Keys" value={summary.missing} icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} />
          <SummaryCard title="AI Providers" value={summary.aiProviders} icon={<Zap className="w-4 h-4 text-purple-400" />} />
          <SummaryCard title="AI Healthy" value={summary.aiHealthy} icon={<Wifi className="w-4 h-4 text-emerald-400" />} />
          <SummaryCard title="Pages Covered" value={totalPages} icon={<Eye className="w-4 h-4 text-cyan-400" />} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#444]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search APIs, pages, features..."
            className="w-full pl-10 pr-4 py-2 bg-[#111] border border-[#1f1f1f] rounded-lg text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#FF0000]/50 transition"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-[#111] border border-[#1f1f1f] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF0000]/50 transition"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[#111] border border-[#1f1f1f] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF0000]/50 transition"
        >
          <option value="all">All Statuses</option>
          <option value="ok">Working</option>
          <option value="fail">Failing</option>
          <option value="no-key">Missing Key</option>
        </select>
        <div className="flex gap-1">
          <button onClick={expandAll} className="px-3 py-2 bg-[#111] border border-[#1f1f1f] rounded-lg text-[#666] text-xs hover:text-white transition">
            Expand All
          </button>
          <button onClick={collapseAll} className="px-3 py-2 bg-[#111] border border-[#1f1f1f] rounded-lg text-[#666] text-xs hover:text-white transition">
            Collapse
          </button>
        </div>
      </div>

      {/* API Cards */}
      <div className="space-y-2">
        {filteredApis.map(api => {
          const isOpen = expanded.has(api.id);
          const catColor = CATEGORY_COLORS[api.category] || CATEGORY_COLORS.Monitoring;
          const status: 'ok' | 'fail' | 'no-key' | 'unknown' = !api.hasKey
            ? 'no-key'
            : api.health?.status || 'unknown';
          const statusLabel = status === 'ok' ? 'Working' : status === 'fail' ? 'Failing' : status === 'no-key' ? 'No Key' : 'Unknown';
          const failRate = api.usage && api.usage.calls > 0 ? ((api.usage.failures / api.usage.calls) * 100).toFixed(0) : null;

          return (
            <div key={api.id} className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden hover:border-[#292929] transition">
              {/* Header Row */}
              <button
                onClick={() => toggleExpand(api.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <StatusDot status={status} />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{api.name}</h3>
                    {api.model && (
                      <span className="text-[9px] text-[#555] font-mono bg-[#0a0a0a] px-1.5 py-0.5 rounded">{api.model}</span>
                    )}
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${catColor.bg} ${catColor.text} ${catColor.border} border`}>
                      {api.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#555] mt-0.5 line-clamp-1">{api.purpose}</p>
                </div>

                {/* Stats - desktop */}
                <div className="hidden md:flex items-center gap-4">
                  {api.usage && api.usage.calls > 0 && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">{api.usage.calls}</p>
                      <p className="text-[9px] text-[#444]">calls</p>
                    </div>
                  )}
                  {failRate && parseInt(failRate) > 0 && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-400">{failRate}%</p>
                      <p className="text-[9px] text-[#444]">fail rate</p>
                    </div>
                  )}
                  {api.health?.latencyMs && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-cyan-400">{api.health.latencyMs}ms</p>
                      <p className="text-[9px] text-[#444]">latency</p>
                    </div>
                  )}
                  <div className="text-right min-w-[60px]">
                    <p className="text-[10px] font-bold">{api.pages.length}</p>
                    <p className="text-[9px] text-[#444]">pages</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                  status === 'ok' ? 'bg-emerald-500/10 text-emerald-400' :
                  status === 'fail' ? 'bg-red-500/10 text-red-400' :
                  status === 'no-key' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-[#1a1a1a] text-[#555]'
                }`}>
                  {statusLabel}
                </span>

                {isOpen ? <ChevronDown className="w-4 h-4 text-[#555] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#555] shrink-0" />}
              </button>

              {/* Expanded Content */}
              {isOpen && (
                <div className="border-t border-[#1a1a1a] px-4 pb-4">
                  {/* Mobile Stats */}
                  <div className="flex md:hidden flex-wrap gap-3 pt-3 pb-2">
                    {api.usage && api.usage.calls > 0 && (
                      <span className="text-[10px] text-[#888]">
                        <strong className="text-white">{api.usage.calls}</strong> calls
                      </span>
                    )}
                    {failRate && parseInt(failRate) > 0 && (
                      <span className="text-[10px] text-[#888]">
                        <strong className="text-red-400">{failRate}%</strong> fail rate
                      </span>
                    )}
                    {api.health?.latencyMs && (
                      <span className="text-[10px] text-[#888]">
                        <strong className="text-cyan-400">{api.health.latencyMs}ms</strong> latency
                      </span>
                    )}
                    {api.usage?.lastUsed ? (
                      <span className="text-[10px] text-[#888]">
                        Last: <strong className="text-white">{formatTime(api.usage.lastUsed)}</strong>
                      </span>
                    ) : null}
                  </div>

                  {/* Usage bar (desktop) */}
                  {api.usage && api.usage.calls > 0 && (
                    <div className="hidden md:flex items-center gap-3 pt-3 pb-2 text-[10px] text-[#666]">
                      <Activity className="w-3 h-3" />
                      <span><strong className="text-white">{api.usage.calls}</strong> total calls</span>
                      <span className="text-[#333]">|</span>
                      <span><strong className="text-green-400">{api.usage.calls - api.usage.failures}</strong> success</span>
                      <span className="text-[#333]">|</span>
                      <span><strong className="text-red-400">{api.usage.failures}</strong> failed</span>
                      <span className="text-[#333]">|</span>
                      <span>Last used: <strong className="text-white">{formatTime(api.usage.lastUsed)}</strong></span>
                    </div>
                  )}

                  {/* Pages Table */}
                  <div className="mt-2">
                    <p className="text-[10px] text-[#444] uppercase tracking-wider font-bold mb-2">
                      Pages using this API ({api.pages.length})
                    </p>
                    <div className="space-y-1">
                      {api.pages.map((p, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-2.5 rounded-lg bg-[#0a0a0a] border border-[#181818] hover:border-[#252525] transition">
                          <div className="flex items-center gap-2 sm:w-[220px] shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF0000] shrink-0" />
                            <span className="text-xs font-medium text-white truncate">{p.page}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#444] sm:w-[240px] shrink-0 truncate pl-3.5 sm:pl-0">
                            {p.route}
                          </span>
                          <span className="text-[11px] text-[#666] flex-1 pl-3.5 sm:pl-0">
                            {p.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredApis.length === 0 && !loading && (
        <div className="text-center py-16">
          <WifiOff className="w-10 h-10 text-[#252525] mx-auto mb-3" />
          <p className="text-sm text-[#555]">No APIs match your filters</p>
        </div>
      )}

      {/* AI Failover Chain Visual */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          AI Failover Chain (routeAI)
        </h3>
        <p className="text-[11px] text-[#555] mb-4">
          When one AI provider fails, the system automatically tries the next one. All AI-powered features use this chain.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {apis.filter(a => a.category === 'AI / LLM').map((api, idx, arr) => {
            const status = !api.hasKey ? 'no-key' : api.health?.status || 'unknown';
            return (
              <div key={api.id} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                  status === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  status === 'fail' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  status === 'no-key' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-[#1a1a1a] border-[#252525] text-[#666]'
                }`}>
                  <StatusDot status={status} />
                  <span>{api.name}</span>
                  {api.health?.latencyMs && (
                    <span className="text-[9px] opacity-60">{api.health.latencyMs}ms</span>
                  )}
                </div>
                {idx < arr.length - 1 && (
                  <span className="text-[#333] text-xs">→</span>
                )}
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-[#1a1a1a] border-[#252525] text-[#555] text-xs">
            Mock (fallback)
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-[#333] text-center">
        Usage stats are per server instance and reset on restart. Health checks run live on each page load.
      </p>
    </div>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3 sm:p-4 hover:border-[#292929] transition">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold">{title}</p>
        {icon}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
