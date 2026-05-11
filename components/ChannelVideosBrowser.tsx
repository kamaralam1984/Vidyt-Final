'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Loader2, AlertCircle, Youtube, Play, Radio, Zap,
  ChevronRight, Edit3, Check, RefreshCw, TrendingUp, Rocket,
  Sparkles, Tag, Hash, Upload,
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { computeOutlierIndex } from '@/lib/viralHeuristics';

interface ChannelVideo {
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  hashtags: string;
  thumbnail: string;
  publishedAt: string;
  duration: number;
  type: 'short' | 'live' | 'long';
  viewCount?: string;
  likeCount?: string;
}

interface AnalysisResult {
  ctrPercent?: string;
  predictedRetention?: number;
  viralScore?: number;
  outlier?: number;
}

interface Props {
  onLoadToOptimizer: (video: {
    videoId: string;
    title: string;
    description: string;
    tags: string;
  }) => void;
}

const TYPE_TABS = [
  { key: 'all', label: 'All', icon: Youtube },
  { key: 'long', label: 'Long', icon: Play },
  { key: 'short', label: 'Shorts', icon: Zap },
  { key: 'live', label: 'Live', icon: Radio },
] as const;

function formatDuration(secs: number) {
  if (secs <= 0) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ScoreBadge({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg border" style={{ borderColor: `${color}4d`, backgroundColor: `${color}1a` }}>
      <span className="text-xs text-[#888] mb-0.5">{label}</span>
      <span className="text-sm font-black" style={{ color }}>{value}</span>
    </div>
  );
}

export default function ChannelVideosBrowser({ onLoadToOptimizer }: Props) {
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelName, setChannelName] = useState('');
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState('');
  const [uploadsPlaylistId, setUploadsPlaylistId] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'short' | 'live' | 'long'>('all');
  const [selectedVideo, setSelectedVideo] = useState<ChannelVideo | null>(null);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);

  // Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Update
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // SEO generate
  const [genSeo, setGenSeo] = useState(false);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const fetchVideos = async () => {
    if (!channelUrl.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedVideo(null);
    setVideos([]);
    setNextPageToken('');
    setUploadsPlaylistId('');
    try {
      const res = await axios.get('/api/youtube/channel-videos', {
        params: { channelUrl: channelUrl.trim() },
        headers: getAuthHeaders(),
      });
      setChannelName(res.data.channel || '');
      setVideos(res.data.videos || []);
      setNextPageToken(res.data.nextPageToken || '');
      setUploadsPlaylistId(res.data.uploadsPlaylistId || '');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to fetch channel videos');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (!nextPageToken || !uploadsPlaylistId || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await axios.get('/api/youtube/channel-videos', {
        params: { uploadsPlaylistId, pageToken: nextPageToken },
        headers: getAuthHeaders(),
      });
      setVideos((prev) => [...prev, ...(res.data.videos || [])]);
      setNextPageToken(res.data.nextPageToken || '');
    } catch {
      // silently fail — user can scroll again
    } finally {
      setLoadingMore(false);
    }
  }, [nextPageToken, uploadsPlaylistId, loadingMore]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPageToken && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, nextPageToken, loadingMore]);

  const selectVideo = (v: ChannelVideo) => {
    setSelectedVideo(v);
    setEditTitle(v.title);
    setEditDesc(v.description);
    setEditTags(v.tags.join(', '));
    setEditHashtags(v.hashtags);
    setThumbPreview(v.thumbnail);
    setAnalysis(null);
    setAnalyzeError(null);
    setUpdateMsg(null);
  };

  const runAnalysis = async () => {
    if (!selectedVideo) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalysis(null);
    try {
      const headers = getAuthHeaders();
      const [ctrRes, retRes] = await Promise.allSettled([
        axios.post('/api/viral/ctr', { title: editTitle, keywords: editTags, description: editDesc, thumbnailScore: 70 }, { headers }),
        axios.post('/api/viral/retention', { title: editTitle, script: '' }, { headers }),
      ]);
      const ctr = ctrRes.status === 'fulfilled' ? ctrRes.value.data : null;
      const ret = retRes.status === 'fulfilled' ? retRes.value.data : null;
      const outlierData = computeOutlierIndex(editTitle);
      const ctrNum = ctr ? parseFloat(ctr.ctrPercent) : 0;
      const retNum = ret?.predictedRetention ?? 0;
      const viral = Math.min(99, Math.round(0.4 * ctrNum * 10 + 0.35 * retNum + 0.25 * outlierData.overall));
      setAnalysis({
        ctrPercent: ctr?.ctrPercent,
        predictedRetention: ret?.predictedRetention,
        viralScore: viral,
        outlier: outlierData.overall,
      });
    } catch {
      setAnalyzeError('Analysis failed. Try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateSeo = async () => {
    setGenSeo(true);
    try {
      const fd = new FormData();
      fd.append('topic', editTitle || 'viral content');
      const res = await axios.post('/api/youtube/video-analyze', fd, { headers: getAuthHeaders() });
      const sug = res.data?.suggestions;
      if (sug) {
        if (sug.title) setEditTitle(sug.title);
        if (sug.description) setEditDesc(sug.description);
        if (sug.keywords?.length) setEditTags(sug.keywords.join(', '));
        if (sug.hashtags?.length) setEditHashtags(sug.hashtags.join(' '));
      }
    } catch {}
    setGenSeo(false);
  };

  const handleUpdate = async () => {
    if (!selectedVideo) return;
    setUpdating(true);
    setUpdateMsg(null);
    try {
      const allTags = [
        ...editTags.split(',').map((t) => t.trim()).filter(Boolean),
        ...editHashtags.split(/\s+/).map((t) => t.trim()).filter(Boolean),
      ].join(', ');
      const res = await axios.post(
        '/api/youtube/update-video-metadata',
        { videoId: selectedVideo.videoId, title: editTitle, description: editDesc, tags: allTags },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        setUpdateMsg({ type: 'success', text: 'Video updated on YouTube!' });
        setSelectedVideo({ ...selectedVideo, title: editTitle, description: editDesc });
        setVideos((prev) => prev.map((v) => v.videoId === selectedVideo.videoId ? { ...v, title: editTitle, description: editDesc } : v));
      }
    } catch (e: any) {
      if (e.response?.data?.needsAuth) { window.location.href = '/api/youtube/auth'; return; }
      setUpdateMsg({ type: 'error', text: e.response?.data?.error || 'Update failed' });
    } finally {
      setUpdating(false);
    }
  };

  const filtered = activeTab === 'all' ? videos : videos.filter((v) => v.type === activeTab);
  const outlierColor = (v: number) => v >= 70 ? '#22c55e' : v >= 45 ? '#eab308' : '#ef4444';

  return (
    <div className="bg-[#181818] border border-[#333] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#222]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#FF0000]/20 flex items-center justify-center">
            <Youtube className="w-5 h-5 text-[#FF0000]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Channel Video Analyzer</h2>
            <p className="text-xs text-[#666]">Paste any YouTube channel URL to browse, analyze and optimize old videos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchVideos()}
            placeholder="https://www.youtube.com/@ChannelName"
            className="flex-1 px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#555] text-sm focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
          />
          <button
            onClick={fetchVideos}
            disabled={loading || !channelUrl.trim()}
            className="px-4 py-2.5 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Body */}
      {videos.length > 0 && (
        <div className="flex" style={{ minHeight: 520 }}>
          {/* Video list panel */}
          <div className="w-72 shrink-0 border-r border-[#222] flex flex-col">
            {/* Channel name + tabs */}
            <div className="px-4 py-3 border-b border-[#222]">
              {channelName && (
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-white truncate">{channelName}</p>
                  <span className="text-[10px] text-[#555] shrink-0 ml-2">{videos.length} loaded</span>
                </div>
              )}
              <div className="flex gap-1">
                {TYPE_TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                      activeTab === key ? 'bg-[#FF0000] text-white' : 'text-[#888] hover:text-white hover:bg-[#222]'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="text-[10px] opacity-70">
                      {key === 'all' ? videos.length : videos.filter((v) => v.type === key).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable video list */}
            <div ref={listRef} className="flex-1 overflow-y-auto" style={{ maxHeight: 460 }}>
              {filtered.length === 0 ? (
                <p className="text-center text-[#555] text-xs p-6">No {activeTab} videos found</p>
              ) : (
                <>
                  {filtered.map((v) => (
                    <button
                      key={v.videoId}
                      onClick={() => selectVideo(v)}
                      className={`w-full text-left px-3 py-2.5 border-b border-[#1a1a1a] hover:bg-[#212121] transition-colors flex gap-2.5 ${
                        selectedVideo?.videoId === v.videoId ? 'bg-[#212121] border-l-2 border-l-[#FF0000]' : ''
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img src={v.thumbnail} alt="" className="w-16 h-9 rounded object-cover bg-[#111]" />
                        {v.duration > 0 && (
                          <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/80 text-white px-1 rounded">
                            {formatDuration(v.duration)}
                          </span>
                        )}
                        {v.type === 'live' && (
                          <span className="absolute top-0.5 left-0.5 text-[8px] bg-red-600 text-white px-1 rounded font-bold">LIVE</span>
                        )}
                        {v.type === 'short' && (
                          <span className="absolute top-0.5 left-0.5 text-[8px] bg-purple-600 text-white px-1 rounded font-bold">#S</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{v.title}</p>
                        <p className="text-[#555] text-[10px] mt-0.5">{new Date(v.publishedAt).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#444] shrink-0 self-center" />
                    </button>
                  ))}

                  {/* Infinite scroll sentinel */}
                  <div ref={sentinelRef} className="py-3 flex items-center justify-center">
                    {loadingMore ? (
                      <div className="flex items-center gap-2 text-xs text-[#555]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading more...
                      </div>
                    ) : nextPageToken ? (
                      <button
                        onClick={loadMore}
                        className="text-xs text-[#FF4444] hover:text-[#FF0000] flex items-center gap-1 transition-colors"
                      >
                        Load more videos
                      </button>
                    ) : (
                      <p className="text-[10px] text-[#444]">All videos loaded</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Detail / Edit panel */}
          <div className="flex-1 overflow-y-auto">
            {!selectedVideo ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Play className="w-10 h-10 text-[#333] mb-3" />
                <p className="text-[#555] text-sm">Select a video from the list to view details and optimize</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Thumbnail + stats row */}
                <div className="flex gap-4">
                  <div className="relative w-40 shrink-0">
                    <img src={thumbPreview || selectedVideo.thumbnail} alt="" className="w-full rounded-lg object-cover aspect-video bg-[#111]" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setThumbPreview(URL.createObjectURL(f));
                        }}
                      />
                      <div className="text-white text-xs flex flex-col items-center gap-1">
                        <Upload className="w-4 h-4" /><span>Change</span>
                      </div>
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#888] text-xs mb-1">{new Date(selectedVideo.publishedAt).toLocaleDateString()} &middot; {selectedVideo.type.toUpperCase()}</p>
                    <p className="text-white text-sm font-semibold line-clamp-2 mb-2">{selectedVideo.title}</p>
                    {analysis ? (
                      <div className="flex flex-wrap gap-2">
                        <ScoreBadge label="Outlier" value={analysis.outlier ?? 0} color={outlierColor(analysis.outlier ?? 0)} />
                        <ScoreBadge label="CTR" value={`${analysis.ctrPercent ?? 0}%`} color="#3b82f6" />
                        <ScoreBadge label="Retention" value={`${analysis.predictedRetention ?? 0}%`} color="#a855f7" />
                        <ScoreBadge label="Viral" value={`${analysis.viralScore ?? 0}%`} color={outlierColor(analysis.viralScore ?? 0)} />
                      </div>
                    ) : (
                      <button
                        onClick={runAnalysis}
                        disabled={analyzing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF4444] text-xs font-semibold rounded-lg hover:bg-[#FF0000]/20 transition-colors disabled:opacity-50"
                      >
                        {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        {analyzing ? 'Analyzing...' : 'Analyze Viral Potential'}
                      </button>
                    )}
                    {analyzeError && <p className="text-xs text-red-400 mt-1">{analyzeError}</p>}
                  </div>
                </div>

                {/* Edit fields */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-[#888] flex items-center gap-1"><Edit3 className="w-3 h-3" /> Title</label>
                      <span className={`text-[10px] font-mono ${editTitle.length >= 40 && editTitle.length <= 65 ? 'text-emerald-400' : editTitle.length > 70 ? 'text-red-400' : 'text-[#555]'}`}>
                        {editTitle.length}/70
                      </span>
                    </div>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] flex items-center gap-1 mb-1"><Edit3 className="w-3 h-3" /> Description</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FF0000] resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] flex items-center gap-1 mb-1"><Tag className="w-3 h-3" /> Tags <span className="text-[#555]">(comma separated)</span></label>
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                      className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FF0000]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] flex items-center gap-1 mb-1"><Hash className="w-3 h-3" /> Hashtags</label>
                    <input
                      value={editHashtags}
                      onChange={(e) => setEditHashtags(e.target.value)}
                      placeholder="#youtube #viral #shorts"
                      className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FF0000]"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={generateSeo}
                    disabled={genSeo}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {genSeo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                    AI High-CTR SEO
                  </button>
                  {analysis && (
                    <button
                      onClick={runAnalysis}
                      disabled={analyzing}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Re-analyze
                    </button>
                  )}
                  <button
                    onClick={() => onLoadToOptimizer({ videoId: selectedVideo.videoId, title: editTitle, description: editDesc, tags: editTags })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#333] hover:bg-[#444] border border-[#444] text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Rocket className="w-3.5 h-3.5 text-amber-400" /> Full Optimizer
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors ml-auto"
                  >
                    {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {updating ? 'Updating...' : 'Update on YouTube'}
                  </button>
                </div>

                {updateMsg && (
                  <div className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-2 ${
                    updateMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {updateMsg.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {updateMsg.text}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
