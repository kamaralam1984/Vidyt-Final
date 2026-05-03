'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { useTranslations } from '@/context/translations';
import { autoCreateSeoPage } from '@/lib/autoCreateSeoPage';
import { useUser } from '@/hooks/useUser';
import {
  TrendingUp, Flame, Youtube, Facebook, Instagram, Film, Loader2, RefreshCw,
  Copy, Check, Search, ExternalLink, ChevronDown, Zap,
} from 'lucide-react';
import Link from 'next/link';

type Platform = 'youtube' | 'facebook' | 'instagram' | 'tiktok';

const TRENDING_FOCUS_LIMIT_BY_PLAN: Record<string, number> = {
  free: 3,
  starter: 6,
  pro: 15,
  enterprise: 30,
  custom: 30,
  owner: Infinity,
};

const PLATFORM_CONFIG: Record<Platform, { icon: typeof Youtube; color: string; bg: string; border: string }> = {
  youtube: { icon: Youtube, color: 'text-white', bg: 'bg-red-600', border: 'border-red-500/30' },
  facebook: { icon: Facebook, color: 'text-white', bg: 'bg-blue-600', border: 'border-blue-500/30' },
  instagram: { icon: Instagram, color: 'text-white', bg: 'bg-gradient-to-r from-purple-600 to-pink-600', border: 'border-pink-500/30' },
  tiktok: { icon: Film, color: 'text-white', bg: 'bg-[#111] border border-white/20', border: 'border-white/10' },
};

