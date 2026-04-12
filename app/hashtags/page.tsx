'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Hash, Copy, Check, Youtube, Facebook, Instagram, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

type Platform = 'youtube' | 'facebook' | 'instagram';

interface ViralHashtag {
  tag: string;
  viralScore: number;
}

const STATIC_HASHTAGS: Record<Platform, string[]> = {
  youtube: [
    'viral',
    'fyp',
    'foryou',
    'trending',
    'shorts',
    'viralvideo',
    'explore',
    'subscribe',
    'comedy',
    'dance',
    'music',
    'food',
    'travel',
    'fitness',
    'beauty',
    'fashion',
    'tech',
    'gaming',
    'youtubeshorts',
    'shortsfeed',
    'viralvideos',
    'trendingnow',
  ],
  facebook: [
    'viral',
    'trending',
    'fyp',
    'foryou',
    'facebookvideo',
    'fbviral',
    'explore',
    'love',
    'like',
    'share',
    'comment',
    'follow',
    'comedy',
    'dance',
    'music',
    'food',
    'travel',
    'fitness',
    'beauty',
    'fashion',
    'tech',
    'gaming',
    'reels',
    'viralpost',
  ],
  instagram: [
    'viral',
    'fyp',
    'foryou',
    'trending',
    'reels',
    'viralreels',
    'instagood',
    'love',
    'like',
    'follow',
    'share',
    'comment',
    'comedy',
    'dance',
    'music',
    'food',
    'travel',
    'fitness',
    'beauty',
    'fashion',
    'tech',
    'gaming',
    'explore',
    'instadaily',
  ],
};

const PLATFORM_KEYWORD_POOL: Record<Platform, string[]> = {
  youtube: [
    'viral video',
    'funny',
    'gaming',
    'vlog',
    'music',
    'shorts',
    'tutorial',
    'review',
    'reaction',
    'dance video',
  ],
  facebook: [
    'viral post',
    'facebook reels',
    'motivational',
    'news update',
    'funny clips',
    'memes',
    'live video',
    'sports highlights',
  ],
  instagram: [
    'reels',
    'aesthetic',
    'travel',
    'food',
    'fitness',
    'fashion',
    'makeup',
    'lifestyle',
    'pets',
  ],
};

function buildFallbackHashtags(platform: Platform): ViralHashtag[] {
  const base = STATIC_HASHTAGS[platform];
  return base.map((tag, index) => {
    // Deterministic fallback scores to keep server/client HTML in sync
    const baseScore = 80 - index * 2;
    const viralScore = Math.max(35, Math.min(100, baseScore));
    return { tag: `#${tag}`, viralScore };
  });
}

function getScoreClasses(score: number) {
  if (score >= 75) {
    return {
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      label: 'High viral chance',
    };
  }
  if (score >= 55) {
    return {
      badge: 'bg-amber-400/15 text-amber-200 border-amber-400/40',
      label: 'Normal performance',
    };
  }
  return {
    badge: 'bg-red-500/15 text-red-300 border-red-500/40',
    label: 'Low performance',
  };
}

export default function HashtagsPage() {
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [copied, setCopied] = useState(false);
  const [hashtags, setHashtags] = useState<ViralHashtag[]>([]);
  const [loading, setLoading] = useState(false);
   const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const safeCopyToClipboard = async (text: string) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) return;
      // Some browsers throw if tab is not focused; ignore those errors
      await navigator.clipboard.writeText(text);
    } catch {
      // Silently ignore clipboard errors – UX degrade but no crash
    }
  };

  const loadHashtags = async (activePlatform: Platform) => {
    setLoading(true);
    setSelectedTags(new Set());
    try {
      const endpoint =
        activePlatform === 'youtube'
          ? '/api/youtube/hashtags'
          : activePlatform === 'facebook'
          ? '/api/facebook/hashtags'
          : '/api/instagram/hashtags';

      const contentType =
        activePlatform === 'youtube' ? 'video' : activePlatform === 'facebook' ? 'post' : 'reel';

      // Pick a random seed keyword per generate so hashtags set actually changes
      const pool = PLATFORM_KEYWORD_POOL[activePlatform];
      const randomKeyword =
        pool && pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : 'viral';

      const response = await axios.get(endpoint, {
        params: {
          keyword: randomKeyword,
          contentType,
        },
        headers: getAuthHeaders(),
      });

      const data = response.data?.hashtags || [];
      if (Array.isArray(data) && data.length > 0) {
        const mapped: ViralHashtag[] = data.map((h: any) => ({
          tag: typeof h.tag === 'string' ? h.tag : String(h.tag ?? ''),
          viralScore:
            typeof h.viralScore === 'number'
              ? Math.max(0, Math.min(100, Math.round(h.viralScore)))
              : 60,
        }));
        // Shuffle and limit for more visual change on each generate
        const shuffled = mapped.sort(() => Math.random() - 0.5);
        setHashtags(shuffled.slice(0, 24));
      } else {
        setHashtags(buildFallbackHashtags(activePlatform));
      }
    } catch (error) {
      console.error('Error loading hashtags:', error);
      setHashtags(buildFallbackHashtags(activePlatform));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHashtags(platform);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const copyAllHashtags = () => {
    const baseList =
      hashtags.length > 0
        ? hashtags
        : STATIC_HASHTAGS[platform].map((tag) => ({ tag: `#${tag}`, viralScore: 60 }));

    const list =
      selectedTags.size > 0
        ? baseList.filter((item) => selectedTags.has(item.tag))
        : baseList;
    const hashtagsText = list.map((item) => item.tag).join(' ');
    void safeCopyToClipboard(hashtagsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Hash className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Hashtag Generator</h1>
                <p className="text-[#AAAAAA]">
                  Popular hashtags for {platform} content. Click to select; Copy All copies selected first.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadHashtags(platform)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#181818] border border-[#333333] text-white rounded-lg hover:border-blue-500 disabled:opacity-60 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Generate
              </button>
              <button
                onClick={copyAllHashtags}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy All
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Select Platform</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPlatform('youtube')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  platform === 'youtube'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Youtube className="w-5 h-5" />
                YouTube
              </button>
              <button
                onClick={() => setPlatform('facebook')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  platform === 'facebook'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Facebook className="w-5 h-5" />
                Facebook
              </button>
              <button
                onClick={() => setPlatform('instagram')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  platform === 'instagram'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Instagram className="w-5 h-5" />
                Instagram
              </button>
            </div>
          </div>

          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6">
            {loading && hashtags.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-[#AAAAAA] gap-2 text-sm">
                <span className="inline-block h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                Generating fresh hashtags for {platform}...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((item, index) => {
                  const classes = getScoreClasses(item.viralScore);
                  const isSelected = selectedTags.has(item.tag);
                  return (
                    <motion.button
                      type="button"
                      key={`${item.tag}-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                          : 'bg-[#101010] border-[#333333] hover:border-blue-500 hover:bg-[#141414] text-white'
                      }`}
                      onClick={() => {
                        setSelectedTags((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.tag)) {
                            next.delete(item.tag);
                          } else {
                            next.add(item.tag);
                          }
                          return next;
                        });
                      }}
                    >
                      <Hash className="w-3 h-3 text-blue-400" />
                      <span>{item.tag}</span>
                      <span
                        className={`ml-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${classes.badge}`}
                      >
                        {item.viralScore}%
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
