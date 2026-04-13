'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  Search, BarChart3, FileText, Facebook, Loader2, Hash, Clock, Copy, Check, Sparkles, RefreshCw, Zap,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslations } from '@/context/translations';
import { autoCreateSeoPage } from '@/lib/autoCreateSeoPage';

const DEBOUNCE_MS = 500;

export default function FacebookSEOPage() {
  const { t } = useTranslations();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [contentType, setContentType] = useState<'post' | 'reel' | 'live'>('post');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const [seoData, setSeoData] = useState<{ seoScore: number; breakdown: Record<string, { score: number; label: string }> } | null>(null);
  const [descriptions, setDescriptions] = useState<{ text: string; seoScore: number }[]>([]);
  const [hashtags, setHashtags] = useState<{ tag: string; viralLevel: string; viralScore?: number }[]>([]);
  const [keywordData, setKeywordData] = useState<{ viralKeywords: { keyword: string; viralScore: number }[] } | null>(null);

  const [loadingSeo, setLoadingSeo] = useState(false);
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  const [facebookPageUrl, setFacebookPageUrl] = useState('');
  const [pageSummary, setPageSummary] = useState<{
    pageName?: string; followersCount?: number; postsCount?: number;
    pageKami?: string[]; settingKami?: string[];
    homepageKeywords?: { keyword: string; score: number }[];
    growthActions?: { where: string; action: string; reason: string }[];
    recommendedKeywords?: { keyword: string; score: number }[];
    linked?: boolean; aiProvider?: 'openai' | 'gemini'; aiError?: string;
  } | null>(null);
  const [pageSummaryLoading, setPageSummaryLoading] = useState(false);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const tagCount = keywords.split(/[,;\n]/).map(k => k.trim()).filter(Boolean).length;

  const hasAnyInput = Boolean(title.trim() || description.trim() || keywords.trim());

  const fetchSeo = useCallback(async () => {
    if (!hasAnyInput) { setSeoData(null); return; }
    if (title.trim()) autoCreateSeoPage(title);
    setLoadingSeo(true);
    try {
      const res = await axios.get(`/api/facebook/seo?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&keywords=${encodeURIComponent(keywords)}`, { headers: getAuthHeaders() });
      setSeoData(res.data);
    } catch { setSeoData(null); } finally { setLoadingSeo(false); }
  }, [title, description, keywords, hasAnyInput]);

  const fetchDescriptions = useCallback(async () => {
    if (!title.trim() && !keywords.trim()) { setDescriptions([]); return; }
    setLoadingDescriptions(true);
    try {
      const res = await axios.get(`/api/facebook/descriptions?title=${encodeURIComponent(title)}&keywords=${encodeURIComponent(keywords)}&contentType=${contentType}`, { headers: getAuthHeaders() });
      setDescriptions(res.data.descriptions || []);
    } catch { setDescriptions([]); } finally { setLoadingDescriptions(false); }
  }, [title, keywords, contentType]);

  const fetchHashtags = useCallback(async () => {
    const kw = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || title.split(/\s+/).slice(0, 2).join(' ') || '';
    if (!kw) { setHashtags([]); return; }
    setLoadingHashtags(true);
    try {
      const res = await axios.get(`/api/facebook/hashtags?keyword=${encodeURIComponent(kw)}&contentType=${contentType}`, { headers: getAuthHeaders() });
      setHashtags(res.data.hashtags || []);
    } catch { setHashtags([]); } finally { setLoadingHashtags(false); }
  }, [keywords, title, contentType]);

  const fetchKeywords = useCallback(async () => {
    const kw = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || '';
    setLoadingKeywords(true);
    try {
      const res = await axios.get(`/api/facebook/keywords?keyword=${encodeURIComponent(kw)}&title=${encodeURIComponent(title)}`, { headers: getAuthHeaders() });
      setKeywordData(res.data);
    } catch { setKeywordData(null); } finally { setLoadingKeywords(false); }
  }, [keywords, title]);

  useEffect(() => {
    if (!hasAnyInput) { setSeoData(null); return; }
    const tm = setTimeout(fetchSeo, DEBOUNCE_MS); return () => clearTimeout(tm);
  }, [hasAnyInput, fetchSeo]);

  useEffect(() => {
    if (!hasAnyInput) { setDescriptions([]); return; }
    const tm = setTimeout(fetchDescriptions, DEBOUNCE_MS); return () => clearTimeout(tm);
  }, [hasAnyInput, fetchDescriptions]);

  useEffect(() => {
    if (!hasAnyInput) { setHashtags([]); return; }
    const tm = setTimeout(fetchHashtags, DEBOUNCE_MS); return () => clearTimeout(tm);
  }, [hasAnyInput, fetchHashtags]);

  useEffect(() => {
    if (!hasAnyInput) { setKeywordData(null); return; }
    const tm = setTimeout(fetchKeywords, DEBOUNCE_MS); return () => clearTimeout(tm);
  }, [hasAnyInput, fetchKeywords]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('facebook-seo-page-url') : null;
    if (saved) setFacebookPageUrl(saved);
  }, []);

  const saveFacebookPageUrl = (url: string) => {
    setFacebookPageUrl(url);
    setPageSummary(null);
    if (typeof window !== 'undefined') localStorage.setItem('facebook-seo-page-url', url);
  };

  const fetchPageSummary = useCallback(async () => {
    const url = facebookPageUrl.trim();
    if (!url) { setPageSummary(null); return; }
    setPageSummaryLoading(true);
    setPageSummary(null);
    try {
      const res = await axios.get(`/api/facebook/page-summary?pageUrl=${encodeURIComponent(url)}&_t=${Date.now()}`, { headers: getAuthHeaders() });
      setPageSummary(res.data);
    } catch { setPageSummary(null); } finally { setPageSummaryLoading(false); }
  }, [facebookPageUrl]);

  const breakdownChartData = seoData?.breakdown
    ? Object.entries(seoData.breakdown).map(([name, v]) => ({ name: name.replace(/([A-Z])/g, ' $1').trim(), score: v.score }))
    : [];

  const addKeywordToField = (kw: string) => {
    const current = keywords.trim();
    setKeywords(current ? `${current}, ${kw}` : kw);
  };
  const addDescriptionToField = (text: string) => setDescription((prev) => (prev ? `${prev}\n\n${text}` : text));
  const addHashtagToField = (tag: string) => setDescription((prev) => (prev ? `${prev} ${tag}` : tag));

  const seoScore = seoData?.seoScore ?? 0;
  const scoreColor = seoScore >= 70 ? 'text-emerald-400' : seoScore >= 40 ? 'text-amber-400' : 'text-red-400';
  const barColor = seoScore >= 70 ? 'bg-emerald-500' : seoScore >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 max-w-[1600px] mx-auto">
          {/* Animated Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-blue-400/5 to-blue-600/10 animate-pulse" />
            <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Facebook className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    Facebook Live SEO Analyzer
                  </h1>
                  <p className="text-sm text-[#888] mt-0.5">{t('seo.analyzer.subtitle')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT COLUMN */}
            <motion.div className="lg:col-span-2 space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> {t('seo.analyzer.contentSetup')}
                </h2>
                <div className="flex gap-2 p-1 bg-[#212121] rounded-lg mb-4">
                  {(['post', 'reel', 'live'] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setContentType(type)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${contentType === type ? 'bg-blue-600 text-white' : 'text-[#AAA] hover:text-white hover:bg-[#333]'}`}>
                      {type === 'post' ? 'Post' : type === 'reel' ? 'Reel' : 'Live'}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  {/* Title with counter */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-[#AAAAAA]">{contentType === 'reel' ? 'Reel Title' : contentType === 'live' ? 'Live Title' : 'Post Title'}</label>
                      <span className={`text-xs font-mono ${title.length >= 20 && title.length <= 80 ? 'text-emerald-400' : title.length > 0 ? 'text-[#666]' : 'text-[#666]'}`}>
                        {title.length} chars {title.length >= 20 && title.length <= 80 ? '✓' : ''}
                      </span>
                    </div>
                    <input value={title} onChange={(e) => setTitle(e.target.value)}
                      placeholder={contentType === 'reel' ? 'e.g. 30 sec tip' : contentType === 'live' ? 'e.g. Live Q&A 9 PM' : 'e.g. Best tips for growth'}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {/* Description with counter + AI Generate */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-[#AAAAAA]">Description</label>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono ${description.length >= 100 ? 'text-emerald-400' : 'text-[#666]'}`}>
                          {description.length} chars {description.length >= 100 ? '✓' : description.length > 0 ? '(100+ ideal)' : ''}
                        </span>
                        <button type="button" onClick={fetchDescriptions} disabled={!title.trim() || loadingDescriptions}
                          className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition disabled:opacity-50">
                          {loadingDescriptions ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Generate
                        </button>
                      </div>
                    </div>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="Caption / description..." rows={4}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>

                  {/* Keywords with counter + AI Generate */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-[#AAAAAA]">Keywords / Hashtags</label>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono ${tagCount >= 5 ? 'text-emerald-400' : 'text-[#666]'}`}>
                          {tagCount} tags {tagCount >= 5 ? '✓' : tagCount > 0 ? '(5+ ideal)' : ''}
                        </span>
                        <button type="button" onClick={fetchHashtags} disabled={(!keywords.trim() && !title.trim()) || loadingHashtags}
                          className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition disabled:opacity-50">
                          {loadingHashtags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Generate
                        </button>
                      </div>
                    </div>
                    <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)}
                      placeholder="viral, facebook, reels, trending" rows={2}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>

                  {/* Facebook Page Link */}
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Facebook Page Link</label>
                    <p className="text-xs text-[#666] mb-2">{t('seo.analyzer.linkDesc.facebook')}</p>
                    <div className="flex gap-2">
                      <input value={facebookPageUrl} onChange={(e) => saveFacebookPageUrl(e.target.value)}
                        placeholder="https://www.facebook.com/YourPage"
                        className="flex-1 px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={fetchPageSummary} disabled={!facebookPageUrl.trim() || pageSummaryLoading}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium">
                        {pageSummaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('seo.analyzer.linkButton')}
                      </button>
                    </div>
                    {pageSummary?.pageName && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-emerald-400">
                          Linked: {pageSummary.pageName}
                          {(pageSummary.postsCount ?? 0) + (pageSummary.followersCount ?? 0) > 0 && (
                            <> · {pageSummary.postsCount ?? 0} posts · {(pageSummary.followersCount ?? 0).toLocaleString()} followers</>
                          )}
                          {pageSummary.aiProvider && <span className="text-[#888] ml-1">· AI: {pageSummary.aiProvider === 'openai' ? 'OpenAI' : 'Gemini'}</span>}
                        </p>
                        {pageSummary.aiError && <p className="text-xs text-amber-400">{t('seo.analyzer.aiError')} {pageSummary.aiError}.</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN */}
            <motion.div className="lg:col-span-3 space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              {/* SEO Score */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" /> SEO Score
                </h2>
                {loadingSeo ? <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> : (
                  <>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className={`text-4xl font-black ${scoreColor}`}>{seoScore}</span>
                      <span className="text-[#AAAAAA]">/ 100</span>
                      <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${seoScore >= 70 ? 'bg-emerald-500/20 text-emerald-400' : seoScore >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                        {seoScore >= 70 ? 'Good' : seoScore >= 40 ? 'Average' : 'Needs Work'}
                      </span>
                    </div>
                    <div className="h-3 bg-[#212121] rounded-full overflow-hidden mb-4">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${seoScore}%` }} transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${barColor}`} />
                    </div>
                    {breakdownChartData.length > 0 && (
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={breakdownChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#888', fontSize: 12 }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#AAA', fontSize: 11 }} width={90} />
                            <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333' }} />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {breakdownChartData.map((entry, i) => (
                                <Cell key={i} fill={entry.score >= 70 ? '#10b981' : entry.score >= 40 ? '#f59e0b' : '#ef4444'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Page Audit */}
              {pageSummary?.linked && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" /> {t('seo.analyzer.pageAuditTitle')}
                  </h2>
                  <p className="text-xs text-[#888] mb-4">{t('seo.analyzer.pageAuditDesc')}</p>
                  {(pageSummary?.homepageKeywords?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-emerald-400 mb-2">{t('seo.analyzer.keywordsTitle')}</p>
                      <div className="flex flex-wrap gap-2">
                        {(pageSummary.homepageKeywords || []).map((item, i) => (
                          <span key={i} className="px-2 py-1 rounded text-sm border bg-[#212121] text-emerald-400 border-emerald-500/30">
                            {item.keyword} <span className="opacity-90">{item.score}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(pageSummary?.growthActions?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-amber-400 mb-2">{t('seo.analyzer.growthActionsTitle')}</p>
                      <div className="space-y-3">
                        {(pageSummary.growthActions || []).map((g, i) => (
                          <div key={i} className="p-3 rounded-lg bg-[#212121]/80 border border-[#333]">
                            <p className="text-white font-medium text-sm mb-1"><span className="text-amber-400">{t('seo.analyzer.actions.where')}:</span> {g.where}</p>
                            <p className="text-[#CCC] text-sm mb-1"><span className="text-emerald-400">{t('seo.analyzer.actions.action')}:</span> {g.action}</p>
                            <p className="text-[#888] text-xs"><span className="text-[#666]">{t('seo.analyzer.actions.reason')}:</span> {g.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(pageSummary?.recommendedKeywords?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-white mb-2">{t('seo.analyzer.recommendedKeywordsTitle')}</p>
                      <div className="flex flex-wrap gap-2">
                        {(pageSummary.recommendedKeywords || []).map((item, i) => (
                          <button key={i} type="button" onClick={() => addKeywordToField(item.keyword)} className="px-2 py-1 bg-[#212121] text-emerald-400 rounded text-sm border border-emerald-500/30 hover:bg-[#2a2a2a]">
                            {item.keyword} <span className="opacity-90">{item.score}%</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {((pageSummary?.pageKami?.length ?? 0) > 0 || (pageSummary?.settingKami?.length ?? 0) > 0) && (
                    <div className="pt-4 border-t border-[#333]">
                      <p className="text-xs font-semibold text-[#AAA] mb-2">{t('seo.analyzer.missingElementsTitle')}</p>
                      <ul className="text-xs text-[#888] space-y-1 list-disc list-inside">
                        {(pageSummary.pageKami || []).map((k, i) => <li key={`p-${i}`}>{k}</li>)}
                        {(pageSummary.settingKami || []).map((k, i) => <li key={`s-${i}`}>{k}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Post Time */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" /> {t('seo.analyzer.postTimeTitle')}
                </h2>
                <p className="text-xs text-[#888] mb-4">{t('seo.analyzer.postTimeDesc')}</p>
                {pageSummary?.linked ? (
                  <>
                    <div className="p-4 rounded-lg bg-[#212121]/80 border border-[#333] mb-3">
                      <p className="text-sm font-semibold text-emerald-400 mb-2">{t('seo.analyzer.activeTimeTitle')}</p>
                      <ul className="text-sm text-[#CCC] space-y-1.5">
                        <li className="flex justify-between p-1.5 bg-[#1a1a1a] rounded"><span>Tuesday–Thursday</span> <span className="text-emerald-400 font-bold">Peak engagement</span></li>
                        <li className="flex justify-between p-1.5 bg-[#1a1a1a] rounded"><span>9–11 AM</span> <span className="text-amber-400 font-bold">Morning scroll</span></li>
                        <li className="flex justify-between p-1.5 bg-[#1a1a1a] rounded"><span>1–3 PM</span> <span className="text-emerald-400 font-bold">Lunch break peak</span></li>
                        <li className="flex justify-between p-1.5 bg-[#1a1a1a] rounded"><span>7–9 PM</span> <span className="text-emerald-400 font-bold">Evening prime time</span></li>
                      </ul>
                      <p className="text-xs text-[#888] mt-3">{t('seo.analyzer.timezoneNote')}</p>
                    </div>
                    <p className="text-xs text-[#AAA]">{t('seo.analyzer.exactTimeNote')}</p>
                  </>
                ) : (
                  <p className="text-sm text-[#666]">{t('seo.analyzer.linkFirstHint')}</p>
                )}
              </div>

              {/* Auto Descriptions with Refresh + Copy */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" /> {t('seo.analyzer.autoDescTitle')} {contentType !== 'post' && `(${contentType === 'reel' ? 'Reel' : 'Live'})`}
                  </h2>
                  <button type="button" onClick={fetchDescriptions} disabled={!title.trim() || loadingDescriptions}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition disabled:opacity-50">
                    {loadingDescriptions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
                  </button>
                </div>
                <p className="text-xs text-[#888] mb-3">{t('seo.analyzer.autoDescDesc')}</p>
                {loadingDescriptions ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : descriptions.length > 0 ? (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {descriptions.map((d, i) => (
                      <li key={i} className="p-3 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] border border-[#333] transition">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-blue-400 font-semibold text-sm">{d.seoScore}% SEO</span>
                          <div className="flex gap-1.5">
                            <button type="button" onClick={() => copyText(d.text, `desc-${i}`)} className="text-xs text-[#888] hover:text-white flex items-center gap-1">
                              {copiedItem === `desc-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <button type="button" onClick={() => addDescriptionToField(d.text)} className="text-xs text-blue-400 hover:text-blue-300">Use</button>
                          </div>
                        </div>
                        <p className="text-sm text-[#CCC] line-clamp-2">{d.text}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#666] text-sm">{t('seo.analyzer.fillTitleHint')}</p>
                )}
              </div>

              {/* Hashtags with Refresh + Copy */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Hash className="w-5 h-5 text-blue-500" /> {t('seo.analyzer.hashtagsTitle')} {contentType !== 'post' && `(${contentType})`}
                  </h2>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => copyText(hashtags.map(h => h.tag).join(' '), 'all-hashtags')}
                      disabled={hashtags.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333] rounded-lg text-xs text-[#CCC] disabled:opacity-50">
                      {copiedItem === 'all-hashtags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} Copy All
                    </button>
                    <button type="button" onClick={fetchHashtags} disabled={loadingHashtags || (!keywords.trim() && !title.trim())}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition disabled:opacity-50">
                      {loadingHashtags ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#888] mb-3">{t('seo.analyzer.hashtagsDesc')}</p>
                {loadingHashtags ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : hashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((h, i) => (
                      <button key={i} type="button" onClick={() => addHashtagToField(h.tag)}
                        className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition hover:scale-105 ${h.viralLevel === 'high' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : h.viralLevel === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-[#212121] text-[#AAA] border border-[#333]'}`}>
                        {h.tag} {h.viralScore != null && <span className="opacity-70 ml-1">{h.viralScore}%</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#666] text-sm">{t('seo.analyzer.fillKeywordsHint')}</p>
                )}
              </div>

              {/* Viral Keywords with Refresh */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-400" /> {t('seo.analyzer.viralKeywordsTitle')}
                  </h2>
                  <button type="button" onClick={fetchKeywords} disabled={loadingKeywords || (!keywords.trim() && !title.trim())}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition disabled:opacity-50">
                    {loadingKeywords ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
                  </button>
                </div>
                <p className="text-xs text-[#888] mb-3">{t('seo.analyzer.viralKeywordsDesc')}</p>
                {loadingKeywords ? <Loader2 className="w-6 h-6 animate-spin text-purple-500" /> : (keywordData?.viralKeywords?.length ?? 0) > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(keywordData?.viralKeywords || []).map((v, i) => {
                      const kColor = v.viralScore >= 70 ? 'text-emerald-400' : v.viralScore >= 50 ? 'text-amber-400' : 'text-red-400';
                      const kBar = v.viralScore >= 70 ? 'bg-emerald-500' : v.viralScore >= 50 ? 'bg-amber-500' : 'bg-red-500';
                      return (
                        <div key={i} onClick={() => addKeywordToField(v.keyword)}
                          className="flex items-center justify-between p-2.5 bg-[#111] border border-[#222] rounded-lg cursor-pointer hover:border-purple-500/30 transition group">
                          <span className="text-sm text-white group-hover:text-purple-300 transition truncate">{v.keyword}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-14 h-1.5 bg-[#222] rounded-full"><div className={`h-full rounded-full ${kBar}`} style={{ width: `${v.viralScore}%` }} /></div>
                            <span className={`text-xs font-bold ${kColor}`}>{v.viralScore}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[#666] text-sm">{t('seo.analyzer.keywordsHint')}</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
