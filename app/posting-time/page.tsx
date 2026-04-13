'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import PostingTimeHeatmap from '@/components/PostingTimeHeatmap';
import { Clock, Youtube, Facebook, Instagram, Film, Link2, Loader2, AlertCircle, Check, BarChart3, TrendingUp, Zap, RefreshCw, Copy } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import { useTranslations } from '@/context/translations';

type Platform = 'youtube' | 'facebook' | 'instagram' | 'tiktok';

const PLATFORM_CONFIG: Record<Platform, { icon: typeof Youtube; activeBg: string; label: string; placeholder: string }> = {
  youtube: { icon: Youtube, activeBg: 'bg-red-600', label: 'YouTube', placeholder: 'https://www.youtube.com/@channel or /channel/UC...' },
  facebook: { icon: Facebook, activeBg: 'bg-blue-600', label: 'Facebook', placeholder: 'https://www.facebook.com/yourpage' },
  instagram: { icon: Instagram, activeBg: 'bg-gradient-to-r from-purple-600 to-pink-600', label: 'Instagram', placeholder: 'https://www.instagram.com/yourprofile' },
  tiktok: { icon: Film, activeBg: 'bg-[#111] border border-white/20', label: 'TikTok', placeholder: 'https://www.tiktok.com/@username' },
};

