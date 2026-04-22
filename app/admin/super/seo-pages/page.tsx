'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  Search, Filter, ExternalLink, Edit3, Trash2, CheckCircle2, XCircle,
  Clock, TrendingUp, Eye, BarChart3, RefreshCw, Play, Shield,
  ChevronLeft, ChevronRight, AlertTriangle, Globe, Database, Zap,
} from 'lucide-react';

interface PageItem {
  slug: string;
  keyword: string;
  title: string;
  url: string;
  absoluteUrl: string;
  category: string;
  source: string;
  viralScore: number;
  qualityScore: number;
  wordCount: number;
  views: number;
  trendingRank: number;
  isIndexable: boolean;
  status: 'indexable' | 'pending' | 'rejected';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  gsc: { clicks: number; impressions: number; ctr: number; position: number } | null;
}

interface Stats {
  counts: {
    total: number;
    createdToday: number;
    created7d: number;
    created30d: number;
    indexable: number;
    pending: number;
    rejected: number;
    avgQualityScore: number;
  };
  bySource: { _id: string; count: number }[];
  byCategory: { _id: string; count: number; indexed: number }[];
  dailyCreation: { _id: string; count: number; indexed: number }[];
  gsc: {
    configured: boolean;
    connected: boolean;
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
    topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
    error?: string;
  };
  threshold: number;
}

interface ListResponse {
  items: PageItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
  gscConnected: boolean;
}

const PAGE_LIMIT = 25;

