'use client';

import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Film, Upload, Copy, Download, Loader2, Play, Pause } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

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
}: {
  clip: Clip;
  videoUrl: string | null;
  index: number;
  onCopyCaption: () => void;
  copied: boolean;
  onDownload: () => void;
  isDownloading: boolean;
  canDownload: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

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
        <div className="w-full md:w-64 aspect-video bg-[#212121] rounded-lg overflow-hidden shrink-0 relative">
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
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [sourceYoutubeUrl, setSourceYoutubeUrl] = useState<string | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

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
      alert(err.response?.data?.error || 'Failed to generate clips');
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
            Auto Shorts Creator
          </h1>
          <p className="text-[#AAAAAA] mb-6">
            Video ka link paste karein ya file upload karein – viral/key moments (scene changes) se short clips banenge. Preview aur download dono available.
          </p>

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
              <p className="text-xs text-[#666] mt-1">Link dalne par video download karke viral scenes se shorts banenge.</p>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