export default function PostingTimePage() {
  const { t } = useTranslations();
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [links, setLinks] = useState<Record<string, string>>({ youtube: '', facebook: '', instagram: '', tiktok: '' });
  const [postingTime, setPostingTime] = useState({ day: '', hour: 0, confidence: 0 });
  const [linkBasedResult, setLinkBasedResult] = useState<{
    summary?: string; bestDays?: string[]; bestHours?: number[];
    bestSlots?: { day: string; hour: number; timeLabel: string; views: number; share: number }[];
    heatmapSlots?: { day: string; hour: number; views: number; share: number }[];
    totalVideosAnalyzed?: number; error?: string;
  } | null>(null);
  const [loadingLink, setLoadingLink] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Load saved links from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('posting-time-links');
    if (saved) try { setLinks(JSON.parse(saved)); } catch {}
  }, []);

  const saveLink = (p: string, url: string) => {
    const updated = { ...links, [p]: url };
    setLinks(updated);
    if (typeof window !== 'undefined') localStorage.setItem('posting-time-links', JSON.stringify(updated));
  };

  useEffect(() => {
    setLinkBasedResult(null);
    setPostingTime({ day: '', hour: 0, confidence: 0 });
    // Auto-analyze if link exists for this platform
    const link = links[platform]?.trim();
    if (link) setTimeout(() => fetchFromLink(link), 300);
  }, [platform]);

  const currentLink = links[platform]?.trim() || '';

  const copyText = (text: string, label: string) => {
    try { navigator.clipboard.writeText(text); } catch {}
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const fetchFromLink = async (url?: string) => {
    const link = url || currentLink;
    if (!link) return;
    setLoadingLink(true);
    setLinkBasedResult(null);
    try {
      if (platform === 'youtube') {
        const res = await axios.get(`/api/youtube/best-posting-time?channelUrl=${encodeURIComponent(link)}`, { headers: getAuthHeaders() });
        if (res.data.error && !res.data.bestSlots?.length) {
          setLinkBasedResult({ error: res.data.error || res.data.summary || 'Invalid link' });
          return;
        }
        const top = res.data.bestSlots?.[0];
        if (top) setPostingTime({ day: top.day, hour: top.hour, confidence: Math.min(95, 70 + (top.share || 0) / 2) });
        setLinkBasedResult({
          summary: res.data.summary, bestDays: res.data.bestDays, bestHours: res.data.bestHours,
          bestSlots: res.data.bestSlots, heatmapSlots: res.data.heatmapSlots,
          totalVideosAnalyzed: res.data.totalVideosAnalyzed, error: res.data.error,
        });
      } else {
        const res = await axios.get(`/api/social-posting-time?platform=${platform}&url=${encodeURIComponent(link)}`, { headers: getAuthHeaders() });
        if (res.data.error && !res.data.bestSlots?.length) {
          setLinkBasedResult({ error: res.data.error, summary: res.data.summary });
          return;
        }
        const top = res.data.bestSlots?.[0];
        if (top) setPostingTime({ day: top.day, hour: top.hour, confidence: Math.min(95, 65 + (top.share || 0) / 2) });
        setLinkBasedResult({
          summary: res.data.summary, bestDays: res.data.bestDays, bestHours: res.data.bestHours,
          bestSlots: res.data.bestSlots, totalVideosAnalyzed: res.data.totalVideosAnalyzed, error: res.data.error,
        });
      }
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error || 'Could not fetch data from this link.';
      setLinkBasedResult({ error: msg });
    } finally {
      setLoadingLink(false);
    }
  };

  const hasResults = linkBasedResult && !linkBasedResult.error && (linkBasedResult.bestSlots?.length || linkBasedResult.summary);
  const bestSlot = linkBasedResult?.bestSlots?.[0];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Animated Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-amber-500/10 to-purple-600/10 animate-pulse" />
          <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Clock className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-amber-400 to-purple-400">
                    {t('posting.title')}
                  </h1>
                  <p className="text-sm text-[#888] mt-0.5">{t('posting.subtitle')}</p>
                </div>
              </div>

              {/* Best Time Badge */}
              {bestSlot && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-emerald-500/10 to-purple-500/10 border border-emerald-500/30 rounded-xl px-5 py-3 text-center">
                  <p className="text-[10px] text-[#888] uppercase font-bold">Best Time to Post</p>
                  <p className="text-lg font-black text-emerald-400">{bestSlot.day} {bestSlot.timeLabel}</p>
                  <p className="text-[10px] text-[#666]">{postingTime.confidence}% confidence</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Platform Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['youtube', 'facebook', 'instagram', 'tiktok'] as Platform[]).map((p) => {
            const cfg = PLATFORM_CONFIG[p];
            const Icon = cfg.icon;
            return (
              <button key={p} onClick={() => setPlatform(p)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${platform === p ? `${cfg.activeBg} text-white shadow-lg` : 'bg-[#181818] text-[#888] border border-[#333] hover:text-white'}`}>
                <Icon className="w-5 h-5" /> {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Channel Link Input */}
        <div className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">
              Paste your {PLATFORM_CONFIG[platform].label} link
            </h2>
          </div>
          <p className="text-xs text-[#888] mb-4">
            We analyze your recent videos/posts and calculate the exact best posting times based on real engagement data.
          </p>
          <div className="flex gap-3">
            <input type="url" value={currentLink} onChange={(e) => saveLink(platform, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchFromLink()}
              placeholder={PLATFORM_CONFIG[platform].placeholder}
              className="flex-1 px-4 py-3 rounded-xl bg-[#111] border border-[#333] text-white placeholder-[#555] focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            <button onClick={() => fetchFromLink()} disabled={!currentLink || loadingLink}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 disabled:opacity-50 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 transition">
              {loadingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {loadingLink ? 'Analyzing Channel...' : 'Analyze & Find Best Time'}
            </button>
          </div>

          {/* Error */}
          {linkBasedResult?.error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{linkBasedResult.error}</span>
            </motion.div>
          )}
        </div>

        {/* No Results Prompt */}
        {!hasResults && !loadingLink && (
          <div className="bg-[#181818] border border-[#212121] rounded-xl p-12 text-center mb-6">
            <Clock className="w-14 h-14 text-[#333] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Paste your channel link above</h3>
            <p className="text-sm text-[#888] max-w-md mx-auto">
              We will analyze your recent videos, check when they got the most views, and calculate the exact best posting times with confidence scores.
            </p>
          </div>
        )}

        {/* Loading */}
        {loadingLink && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-[#181818] border border-[#212121] rounded-xl p-10 text-center mb-6">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto mb-3" />
            <p className="text-white font-bold mb-1">Analyzing {PLATFORM_CONFIG[platform].label} Channel...</p>
            <p className="text-xs text-[#888]">Checking video publish times, view patterns, and engagement data</p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {hasResults && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Analysis Summary */}
              {linkBasedResult?.summary && (
                <div className="bg-gradient-to-r from-emerald-500/5 to-purple-500/5 border border-emerald-500/20 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Analysis Complete
                    </h3>
                    {linkBasedResult.totalVideosAnalyzed && (
                      <span className="text-xs text-[#888]">{linkBasedResult.totalVideosAnalyzed} videos analyzed</span>
                    )}
                  </div>
                  <p className="text-sm text-[#CCC] whitespace-pre-line">{linkBasedResult.summary.replace(/\*\*/g, '')}</p>
                </div>
              )}

              {/* Best Days & Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkBasedResult?.bestDays && linkBasedResult.bestDays.length > 0 && (
                  <div className="bg-[#181818] border border-[#212121] rounded-xl p-5">
                    <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Best Days to Post
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {linkBasedResult.bestDays.map((day, i) => (
                        <span key={i} className={`px-3 py-2 rounded-xl text-sm font-bold ${i === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#222] text-white border border-[#333]'}`}>
                          {i === 0 && <Zap className="w-3 h-3 inline mr-1" />}{day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {linkBasedResult?.bestHours && linkBasedResult.bestHours.length > 0 && (
                  <div className="bg-[#181818] border border-[#212121] rounded-xl p-5">
                    <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Best Hours to Post
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {linkBasedResult.bestHours.map((hour, i) => {
                        const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
                        return (
                          <span key={i} className={`px-3 py-2 rounded-xl text-sm font-bold ${i === 0 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-[#222] text-white border border-[#333]'}`}>
                            {i === 0 && <Zap className="w-3 h-3 inline mr-1" />}{label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Top 5 Best Slots */}
              {linkBasedResult?.bestSlots && linkBasedResult.bestSlots.length > 0 && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-400" /> Top Posting Slots (Ranked)
                    </h3>
                    <button onClick={() => copyText(linkBasedResult.bestSlots!.slice(0, 5).map(s => `${s.day} ${s.timeLabel}`).join(', '), 'slots')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#333] rounded-lg text-xs text-[#CCC]">
                      {copiedItem === 'slots' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy
                    </button>
                  </div>
                  <div className="space-y-2">
                    {linkBasedResult.bestSlots.slice(0, 7).map((slot, i) => {
                      const maxShare = Math.max(...linkBasedResult.bestSlots!.map(s => s.share || s.views || 1));
                      const pct = Math.round(((slot.share || slot.views || 0) / maxShare) * 100);
                      const barColor = i === 0 ? 'bg-emerald-500' : i < 3 ? 'bg-amber-500' : 'bg-blue-500';
                      return (
                        <div key={i} className="flex items-center gap-3 p-2.5 bg-[#111] rounded-xl border border-[#222]">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-emerald-500/20 text-emerald-400' : i < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-[#222] text-[#888]'}`}>
                            #{i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-white">{slot.day} {slot.timeLabel}</span>
                              <span className={`text-xs font-bold ${i === 0 ? 'text-emerald-400' : i < 3 ? 'text-amber-400' : 'text-[#AAA]'}`}>{slot.share || slot.views}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.1, duration: 0.6 }}
                                className={`h-full rounded-full ${barColor}`} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Heatmap */}
              <PostingTimeHeatmap
                postingTime={postingTime}
                platform={platform === 'tiktok' ? 'youtube' : platform}
                slots={
                  linkBasedResult?.heatmapSlots?.length
                    ? linkBasedResult.heatmapSlots.map(s => ({ day: s.day, hour: s.hour, engagement: s.share ?? s.views ?? 0 }))
                    : linkBasedResult?.bestSlots?.length
                      ? linkBasedResult.bestSlots.map(s => ({ day: s.day, hour: s.hour, engagement: s.share ?? s.views ?? 0 }))
                      : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
