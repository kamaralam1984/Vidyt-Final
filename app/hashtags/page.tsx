'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Hash, Copy, Check, Youtube, Facebook, Instagram, RefreshCw, Loader2,
  Search, Film, Sparkles, Zap, X, Filter,
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { useTranslations } from '@/context/translations';
import { autoCreateSeoPage } from '@/lib/autoCreateSeoPage';

type Platform = 'youtube' | 'facebook' | 'instagram' | 'tiktok';

interface ViralHashtag {
  tag: string;
  viralScore: number;
  category?: string;
}

const CATEGORIES = ['All', 'Viral', 'Entertainment', 'Gaming', 'Music', 'Food', 'Travel', 'Fitness', 'Beauty', 'Tech', 'News', 'Comedy', 'Education'];

const PLATFORM_CONFIG: Record<Platform, { icon: typeof Youtube; activeBg: string }> = {
  youtube: { icon: Youtube, activeBg: 'bg-red-600' },
  facebook: { icon: Facebook, activeBg: 'bg-blue-600' },
  instagram: { icon: Instagram, activeBg: 'bg-gradient-to-r from-purple-600 to-pink-600' },
  tiktok: { icon: Film, activeBg: 'bg-[#111] border border-white/20' },
};

const NICHE_KEYWORDS: Record<Platform, string[]> = {
  youtube: ['viral video', 'funny', 'gaming', 'vlog', 'music', 'shorts', 'tutorial', 'review', 'reaction', 'dance', 'cooking', 'tech review', 'travel vlog', 'fitness'],
  facebook: ['viral post', 'facebook reels', 'motivational', 'news', 'funny clips', 'memes', 'live video', 'sports', 'cooking recipe', 'life hack'],
  instagram: ['reels', 'aesthetic', 'travel', 'food', 'fitness', 'fashion', 'makeup', 'lifestyle', 'pets', 'photography', 'art', 'dance'],
  tiktok: ['fyp', 'viral', 'trending', 'dance', 'comedy', 'storytime', 'grwm', 'outfit', 'recipe', 'hack', 'pov', 'duet'],
};

const STATIC_FALLBACK: Record<Platform, string[]> = {
  youtube: ['viral', 'fyp', 'trending', 'shorts', 'subscribe', 'youtubeshorts', 'viralvideo', 'explore', 'comedy', 'music', 'gaming', 'food', 'travel', 'fitness', 'tech', 'fashion', 'beauty', 'dance', 'vlog', 'reaction'],
  facebook: ['viral', 'trending', 'fyp', 'facebookvideo', 'reels', 'explore', 'love', 'comedy', 'music', 'food', 'travel', 'fitness', 'beauty', 'gaming', 'memes', 'motivation', 'news', 'sports', 'lifehack', 'fbreels'],
  instagram: ['viral', 'fyp', 'trending', 'reels', 'instagood', 'explore', 'love', 'follow', 'comedy', 'dance', 'music', 'food', 'travel', 'fitness', 'beauty', 'fashion', 'photography', 'art', 'instadaily', 'viralreels'],
  tiktok: ['fyp', 'viral', 'trending', 'foryou', 'tiktok', 'dance', 'comedy', 'storytime', 'grwm', 'outfit', 'recipe', 'hack', 'pov', 'duet', 'xyzbca', 'trend', 'funny', 'relatable', 'aesthetic', 'fitness'],
};

