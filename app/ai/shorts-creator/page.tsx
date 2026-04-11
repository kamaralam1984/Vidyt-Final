'use client';

import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Film, Upload, Copy, Download, Loader2, Play, Pause } from 'lucide-react';
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
          <p className="text-white font-medium">{clip.title}</p>
          <p className="text-sm text-[#AAAAAA]">Hook: {clip.hookText}</p>
          <div className="flex flex-wrap gap-1">
            {clip.hashtags.map((h) => (
              <span key={h} className="text-xs text-[#FF0000]">#{h.replace('#', '')}</span>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onCopyCaption}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#212121] rounded text-sm text-white hover:bg-[#333333]"
            >
              <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy caption'}
            </button>
            <button
              onClick={onDownload}
              disabled={isDownloading || !canDownload}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#FF0000] rounded text-sm text-white hover:bg-[#CC0000] disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}{' '}
              Download
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
  const videoRefManual = useRef<HTMLVideoElement>(null);

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
      alert('Video file upload karein ya YouTube video link paste karein');
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
        alert('File too large (413). Please try a smaller video file or use a YouTube link.');
      } else {
        alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (clip: Clip, index: number) => {
    if (!file && !sourceYoutubeUrl) {
      alert('Download ke liye pehle video upload karein ya link se shorts banayein.');
      return;
    }
    setDownloadingIndex(index);
    const formData = new FormData();
    if (file) formData.append('video', file);
    if (sourceYoutubeUrl) formData.append('youtubeUrl', sourceYoutubeUrl);
    formData.append('startTime', String(clip.startTime));
    formData.append('endTime', String(clip.endTime));
    formData.append('aspectRatio', aspectRatio);
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
      alert(e.message || 'Download failed. Server may need ffmpeg.');
    } finally {
      setDownloadingIndex(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Film className="w-8 h-8 text-[#FF0000]" />
            Shorts Creator
          </h1>
          <p className="text-[#AAAAAA] mb-6">
            {mode === 'auto'
              ? 'Video ka link paste karein ya file upload karein – viral/key moments (scene changes) se short clips banenge.'
              : 'Video link se manually shorts banayein – apne time range chun kar segment cut karein.'}
          </p>

          {/* Mode Selector */}
          <div className="flex gap-3 mb-8">
            <button
              type="button"
              onClick={() => {
                setMode('auto');
                setClips([]);
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                mode === 'auto'
                  ? 'bg-[#FF0000] text-white shadow-lg shadow-red-600/30'
                  : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
              }`}
            >
              🤖 Auto Shorts
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('manual');
                setManualVideoLink('');
                setManualError('');
                setVideoDuration(0);
                setStartTime(0);
                setEndTime(0);
                setManualVideoUrl(null);
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                mode === 'manual'
                  ? 'bg-[#FF0000] text-white shadow-lg shadow-red-600/30'
                  : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
              }`}
            >
              ✂️ Manual Short
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
                  <label className="block text-sm text-[#AAAAAA] mb-1">Ya video file upload karein</label>
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
