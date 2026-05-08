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

  // Delete-by-quality dropdown — picks a max quality threshold and one click
  // wipes every non-indexable page at-or-below that score.
  const [deleteQualityThreshold, setDeleteQualityThreshold] = useState<number>(40);

  // Slug audit (lazy-loaded — calls clean-bad-slugs?action=dry)
  const [slugAudit, setSlugAudit] = useState<{
    scanned: number;
    scoreHistogram: Record<string, number>;
    flagsBucket: Record<string, number>;
    eligibleForDemotion: number;
    samples: { slug: string; score: number; flags: string[] }[];
  } | null>(null);
  const [slugAuditLoading, setSlugAuditLoading] = useState(false);

  const loadSlugAudit = useCallback(async () => {
    setSlugAuditLoading(true);
    try {
      const res = await axios.get(
        '/api/admin/super/seo-pages/clean-bad-slugs?action=dry&limit=20000',
        { headers: getAuthHeaders() }
      );
      setSlugAudit(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to load slug audit');
    } finally {
      setSlugAuditLoading(false);
    }
  }, []);

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

  async function doBulk(action: 'delete' | 'promote' | 'demote' | 'rebuild') {
    if (selected.size === 0) return;
    const confirmMsg =
      action === 'delete' ? `Delete ${selected.size} pages? Cannot be undone.`
      : action === 'promote' ? `Promote ${selected.size} pages to indexable?`
      : action === 'rebuild' ? `Rebuild ${selected.size} pages with fresh 5-variant content + recompute quality?`
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

  async function rebuildOne(slug: string) {
    setActionBusy(true);
    try {
      await axios.patch(
        `/api/admin/super/seo-pages/${encodeURIComponent(slug)}`,
        { action: 'regenerate' },
        { headers: getAuthHeaders() }
      );
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Rebuild failed');
    } finally {
      setActionBusy(false);
    }
  }

  async function cleanBadSlugs() {
    if (!confirm(
      'Demote all pages with garbage slugs (best-best-best, year-stacks, etc.) ' +
      'from the sitemap?\n\n' +
      '• Pages stay in DB (not deleted)\n' +
      '• isIndexable flips to false\n' +
      '• You can manually re-promote any page later'
    )) return;
    setCronBusy('clean-bad-slugs');
    try {
      const res = await axios.get(
        '/api/admin/super/seo-pages/clean-bad-slugs?action=run&limit=50000',
        { headers: getAuthHeaders() }
      );
      alert(`Done. Demoted ${res.data.demoted} pages with bad slugs. Sitemap will refresh on next request.`);
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Clean bad slugs failed');
    } finally {
      setCronBusy(null);
    }
  }

  async function deleteAllRejected() {
    if (!confirm(
      'DELETE every non-indexable /k/ page right now?\n\n' +
      '• Wipes the rejected backlog (likely 400k+ rows)\n' +
      '• Indexable pages stay untouched\n' +
      '• Cannot be undone — pages are removed from the database\n\n' +
      'Recommended: click Recreate Fresh after this to seed clean replacements.'
    )) return;
    if (!confirm('Are you absolutely sure? Click OK to proceed with the bulk delete.')) return;
    setCronBusy('delete-all-rejected');
    try {
      // Loop until the server reports no more matches. Each call deletes
      // up to `limit` rows in well under Cloudflare's 100s edge budget.
      let totalDeleted = 0;
      let totalBefore = 0;
      let totalAfter = 0;
      let iterations = 0;
      // Hard cap so a runaway loop can't hammer the API forever.
      const MAX_ITERATIONS = 200;
      while (iterations < MAX_ITERATIONS) {
        const res = await axios.post(
          '/api/admin/super/seo-pages/delete-all-rejected?limit=2000',
          {},
          { headers: getAuthHeaders(), timeout: 90000 }
        );
        const d = res.data || {};
        if (iterations === 0) totalBefore = d.totalBefore || 0;
        totalDeleted += d.deleted || 0;
        totalAfter = d.totalAfter || 0;
        iterations++;
        if (!d.hasMore) break;
      }
      alert(
        `Deleted ${totalDeleted} rejected pages` +
        (iterations > 1 ? ` over ${iterations} batches.\n` : '.\n') +
        `Total before: ${totalBefore}\n` +
        `Total after: ${totalAfter}`
      );
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || 'Bulk delete failed');
    } finally {
      setCronBusy(null);
    }
  }

  async function deleteByQuality() {
    if (!confirm(
      `DELETE every non-indexable page with qualityScore ≤ ${deleteQualityThreshold}?\n\n` +
      '• Indexable pages stay untouched\n' +
      '• Cannot be undone — pages are removed from the database'
    )) return;
    setCronBusy('delete-by-quality');
    try {
      // Loop until server reports no more matches. Same chunked pattern as
      // deleteAllRejected — keeps each request inside the CF 100s budget.
      let totalDeleted = 0;
      let totalBefore = 0;
      let totalAfter = 0;
      let iterations = 0;
      const MAX_ITERATIONS = 200;
      while (iterations < MAX_ITERATIONS) {
        const res = await axios.post(
          '/api/admin/super/seo-pages/delete-by-quality',
          { threshold: deleteQualityThreshold, mode: 'lte', limit: 2000 },
          { headers: getAuthHeaders(), timeout: 90000 }
        );
        const d = res.data || {};
        if (iterations === 0) totalBefore = d.totalBefore || 0;
        totalDeleted += d.deletedCount || 0;
        totalAfter = d.totalAfter || 0;
        iterations++;
        if (!d.hasMore) break;
      }
      alert(
        `Deleted ${totalDeleted} pages (quality ≤ ${deleteQualityThreshold})` +
        (iterations > 1 ? ` over ${iterations} batches.\n` : '.\n') +
        `Total before: ${totalBefore}\nTotal after: ${totalAfter}`
      );
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || 'Delete-by-quality failed');
    } finally {
      setCronBusy(null);
    }
  }

  async function recreateFresh() {
    if (!confirm(
      'Recreate fresh pages?\n\n' +
      '• Runs curated generator (75 niche pages)\n' +
      '• Runs trending generator (50 trending + hashtag pages)\n' +
      '• Runs the promote cron (top 100 by score → indexable + IndexNow)\n\n' +
      'Click again later for more — generators skip slugs that already exist.'
    )) return;
    setCronBusy('recreate-fresh');
    try {
      const res = await axios.post(
        '/api/admin/super/seo-pages/recreate-fresh',
        {},
        { headers: getAuthHeaders() }
      );
      const d = res.data || {};
      alert(
        `Pipeline complete.\n` +
        `Curated created: ${d.steps?.curated?.created || 0}\n` +
        `Trending created: ${d.steps?.trending?.created || 0}\n` +
        `Promoted to indexable: ${d.steps?.promoted?.promoted || 0}`
      );
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Recreate failed');
    } finally {
      setCronBusy(null);
    }
  }

  async function promoteAll() {
    if (!confirm(
      'Promote ALL non-indexable pages to sitemap?\n\n' +
      '• Only literal garbage slugs are skipped\n' +
      '• All other pages → isIndexable = true immediately\n' +
      '• This is the intended design: let Google decide quality\n\n' +
      'Continue?'
    )) return;
    setCronBusy('promote-all');
    try {
      const res = await axios.post(
        '/api/admin/super/seo-pages/bulk',
        { action: 'promote-all' },
        { headers: getAuthHeaders() }
      );
      const d = res.data || {};
      alert(`Promote All done!\nPromoted: ${d.affected} pages`);
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Promote All failed');
    } finally {
      setCronBusy(null);
    }
  }

  async function repairRejected() {
    if (!confirm(
      'Repair the rejected backlog?\n\n' +
      '• Junk-slug pages (best-best-best, year-stacks, 13+ tokens) → DELETED\n' +
      '• Salvageable pages → content rebuilt + re-scored\n' +
      '• Indexable pages are never touched\n\n' +
      'Runs in batches of 5000. Click again to keep working through the backlog.'
    )) return;
    setCronBusy('repair-rejected');
    try {
      const res = await axios.post(
        '/api/admin/super/seo-pages/repair-rejected?mode=auto&limit=5000',
        {},
        { headers: getAuthHeaders() }
      );
      const d = res.data || {};
      alert(
        `Repair done.\n` +
        `Scanned: ${d.scanned}\n` +
        `Deleted (junk slugs): ${d.deleted}\n` +
        `Upgraded (rebuilt): ${d.upgraded}\n` +
        `Promoted to indexable: ${d.promoted}`
      );
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Repair failed');
    } finally {
      setCronBusy(null);
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
            onClick={() => fireCron('/api/cron/promote-seo-pages', 'Promote top 500')}
            disabled={cronBusy !== null}
            className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {cronBusy === '/api/cron/promote-seo-pages' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Promote Top 500
          </button>
          <button
            onClick={promoteAll}
            disabled={cronBusy !== null}
            className="px-3 py-2 bg-green-600/30 hover:bg-green-600/40 border border-green-500/40 text-green-200 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            title="Mark ALL non-garbage pages as indexable in one shot — let Google decide quality"
          >
            {cronBusy === 'promote-all' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Promote ALL
          </button>
          <button
            onClick={cleanBadSlugs}
            disabled={cronBusy !== null}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            title="Detect repetitive/junk slugs (best-best-best…) and demote them from the sitemap. Pages stay in DB."
          >
            {cronBusy === 'clean-bad-slugs' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Clean Bad Slugs
          </button>
          <button
            onClick={repairRejected}
            disabled={cronBusy !== null}
            className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            title="Delete junk-slug rejected pages + rebuild salvageable ones (5000/batch). Indexable count climbs as borderline pages re-score above 75."
          >
            {cronBusy === 'repair-rejected' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Repair Rejected
          </button>
          <button
            onClick={deleteAllRejected}
            disabled={cronBusy !== null}
            className="px-3 py-2 bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/40 text-rose-200 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            title="Wipe ALL non-indexable /k/ pages from the database. Indexable pages preserved. Pair with Recreate Fresh to seed clean replacements."
          >
            {cronBusy === 'delete-all-rejected' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Delete All Rejected
          </button>
          <div className="flex items-stretch rounded-lg border border-rose-500/40 overflow-hidden bg-rose-600/20" title="Bulk-delete every non-indexable page with qualityScore at-or-below the selected threshold.">
            <select
              value={deleteQualityThreshold}
              onChange={e => setDeleteQualityThreshold(parseInt(e.target.value, 10))}
              disabled={cronBusy !== null}
              className="px-2 py-2 bg-transparent text-rose-100 text-sm outline-none border-r border-rose-500/40 disabled:opacity-50"
              aria-label="Quality threshold for delete"
            >
              {[20, 30, 40, 50, 60, 70, 80, 90].map(n => (
                <option key={n} value={n} className="bg-zinc-900 text-rose-200">≤ {n} quality</option>
              ))}
            </select>
            <button
              onClick={deleteByQuality}
              disabled={cronBusy !== null}
              className="px-3 py-2 hover:bg-rose-600/40 text-rose-200 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {cronBusy === 'delete-by-quality' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Below
            </button>
          </div>
          <button
            onClick={recreateFresh}
            disabled={cronBusy !== null}
            className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            title="One-click pipeline: curated generator + trending generator + promote-top-100 + IndexNow ping. Run this after Delete All Rejected to seed clean pages."
          >
            {cronBusy === 'recreate-fresh' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Recreate Fresh
          </button>
          <button
            onClick={() => fireCron('/api/cron/seo-rerank-weekly', 'Weekly SEO rerank')}
            disabled={cronBusy !== null}
            className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            title="Re-score all pages, refresh sitemap priority, ping IndexNow for top movers"
          >
            {cronBusy === '/api/cron/seo-rerank-weekly' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            Run SEO Rerank
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

      {/* Slug Audit panel — lazy loaded on demand */}
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" /> Slug Quality Audit
            <span className="text-xs font-normal text-white/40">
              · scans for "best-best-best", "tutorial-tutorial-tutorial", year-stacks &amp; junk fragments
            </span>
          </h2>
          <button
            onClick={loadSlugAudit}
            disabled={slugAuditLoading}
            className="px-3 py-1.5 rounded text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 disabled:opacity-50"
          >
            {slugAuditLoading ? 'Scanning…' : slugAudit ? 'Rescan' : 'Run Audit'}
          </button>
        </div>

        {!slugAudit && !slugAuditLoading && (
          <p className="text-sm text-white/50">
            Click <span className="text-amber-300">Run Audit</span> to inspect every slug in the DB.
            Bad slugs will not be deleted — only flagged. Use the red <strong>Clean Bad Slugs</strong> button at the top to demote them from the sitemap when ready.
          </p>
        )}

        {slugAudit && (
          <div className="space-y-4">
            {/* Score distribution bar */}
            <div>
              <p className="text-[10px] uppercase text-white/40 tracking-wider mb-2">
                Score distribution ({slugAudit.scanned.toLocaleString()} pages scanned)
              </p>
              <div className="flex h-6 rounded-lg overflow-hidden border border-white/10">
                {(['90+', '70-89', '50-69', '30-49', '<30'] as const).map((bucket, i) => {
                  const n = slugAudit.scoreHistogram[bucket] || 0;
                  const total = slugAudit.scanned || 1;
                  const pct = (n / total) * 100;
                  if (pct === 0) return null;
                  const color = ['bg-emerald-500', 'bg-emerald-400/70', 'bg-amber-400/80', 'bg-orange-500', 'bg-red-500'][i];
                  return (
                    <div
                      key={bucket}
                      className={color}
                      style={{ width: `${pct}%` }}
                      title={`${bucket}: ${n.toLocaleString()} pages (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                {(['90+', '70-89', '50-69', '30-49', '<30'] as const).map((bucket, i) => {
                  const n = slugAudit.scoreHistogram[bucket] || 0;
                  const color = ['text-emerald-400', 'text-emerald-300', 'text-amber-300', 'text-orange-400', 'text-red-400'][i];
                  return (
                    <span key={bucket} className="text-white/60">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${color.replace('text', 'bg')}`}></span>
                      <span className={color}>{bucket}</span>
                      <span className="text-white/50 tabular-nums ml-1">{n.toLocaleString()}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Flags breakdown */}
            {Object.keys(slugAudit.flagsBucket || {}).length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-white/40 tracking-wider mb-2">Most common spam patterns</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(slugAudit.flagsBucket)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 12)
                    .map(([flag, n]) => (
                      <span key={flag} className="px-2 py-1 text-xs bg-red-500/10 border border-red-500/20 rounded text-red-300">
                        {flag}
                        <span className="ml-1.5 text-red-400/60 tabular-nums">{n.toLocaleString()}</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Bad-slug count + CTA */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-white/80 flex-1 min-w-[200px]">
                <span className="font-bold text-red-300">{slugAudit.eligibleForDemotion.toLocaleString()}</span>
                {' '}indexable pages have spam-pattern slugs. Demoting them frees up Google's crawl budget for high-quality pages.
              </p>
              <button
                onClick={cleanBadSlugs}
                disabled={cronBusy !== null || slugAudit.eligibleForDemotion === 0}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm disabled:opacity-40"
              >
                Demote {slugAudit.eligibleForDemotion.toLocaleString()} pages
              </button>
            </div>

            {/* Sample bad slugs */}
            {slugAudit.samples.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-white/40 tracking-wider mb-2">Sample bad slugs (first 12)</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                  {slugAudit.samples.slice(0, 12).map(s => (
                    <div key={s.slug} className="flex items-center gap-2 p-2 bg-white/[0.02] border border-white/5 rounded text-xs">
                      <span className={`px-1.5 py-0.5 rounded font-bold tabular-nums ${
                        s.score < 30 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>{s.score}</span>
                      <Link
                        href={`/k/${s.slug}`}
                        target="_blank"
                        className="text-white/70 hover:text-white truncate flex-1 font-mono text-[11px]"
                      >/k/{s.slug}</Link>
                      <span className="text-red-400/70 text-[10px]">
                        {s.flags.slice(0, 2).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          className="bg-[#1a1a2e] border border-white/10 rounded px-3 py-1.5 text-sm text-white [&>option]:bg-[#1a1a2e] [&>option]:text-white">
          <option value="all">All status</option>
          <option value="indexable">Indexable</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-[#1a1a2e] border border-white/10 rounded px-3 py-1.5 text-sm text-white [&>option]:bg-[#1a1a2e] [&>option]:text-white">
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={source} onChange={e => setSource(e.target.value)}
          className="bg-[#1a1a2e] border border-white/10 rounded px-3 py-1.5 text-sm text-white [&>option]:bg-[#1a1a2e] [&>option]:text-white">
          <option value="">All sources</option>
          <option value="user_search">User search</option>
          <option value="trending">Trending</option>
          <option value="auto_daily">Auto daily</option>
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <Filter className="w-3 h-3 text-white/40" />
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="bg-[#1a1a2e] border border-white/10 rounded px-2 py-1.5 text-xs text-white [&>option]:bg-[#1a1a2e] [&>option]:text-white">
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
            onClick={() => doBulk('rebuild')} disabled={actionBusy}
            className="px-3 py-1.5 rounded text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 disabled:opacity-40"
          >Rebuild content</button>
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
                        onClick={() => rebuildOne(p.slug)}
                        disabled={actionBusy}
                        className="p-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 disabled:opacity-40"
                        title="Rebuild content + rescore (no delete)"
                      ><RefreshCw className="w-3.5 h-3.5" /></button>
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
