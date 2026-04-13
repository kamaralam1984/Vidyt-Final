'use client';

import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { Film, Upload, Copy, Download, Loader2, Play, Pause, Sparkles, Scissors, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { useTranslations } from '@/context/translations';

interface Clip {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  caption: string;
  hookText: string;
  hashtags: string[];
}

function ClipPreview({
  clip,
  videoUrl,
  index,
  onCopyCaption,
  copied,
  onDownload,
  isDownloading,
  canDownload,
  aspectRatio = '9:16',
}: {
  clip: Clip;
  videoUrl: string | null;
  index: number;
  onCopyCaption: () => void;
  copied: boolean;
  onDownload: () => void;
  isDownloading: boolean;
  canDownload: boolean;
  aspectRatio?: '16:9' | '9:16';
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const aspectClass = aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]';
  const previewWidthClass = aspectRatio === '16:9' ? 'md:w-96' : 'md:w-48';

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    const stopAt = clip.endTime;
    const onTimeUpdate = () => {
      if (v.currentTime >= stopAt) {
        v.pause();
        v.currentTime = clip.startTime;
        setPlaying(false);
      }
    };
    v.addEventListener('timeupdate', onTimeUpdate);
    return () => v.removeEventListener('timeupdate', onTimeUpdate);
  }, [videoUrl, clip.startTime, clip.endTime]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    const onLoadedMetadata = () => {
      v.currentTime = clip.startTime;
    };
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    if (v.readyState >= 1) v.currentTime = clip.startTime;
    return () => v.removeEventListener('loadedmetadata', onLoadedMetadata);
  }, [videoUrl, clip.startTime]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
    } else {
      v.currentTime = clip.startTime;
      v.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className={`w-full ${previewWidthClass} ${aspectClass} bg-[#212121] rounded-lg overflow-hidden shrink-0 relative`}>
          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                preload="metadata"
                className="w-full h-full object-contain"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                playsInline
              />
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white" />}
              </button>
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-xs text-white">
                {(clip.endTime - clip.startTime).toFixed(0)}s
              </span>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#666]">
              Preview ({(clip.endTime - clip.startTime).toFixed(0)}s) — upload video to see preview
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-white font-bold">{clip.title}</p>
          <p className="text-sm text-amber-400">Hook: {clip.hookText}</p>
          <div className="flex flex-wrap gap-1">
            {clip.hashtags.map((h) => (
              <span key={h} className="text-xs px-1.5 py-0.5 bg-[#FF0000]/10 text-[#FF0000] rounded">#{h.replace('#', '')}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={onCopyCaption}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#212121] rounded-lg text-sm text-white hover:bg-[#333] transition">
              <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Caption'}
            </button>
            <button onClick={onDownload} disabled={isDownloading || !canDownload}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#FF0000] rounded-lg text-sm text-white hover:bg-[#CC0000] disabled:opacity-50 transition">
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download
            </button>
            {/* Share Buttons */}
            <button onClick={() => { const text = `${clip.title}\n\n${clip.hookText}\n\n${clip.hashtags.map(h => '#' + h.replace('#','')).join(' ')}`; if (navigator.share) navigator.share({ title: clip.title, text }); else { navigator.clipboard.writeText(text); } }}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm hover:bg-purple-600/30 transition">
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShortsCreatorPage() {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [sourceYoutubeUrl, setSourceYoutubeUrl] = useState<string | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const { t } = useTranslations();

  // Manual mode states
  const [manualVideoLink, setManualVideoLink] = useState('');
  const [manualError, setManualError] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [manualVideoUrl, setManualVideoUrl] = useState<string | null>(null);
  const [manualDownloading, setManualDownloading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const videoRefManual = useRef<HTMLVideoElement>(null);

  // Video editing controls
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [overlayText, setOverlayText] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicVolume, setMusicVolume] = useState(50);
  const [voiceoverFile, setVoiceoverFile] = useState<File | null>(null);
  const [overlayImage, setOverlayImage] = useState<File | null>(null);
  const [overlayImagePreview, setOverlayImagePreview] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'>('bottom-right');
  const [colorFilter, setColorFilter] = useState<'none' | 'warm' | 'cool' | 'vintage' | 'vivid' | 'bw' | 'cinematic'>('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [showEditPanel, setShowEditPanel] = useState(false);

  useEffect(() => {
    if (file && clips.length > 0) {
      const url = URL.createObjectURL(file);
      setVideoObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (!file && sourceYoutubeUrl) setVideoObjectUrl(null);
    else if (!file) setVideoObjectUrl(null);
  }, [file, clips.length, sourceYoutubeUrl]);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleManualVideoLinkChange = async (link: string) => {
    setManualVideoLink(link);
    setManualError('');
    if (!link.trim()) {
      setManualVideoUrl(null);
      setVideoDuration(0);
      setStartTime(0);
      setEndTime(0);
      return;
    }

    // Extract YouTube video ID and create proxy URL for preview
    try {
      let videoId = '';
      if (link.includes('youtube.com/watch?v=')) {
        videoId = link.split('v=')[1]?.split('&')[0];
      } else if (link.includes('youtu.be/')) {
        videoId = link.split('youtu.be/')[1]?.split('?')[0];
      }

      if (videoId) {
        // Use YouTube embed URL for preview
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        setManualVideoUrl(embedUrl);
        
        // Fetch video duration from API
        try {
          const headers = getAuthHeaders() as Record<string, string>;
          const response = await axios.get('/api/youtube/metadata', {
            params: { url: link },
            headers,
          });
          
          if (response.data && response.data.duration) {
            setVideoDuration(response.data.duration);
            setStartTime(0);
            setEndTime(Math.min(60, response.data.duration)); // Default to first 60 seconds
          }
        } catch (err: any) {
          console.warn('Could not fetch video duration:', err.message);
          // Still allow manual selection even if duration fetch fails
          setManualError('Duration detection failed, but you can still set times manually');
          setVideoDuration(0);
        }
      } else {
        setManualError('Invalid YouTube URL');
      }
    } catch (err) {
      setManualError('Failed to process video link');
    }
  };

  const handleManualDownload = async () => {
    if (!manualVideoLink.trim()) {
      setManualError('Video link required');
      return;
    }

    const selectedDuration = endTime - startTime;
    if (selectedDuration <= 0) {
      setManualError('Invalid time range selected');
      return;
    }

    setManualDownloading(true);
    setManualError('');

    const formData = new FormData();
    formData.append('youtubeUrl', manualVideoLink.trim());
    formData.append('startTime', String(startTime));
    formData.append('endTime', String(endTime));
    formData.append('aspectRatio', aspectRatio);
    formData.append('quality', videoQuality);
    if (overlayText) { formData.append('overlayText', overlayText); formData.append('textPosition', textPosition); formData.append('textColor', textColor); }
    if (musicFile) { formData.append('musicFile', musicFile); formData.append('musicVolume', String(musicVolume)); }
    if (voiceoverFile) formData.append('voiceoverFile', voiceoverFile);
    if (overlayImage) { formData.append('overlayImage', overlayImage); formData.append('imagePosition', imagePosition); }
    if (colorFilter !== 'none') formData.append('colorFilter', colorFilter);
    if (brightness !== 100) formData.append('brightness', String(brightness));
    if (contrast !== 100) formData.append('contrast', String(contrast));

    try {
      const headers = getAuthHeaders() as Record<string, string>;
      const res = await fetch('/api/ai/shorts-creator/cut', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Download failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manual-short-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setManualError(e.message || 'Download failed. Check video link or server.');
    } finally {
      setManualDownloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !videoLink.trim()) {
      setGlobalError('Please upload a video file or paste a YouTube video link');
      return;
    }
    setLoading(true);
    setClips([]);
    setVideoObjectUrl(null);
    setSourceYoutubeUrl(null);
    try {
      const formData = new FormData();
      formData.append('title', title || 'My Video');
      if (file) formData.append('video', file);
      if (videoLink.trim()) formData.append('youtubeUrl', videoLink.trim());
      const res = await axios.post('/api/ai/shorts-creator', formData, {
        headers: getAuthHeaders(),
      });
      setClips(res.data.clips || []);
      if (res.data.youtubeUrl) setSourceYoutubeUrl(res.data.youtubeUrl);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to generate clips';
      if (err.response?.status === 413) {
        setGlobalError('File too large. Please try a smaller video file or use a YouTube link.');
      } else {
        setGlobalError(typeof errorMsg === 'string' ? errorMsg : 'Failed to generate clips. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (clip: Clip, index: number) => {
    if (!file && !sourceYoutubeUrl) {
      setGlobalError('Please upload a video or use a link to create shorts first.');
      return;
    }
    setDownloadingIndex(index);
    const formData = new FormData();
    if (file) formData.append('video', file);
    if (sourceYoutubeUrl) formData.append('youtubeUrl', sourceYoutubeUrl);
    formData.append('startTime', String(clip.startTime));
    formData.append('endTime', String(clip.endTime));
    formData.append('aspectRatio', aspectRatio);
    formData.append('quality', videoQuality);
    if (overlayText) { formData.append('overlayText', overlayText); formData.append('textPosition', textPosition); formData.append('textColor', textColor); }
    if (musicFile) { formData.append('musicFile', musicFile); formData.append('musicVolume', String(musicVolume)); }
    if (voiceoverFile) formData.append('voiceoverFile', voiceoverFile);
    if (overlayImage) { formData.append('overlayImage', overlayImage); formData.append('imagePosition', imagePosition); }
    if (colorFilter !== 'none') formData.append('colorFilter', colorFilter);
    if (brightness !== 100) formData.append('brightness', String(brightness));
    if (contrast !== 100) formData.append('contrast', String(contrast));
    try {
      const headers = getAuthHeaders() as Record<string, string>;
      const res = await fetch('/api/ai/shorts-creator/cut', {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `short-clip-${index + 1}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setGlobalError(e.message || 'Download failed. Server may need ffmpeg installed.');
    } finally {
      setDownloadingIndex(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Animated Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-[#FF0000]/10 to-purple-500/10 animate-pulse" />
            <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-[#FF0000] flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Film className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-[#FF4444]">
                    Shorts Creator
                  </h1>
                  <p className="text-sm text-[#888] mt-0.5">
                    {mode === 'auto'
                      ? 'Upload video or paste link — AI finds viral moments and creates short clips automatically'
                      : 'Manually select time range from any YouTube video to cut your own shorts'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Error Banner */}
          {globalError && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
              <span>{globalError}</span>
              <button onClick={() => setGlobalError(null)} className="text-red-400 hover:text-white ml-4">✕</button>
            </div>
          )}

          {/* Mode Selector */}
          <div className="flex gap-3 mb-6">
            <button type="button" onClick={() => { setMode('auto'); setClips([]); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'auto' ? 'bg-gradient-to-r from-[#FF0000] to-purple-600 text-white shadow-lg shadow-red-600/20' : 'bg-[#181818] text-[#888] border border-[#333] hover:text-white'}`}>
              <Sparkles className="w-4 h-4" /> Auto Shorts
            </button>
            <button type="button" onClick={() => { setMode('manual'); setManualVideoLink(''); setManualError(''); setVideoDuration(0); setStartTime(0); setEndTime(0); setManualVideoUrl(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'manual' ? 'bg-gradient-to-r from-[#FF0000] to-purple-600 text-white shadow-lg shadow-red-600/20' : 'bg-[#181818] text-[#888] border border-[#333] hover:text-white'}`}>
              <Scissors className="w-4 h-4" /> Manual Short
            </button>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="mb-8 flex gap-3 items-center">
            <span className="text-sm text-[#AAAAAA] font-semibold">Screen Format:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  aspectRatio === '16:9'
                    ? 'bg-[#FF0000] text-white shadow-lg shadow-red-600/30'
                    : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
                }`}
              >
                <span className="text-lg">📺</span> 16:9 Landscape
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  aspectRatio === '9:16'
                    ? 'bg-[#FF0000] text-white shadow-lg shadow-red-600/30'
                    : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
                }`}
              >
                <span className="text-lg">📱</span> 9:16 Portrait
              </button>
            </div>
          </div>

          {/* Video Quality + Edit Panel Toggle */}
          <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-[#888] font-bold">Quality:</span>
              {(['720p', '1080p', '4k'] as const).map(q => (
                <button key={q} type="button" onClick={() => setVideoQuality(q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${videoQuality === q ? 'bg-emerald-600 text-white' : 'bg-[#222] text-[#888] border border-[#333] hover:text-white'}`}>
                  {q.toUpperCase()}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setShowEditPanel(!showEditPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${showEditPanel ? 'bg-purple-600 text-white' : 'bg-[#181818] text-[#888] border border-[#333] hover:text-white hover:border-purple-500/50'}`}>
              <Scissors className="w-4 h-4" /> {showEditPanel ? 'Hide Editor' : 'Video Editor'}
            </button>
          </div>

          {/* Video Editing Panel */}
          {showEditPanel && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="bg-[#181818] border border-purple-500/20 rounded-xl p-6 mb-6 space-y-5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-purple-400" /> Video Editor
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Text Overlay */}
                <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400">Text Overlay</h4>
                  <input value={overlayText} onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="Text to show on video..."
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white text-sm placeholder-[#555]" />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-[#888] block mb-1">Position</label>
                      <select value={textPosition} onChange={(e) => setTextPosition(e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-[#0a0a0a] border border-[#333] rounded-lg text-white text-xs">
                        <option value="top">Top</option>
                        <option value="center">Center</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#888] block mb-1">Color</label>
                      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-8 rounded border border-[#333] bg-transparent cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Color Balance */}
                <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-blue-400">Color Balance</h4>
                  <div>
                    <label className="text-[10px] text-[#888] block mb-1">Filter</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['none', 'warm', 'cool', 'vintage', 'vivid', 'bw', 'cinematic'] as const).map(f => (
                        <button key={f} type="button" onClick={() => setColorFilter(f)}
                          className={`px-2 py-1 rounded text-[10px] font-bold capitalize ${colorFilter === f ? 'bg-blue-600 text-white' : 'bg-[#222] text-[#888] hover:text-white'}`}>
                          {f === 'bw' ? 'B&W' : f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-[#888] mb-1">
                      <span>Brightness</span><span>{brightness}%</span>
                    </div>
                    <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#333] rounded-full appearance-none" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-[#888] mb-1">
                      <span>Contrast</span><span>{contrast}%</span>
                    </div>
                    <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#333] rounded-full appearance-none" />
                  </div>
                </div>

                {/* Music */}
                <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-emerald-400">Background Music</h4>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg cursor-pointer hover:border-emerald-500/50 text-sm text-[#888]">
                      <input type="file" accept="audio/*" className="hidden" onChange={(e) => setMusicFile(e.target.files?.[0] || null)} />
                      <Upload className="w-4 h-4" /> {musicFile ? musicFile.name.slice(0, 20) : 'Upload MP3/WAV'}
                    </label>
                    {musicFile && <button type="button" onClick={() => setMusicFile(null)} className="text-red-400 text-xs">✕</button>}
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-[#888] mb-1">
                      <span>Music Volume</span><span>{musicVolume}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#333] rounded-full appearance-none" />
                  </div>
                </div>

                {/* Voiceover */}
                <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-pink-400">Voiceover</h4>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg cursor-pointer hover:border-pink-500/50 text-sm text-[#888]">
                      <input type="file" accept="audio/*" className="hidden" onChange={(e) => setVoiceoverFile(e.target.files?.[0] || null)} />
                      <Upload className="w-4 h-4" /> {voiceoverFile ? voiceoverFile.name.slice(0, 20) : 'Upload Voiceover'}
                    </label>
                    {voiceoverFile && <button type="button" onClick={() => setVoiceoverFile(null)} className="text-red-400 text-xs">✕</button>}
                  </div>
                  <p className="text-[10px] text-[#666]">Audio will be mixed with original video audio</p>
                </div>

                {/* Image Overlay */}
                <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3 md:col-span-2">
                  <h4 className="text-sm font-bold text-amber-400">Image Overlay (Logo/Watermark)</h4>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg cursor-pointer hover:border-amber-500/50 text-sm text-[#888]">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { setOverlayImage(f); setOverlayImagePreview(URL.createObjectURL(f)); }
                      }} />
                      <Upload className="w-4 h-4" /> {overlayImage ? overlayImage.name.slice(0, 20) : 'Upload Image'}
                    </label>
                    {overlayImagePreview && (
                      <div className="flex items-center gap-2">
                        <img src={overlayImagePreview} alt="" className="w-10 h-10 rounded object-cover border border-[#333]" />
                        <button type="button" onClick={() => { setOverlayImage(null); setOverlayImagePreview(null); }} className="text-red-400 text-xs">✕</button>
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] text-[#888] block mb-1">Position</label>
                      <select value={imagePosition} onChange={(e) => setImagePosition(e.target.value as any)}
                        className="px-2 py-1.5 bg-[#0a0a0a] border border-[#333] rounded-lg text-white text-xs">
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="center">Center</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Auto Mode Form */}
          {mode === 'auto' && (
            <>
              <form onSubmit={handleSubmit} className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-8">
                <div className="mb-4">
                  <label className="block text-sm text-[#AAAAAA] mb-1">Video title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white"
                    placeholder="My long video"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-[#AAAAAA] mb-1">YouTube video link (optional)</label>
                  <input
                    type="url"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white placeholder-[#666]"
                  />
                  <p className="text-xs text-[#666] mt-1">{t('shorts.autoHint')}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-[#AAAAAA] mb-1">Or upload a video file</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || (!file && !videoLink.trim())}
                  className="flex items-center gap-2 px-6 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  Create Shorts
                </button>
              </form>

              {clips.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">{clips.length} Short Clips</h2>
                  {clips.map((clip, i) => (
                    <ClipPreview
                      key={clip.id}
                      clip={clip}
                      videoUrl={videoObjectUrl}
                      index={i}
                      onCopyCaption={() => copy(clip.caption, `cap-${i}`)}
                      copied={copied === `cap-${i}`}
                      onDownload={() => handleDownload(clip, i)}
                      isDownloading={downloadingIndex === i}
                      canDownload={!!(file || sourceYoutubeUrl)}
                      aspectRatio={aspectRatio}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Manual Mode Form */}
          {mode === 'manual' && (
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#AAAAAA] mb-2 font-semibold">YouTube Video Link</label>
                  <input
                    type="url"
                    value={manualVideoLink}
                    onChange={(e) => handleManualVideoLinkChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white placeholder-[#666]"
                  />
                  <p className="text-xs text-[#666] mt-1">{t('shorts.manualHint')}</p>
                </div>

                {manualError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {manualError}
                  </div>
                )}

                {manualVideoUrl && (
                  <div className="space-y-4">
                    <div className={`border border-[#212121] rounded-lg overflow-hidden bg-black ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'} mx-auto ${aspectRatio === '16:9' ? 'max-w-2xl' : 'max-w-sm'}`}>
                      <iframe
                        width="100%"
                        height="100%"
                        src={manualVideoUrl + "?modestbranding=1"}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>

                    {videoDuration > 0 && (
                      <div className="space-y-4">
                        <div className="bg-[#0F0F0F] border border-[#212121] rounded-lg p-4 space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm text-[#AAAAAA] font-semibold">{t('shorts.startTime')}</label>
                              <span className="text-white font-bold">{startTime.toFixed(1)}s</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={Math.max(videoDuration - 1, 0)}
                              value={startTime}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setStartTime(Math.min(val, endTime));
                              }}
                              className="w-full h-2 bg-[#212121] rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, #FF0000 0%, #FF0000 ${(startTime / videoDuration) * 100}%, #212121 ${(startTime / videoDuration) * 100}%, #212121 100%)`
                              }}
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm text-[#AAAAAA] font-semibold">{t('shorts.endTime')}</label>
                              <span className="text-white font-bold">{endTime.toFixed(1)}s</span>
                            </div>
                            <input
                              type="range"
                              min={Math.min(videoDuration, Math.max(startTime, 1))}
                              max={videoDuration}
                              value={endTime}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setEndTime(Math.max(val, startTime));
                              }}
                              className="w-full h-2 bg-[#212121] rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, #212121 0%, #212121 ${(endTime / videoDuration) * 100}%, #FF0000 ${(endTime / videoDuration) * 100}%, #FF0000 100%)`
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#212121]">
                            <div className="bg-[#181818] rounded p-3 text-center">
                              <p className="text-xs text-[#888] mb-1">{t('shorts.totalLength')}</p>
                              <p className="text-lg font-bold text-white">{videoDuration.toFixed(1)}s</p>
                            </div>
                            <div className="bg-[#181818] rounded p-3 text-center">
                              <p className="text-xs text-[#888] mb-1">{t('shorts.selected')}</p>
                              <p className="text-lg font-bold text-[#FF0000]">{(endTime - startTime).toFixed(1)}s</p>
                            </div>
                            <div className="bg-[#181818] rounded p-3 text-center">
                              <p className="text-xs text-[#888] mb-1">{t('shorts.percentage')}</p>
                              <p className="text-lg font-bold text-emerald-400">
                                {((endTime - startTime) / videoDuration * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleManualDownload}
                          disabled={manualDownloading || endTime <= startTime}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50 font-semibold"
                        >
                          {manualDownloading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Cutting & Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-5 h-5" />
                              Download Short ({(endTime - startTime).toFixed(1)}s)
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