export default function HashtagsPage() {
  const { t } = useTranslations();
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [hashtags, setHashtags] = useState<ViralHashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [customKeyword, setCustomKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  const copyText = (text: string, label: string) => {
    try { navigator.clipboard.writeText(text); } catch {}
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const loadHashtags = async (activePlatform: Platform, keyword?: string) => {
    setLoading(true);
    setSelectedTags(new Set());
    const pool = NICHE_KEYWORDS[activePlatform];
    const seedKeyword = keyword?.trim() || pool[Math.floor(Math.random() * pool.length)];
    autoCreateSeoPage(seedKeyword);
    const allHashtags: ViralHashtag[] = [];

    // 1) AI Keyword Intelligence — real AI-generated hashtags with viral scores
    try {
      const aiRes = await axios.post('/api/ai/keyword-intelligence', {
        primaryKeyword: seedKeyword,
        currentPage: 'HASHTAG_GENERATOR_PAGE',
        platform: activePlatform === 'tiktok' ? 'youtube' : activePlatform,
        contentType: activePlatform === 'youtube' || activePlatform === 'tiktok' ? 'short' : activePlatform === 'facebook' ? 'post' : 'reel',
      }, { headers: getAuthHeaders() });

      const data = aiRes.data?.data;
      if (data) {
        // AI-generated hashtags
        (data.hashtags || []).forEach((tag: string, i: number) => {
          allHashtags.push({
            tag: tag.startsWith('#') ? tag : `#${tag}`,
            viralScore: Math.max(50, 90 - i * 2),
            category: categorizeHashtag(tag),
          });
        });
        // Viral keywords as hashtags
        (data.viral_keywords || []).forEach((kw: string, i: number) => {
          const tag = `#${kw.replace(/\s+/g, '').toLowerCase()}`;
          if (!allHashtags.find(h => h.tag.toLowerCase() === tag.toLowerCase())) {
            allHashtags.push({ tag, viralScore: Math.max(60, 85 - i * 3), category: categorizeHashtag(kw) });
          }
        });
        // Keyword scores as ranked hashtags
        (data.keyword_scores || []).forEach((ks: any) => {
          const tag = `#${(ks.keyword || '').replace(/\s+/g, '').toLowerCase()}`;
          if (tag.length > 1 && !allHashtags.find(h => h.tag.toLowerCase() === tag.toLowerCase())) {
            allHashtags.push({
              tag,
              viralScore: ks.viral_score || ks.seo_score || 65,
              category: categorizeHashtag(ks.keyword || ''),
            });
          }
        });
        // Long-tail keywords as niche hashtags
        (data.long_tail_keywords || []).slice(0, 8).forEach((kw: string, i: number) => {
          const tag = `#${kw.replace(/\s+/g, '').toLowerCase()}`;
          if (!allHashtags.find(h => h.tag.toLowerCase() === tag.toLowerCase())) {
            allHashtags.push({ tag, viralScore: Math.max(45, 75 - i * 3), category: categorizeHashtag(kw) });
          }
        });
      }
    } catch (e) {
      console.error('[HashtagGen] AI Intelligence failed:', e);
    }

    // 2) Platform-specific hashtag API — supplement with platform hashtags
    try {
      const endpoint = activePlatform === 'youtube' || activePlatform === 'tiktok'
        ? '/api/youtube/hashtags'
        : activePlatform === 'facebook' ? '/api/facebook/hashtags' : '/api/instagram/hashtags';
      const contentType = activePlatform === 'youtube' || activePlatform === 'tiktok' ? 'short' : activePlatform === 'facebook' ? 'post' : 'reel';

      const res = await axios.get(endpoint, {
        params: { keyword: seedKeyword, contentType },
        headers: getAuthHeaders(),
      });
      const data = res.data?.hashtags || [];
      data.forEach((h: any) => {
        const tag = typeof h.tag === 'string' ? h.tag : `#${h.tag || h}`;
        if (!allHashtags.find(x => x.tag.toLowerCase() === tag.toLowerCase())) {
          allHashtags.push({
            tag,
            viralScore: typeof h.viralScore === 'number' ? Math.max(0, Math.min(100, Math.round(h.viralScore))) : 55,
            category: categorizeHashtag(tag),
          });
        }
      });
    } catch {
      // silent — AI results are primary
    }

    // 3) Trending data supplement
    try {
      const trendRes = await axios.get(`/api/trending?platform=${activePlatform}&keywords=${encodeURIComponent(seedKeyword)}`, { headers: getAuthHeaders() });
      const trends = trendRes.data?.trendingTopics || [];
      trends.slice(0, 5).forEach((tr: any) => {
        const tag = `#${(tr.keyword || '').replace(/\s+/g, '').toLowerCase()}`;
        if (tag.length > 1 && !allHashtags.find(h => h.tag.toLowerCase() === tag.toLowerCase())) {
          allHashtags.push({ tag, viralScore: tr.score || 80, category: tr.category || categorizeHashtag(tr.keyword || '') });
        }
      });
    } catch { /* silent */ }

    // 4) Deduplicate, rank by score, limit
    if (allHashtags.length > 0) {
      const unique = new Map<string, ViralHashtag>();
      allHashtags.forEach(h => {
        const key = h.tag.toLowerCase();
        const existing = unique.get(key);
        if (!existing || h.viralScore > existing.viralScore) unique.set(key, h);
      });
      const sorted = Array.from(unique.values()).sort((a, b) => b.viralScore - a.viralScore).slice(0, 35);
      setHashtags(sorted);
    } else {
      setHashtags(buildFallback(activePlatform));
    }

    setLoading(false);
  };

  const buildFallback = (p: Platform): ViralHashtag[] =>
    STATIC_FALLBACK[p].map((tag, i) => ({
      tag: `#${tag}`,
      viralScore: Math.max(35, 85 - i * 2),
      category: categorizeHashtag(tag),
    }));

  useEffect(() => {
    // When platform changes, use the custom keyword if user has typed one
    loadHashtags(platform, customKeyword.trim() || undefined);
  }, [platform]);

  const handleCustomSearch = () => {
    // Always use whatever is in the search box — even if empty (will use random seed)
    loadHashtags(platform, customKeyword.trim() || undefined);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const filteredHashtags = hashtags.filter(h => {
    if (activeCategory !== 'All' && h.category !== activeCategory) return false;
    if (searchFilter && !h.tag.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const selectedCount = selectedTags.size;
  const highViralCount = hashtags.filter(h => h.viralScore >= 75).length;
  const avgScore = hashtags.length > 0 ? Math.round(hashtags.reduce((s, h) => s + h.viralScore, 0) / hashtags.length) : 0;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Animated Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 animate-pulse" />
          <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Hash className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
                    {t('hashtags.title')}
                  </h1>
                  <p className="text-sm text-[#888] mt-0.5">{t('hashtags.subtitle')}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3">
                <div className="bg-[#111] border border-[#222] rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-[#666] uppercase font-bold">Total</p>
                  <p className="text-lg font-black text-white">{hashtags.length}</p>
                </div>
                <div className="bg-[#111] border border-[#222] rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-[#666] uppercase font-bold">Viral</p>
                  <p className="text-lg font-black text-emerald-400">{highViralCount}</p>
                </div>
                <div className="bg-[#111] border border-[#222] rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-[#666] uppercase font-bold">Avg Score</p>
                  <p className={`text-lg font-black ${avgScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{avgScore}%</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Platform + Custom Keyword */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['youtube', 'facebook', 'instagram', 'tiktok'] as Platform[]).map((p) => {
              const cfg = PLATFORM_CONFIG[p];
              const Icon = cfg.icon;
              return (
                <button key={p} onClick={() => setPlatform(p)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${platform === p ? `${cfg.activeBg} text-white shadow-lg` : 'bg-[#181818] text-[#888] border border-[#333] hover:text-white'}`}>
                  <Icon className="w-5 h-5" />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Custom Keyword Search */}
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input value={customKeyword} onChange={(e) => setCustomKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
                placeholder="Type topic — e.g. cooking, gaming, fitness, travel..."
                className="w-full pl-10 pr-4 py-3 bg-[#181818] border border-[#333] rounded-xl text-white text-sm placeholder-[#555] focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <button onClick={handleCustomSearch} disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl font-black text-sm flex items-center gap-2 transition shadow-lg shadow-blue-500/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Generate Hashtags'}
            </button>
            <button onClick={() => { setCustomKeyword(''); loadHashtags(platform); }} disabled={loading} title="Random hashtags"
              className="px-4 py-3 bg-[#181818] border border-[#333] hover:border-blue-500 text-[#888] hover:text-white rounded-xl transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${activeCategory === cat ? 'bg-purple-600 text-white' : 'bg-[#181818] text-[#888] border border-[#333] hover:text-white'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Search Filter + Actions */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="relative flex-1 max-w-xs">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666]" />
            <input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter hashtags..."
              className="w-full pl-9 pr-4 py-2 bg-[#111] border border-[#333] rounded-lg text-sm text-white placeholder-[#666]" />
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <span className="text-xs text-purple-400 font-bold">{selectedCount} selected</span>
            )}
            <button onClick={() => {
              const tags = selectedCount > 0
                ? hashtags.filter(h => selectedTags.has(h.tag))
                : hashtags;
              copyText(tags.map(h => h.tag).join(' '), 'all');
            }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition">
              {copiedItem === 'all' ? <><Check className="w-4 h-4" /> {t('common.copied')}</> : <><Copy className="w-4 h-4" /> {selectedCount > 0 ? `Copy ${selectedCount}` : t('hashtags.copyAll')}</>}
            </button>
          </div>
        </div>

        {/* Hashtags Grid */}
        <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
          {loading && hashtags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm text-[#888]">{t('common.loading')}</p>
            </div>
          ) : filteredHashtags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filteredHashtags.map((item, i) => {
                const isSelected = selectedTags.has(item.tag);
                const isHot = item.viralScore >= 75;
                const isMedium = item.viralScore >= 55;
                const scoreBg = isHot ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : isMedium ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30';

                return (
                  <motion.button key={`${item.tag}-${i}`} type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.015 }}
                    onClick={() => toggleTag(item.tag)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition border ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-lg shadow-blue-500/10'
                        : 'bg-[#111] border-[#333] hover:border-blue-500/50 text-white hover:bg-[#151515]'
                    }`}
                  >
                    {isHot && <Zap className="w-3 h-3 text-emerald-400" />}
                    <span>{item.tag}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${scoreBg}`}>
                      {item.viralScore}%
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <Hash className="w-10 h-10 text-[#333] mx-auto mb-2" />
              <p className="text-sm text-[#888]">No hashtags match your filter. Try a different category or search.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function categorizeHashtag(tag: string): string {
  const t = tag.toLowerCase().replace('#', '');
  if (/game|gaming|gta|fortnite|minecraft|pubg|valorant/.test(t)) return 'Gaming';
  if (/music|song|dance|dj|singer|rap|hiphop|beat/.test(t)) return 'Music';
  if (/food|cook|recipe|eat|restaurant|chef|baking/.test(t)) return 'Food';
  if (/travel|tour|destination|explore|adventure|wanderlust/.test(t)) return 'Travel';
  if (/fit|fitness|workout|gym|yoga|health|exercise/.test(t)) return 'Fitness';
  if (/beauty|makeup|skincare|hair|glow|cosmetic/.test(t)) return 'Beauty';
  if (/tech|ai|code|software|phone|gadget|app/.test(t)) return 'Tech';
  if (/news|breaking|politic|election|government/.test(t)) return 'News';
  if (/comedy|funny|laugh|meme|joke|humor/.test(t)) return 'Comedy';
  if (/learn|education|tutorial|howto|study|tips/.test(t)) return 'Education';
  if (/viral|fyp|trending|explore|foryou/.test(t)) return 'Viral';
  return 'Entertainment';
}
