'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  Search,
  BarChart3,
  FileText,
  Facebook,
  Loader2,
  Hash,
  Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DEBOUNCE_MS = 500;

export default function FacebookSEOPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [contentType, setContentType] = useState<'post' | 'reel' | 'live'>('post');

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
    pageName?: string;
    followersCount?: number;
    postsCount?: number;
    pageKami?: string[];
    settingKami?: string[];
    homepageKeywords?: { keyword: string; score: number }[];
    growthActions?: { where: string; action: string; reason: string }[];
    recommendedKeywords?: { keyword: string; score: number }[];
    linked?: boolean;
    aiProvider?: 'openai' | 'gemini';
    aiError?: string;
  } | null>(null);
  const [pageSummaryLoading, setPageSummaryLoading] = useState(false);

  const fetchSeo = useCallback(async () => {
    setLoadingSeo(true);
    try {
      const res = await axios.get(
        `/api/facebook/seo?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&keywords=${encodeURIComponent(keywords)}`,
        { headers: getAuthHeaders() }
      );
      setSeoData(res.data);
    } catch {
      setSeoData(null);
    } finally {
      setLoadingSeo(false);
    }
  }, [title, description, keywords]);

  const fetchDescriptions = useCallback(async () => {
    setLoadingDescriptions(true);
    try {
      const res = await axios.get(
        `/api/facebook/descriptions?title=${encodeURIComponent(title)}&keywords=${encodeURIComponent(keywords)}&contentType=${contentType}`,
        { headers: getAuthHeaders() }
      );
      setDescriptions(res.data.descriptions || []);
    } catch {
      setDescriptions([]);
    } finally {
      setLoadingDescriptions(false);
    }
  }, [title, keywords, contentType]);

  const fetchHashtags = useCallback(async () => {
    const kw = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || title.split(/\s+/).slice(0, 2).join(' ') || '';
    if (!kw) {
      setHashtags([]);
      return;
    }
    setLoadingHashtags(true);
    try {
      const res = await axios.get(`/api/facebook/hashtags?keyword=${encodeURIComponent(kw)}&contentType=${contentType}`, { headers: getAuthHeaders() });
      setHashtags(res.data.hashtags || []);
    } catch {
      setHashtags([]);
    } finally {
      setLoadingHashtags(false);
    }
  }, [keywords, title, contentType]);

  const fetchKeywords = useCallback(async () => {
    const kw = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || '';
    setLoadingKeywords(true);
    try {
      const res = await axios.get(`/api/facebook/keywords?keyword=${encodeURIComponent(kw)}&title=${encodeURIComponent(title)}`, { headers: getAuthHeaders() });
      setKeywordData(res.data);
    } catch {
      setKeywordData(null);
    } finally {
      setLoadingKeywords(false);
    }
  }, [keywords, title]);

  useEffect(() => {
    const t = setTimeout(fetchSeo, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [fetchSeo]);

  useEffect(() => {
    const t = setTimeout(fetchDescriptions, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [fetchDescriptions]);

  useEffect(() => {
    const t = setTimeout(fetchHashtags, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [fetchHashtags]);

  useEffect(() => {
    const t = setTimeout(() => { if (keywords.trim() || title.trim()) fetchKeywords(); }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [keywords, title, fetchKeywords]);

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
    if (!url) {
      setPageSummary(null);
      return;
    }
    setPageSummaryLoading(true);
    setPageSummary(null);
    try {
      const res = await axios.get(`/api/facebook/page-summary?pageUrl=${encodeURIComponent(url)}&_t=${Date.now()}`, { headers: getAuthHeaders() });
      setPageSummary(res.data);
    } catch {
      setPageSummary(null);
    } finally {
      setPageSummaryLoading(false);
    }
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

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 max-w-[1600px] mx-auto">
          <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Facebook className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-white">Facebook Live SEO Analyzer</h1>
              <p className="text-sm text-[#AAAAAA]">Real-time SEO for posts, reels & live — description, keywords, hashtags (YouTube page jaisa)</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <motion.div className="lg:col-span-2 space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Content setup
                </h2>
                <div className="flex gap-2 p-1 bg-[#212121] rounded-lg mb-4">
                  {(['post', 'reel', 'live'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContentType(type)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${contentType === type ? 'bg-blue-600 text-white' : 'text-[#AAA] hover:text-white hover:bg-[#333]'}`}
                    >
                      {type === 'post' ? 'Post' : type === 'reel' ? 'Reel' : 'Live'}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">{contentType === 'reel' ? 'Reel Title' : contentType === 'live' ? 'Live Title' : 'Post Title'}</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={contentType === 'reel' ? 'e.g. 30 sec tip' : contentType === 'live' ? 'e.g. Live Q&A 9 PM' : 'e.g. Best tips for growth'}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Caption / description..."
                      rows={4}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Keywords / Hashtags (comma or newline)</label>
                    <textarea
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="viral, facebook, reels, trending"
                      rows={2}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Facebook Page link / Profile link</label>
                    <p className="text-xs text-[#666] mb-1">Link dalne par page/profile ka summary, kya badlav karne hain, growth tips — sab YouTube jaisa dikhega.</p>
                    <div className="flex gap-2">
                      <input
                        value={facebookPageUrl}
                        onChange={(e) => saveFacebookPageUrl(e.target.value)}
                        placeholder="https://www.facebook.com/YourPage ya facebook.com/profile.php?id=..."
                        className="flex-1 px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={fetchPageSummary}
                        disabled={!facebookPageUrl.trim() || pageSummaryLoading}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium"
                      >
                        {pageSummaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Link karein'}
                      </button>
                    </div>
                    {pageSummary?.pageName && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-emerald-400">
                          Linked: {pageSummary.pageName}
                          {(pageSummary.postsCount ?? 0) + (pageSummary.followersCount ?? 0) > 0 && (
                            <> · {pageSummary.postsCount ?? 0} posts · {(pageSummary.followersCount ?? 0).toLocaleString()} followers</>
                          )}
                          {pageSummary.aiProvider && (
                            <span className="text-[#888] ml-1">· AI: {pageSummary.aiProvider === 'openai' ? 'OpenAI' : 'Gemini'}</span>
                          )}
                        </p>
                        {pageSummary.aiError && (
                          <p className="text-xs text-amber-400">AI nahi chal paya: {pageSummary.aiError}. Fallback result dikhaya. Super Admin → API keys check karein.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="lg:col-span-3 space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> SEO Score
                </h2>
                {loadingSeo ? (
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold text-white">{seoData?.seoScore ?? 0}</span>
                      <span className="text-[#AAAAAA]">/ 100</span>
                    </div>
                    <div className="h-3 bg-[#212121] rounded-full overflow-hidden mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${seoData?.seoScore ?? 0}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${(seoData?.seoScore ?? 0) >= 70 ? 'bg-emerald-500' : (seoData?.seoScore ?? 0) >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      />
                    </div>
                    {breakdownChartData.length > 0 && (
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={breakdownChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#888', fontSize: 12 }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#AAA', fontSize: 11 }} width={90} />
                            <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333' }} />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {breakdownChartData.map((_, i) => (
                                <Cell key={i} fill={breakdownChartData[i].score >= 70 ? '#10b981' : breakdownChartData[i].score >= 40 ? '#f59e0b' : '#ef4444'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </div>

              {pageSummary?.linked && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" /> Page Audit — Growth &amp; Home
                  </h2>
                  <p className="text-xs text-[#888] mb-4">Page/Profile link ke hisaab se: kya badlav karein, kaun se keywords rakhne chahiye — YouTube page jaisa system.</p>
                  {(pageSummary?.homepageKeywords?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-emerald-400 mb-2">Page pe kaun kaun se keywords rakhne chahiye (score %)</p>
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
                      <p className="text-sm font-semibold text-amber-400 mb-2">Kya badlav karne ki zarurat hai — followers &amp; reach badhane ke liye</p>
                      <div className="space-y-3">
                        {(pageSummary.growthActions || []).map((g, i) => (
                          <div key={i} className="p-3 rounded-lg bg-[#212121]/80 border border-[#333]">
                            <p className="text-white font-medium text-sm mb-1"><span className="text-amber-400">Jahan:</span> {g.where}</p>
                            <p className="text-[#CCC] text-sm mb-1"><span className="text-emerald-400">Kya karein:</span> {g.action}</p>
                            <p className="text-[#888] text-xs"><span className="text-[#666]">Kyun:</span> {g.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(pageSummary?.recommendedKeywords?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-white mb-2">Recommended keywords (page/caption me use karein)</p>
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
                      <p className="text-xs font-semibold text-[#AAA] mb-2">Page me kami / Settings me kami (summary)</p>
                      <ul className="text-xs text-[#888] space-y-1 list-disc list-inside">
                        {(pageSummary.pageKami || []).map((k, i) => <li key={`p-${i}`}>{k}</li>)}
                        {(pageSummary.settingKami || []).map((k, i) => <li key={`s-${i}`}>{k}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Post time — kab post karein (is page ke viewers kab online/active) */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" /> Post time — kab post karein
                </h2>
                <p className="text-xs text-[#888] mb-4">Is page ke viewers kab online aur active rahte hain — in time pe post karke zyada reach milegi.</p>
                {pageSummary?.linked ? (
                  <>
                    <div className="p-4 rounded-lg bg-[#212121]/80 border border-[#333] mb-3">
                      <p className="text-sm font-semibold text-emerald-400 mb-2">Zyada active time (research-based)</p>
                      <ul className="text-sm text-[#CCC] space-y-1.5">
                        <li>• <strong className="text-white">Tuesday–Thursday</strong> — sabse zyada engagement</li>
                        <li>• <strong className="text-white">9–11 AM</strong> — morning scroll, office break</li>
                        <li>• <strong className="text-white">1–3 PM</strong> — lunch break, peak activity</li>
                        <li>• <strong className="text-white">7–9 PM</strong> — evening, sabse zyada viewers online</li>
                      </ul>
                      <p className="text-xs text-[#888] mt-3">Apne timezone ke hisaab se post schedule karein.</p>
                    </div>
                    <p className="text-xs text-[#AAA]">
                      <strong className="text-amber-400">Exact time apne page ke viewers ke liye:</strong> Facebook Business Suite → Page → Insights → &quot;When your fans are online&quot; dekhein. Wahan hour-by-hour dikhega kab aapke followers active rahte hain.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[#666]">Pehle upar <strong className="text-[#AAA]">Facebook Page link</strong> daalein aur &quot;Link karein&quot; dabayein, phir is page ke hisaab se post time aur tips dikhenge.</p>
                )}
              </div>

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> 5 Automatic descriptions {contentType !== 'post' && `(${contentType === 'reel' ? 'Reel' : 'Live'})`}
                </h2>
                <p className="text-xs text-[#888] mb-3">Click karke description me add ho jayega.</p>
                {loadingDescriptions ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                ) : descriptions.length > 0 ? (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {descriptions.map((d, i) => (
                      <li key={i}>
                        <button type="button" onClick={() => addDescriptionToField(d.text)} className="w-full text-left p-3 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] border border-[#333] transition">
                          <span className="text-blue-400 font-semibold text-sm">{d.seoScore}%</span>
                          <p className="text-sm text-[#CCC] mt-1 line-clamp-2">{d.text}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#666] text-sm">Title ya keywords bharein.</p>
                )}
              </div>

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Hash className="w-5 h-5" /> 25 Viral hashtags {contentType !== 'post' && `(${contentType})`}
                </h2>
                <p className="text-xs text-[#888] mb-3">Click karke description me add. Green = high, amber = medium.</p>
                {loadingHashtags ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                ) : hashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((h, i) => (
                      <button key={i} type="button" onClick={() => addHashtagToField(h.tag)} className={`px-2 py-1.5 rounded text-sm font-medium transition hover:opacity-90 ${h.viralLevel === 'high' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : h.viralLevel === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-[#212121] text-[#AAA] border border-[#333]'}`}>
                        {h.tag} {h.viralScore != null && <span className="opacity-90">{h.viralScore}%</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#666] text-sm">Keywords bharein.</p>
                )}
              </div>

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Search className="w-5 h-5" /> Viral Keywords
                </h2>
                <p className="text-xs text-[#888] mb-3">Click karke Keywords me add karein. Har keyword ke saath %.</p>
                {loadingKeywords ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                ) : (keywordData?.viralKeywords?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {(keywordData?.viralKeywords || []).map((v, i) => (
                      <button key={i} type="button" onClick={() => addKeywordToField(v.keyword)} className={`px-2 py-1.5 rounded text-sm border transition hover:opacity-90 ${v.viralScore >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#212121] text-[#AAA] border-[#333]'}`}>
                        <span className="truncate max-w-[140px]">{v.keyword}</span>
                        <span className="ml-1 font-semibold opacity-90">{v.viralScore}%</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#666] text-sm">Keyword ya title type karein.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
