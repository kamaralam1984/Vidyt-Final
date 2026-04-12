'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Youtube, Facebook, Instagram, Music, Loader2, CheckCircle2, Globe, Lock, EyeOff, Share2, Copy, X, ImageIcon, Link2 } from 'lucide-react';
import axios from 'axios';
import { getToken, isAuthenticated, getAuthHeaders } from '@/utils/auth';
import type { AxiosProgressEvent } from 'axios';
import {
  clampYoutubeTitle,
  truncateToWordCount,
  SEO_DESCRIPTION_MAX_WORDS,
  YOUTUBE_TITLE_MAX_CHARS,
  countWords,
} from '@/lib/buildUploadSeo';

function normalizeKeywords(input: string[] | string, max = 10): string {
  const list = Array.isArray(input)
    ? input
    : String(input || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
  const unique = Array.from(new Set(list.map((x) => x.replace(/^#/, '').trim().toLowerCase()).filter(Boolean)));
  return unique.slice(0, max).join(', ');
}

function normalizeHashtags(input: string[] | string, max = 10): string {
  const list = Array.isArray(input)
    ? input
    : String(input || '')
        .split(/[\s,]+/)
        .map((x) => x.trim())
        .filter(Boolean);
  const unique = Array.from(
    new Set(
      list
        .map((x) => x.replace(/^#/, '').trim().toLowerCase())
        .filter(Boolean)
        .map((x) => `#${x}`),
    ),
  );
  return unique.slice(0, max).join(' ');
}

interface YoutubeChannelOption {
  channelId: string;
  channelTitle: string;
  channelThumbnail?: string;
}

interface VideoUploadProps {
  onAnalysisComplete: (data: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  /** User can use YouTube upload (Google OAuth on user and/or linked channel rows). */
  isYoutubeConnected?: boolean;
  /** User has OAuth tokens on the User document (main Google connect). */
  youtubeGoogleConnected?: boolean;
  allowedSystems?: Record<string, boolean>;
}

const YT_UPLOAD_CHANNEL_STORAGE = 'youtube-upload-channel-id';

export default function VideoUpload({
  onAnalysisComplete,
  loading,
  setLoading,
  isYoutubeConnected,
  youtubeGoogleConnected = false,
}: VideoUploadProps) {
  const [uploadType, setUploadType] = useState<'file' | 'youtube' | 'facebook' | 'instagram' | 'tiktok'>('file');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // YouTube Upload States
  const [isUploadingToYoutube, setIsUploadingToYoutube] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [youtubeUploadSuccess, setYoutubeUploadSuccess] = useState<{ videoId: string; url: string } | null>(null);
  const [youtubeUploadError, setYoutubeUploadError] = useState<string | null>(null);
  
  // Form States for YouTube
  const [ytTitle, setYtTitle] = useState('');
  const [ytDescription, setYtDescription] = useState('');
  const [ytTags, setYtTags] = useState('');
  const [ytHashtags, setYtHashtags] = useState('');
  const [seoRankScore, setSeoRankScore] = useState<number | null>(null);
  const [rank1Mode, setRank1Mode] = useState(true);
  const [ytPrivacy, setYtPrivacy] = useState<'public' | 'private' | 'unlisted'>('public');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [titleSeoLoading, setTitleSeoLoading] = useState(false);
  const titleSeoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleSeoAbortRef = useRef<AbortController | null>(null);
  const titleSeoGenRef = useRef(0);

  const [youtubeChannels, setYoutubeChannels] = useState<YoutubeChannelOption[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('__default__');
  const [channelsLoaded, setChannelsLoaded] = useState(false);

  const canUseYoutubeUpload = !!isYoutubeConnected || youtubeChannels.length > 0;

  useEffect(() => {
    let cancelled = false;
    async function loadChannels() {
      if (!isAuthenticated()) {
        setChannelsLoaded(true);
        return;
      }
      try {
        const res = await axios.get<{ channels: YoutubeChannelOption[] }>('/api/youtube/channels', {
          headers: getAuthHeaders(),
        });
        if (cancelled) return;
        const list = res.data.channels || [];
        setYoutubeChannels(list);

        const saved = typeof window !== 'undefined' ? localStorage.getItem(YT_UPLOAD_CHANNEL_STORAGE) : null;
        if (saved === '__default__' && youtubeGoogleConnected) {
          setSelectedChannelId('__default__');
        } else if (saved && list.some((c) => c.channelId === saved)) {
          setSelectedChannelId(saved);
        } else if (youtubeGoogleConnected && list.length === 0) {
          setSelectedChannelId('__default__');
        } else if (list.length >= 1) {
          setSelectedChannelId(list[0].channelId);
        } else {
          setSelectedChannelId('__default__');
        }
      } catch {
        if (!cancelled) setYoutubeChannels([]);
      } finally {
        if (!cancelled) setChannelsLoaded(true);
      }
    }
    void loadChannels();
    return () => {
      cancelled = true;
    };
  }, [isYoutubeConnected, youtubeGoogleConnected]);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview(null);
      return;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  useEffect(() => {
    if (!selectedVideoFile || !canUseYoutubeUpload || !ytTitle.trim() || ytTitle.trim().length < 2) {
      return;
    }
    if (!isAuthenticated()) return;

    if (titleSeoDebounceRef.current) clearTimeout(titleSeoDebounceRef.current);
    titleSeoAbortRef.current?.abort();

    titleSeoDebounceRef.current = setTimeout(async () => {
      const myGen = ++titleSeoGenRef.current;
      const ac = new AbortController();
      titleSeoAbortRef.current = ac;
      setTitleSeoLoading(true);
      try {
        const token = getToken();
        const { data } = await axios.post(
          '/api/youtube/title-seo',
          { title: ytTitle.trim(), rank1Mode },
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: ac.signal,
          }
        );
        if (ac.signal.aborted || myGen !== titleSeoGenRef.current) return;
        if (data?.description) {
          setYtDescription(truncateToWordCount(data.description, SEO_DESCRIPTION_MAX_WORDS));
        }
        if (Array.isArray(data?.keywords)) {
          setYtTags(normalizeKeywords(data.keywords, 10));
        } else if (typeof data?.tags === 'string') {
          setYtTags(normalizeKeywords(data.tags, 10));
        }
        if (Array.isArray(data?.hashtags)) {
          setYtHashtags(normalizeHashtags(data.hashtags, 10));
        } else if (typeof data?.hashtagsText === 'string') {
          setYtHashtags(normalizeHashtags(data.hashtagsText, 10));
        }
        if (typeof data?.seoRankScore === 'number') {
          setSeoRankScore(data.seoRankScore);
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') return;
        console.error('Title SEO:', err);
      } finally {
        if (myGen === titleSeoGenRef.current) setTitleSeoLoading(false);
      }
    }, 480);

    return () => {
      if (titleSeoDebounceRef.current) clearTimeout(titleSeoDebounceRef.current);
      titleSeoAbortRef.current?.abort();
    };
  }, [ytTitle, selectedVideoFile, canUseYoutubeUpload, rank1Mode]);

  const handleFileUpload = async (file: File) => {
    setSelectedVideoFile(file);
    setYtTitle(clampYoutubeTitle(file.name.split('.').slice(0, -1).join('.')));
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name);
    formData.append('userId', 'default-user');

    try {
      if (!isAuthenticated()) {
        alert('Please login to upload videos. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        setLoading(false);
        return;
      }
      
      const token = getToken();
      const response = await axios.post('/api/videos/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      const { video, analysisId, metadata } = response.data;
      
      // Construct a partial analysis object for the dashboard to start with
      const initialAnalysis = {
        id: video.id,
        analysisId: analysisId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        viralProbability: 0,
        hookScore: 0,
        thumbnailScore: 0,
        titleScore: 0,
        confidenceLevel: 0,
        isPartial: true, // Flag for Dashboard to start lazy loading
        ...metadata
      };

      onAnalysisComplete(initialAnalysis);
    } catch (error: any) {
      const errorData = error?.response?.data;
      const errorMessage = typeof errorData?.error === 'string' 
        ? errorData.error 
        : (typeof errorData?.message === 'string' ? errorData.message : (error?.message || 'Failed to upload video'));
      
      if (error?.response?.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let url = '';
    let apiEndpoint = '';
    
    if (uploadType === 'youtube' && youtubeUrl) {
      url = youtubeUrl;
      apiEndpoint = '/api/videos/youtube';
    } else if (uploadType === 'facebook' && facebookUrl) {
      url = facebookUrl;
      apiEndpoint = '/api/videos/facebook';
    } else if (uploadType === 'instagram' && instagramUrl) {
      url = instagramUrl;
      apiEndpoint = '/api/videos/instagram';
    } else if (uploadType === 'tiktok' && tiktokUrl) {
      url = tiktokUrl;
      apiEndpoint = '/api/videos/tiktok';
    } else {
      return;
    }

    setLoading(true);
    try {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        alert('Please login to analyze videos. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        setLoading(false);
        return;
      }
      
      const token = getToken();
      const payload = uploadType === 'youtube' 
        ? { youtubeUrl: url, userId: 'default-user' }
        : uploadType === 'facebook'
        ? { facebookUrl: url, userId: 'default-user' }
        : uploadType === 'instagram'
        ? { instagramUrl: url, userId: 'default-user' }
        : { tiktokUrl: url, userId: 'default-user' };
        
      const headers = { Authorization: `Bearer ${token}` };

      // ── STEP 1: Fast Init — get video ID + analysisId in < 2s ──────────────
      const initResponse = await axios.post(apiEndpoint, payload, { headers });
      const { video, analysisId } = initResponse.data;

      if (!video?.id || !analysisId) {
        // Fallback: old APIs (facebook/instagram/tiktok) still return analysis directly
        onAnalysisComplete(initResponse.data.analysis);
        if (uploadType === 'youtube') setYoutubeUrl('');
        if (uploadType === 'facebook') setFacebookUrl('');
        if (uploadType === 'instagram') setInstagramUrl('');
        if (uploadType === 'tiktok') setTiktokUrl('');
        return;
      }

      // ── STEP 2: Trigger Dashboard immediately! ────────────────────────────
      const initialAnalysis = {
        id: video.id,
        analysisId: analysisId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        viralProbability: 0,
        hookScore: 0,
        thumbnailScore: 0,
        titleScore: 0,
        confidenceLevel: 0,
        isPartial: true
      };

      onAnalysisComplete(initialAnalysis);
      
      // Clear the URL inputs
      if (uploadType === 'youtube') setYoutubeUrl('');
      if (uploadType === 'facebook') setFacebookUrl('');
      if (uploadType === 'instagram') setInstagramUrl('');
      if (uploadType === 'tiktok') setTiktokUrl('');
    } catch (error: any) {
      console.error(`${uploadType} import error:`, error);
      console.error('Error response:', error?.response?.data);
      
      // Extract error message from response safely
      let errorMessage = `Failed to import ${uploadType} video`;
      const errorData = error?.response?.data;
      
      if (error?.response?.status === 401) {
        if (errorData?.error === 'Invalid token') {
          errorMessage = 'Your session has expired. Please login again.';
        } else {
          errorMessage = 'Please login to analyze videos.';
        }
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (errorData?.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : (errorData.message || errorMessage);
        if (errorData.details) {
          errorMessage += `\n\nDetails: ${typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details)}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleYoutubeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoFile) return;

    setIsUploadingToYoutube(true);
    setUploadProgress(0);
    setYoutubeUploadError(null);
    setYoutubeUploadSuccess(null);

    const hashtagsLine = ytHashtags.trim();
    const finalDescription = hashtagsLine && !ytDescription.includes(hashtagsLine)
      ? `${ytDescription}\n\n${hashtagsLine}`.trim()
      : ytDescription;

    const formData = new FormData();
    formData.append('video', selectedVideoFile);
    formData.append('title', ytTitle);
    formData.append('description', finalDescription);
    formData.append('tags', ytTags);
    formData.append('privacyStatus', ytPrivacy);
    if (thumbnailFile && thumbnailFile.size > 0) {
      formData.append('thumbnail', thumbnailFile);
    }
    if (selectedChannelId && selectedChannelId !== '__default__') {
      formData.append('channelId', selectedChannelId);
    }

    try {
      const token = getToken();
      const response = await axios.post('/api/youtube/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      if (response.data.success) {
        const watchUrl = response.data.url || response.data.videoUrl;
        setYoutubeUploadSuccess({
          videoId: response.data.videoId,
          url: watchUrl,
        });
        setThumbnailFile(null);
      }
    } catch (err: any) {
      console.error('YouTube upload error:', err);
      setYoutubeUploadError(err.response?.data?.error || 'Failed to upload video to YouTube');
    } finally {
      setIsUploadingToYoutube(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#181818] rounded-xl shadow-lg p-6 border border-[#212121]"
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        <button
          onClick={() => setUploadType('file')}
          className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            uploadType === 'file'
              ? 'bg-[#FF0000] text-white'
              : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
        <button
          onClick={() => setUploadType('youtube')}
          className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            uploadType === 'youtube'
              ? 'bg-[#FF0000] text-white'
              : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
          }`}
        >
          <Youtube className="w-4 h-4" />
          YouTube
        </button>
        <button
          onClick={() => setUploadType('facebook')}
          className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            uploadType === 'facebook'
              ? 'bg-[#1877F2] text-white'
              : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
          }`}
        >
          <Facebook className="w-4 h-4" />
          Facebook
        </button>
        <button
          onClick={() => setUploadType('instagram')}
          className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            uploadType === 'instagram'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
          }`}
        >
          <Instagram className="w-4 h-4" />
          Instagram
        </button>
      </div>

      {uploadType === 'file' ? (
        <div className="space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
              dragActive
                ? 'border-[#FF0000] bg-[#212121]'
                : 'border-[#212121]'
            }`}
          >
            {selectedVideoFile ? (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 text-[#FF0000] mb-4" />
                <p className="text-white font-medium mb-1">{selectedVideoFile.name}</p>
                <p className="text-xs text-[#AAAAAA]">{(selectedVideoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                <button 
                  onClick={() => setSelectedVideoFile(null)}
                  className="mt-4 text-xs text-[#AAAAAA] hover:text-white underline"
                >
                  Change file
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-[#AAAAAA]" />
                <p className="text-[#AAAAAA] mb-2">
                  Drag and drop your video here, or
                </p>
                <label className="cursor-pointer">
                  <span className="text-[#FF0000] font-medium hover:underline">
                    browse files
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    disabled={loading}
                  />
                </label>
              </>
            )}
          </div>

          {selectedVideoFile && canUseYoutubeUpload && !youtubeUploadSuccess && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-8 pt-8 border-t border-[#212121]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Youtube className="w-6 h-6 text-[#FF0000]" />
                  <h3 className="text-lg font-bold text-white">Upload to YouTube</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a
                    href="/dashboard/channels"
                    className="text-[#AAAAAA] hover:text-white inline-flex items-center gap-1"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Manage channels
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/youtube/channels/connect';
                    }}
                    className="text-[#FF0000] hover:underline"
                  >
                    Add channel
                  </button>
                </div>
              </div>

              {channelsLoaded && (youtubeGoogleConnected || youtubeChannels.length > 0) && (
                <div className="mb-4 p-4 rounded-lg bg-[#0F0F0F] border border-[#212121] space-y-2">
                  <label className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">
                    Upload to channel
                  </label>
                  {youtubeGoogleConnected && youtubeChannels.length === 0 && (
                    <p className="text-sm text-[#CCCCCC]">
                      Using the YouTube channel linked to your Google account (
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = '/api/youtube/channels/connect';
                        }}
                        className="text-[#FF0000] hover:underline"
                      >
                        add another channel
                      </button>
                      ).
                    </p>
                  )}
                  {!youtubeGoogleConnected && youtubeChannels.length >= 1 && (
                    <select
                      value={
                        selectedChannelId === '__default__'
                          ? youtubeChannels[0]?.channelId
                          : selectedChannelId
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        setSelectedChannelId(v);
                        localStorage.setItem(YT_UPLOAD_CHANNEL_STORAGE, v);
                      }}
                      className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000]"
                    >
                      {youtubeChannels.map((c) => (
                        <option key={c.channelId} value={c.channelId}>
                          {c.channelTitle}
                        </option>
                      ))}
                    </select>
                  )}
                  {youtubeGoogleConnected && youtubeChannels.length >= 1 && (
                    <select
                      value={selectedChannelId}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSelectedChannelId(v);
                        localStorage.setItem(YT_UPLOAD_CHANNEL_STORAGE, v);
                      }}
                      className="w-full bg-[#181818] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000]"
                    >
                      <option value="__default__">Default (Google login account)</option>
                      {youtubeChannels.map((c) => (
                        <option key={c.channelId} value={c.channelId}>
                          {c.channelTitle}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[11px] text-[#666] leading-relaxed">
                    First time?{' '}
                    <button
                      type="button"
                      className="text-[#FF0000] hover:underline"
                      onClick={() => {
                        window.location.href = '/api/youtube/auth';
                      }}
                    >
                      Connect Google (YouTube)
                    </button>
                    {' · '}
                    Multiple accounts: use{' '}
                    <button
                      type="button"
                      className="text-[#FF0000] hover:underline"
                      onClick={() => {
                        window.location.href = '/api/youtube/channels/connect';
                      }}
                    >
                      Add channel
                    </button>
                    .
                  </p>
                </div>
              )}

              <form onSubmit={handleYoutubeUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <label className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">Video Title</label>
                      <span className="text-[10px] text-[#666] tabular-nums">
                        {ytTitle.length}/{YOUTUBE_TITLE_MAX_CHARS}
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={ytTitle}
                      maxLength={YOUTUBE_TITLE_MAX_CHARS}
                      onChange={(e) => setYtTitle(clampYoutubeTitle(e.target.value))}
                      className="w-full bg-[#0F0F0F] border border-[#212121] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000]"
                      placeholder="Enter catch title..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">Privacy Status</label>
                    <div className="flex gap-2">
                      {(['public', 'unlisted', 'private'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setYtPrivacy(status)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm transition-all ${
                            ytPrivacy === status 
                              ? 'bg-[#FF0000] border-[#FF0000] text-white font-medium shadow-lg shadow-red-600/20' 
                              : 'bg-[#0F0F0F] border-[#212121] text-[#AAAAAA] hover:border-[#333333]'
                          }`}
                        >
                          {status === 'public' && <Globe className="w-4 h-4" />}
                          {status === 'unlisted' && <EyeOff className="w-4 h-4" />}
                          {status === 'private' && <Lock className="w-4 h-4" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <label className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider flex items-center gap-2">
                      SEO description
                      {titleSeoLoading && (
                        <span className="text-[10px] font-normal normal-case text-[#888] tabular-nums">
                          Updating from title…
                        </span>
                      )}
                    </label>
                    <span className="text-[10px] text-[#666] tabular-nums">
                      {countWords(ytDescription)} / {SEO_DESCRIPTION_MAX_WORDS} words
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#2A2A2A] bg-[#111] px-3 py-2">
                    <p className="text-[11px] text-[#BDBDBD]">
                      SEO Rank 1 mode (aggressive keywords + tags)
                    </p>
                    <button
                      type="button"
                      onClick={() => setRank1Mode((v) => !v)}
                      className={`px-2.5 py-1 text-[11px] rounded ${
                        rank1Mode ? 'bg-[#FF0000] text-white' : 'bg-[#212121] text-[#AAAAAA]'
                      }`}
                    >
                      {rank1Mode ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {seoRankScore !== null && (
                    <p className="text-[11px] text-[#8FD48F]">
                      SEO rank score (estimated): {seoRankScore}/100
                    </p>
                  )}
                  <textarea 
                    value={ytDescription}
                    onChange={(e) =>
                      setYtDescription(truncateToWordCount(e.target.value, SEO_DESCRIPTION_MAX_WORDS))
                    }
                    className="w-full bg-[#0F0F0F] border border-[#212121] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000] min-h-[120px]"
                    placeholder="Auto-filled after analyze — edit up to 200 words for SEO..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Thumbnail (optional)
                  </label>
                  <p className="text-[11px] text-[#666]">JPG or PNG — applied on YouTube after the video uploads.</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F0F0F] border border-[#212121] text-sm text-white hover:border-[#333]">
                      <Upload className="w-4 h-4" />
                      Choose image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setThumbnailFile(f || null);
                        }}
                      />
                    </label>
                    {thumbnailPreview && (
                      <div className="relative w-28 h-16 rounded border border-[#212121] overflow-hidden bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setThumbnailFile(null)}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/70 text-white text-[10px]"
                          aria-label="Remove thumbnail"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={ytTags}
                    onChange={(e) => setYtTags(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-[#212121] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000]"
                    placeholder="Auto-filled 10 keywords by title..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">Hashtags (auto-filled)</label>
                  <textarea
                    value={ytHashtags}
                    onChange={(e) => setYtHashtags(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-[#212121] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000] min-h-[70px]"
                    placeholder="Auto-filled 10 hashtags by title..."
                  />
                </div>

                {isUploadingToYoutube ? (
                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#AAAAAA]">Uploading to YouTube...</span>
                      <span className="text-white font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#212121] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-[#FF0000]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isUploadingToYoutube || !ytTitle}
                      className="w-full bg-[#FF0000] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#CC0000] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-xl shadow-red-600/30"
                    >
                      <Youtube className="w-6 h-6" />
                      Upload to YouTube Now
                    </button>
                  </div>
                )}

                {youtubeUploadError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <p>{youtubeUploadError}</p>
                  </div>
                )}
              </form>
            </motion.div>
          )}

          {youtubeUploadSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 p-8 bg-green-500/10 border border-green-500/20 rounded-2xl text-center"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
              <p className="text-[#AAAAAA] mb-8">Your video has been uploaded successfully to YouTube.</p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href={youtubeUploadSuccess.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#212121] text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-all border border-[#333333]"
                >
                  <Share2 className="w-5 h-5" />
                  View on YouTube
                </a>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(youtubeUploadSuccess.url);
                    alert('Link copied to clipboard!');
                  }}
                  className="flex-1 bg-white text-black py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <Copy className="w-5 h-5" />
                  Copy Link
                </button>
              </div>
              
              <button 
                onClick={() => {
                  setYoutubeUploadSuccess(null);
                  setSelectedVideoFile(null);
                  setThumbnailFile(null);
                }}
                className="mt-8 text-sm text-[#AAAAAA] hover:text-white"
              >
                Upload another video
              </button>
            </motion.div>
          )}

          {(!selectedVideoFile || !canUseYoutubeUpload) && (
            <div className="flex flex-col gap-4 mt-8">
              <button
                onClick={() => selectedVideoFile && handleFileUpload(selectedVideoFile)}
                disabled={loading || !selectedVideoFile}
                className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-xl shadow-white/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Analyzing your video...
                  </>
                ) : (
                  <>
                    Analyze for Viral Potential
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : uploadType === 'youtube' && !canUseYoutubeUpload ? (
        <div className="border-2 border-dashed border-[#212121] rounded-lg p-12 text-center">
          <Youtube className="w-12 h-12 mx-auto mb-4 text-[#FF0000]" />
          <h3 className="text-xl font-bold text-white mb-2">Connect Your YouTube Channel</h3>
          <p className="text-[#AAAAAA] mb-6 max-w-sm mx-auto">
            Link your YouTube account to analyze your videos directly and get viral insights.
          </p>
          <button
            onClick={() => window.location.href = '/api/youtube/auth'}
            className="bg-[#FF0000] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#CC0000] transition-all shadow-lg shadow-red-600/20 flex items-center gap-2 mx-auto"
          >
            <Youtube className="w-5 h-5" />
            Connect Now
          </button>
        </div>
      ) : (
        <form onSubmit={handlePlatformSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              {uploadType === 'youtube' && (
                <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              {uploadType === 'facebook' && (
                <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              {uploadType === 'instagram' && (
                <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              {uploadType === 'tiktok' && (
                <Music className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              <input
                type="text"
                value={
                  uploadType === 'youtube' ? youtubeUrl :
                  uploadType === 'facebook' ? facebookUrl :
                  uploadType === 'instagram' ? instagramUrl :
                  tiktokUrl
                }
                onChange={(e) => {
                  if (uploadType === 'youtube') setYoutubeUrl(e.target.value);
                  else if (uploadType === 'facebook') setFacebookUrl(e.target.value);
                  else if (uploadType === 'instagram') setInstagramUrl(e.target.value);
                  else setTiktokUrl(e.target.value);
                }}
                placeholder={
                  uploadType === 'youtube' ? 'Paste YouTube video URL here...' :
                  uploadType === 'facebook' ? 'Paste Facebook video URL here...' :
                  uploadType === 'instagram' ? 'Paste Instagram video URL here...' :
                  'Paste TikTok video URL here...'
                }
                className="w-full pl-10 pr-4 py-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={
                loading ||
                (uploadType === 'youtube' && !youtubeUrl) ||
                (uploadType === 'facebook' && !facebookUrl) ||
                (uploadType === 'instagram' && !instagramUrl) ||
                (uploadType === 'tiktok' && !tiktokUrl)
              }
              className={`px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${
                uploadType === 'youtube' ? 'bg-[#FF0000] text-white hover:bg-[#CC0000]' :
                uploadType === 'facebook' ? 'bg-[#1877F2] text-white hover:bg-[#166FE5]' :
                uploadType === 'tiktok' ? 'bg-black text-white hover:bg-[#1A1A1A]' :
                'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </button>
          </div>
          <p className="text-sm text-[#AAAAAA]">
            {uploadType === 'youtube' && 'Supported: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...'}
            {uploadType === 'facebook' && 'Supported: facebook.com/watch?v=..., fb.watch/..., facebook.com/username/videos/...'}
            {uploadType === 'instagram' && 'Supported: instagram.com/p/..., instagram.com/reel/..., instagram.com/tv/...'}
            {uploadType === 'tiktok' && 'Supported: tiktok.com/@username/video/VIDEO_ID, vm.tiktok.com/SHORT_CODE'}
          </p>
        </form>
      )}
    </motion.div>
  );
}
