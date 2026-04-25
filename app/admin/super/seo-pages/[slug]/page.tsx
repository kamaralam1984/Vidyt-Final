'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  ArrowLeft, ExternalLink, Save, Trash2, RefreshCw, Zap,
  CheckCircle2, XCircle, Clock, Globe, Eye, TrendingUp,
  BarChart3, Shield, AlertTriangle, Hash, Link2, Sparkles,
} from 'lucide-react';

interface PageDetail {
  slug: string;
  keyword: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  hashtags: string[];
  relatedKeywords: string[];
  viralScore: number;
  qualityScore: number;
  wordCount: number;
  views: number;
  category: string;
  source: string;
  trendingRank: number;
  isIndexable: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
  absoluteUrl: string;
}

interface GSCPageDetail {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topCountries: { country: string; clicks: number; impressions: number }[];
}

interface GSCInspection {
  indexed: boolean;
  verdict: string;
  lastCrawl?: string;
}

export default function SeoPageDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = decodeURIComponent(String(params?.slug || ''));

  const [page, setPage] = useState<PageDetail | null>(null);
  const [gscDetail, setGscDetail] = useState<GSCPageDetail | null>(null);
  const [gscConfigured, setGscConfigured] = useState(false);
  const [inspection, setInspection] = useState<GSCInspection | null>(null);
  const [threshold, setThreshold] = useState(70);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');

  // Editable fields
  const [f, setF] = useState({
    title: '', metaTitle: '', metaDescription: '',
    content: '', hashtags: '', relatedKeywords: '',
    category: '', viralScore: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await axios.get(`/api/admin/super/seo-pages/${encodeURIComponent(slug)}`, { headers: getAuthHeaders() });
      const p: PageDetail = res.data.page;
      setPage(p);
      setGscDetail(res.data.gsc?.detail || null);
      setGscConfigured(!!res.data.gsc?.configured);
      setInspection(res.data.gsc?.inspection || null);
      setThreshold(res.data.threshold || 70);
      setF({
        title: p.title || '',
        metaTitle: p.metaTitle || '',
        metaDescription: p.metaDescription || '',
        content: p.content || '',
        hashtags: (p.hashtags || []).join(', '),
        relatedKeywords: (p.relatedKeywords || []).join(', '),
        category: p.category || '',
        viralScore: p.viralScore || 0,
      });
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to load page');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { if (slug) load(); }, [slug, load]);

  async function save() {
    setSaving(true);
    setNotice('');
    try {
      const body = {
        title: f.title,
        metaTitle: f.metaTitle,
        metaDescription: f.metaDescription,
        content: f.content,
        hashtags: f.hashtags.split(',').map(s => s.trim()).filter(Boolean),
        relatedKeywords: f.relatedKeywords.split(',').map(s => s.trim()).filter(Boolean),
        category: f.category,
        viralScore: Number(f.viralScore) || 0,
      };
      await axios.patch(`/api/admin/super/seo-pages/${encodeURIComponent(slug)}`, body, { headers: getAuthHeaders() });
      setNotice('Saved. Quality score recomputed.');
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function action(action: 'promote' | 'demote' | 'regenerate') {
    if (action === 'regenerate' && !confirm('Regenerate content from keyword? Your edits will be overwritten.')) return;
    try {
      await axios.patch(`/api/admin/super/seo-pages/${encodeURIComponent(slug)}`, { action }, { headers: getAuthHeaders() });
      await load();
      setNotice(`${action} done.`);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Action failed');
    }
  }

  async function remove() {
    if (!confirm(`Delete /k/${slug} permanently? Cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/super/seo-pages/${encodeURIComponent(slug)}`, { headers: getAuthHeaders() });
      router.push('/admin/super/seo-pages');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Delete failed');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050712]">
        <RefreshCw className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }
  if (!page) {
    return (
      <div className="min-h-screen p-6 bg-[#050712] text-white/80">
        <Link href="/admin/super/seo-pages" className="text-red-400 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <p className="mt-4 text-red-400">{err || 'Page not found'}</p>
      </div>
    );
  }

  const status = page.isIndexable ? 'indexable' : (page.qualityScore >= threshold ? 'pending' : 'rejected');
  const statusCls = {
    indexable: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  }[status];
  const StatusIcon = { indexable: CheckCircle2, pending: Clock, rejected: XCircle }[status];

  return (
    <div className="min-h-screen bg-[#050712] text-white/80 p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link href="/admin/super/seo-pages" className="text-xs text-white/50 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3 h-3" /> All SEO Pages
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-white truncate">{page.keyword}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <a href={page.absoluteUrl} target="_blank" rel="noreferrer"
              className="text-white/60 hover:text-red-400 flex items-center gap-1">
              {page.absoluteUrl} <ExternalLink className="w-3 h-3" />
            </a>
            <span className={`px-2 py-0.5 rounded border font-bold ${statusCls}`}>
              <StatusIcon className="w-3 h-3 inline mr-1" /> {status}
            </span>
            <span className="text-white/40">Source: {page.source}</span>
            <span className="text-white/40">Quality: {page.qualityScore}/100</span>
            <span className="text-white/40">Words: {page.wordCount}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!page.isIndexable ? (
            <button onClick={() => action('promote')} className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Promote
            </button>
          ) : (
            <button onClick={() => action('demote')} className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-lg text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Demote
            </button>
          )}
          <button onClick={() => action('regenerate')} className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded-lg text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Regenerate
          </button>
          <button onClick={remove} className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg text-sm flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {err && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" /> {err}
          <button onClick={() => setErr('')} className="ml-auto text-red-400 hover:text-red-300">×</button>
        </div>
      )}
      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4" /> {notice}
          <button onClick={() => setNotice('')} className="ml-auto">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">SEO Meta</h2>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Page Title (H1)</label>
              <input value={f.title} onChange={e => setF({ ...f, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Meta Title <span className="text-white/30">({f.metaTitle.length}/60)</span></label>
              <input value={f.metaTitle} onChange={e => setF({ ...f, metaTitle: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Meta Description <span className="text-white/30">({f.metaDescription.length}/160)</span></label>
              <textarea value={f.metaDescription} onChange={e => setF({ ...f, metaDescription: e.target.value })}
                rows={3} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Category</label>
                <input value={f.category} onChange={e => setF({ ...f, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Viral Score (0-100)</label>
                <input type="number" min={0} max={100} value={f.viralScore}
                  onChange={e => setF({ ...f, viralScore: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Hash className="w-4 h-4" /> Hashtags
            </h2>
            <p className="text-xs text-white/40">Comma-separated. Top 5 render with emerald highlight on the page.</p>
            <textarea value={f.hashtags} onChange={e => setF({ ...f, hashtags: e.target.value })}
              rows={3} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-xs font-mono" />
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Related Keywords
            </h2>
            <p className="text-xs text-white/40">Comma-separated. Render as internal links on the page.</p>
            <textarea value={f.relatedKeywords} onChange={e => setF({ ...f, relatedKeywords: e.target.value })}
              rows={2} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-xs font-mono" />
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Content (Markdown)</h2>
              <span className="text-xs text-white/40">~{f.content.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <textarea value={f.content} onChange={e => setF({ ...f, content: e.target.value })}
              rows={24} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-xs font-mono leading-relaxed" />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={save} disabled={saving}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </div>

        {/* Right column — analytics */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Quality
            </h2>
            <div className="flex items-end gap-2 mb-2">
              <span className={`text-4xl font-black ${page.qualityScore >= 80 ? 'text-emerald-400' : page.qualityScore >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                {page.qualityScore}
              </span>
              <span className="text-white/40 text-sm mb-1">/ 100</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full ${page.qualityScore >= 80 ? 'bg-emerald-400' : page.qualityScore >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${Math.min(100, page.qualityScore)}%` }} />
            </div>
            <p className="text-xs text-white/40 mt-2">Threshold for sitemap: {threshold}</p>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-white/50">Words</span><span className="text-white">{page.wordCount}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Viral</span><span className="text-white">{page.viralScore}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Views</span><span className="text-white">{page.views.toLocaleString()}</span></div>
              {page.trendingRank > 0 && <div className="flex justify-between"><span className="text-white/50">Trend rank</span><span className="text-amber-400">#{page.trendingRank}</span></div>}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" /> Google Search Console
            </h2>
            {!gscConfigured && (
              <p className="text-xs text-white/50">Not configured. Add <code className="bg-white/5 px-1">GSC_SERVICE_ACCOUNT_JSON</code> to .env.local.</p>
            )}
            {gscConfigured && !gscDetail && (
              <p className="text-xs text-white/50">No impressions yet for this URL (last 28 days).</p>
            )}
            {gscDetail && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white/5 rounded">
                    <p className="text-[10px] text-white/40 uppercase">Impressions</p>
                    <p className="text-lg font-bold text-white tabular-nums">{gscDetail.impressions.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-white/5 rounded">
                    <p className="text-[10px] text-white/40 uppercase">Clicks</p>
                    <p className="text-lg font-bold text-emerald-400 tabular-nums">{gscDetail.clicks.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-white/5 rounded">
                    <p className="text-[10px] text-white/40 uppercase">CTR</p>
                    <p className="text-lg font-bold text-white tabular-nums">{(gscDetail.ctr * 100).toFixed(2)}%</p>
                  </div>
                  <div className="p-2 bg-white/5 rounded">
                    <p className="text-[10px] text-white/40 uppercase">Position</p>
                    <p className="text-lg font-bold text-white tabular-nums">#{gscDetail.position.toFixed(1)}</p>
                  </div>
                </div>
                {gscDetail.topQueries.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase text-white/40 tracking-wider mb-1">Top queries (search terms that surfaced this page)</p>
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                      {gscDetail.topQueries.map((q, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 p-1.5 bg-white/[0.03] rounded text-xs">
                          <span className="text-white/80 truncate flex-1">{q.query}</span>
                          <span className="text-emerald-400 tabular-nums w-8 text-right">{q.clicks}</span>
                          <span className="text-white/40 tabular-nums w-10 text-right">{q.impressions}</span>
                          <span className="text-white/50 tabular-nums w-10 text-right">#{q.position.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {gscDetail.topCountries.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase text-white/40 tracking-wider mb-1">Top countries</p>
                    <div className="flex flex-wrap gap-1.5">
                      {gscDetail.topCountries.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-white/5 border border-white/10 rounded">
                          {c.country.toUpperCase()} <span className="text-emerald-400">·{c.clicks}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {inspection && (
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" /> Google Index Status
              </h2>
              <div className="flex items-center gap-2">
                {inspection.indexed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-bold ${inspection.indexed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {inspection.indexed ? 'Indexed' : 'Not indexed'}
                </span>
                <span className="text-xs text-white/50">({inspection.verdict})</span>
              </div>
              {inspection.lastCrawl && (
                <p className="text-[10px] text-white/40 mt-2">Last crawl: {new Date(inspection.lastCrawl).toLocaleString()}</p>
              )}
            </div>
          )}

          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Timeline</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-white/50">Created</span><span className="text-white">{new Date(page.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Updated</span><span className="text-white">{new Date(page.updatedAt).toLocaleString()}</span></div>
              {page.publishedAt && (
                <div className="flex justify-between"><span className="text-white/50">Published</span><span className="text-white">{new Date(page.publishedAt).toLocaleString()}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
