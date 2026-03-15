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
  Instagram,
  Loader2,
  Hash,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DEBOUNCE_MS = 500;

export default function InstagramSEOPage() {
  const [caption, setCaption] = useState('');
  const [keywords, setKeywords] = useState('');
  const [contentType, setContentType] = useState<'post' | 'reel' | 'story' | 'live'>('post');

  const [seoData, setSeoData] = useState<{ seoScore: number; breakdown: Record<string, { score: number; label: string }> } | null>(null);
  const [descriptions, setDescriptions] = useState<{ text: string; seoScore: number }[]>([]);
  const [hashtags, setHashtags] = useState<{ tag: string; viralLevel: string; viralScore?: number }[]>([]);
  const [keywordData, setKeywordData] = useState<{ viralKeywords: { keyword: string; viralScore: number }[] } | null>(null);

  const [loadingSeo, setLoadingSeo] = useState(false);
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  const [instagramProfileUrl, setInstagramProfileUrl] = useState('');
  const [profileSummary, setProfileSummary] = useState<{
    profileName?: string;
    followersCount?: number;
    postsCount?: number;
    profileKami?: string[];
    settingKami?: string[];
    homepageKeywords?: { keyword: string; score: number }[];
    growthActions?: { where: string; action: string; reason: string }[];
    recommendedKeywords?: { keyword: string; score: number }[];
    linked?: boolean;
  } | null>(null);
  const [profileSummaryLoading, setProfileSummaryLoading] = useState(false);

  const fetchSeo = useCallback(async () => {
    setLoadingSeo(true);
    try {
      const res = await axios.get(
        `/api/instagram/seo?caption=${encodeURIComponent(caption)}&keywords=${encodeURIComponent(keywords)}`,
        { headers: getAuthHeaders() }
      );
      setSeoData(res.data);
    } catch {
      setSeoData(null);
    } finally {
      setLoadingSeo(false);
    }
  }, [caption, keywords]);

  const fetchDescriptions = useCallback(async () => {
    setLoadingDescriptions(true);
    try {
      const res = await axios.get(
        `/api/instagram/descriptions?caption=${encodeURIComponent(caption)}&keywords=${encodeURIComponent(keywords)}&contentType=${contentType}`,
        { headers: getAuthHeaders() }
      );
      setDescriptions(res.data.descriptions || []);
    } catch {
      setDescriptions([]);
    } finally {
      setLoadingDescriptions(false);
    }
  }, [caption, keywords, contentType]);

  const fetchHashtags = useCallback(async () => {
    const kw = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || caption.split(/\s+/).slice(0, 2).join(' ') || '';
    if (!kw) {
      setHashtags([]);
      return;
    }
    setLoadingHashtags(true);
    try {
      const res = await axios.get(`/api/instagram/hashtags?keyword=${encodeURIComponent(kw)}&contentType=${contentType}`, { headers: getAuthHeaders() });
      setHashtags(res.data.hashtags || []);
    } catch {
      setHashtags([]);
    } finally {
      setLoadingHashtags(false);
    }
  }, [keywords, caption, contentType]);

  const fetchKeywords = useCallback(async () => {
    const kw = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || '';
    setLoadingKeywords(true);
    try {
      const res = await axios.get(`/api/instagram/keywords?keyword=${encodeURIComponent(kw)}&caption=${encodeURIComponent(caption)}`, { headers: getAuthHeaders() });
      setKeywordData(res.data);
    } catch {
      setKeywordData(null);
    } finally {
      setLoadingKeywords(false);
    }
  }, [keywords, caption]);

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
    const t = setTimeout(() => { if (keywords.trim() || caption.trim()) fetchKeywords(); }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [keywords, caption, fetchKeywords]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('instagram-seo-profile-url') : null;
    if (saved) setInstagramProfileUrl(saved);
  }, []);

  const saveInstagramProfileUrl = (url: string) => {
    setInstagramProfileUrl(url);
    if (typeof window !== 'undefined') localStorage.setItem('instagram-seo-profile-url', url);
  };

  const fetchProfileSummary = useCallback(async () => {
    const url = instagramProfileUrl.trim();
    if (!url) {
      setProfileSummary(null);
      return;
    }
    setProfileSummaryLoading(true);
    setProfileSummary(null);
    try {
      const res = await axios.get(`/api/instagram/page-summary?profileUrl=${encodeURIComponent(url)}&_t=${Date.now()}`, { headers: getAuthHeaders() });
      setProfileSummary(res.data);
    } catch {
      setProfileSummary(null);
    } finally {
      setProfileSummaryLoading(false);
    }
  }, [instagramProfileUrl]);

  const breakdownChartData = seoData?.breakdown
    ? Object.entries(seoData.breakdown).map(([name, v]) => ({ name: name.replace(/([A-Z])/g, ' $1').trim(), score: v.score }))
    : [];

  const addKeywordToField = (kw: string) => {
    const current = keywords.trim();
    setKeywords(current ? `${current}, ${kw}` : kw);
  };

  const addDescriptionToField = (text: string) => setCaption((prev) => (prev ? `${prev}\n\n${text}` : text));
  const addHashtagToField = (tag: string) => setCaption((prev) => (prev ? `${prev} ${tag}` : tag));

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 max-w-[1600px] mx-auto">
          <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Instagram className="w-8 h-8 text-pink-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Instagram Live SEO Analyzer</h1>
              <p className="text-sm text-[#AAAAAA]">Real-time SEO for post, reels, story & live — caption, keywords, hashtags (YouTube page jaisa)</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <motion.div className="lg:col-span-2 space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Content setup
                </h2>
                <div className="flex gap-2 p-1 bg-[#212121] rounded-lg mb-4">
                  {(['post', 'reel', 'story', 'live'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContentType(type)}
                      className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition ${contentType === type ? 'bg-pink-500 text-white' : 'text-[#AAA] hover:text-white hover:bg-[#333]'}`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Caption</label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder={contentType === 'reel' ? 'Reel caption...' : contentType === 'story' ? 'Story text...' : contentType === 'live' ? 'Live caption...' : 'Post caption...'}
                      rows={5}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-pink-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Keywords / Hashtags (comma or newline)</label>
                    <textarea
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="viral, instagram, reels, trending, explore"
                      rows={2}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-pink-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Instagram Profile link</label>
                    <p className="text-xs text-[#666] mb-1">Link dalne par profile ka summary, kya badlav karne hain, growth tips — sab YouTube page jaisa dikhega.</p>
                    <div className="flex gap-2">
                      <input
                        value={instagramProfileUrl}
                        onChange={(e) => saveInstagramProfileUrl(e.target.value)}
                        placeholder="https://www.instagram.com/username"
                        className="flex-1 px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-pink-500"
                      />
                      <button
                        type="button"
                        onClick={fetchProfileSummary}
                        disabled={!instagramProfileUrl.trim() || profileSummaryLoading}
                        className="px-4 py-2.5 bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white rounded-lg font-medium"
                      >
                        {profileSummaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Link karein'}
                      </button>
                    </div>
                    {profileSummary?.profileName && (
                      <p className="text-xs text-emerald-400 mt-1">
                        Linked: {profileSummary.profileName}
                        {(profileSummary.postsCount ?? 0) + (profileSummary.followersCount ?? 0) > 0 && (
                          <> · {profileSummary.postsCount ?? 0} posts · {(profileSummary.followersCount ?? 0).toLocaleString()} followers</>
                        )}
                      </p>
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
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
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
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={breakdownChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#888', fontSize: 12 }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#AAA', fontSize: 11 }} width={100} />
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

              {profileSummary?.linked && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-pink-500" /> Profile Audit — Growth &amp; Home
                  </h2>
                  <p className="text-xs text-[#888] mb-4">Profile link ke hisaab se: kya badlav karein, kaun se keywords rakhne chahiye — YouTube page jaisa system.</p>
                  {(profileSummary?.homepageKeywords?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-emerald-400 mb-2">Profile / bio me kaun kaun se keywords rakhne chahiye (score %)</p>
                      <div className="flex flex-wrap gap-2">
                        {(profileSummary.homepageKeywords || []).map((item, i) => (
                          <span key={i} className="px-2 py-1 rounded text-sm border bg-[#212121] text-emerald-400 border-emerald-500/30">
                            {item.keyword} <span className="opacity-90">{item.score}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(profileSummary?.growthActions?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-amber-400 mb-2">Kya badlav karne ki zarurat hai — followers &amp; reach badhane ke liye</p>
                      <div className="space-y-3">
                        {(profileSummary.growthActions || []).map((g, i) => (
                          <div key={i} className="p-3 rounded-lg bg-[#212121]/80 border border-[#333]">
                            <p className="text-white font-medium text-sm mb-1"><span className="text-amber-400">Jahan:</span> {g.where}</p>
                            <p className="text-[#CCC] text-sm mb-1"><span className="text-emerald-400">Kya karein:</span> {g.action}</p>
                            <p className="text-[#888] text-xs"><span className="text-[#666]">Kyun:</span> {g.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(profileSummary?.recommendedKeywords?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-white mb-2">Recommended keywords (caption/bio me use karein)</p>
                      <div className="flex flex-wrap gap-2">
                        {(profileSummary.recommendedKeywords || []).map((item, i) => (
                          <button key={i} type="button" onClick={() => addKeywordToField(item.keyword)} className="px-2 py-1 bg-[#212121] text-emerald-400 rounded text-sm border border-emerald-500/30 hover:bg-[#2a2a2a]">
                            {item.keyword} <span className="opacity-90">{item.score}%</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {((profileSummary?.profileKami?.length ?? 0) > 0 || (profileSummary?.settingKami?.length ?? 0) > 0) && (
                    <div className="pt-4 border-t border-[#333]">
                      <p className="text-xs font-semibold text-[#AAA] mb-2">Profile me kami / Settings me kami (summary)</p>
                      <ul className="text-xs text-[#888] space-y-1 list-disc list-inside">
                        {(profileSummary.profileKami || []).map((k, i) => <li key={`p-${i}`}>{k}</li>)}
                        {(profileSummary.settingKami || []).map((k, i) => <li key={`s-${i}`}>{k}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> 5 Automatic captions {contentType !== 'post' && `(${contentType.charAt(0).toUpperCase() + contentType.slice(1)})`}
                </h2>
                <p className="text-xs text-[#888] mb-3">Click karke caption me add ho jayega.</p>
                {loadingDescriptions ? (
                  <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                ) : descriptions.length > 0 ? (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {descriptions.map((d, i) => (
                      <li key={i}>
                        <button type="button" onClick={() => addDescriptionToField(d.text)} className="w-full text-left p-3 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] border border-[#333] transition">
                          <span className="text-pink-400 font-semibold text-sm">{d.seoScore}%</span>
                          <p className="text-sm text-[#CCC] mt-1 line-clamp-2">{d.text}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#666] text-sm">Caption ya keywords bharein.</p>
                )}
              </div>

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Hash className="w-5 h-5" /> 25 Viral hashtags {contentType !== 'post' && `(${contentType})`}
                </h2>
                <p className="text-xs text-[#888] mb-3">Click karke caption me add. Green = high, amber = medium.</p>
                {loadingHashtags ? (
                  <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
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
                  <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
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
                  <p className="text-[#666] text-sm">Keyword ya caption type karein.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
