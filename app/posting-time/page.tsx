'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import PostingTimeHeatmap from '@/components/PostingTimeHeatmap';
import { Clock, Youtube, Facebook, Instagram, Link2, Loader2, AlertCircle } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

const PLATFORM_LABELS = {
  youtube: 'YouTube channel or video',
  facebook: 'Facebook page or video',
  instagram: 'Instagram profile or reel',
} as const;

export default function PostingTimePage() {
  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'instagram'>('youtube');
  const [links, setLinks] = useState<Record<string, string>>({
    youtube: '',
    facebook: '',
    instagram: '',
  });
  const [postingTime, setPostingTime] = useState({ day: 'Tuesday', hour: 14, confidence: 75 });
  const [linkBasedResult, setLinkBasedResult] = useState<{
    summary?: string;
    bestDays?: string[];
    bestHours?: number[];
    bestSlots?: { day: string; hour: number; timeLabel: string; views: number; share: number }[];
    heatmapSlots?: { day: string; hour: number; views: number; share: number }[];
    totalVideosAnalyzed?: number;
    error?: string;
  } | null>(null);
  const [loadingLink, setLoadingLink] = useState(false);

  useEffect(() => {
    fetchPostingTime();
    setLinkBasedResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const fetchPostingTime = async () => {
    try {
      const response = await axios.get(`/api/posting-time?platform=${platform}`);
      setPostingTime(response.data.postingTime || { day: 'Tuesday', hour: 14, confidence: 75 });
    } catch (error) {
      console.error('Error fetching posting time:', error);
    }
  };

  const currentLink = links[platform]?.trim() || '';

  const fetchFromLink = async () => {
    if (!currentLink) return;
    setLoadingLink(true);
    setLinkBasedResult(null);
    try {
      if (platform === 'youtube') {
        const res = await axios.get(
          `/api/youtube/best-posting-time?channelUrl=${encodeURIComponent(currentLink)}`,
          { headers: getAuthHeaders() }
        );
        if (res.data.error && !res.data.bestSlots?.length) {
          setLinkBasedResult({ error: res.data.error || res.data.summary || 'Invalid link' });
          return;
        }
        const top = res.data.bestSlots?.[0];
        if (top) {
          setPostingTime({
            day: top.day,
            hour: top.hour,
            confidence: Math.min(95, 70 + (top.share || 0) / 2),
          });
        }
        setLinkBasedResult({
          summary: res.data.summary,
          bestDays: res.data.bestDays,
          bestHours: res.data.bestHours,
          bestSlots: res.data.bestSlots,
          heatmapSlots: res.data.heatmapSlots,
          totalVideosAnalyzed: res.data.totalVideosAnalyzed,
          error: res.data.error,
        });
      } else if (platform === 'facebook' || platform === 'instagram') {
        const res = await axios.get(
          `/api/social-posting-time?platform=${platform}&url=${encodeURIComponent(currentLink)}`,
          { headers: getAuthHeaders() }
        );
        if (res.data.error && !res.data.bestSlots?.length) {
          setLinkBasedResult({ error: res.data.error, summary: res.data.summary });
          return;
        }
        const top = res.data.bestSlots?.[0];
        if (top) {
          setPostingTime({
            day: top.day,
            hour: top.hour,
            confidence: Math.min(95, 65 + (top.share || 0) / 2),
          });
        }
        setLinkBasedResult({
          summary: res.data.summary,
          bestDays: res.data.bestDays,
          bestHours: res.data.bestHours,
          bestSlots: res.data.bestSlots,
          totalVideosAnalyzed: res.data.totalVideosAnalyzed,
          error: res.data.error,
        });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'We could not fetch data from this link.';
      setLinkBasedResult({ error: msg });
    } finally {
      setLoadingLink(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Best Posting Time</h1>
              <p className="text-[#AAAAAA]">
                Select a platform, paste your link — we will analyze your channel or videos and suggest the most accurate time to post.
              </p>
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

          {/* Set link for accurate posting time */}
          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#FF0000]" />
              Paste your {platform === 'youtube' ? 'YouTube' : platform === 'facebook' ? 'Facebook' : 'Instagram'} link
            </h2>
            <p className="text-sm text-[#AAAAAA] mb-4">
              {platform === 'youtube'
                ? 'Paste your channel or video link — we will analyze your recent videos and recommend your best posting time.'
                : 'Paste your page/profile link. We will estimate the best posting time based on recent engagement.'}
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-[#888] mb-1">
                  {PLATFORM_LABELS[platform]} (URL)
                </label>
                <input
                  type="url"
                  value={currentLink}
                  onChange={(e) => setLinks((prev) => ({ ...prev, [platform]: e.target.value }))}
                  placeholder={
                    platform === 'youtube'
                      ? 'https://www.youtube.com/@channel ya /channel/UC...'
                      : platform === 'facebook'
                        ? 'https://www.facebook.com/yourpage'
                        : 'https://www.instagram.com/yourprofile'
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0F0F0F] border border-[#333] text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={fetchFromLink}
                disabled={!currentLink || loadingLink}
                className="px-5 py-2.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 text-white font-medium flex items-center gap-2"
              >
                {loadingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {loadingLink ? 'Analyzing…' : 'Get accurate time'}
              </button>
            </div>
            {linkBasedResult?.error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{linkBasedResult.error}</span>
              </div>
            )}
            {linkBasedResult?.summary && !linkBasedResult.error && (
              <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[#CCC] text-sm whitespace-pre-line">
                {linkBasedResult.summary.replace(/\*\*/g, '')}
                {linkBasedResult.totalVideosAnalyzed != null && (
                  <p className="mt-2 text-emerald-400 text-xs">
                    Analyzed {linkBasedResult.totalVideosAnalyzed} videos for this recommendation.
                  </p>
                )}
              </div>
            )}
            {linkBasedResult?.bestSlots && linkBasedResult.bestSlots.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {linkBasedResult.bestSlots.slice(0, 5).map((slot, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-[#212121] text-xs text-white"
                  >
                    {slot.day} {slot.timeLabel} — {slot.share}%
                  </span>
                ))}
              </div>
            )}
          </div>

          <PostingTimeHeatmap
            postingTime={postingTime}
            platform={platform}
            slots={
              linkBasedResult?.heatmapSlots?.length
                ? linkBasedResult.heatmapSlots.map((s) => ({
                    day: s.day,
                    hour: s.hour,
                    engagement: s.share ?? s.views ?? 0,
                  }))
                : linkBasedResult?.bestSlots?.length
                  ? linkBasedResult.bestSlots.map((slot) => ({
                      day: slot.day,
                      hour: slot.hour,
                      engagement: slot.share ?? slot.views ?? 0,
                    }))
                  : undefined
            }
          />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