function StatCard({ label, value, sub, icon: Icon, tone = 'neutral' }: {
  label: string; value: string | number; sub?: string; icon: any; tone?: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  const toneClass = {
    good: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400',
    warn: 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-400',
    bad: 'from-red-500/10 to-transparent border-red-500/20 text-red-400',
    neutral: 'from-white/5 to-transparent border-white/10 text-white/60',
  }[tone];
  return (
    <div className={`p-4 rounded-xl border bg-gradient-to-br ${toneClass}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: PageItem['status'] }) {
  const map = {
    indexable: { label: 'Indexable', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
    pending: { label: 'Pending', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Clock },
    rejected: { label: 'Rejected', cls: 'bg-red-500/10 text-red-400 border-red-500/30', icon: XCircle },
  } as const;
  const { label, cls, icon: Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

function QualityBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-400' : score >= 70 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <span className="text-xs tabular-nums text-white/70 w-6">{score}</span>
    </div>
  );
}

export default function SeoPagesAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [list, setList] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [err, setErr] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionBusy, setActionBusy] = useState(false);
  const [cronBusy, setCronBusy] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await axios.get<{ success: boolean } & Stats>('/api/admin/super/seo-pages/stats', { headers: getAuthHeaders() });
      setStats(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to load stats');
    }
  }, []);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const params = new URLSearchParams({
        search, category, status, source, sort, order,
        page: String(page), limit: String(PAGE_LIMIT),
      });
      const res = await axios.get<{ success: boolean } & ListResponse>(
        `/api/admin/super/seo-pages/list?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      setList(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to load pages');
    } finally {
      setListLoading(false);
    }
  }, [search, category, status, source, sort, order, page]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadList()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { loadList(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [category, status, source, sort, order, page]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [search, category, status, source]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => loadList(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Keep selection scoped to visible rows
  const visibleSlugs = useMemo(() => new Set(list?.items.map(i => i.slug) || []), [list]);
  const allVisibleSelected = useMemo(
    () => list && list.items.length > 0 && list.items.every(i => selected.has(i.slug)),
    [list, selected]
  );

  function toggleSelectAll() {
    if (allVisibleSelected) setSelected(new Set());
    else setSelected(new Set(list?.items.map(i => i.slug) || []));
  }
  function toggleRow(slug: string) {
    const n = new Set(selected);
    if (n.has(slug)) n.delete(slug); else n.add(slug);
    setSelected(n);
  }

  async function doBulk(action: 'delete' | 'promote' | 'demote') {
    if (selected.size === 0) return;
    const confirmMsg =
      action === 'delete' ? `Delete ${selected.size} pages? Cannot be undone.`
      : action === 'promote' ? `Promote ${selected.size} pages to indexable?`
      : `Demote ${selected.size} pages to non-indexable?`;
    if (!confirm(confirmMsg)) return;
    setActionBusy(true);
    try {
      await axios.post('/api/admin/super/seo-pages/bulk',
        { action, slugs: Array.from(selected) },
        { headers: getAuthHeaders() }
      );
      setSelected(new Set());
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Bulk action failed');
    } finally {
      setActionBusy(false);
    }
  }

  async function deleteOne(slug: string) {
    if (!confirm(`Delete page /k/${slug}?`)) return;
    try {
      await axios.delete(`/api/admin/super/seo-pages/${encodeURIComponent(slug)}`, { headers: getAuthHeaders() });
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Delete failed');
    }
  }

  async function togglePromote(p: PageItem) {
    const action = p.isIndexable ? 'demote' : 'promote';
    try {
      await axios.patch(`/api/admin/super/seo-pages/${encodeURIComponent(p.slug)}`,
        { action }, { headers: getAuthHeaders() });
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Action failed');
    }
  }

  async function fireCron(endpoint: string, label: string) {
    setCronBusy(endpoint);
    try {
      await axios.get(endpoint, { headers: getAuthHeaders() });
      await Promise.all([loadStats(), loadList()]);
      alert(`${label} completed.`);
    } catch (e: any) {
      alert(e?.response?.data?.error || `${label} failed`);
    } finally {
      setCronBusy(null);
    }
  }

  const categories = useMemo(
    () => Array.from(new Set(stats?.byCategory.map(c => c._id).filter(Boolean) || [])),
    [stats]
  );

  return (
    <div className="min-h-screen bg-[#050712] text-white/80 p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-red-400" />
            SEO Pages
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Auto-generated /k/ keyword pages — quality-gated indexing, GSC performance, edit & remove.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { loadStats(); loadList(); }}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => fireCron('/api/cron/generate-trending-pages', 'Generate trending pages')}
            disabled={cronBusy !== null}
            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {cronBusy === '/api/cron/generate-trending-pages' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Generate Trending
          </button>
          <button
            onClick={() => fireCron('/api/cron/promote-seo-pages', 'Promote top 100')}
            disabled={cronBusy !== null}
            className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {cronBusy === '/api/cron/promote-seo-pages' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Promote Top 100
          </button>
        </div>
      </div>

      {err && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" /> {err}
          <button onClick={() => setErr('')} className="ml-auto text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total Pages" value={stats?.counts.total ?? '—'} icon={Database} />
        <StatCard label="Today" value={stats?.counts.createdToday ?? '—'} icon={TrendingUp} tone="good" />
        <StatCard label="Last 7 days" value={stats?.counts.created7d ?? '—'} icon={TrendingUp} />
        <StatCard label="Last 30 days" value={stats?.counts.created30d ?? '—'} icon={TrendingUp} />
        <StatCard label="Indexable" value={stats?.counts.indexable ?? '—'} icon={CheckCircle2} tone="good" sub="in sitemap" />
        <StatCard label="Pending" value={stats?.counts.pending ?? '—'} icon={Clock} tone="warn" sub={`≥${stats?.threshold ?? 70} score`} />
        <StatCard label="Rejected" value={stats?.counts.rejected ?? '—'} icon={XCircle} tone="bad" sub="below threshold" />
        <StatCard label="Avg Quality" value={stats?.counts.avgQualityScore ?? '—'} icon={Shield} sub="of 100" />
      </div>

      {/* GSC row */}
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> Google Search Console (last 28 days)
          </h2>
          {stats && (
            <span className={`text-xs px-2 py-0.5 rounded border ${
              stats.gsc.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/40 border-white/10'
            }`}>
              {stats.gsc.connected ? 'Connected' : stats.gsc.configured ? 'Error' : 'Not configured'}
            </span>
          )}
        </div>
        {stats?.gsc.connected ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Impressions" value={stats.gsc.totalImpressions.toLocaleString()} icon={Eye} />
            <StatCard label="Clicks" value={stats.gsc.totalClicks.toLocaleString()} icon={TrendingUp} tone="good" />
            <StatCard label="Avg CTR" value={`${(stats.gsc.avgCtr * 100).toFixed(2)}%`} icon={BarChart3} />
            <StatCard label="Avg Position" value={stats.gsc.avgPosition.toFixed(1)} icon={Shield} />
          </div>
        ) : (
          <div className="text-sm text-white/50">
            {stats?.gsc.error || 'Set GSC_SERVICE_ACCOUNT_JSON in .env.local to enable per-page impressions, clicks, CTR, and position data.'}
          </div>
        )}
        {stats?.gsc.connected && stats.gsc.topQueries?.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase text-white/40 tracking-wider mb-2">Top queries (site-wide)</p>
            <div className="flex flex-wrap gap-1.5">
              {stats.gsc.topQueries.slice(0, 12).map((q, i) => (
                <span key={i} className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded flex items-center gap-2">
                  <span className="text-white/80">{q.query}</span>
                  <span className="text-emerald-400 tabular-nums">{q.clicks}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/40 tabular-nums">#{q.position.toFixed(1)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-white/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search keyword, title, slug…"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white">
          <option value="all">All status</option>
          <option value="indexable">Indexable</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white">
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={source} onChange={e => setSource(e.target.value)}
          className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white">
          <option value="">All sources</option>
          <option value="user_search">User search</option>
          <option value="trending">Trending</option>
          <option value="auto_daily">Auto daily</option>
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <Filter className="w-3 h-3 text-white/40" />
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white">
            <option value="createdAt">Created</option>
            <option value="qualityScore">Quality</option>
            <option value="views">Views</option>
            <option value="clicks">Clicks (GSC)</option>
            <option value="impressions">Impressions (GSC)</option>
            <option value="ctr">CTR (GSC)</option>
            <option value="position">Position (GSC)</option>
          </select>
          <button
            onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white hover:bg-white/10"
          >
            {order === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 flex items-center gap-3">
          <span className="text-sm text-white">{selected.size} selected</span>
          <button
            onClick={() => doBulk('promote')} disabled={actionBusy}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded text-xs font-bold disabled:opacity-50"
          >Promote</button>
          <button
            onClick={() => doBulk('demote')} disabled={actionBusy}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded text-xs font-bold disabled:opacity-50"
          >Demote</button>
          <button
            onClick={() => doBulk('delete')} disabled={actionBusy}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded text-xs font-bold disabled:opacity-50"
          >Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-white/50 hover:text-white">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-[10px] uppercase text-white/50 tracking-wider">
              <tr>
                <th className="px-3 py-2.5 text-left w-8">
                  <input type="checkbox" checked={allVisibleSelected ?? false} onChange={toggleSelectAll} className="accent-red-500" />
                </th>
                <th className="px-3 py-2.5 text-left">Keyword / Slug</th>
                <th className="px-3 py-2.5 text-left">Status</th>
                <th className="px-3 py-2.5 text-left">Quality</th>
                <th className="px-3 py-2.5 text-right">Views</th>
                <th className="px-3 py-2.5 text-right">Clicks</th>
                <th className="px-3 py-2.5 text-right">Impr.</th>
                <th className="px-3 py-2.5 text-right">CTR</th>
                <th className="px-3 py-2.5 text-right">Rank</th>
                <th className="px-3 py-2.5 text-left">Category</th>
                <th className="px-3 py-2.5 text-left">Created</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listLoading && (
                <tr><td colSpan={12} className="px-3 py-8 text-center text-white/40"><RefreshCw className="w-4 h-4 animate-spin inline mr-2" />Loading…</td></tr>
              )}
              {!listLoading && list?.items.length === 0 && (
                <tr><td colSpan={12} className="px-3 py-8 text-center text-white/40">No pages found</td></tr>
              )}
              {!listLoading && list?.items.map(p => (
                <tr key={p.slug} className="hover:bg-white/[0.03] transition">
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selected.has(p.slug)} onChange={() => toggleRow(p.slug)} className="accent-red-500" />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/super/seo-pages/${encodeURIComponent(p.slug)}`} className="text-white hover:text-red-400 font-medium block max-w-[260px] truncate">
                      {p.keyword}
                    </Link>
                    <a href={p.absoluteUrl} target="_blank" rel="noreferrer"
                      className="text-[10px] text-white/40 hover:text-white/70 inline-flex items-center gap-1">
                      /k/{p.slug} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>
                  <td className="px-3 py-2.5"><StatusPill status={p.status} /></td>
                  <td className="px-3 py-2.5"><QualityBar score={p.qualityScore} /></td>
                  <td className="px-3 py-2.5 text-right text-white/70 tabular-nums">{p.views.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {p.gsc ? <span className="text-emerald-400">{p.gsc.clicks}</span> : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-white/70">
                    {p.gsc ? p.gsc.impressions.toLocaleString() : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-white/70">
                    {p.gsc ? `${p.gsc.ctr.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {p.gsc?.position ? (
                      <span className={p.gsc.position <= 10 ? 'text-emerald-400' : p.gsc.position <= 30 ? 'text-amber-400' : 'text-white/50'}>
                        #{p.gsc.position.toFixed(1)}
                      </span>
                    ) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-white/60">{p.category}</td>
                  <td className="px-3 py-2.5 text-xs text-white/40">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => togglePromote(p)}
                        title={p.isIndexable ? 'Demote' : 'Promote'}
                        className={`p-1.5 rounded border ${p.isIndexable ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
                      >
                        {p.isIndexable ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <Link
                        href={`/admin/super/seo-pages/${encodeURIComponent(p.slug)}`}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/70"
                        title="Edit"
                      ><Edit3 className="w-3.5 h-3.5" /></Link>
                      <button
                        onClick={() => deleteOne(p.slug)}
                        className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400"
                        title="Delete"
                      ><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {list && list.pagination.pages > 1 && (
          <div className="px-3 py-3 border-t border-white/5 flex items-center justify-between text-xs text-white/60">
            <span>
              Page <span className="text-white">{list.pagination.page}</span> of {list.pagination.pages} · {list.pagination.total.toLocaleString()} pages total
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30"
              ><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button
                onClick={() => setPage(p => Math.min(list.pagination.pages, p + 1))}
                disabled={page >= list.pagination.pages}
                className="p-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30"
              ><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <RefreshCw className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
    </div>
  );
}