export default function TrendingPage() {
  const { t } = useTranslations();
  const { plan } = useUser();
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [trendingTopics, setTrendingTopics] = useState<Array<{ keyword: string; score: number; category?: string; rank?: number; source?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const planId = (plan?.id || 'free') as string;
  const focusLimit = TRENDING_FOCUS_LIMIT_BY_PLAN[planId] ?? TRENDING_FOCUS_LIMIT_BY_PLAN.free;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const fetchTrendingTopics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/trending?platform=${platform}`, { headers: getAuthHeaders() });
      const topics = response.data.trendingTopics || [];
      setTrendingTopics(topics);
      // Auto-create SEO pages for all trending topics
      topics.slice(0, 20).forEach((t: any) => autoCreateSeoPage(t.keyword));
    } catch {
      setTrendingTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingTopics();
  }, [platform]);

  // Sort by score desc, mark top N as focused (scores remapped to 90–98%),
  // rest become "locked" (rendered blurred & non-interactive). Same pattern as
  // /dashboard/keyword-intelligence so users can't read locked rows clearly,
  // which prevents refresh-spamming the AI quota.
  const displayedTopics = useMemo(() => {
    if (trendingTopics.length === 0) return [];
    const ranked = [...trendingTopics].sort((a, b) => (b.score || 0) - (a.score || 0));
    return ranked.map((topic, i) => {
      if (i < focusLimit) {
        return { ...topic, focused: true, score: Math.max(90, 98 - i) };
      }
      return { ...topic, focused: false };
    });
  }, [trendingTopics, focusLimit]);

  const focusedTopics = useMemo(() => displayedTopics.filter(t => t.focused), [displayedTopics]);

  const topKeyword = focusedTopics[0]?.keyword || '';
  const avgScore = focusedTopics.length > 0 ? Math.round(focusedTopics.reduce((s, t) => s + t.score, 0) / focusedTopics.length) : 0;
  const highViralCount = focusedTopics.filter(t => t.score >= 75).length;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Animated Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 animate-pulse" />
          <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Flame className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-orange-400">
                    {t('trending.title')}
                  </h1>
                  <p className="text-sm text-[#888] mt-0.5">{t('trending.subtitle')}</p>
                </div>
              </div>
              <button onClick={fetchTrendingTopics} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t('common.retry')}
              </button>
            </div>

            {/* Live Stats */}
            {!loading && focusedTopics.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-[#111]/60 border border-[#222] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#666] uppercase font-bold">Focused Trends</p>
                  <p className="text-xl font-black text-white">{focusedTopics.length}</p>
                </div>
                <div className="bg-[#111]/60 border border-[#222] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#666] uppercase font-bold">High Viral</p>
                  <p className="text-xl font-black text-emerald-400">{highViralCount}</p>
                </div>
                <div className="bg-[#111]/60 border border-[#222] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#666] uppercase font-bold">Avg Score</p>
                  <p className={`text-xl font-black ${avgScore >= 70 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{avgScore}%</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Platform Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['youtube', 'facebook', 'instagram', 'tiktok'] as Platform[]).map((p) => {
            const config = PLATFORM_CONFIG[p];
            const Icon = config.icon;
            const active = platform === p;
            return (
              <button key={p} onClick={() => setPlatform(p)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${active ? `${config.bg} ${config.color} shadow-lg` : 'bg-[#181818] text-[#888] border border-[#333] hover:text-white hover:border-[#555]'}`}>
                <Icon className="w-5 h-5" />
                {(p || '').charAt(0).toUpperCase() + (p || '').slice(1)}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
            <p className="text-[#888] text-sm">{t('common.loading')}</p>
          </div>
        ) : trendingTopics.length > 0 ? (
          <div className="space-y-4">
            {/* Top Trending Highlight */}
            {topKeyword && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[#888] uppercase font-bold">#1 Trending Now</p>
                    <p className="text-lg font-black text-white">{topKeyword}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyText(topKeyword, 'top')}
                    className="px-3 py-1.5 bg-[#222] hover:bg-[#333] rounded-lg text-xs text-[#CCC] flex items-center gap-1">
                    {copiedItem === 'top' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedItem === 'top' ? t('common.copied') : t('common.copy')}
                  </button>
                  <Link href={`/dashboard/youtube-seo?tab=keywords`}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-xs text-white font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Use for SEO
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Topics List */}
            <div className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#212121] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" /> {t('trending.title')} — {(platform || '').charAt(0).toUpperCase() + (platform || '').slice(1)}
                  </h2>
                  <p className="text-[11px] text-[#888]">
                    {planId === 'owner'
                      ? 'Owner plan: unlimited focused trends.'
                      : `${planId.charAt(0).toUpperCase() + planId.slice(1)} plan: ${focusLimit} focused trends (90–98% relevance).`}
                  </p>
                </div>
                <button onClick={() => copyText(focusedTopics.map(t => t.keyword).join(', '), 'all')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#333] rounded-lg text-xs text-[#CCC]">
                  {copiedItem === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedItem === 'all' ? t('common.copied') : t('hashtags.copyAll')}
                </button>
              </div>

              <div className="divide-y divide-[#1a1a1a]">
                {displayedTopics.map((topic, i) => {
                  const locked = !topic.focused;
                  const isHot = topic.score >= 75;
                  const isMedium = topic.score >= 55;
                  const barColor = isHot ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-red-500';
                  const textColor = isHot ? 'text-emerald-400' : isMedium ? 'text-amber-400' : 'text-red-400';
                  const badge = isHot ? 'VIRAL' : isMedium ? 'TRENDING' : 'LOW';
                  const badgeBg = isHot ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : isMedium ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
                  const blurStyle: React.CSSProperties | undefined = locked
                    ? { filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }
                    : undefined;

                  return (
                    <motion.div key={`${topic.keyword}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className={`flex items-center gap-4 px-5 py-3.5 transition group ${locked ? 'select-none' : 'hover:bg-[#111]'}`}>
                      {/* Rank — kept clear so layout reads as a continuous list */}
                      <span className={`text-sm font-black w-8 text-center ${i < 3 ? 'text-orange-400' : 'text-[#555]'}`}>
                        {i < 3 ? '🔥' : `${i + 1}`}
                      </span>

                      {/* Keyword + Category */}
                      <div className="flex-1 min-w-0" style={blurStyle}>
                        <p className="text-sm font-bold text-white truncate">{topic.keyword}</p>
                        {topic.category && <p className="text-[10px] text-[#666] truncate">{topic.category}</p>}
                      </div>

                      {/* Badge */}
                      <span style={blurStyle} className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeBg} hidden sm:inline`}>
                        {badge}
                      </span>

                      {/* Score Bar */}
                      <div style={blurStyle} className="w-20 h-2 bg-[#333] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${topic.score}%` }} transition={{ delay: i * 0.03, duration: 0.5 }}
                          className={`h-full rounded-full ${barColor}`} />
                      </div>

                      {/* Score */}
                      <span style={blurStyle} className={`text-xs font-black w-10 text-right ${textColor}`}>{topic.score}%</span>

                      {/* Actions */}
                      <div style={blurStyle} className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => !locked && copyText(topic.keyword, `kw-${i}`)} className="p-1.5 bg-[#222] hover:bg-[#333] rounded-lg">
                          {copiedItem === `kw-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#888]" />}
                        </button>
                        <Link href={locked ? '#' : `/dashboard/keyword-intelligence?q=${encodeURIComponent(topic.keyword)}`} className="p-1.5 bg-[#222] hover:bg-[#333] rounded-lg">
                          <Search className="w-3.5 h-3.5 text-[#888]" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#181818] border border-[#212121] rounded-xl p-12 text-center">
            <Flame className="w-14 h-14 text-[#333] mx-auto mb-3" />
            <p className="text-[#888] text-sm mb-4">{t('common.error')}</p>
            <button onClick={fetchTrendingTopics}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition">
              {t('common.retry')}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
