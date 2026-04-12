'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Loader2,
  Check,
  VideoIcon,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
}

interface ExistingVideoUpdaterProps {
  onVideoSelected: (video: Video) => void;
  onTitleUpdate: (title: string) => void;
  onDescriptionUpdate: (desc: string) => void;
  onTagsUpdate: (tags: string) => void;
}

export default function ExistingVideoUpdater({
  onVideoSelected,
  onTitleUpdate,
  onDescriptionUpdate,
  onTagsUpdate,
}: ExistingVideoUpdaterProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/youtube/my-videos', {
        headers: getAuthHeaders(),
      });
      setVideos(res.data.videos || []);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setNewTitle(video.title);
    setNewDescription(video.description);
    setNewTags('');
    setUpdateMessage(null);
    onVideoSelected(video);
  };

  const handleUpdateVideo = async () => {
    if (!selectedVideo) return;
    if (!newTitle && !newDescription && !newTags) {
      setUpdateMessage({ type: 'error', text: 'Enter at least one new field' });
      return;
    }

    setUpdating(true);
    setUpdateMessage(null);

    try {
      const res = await axios.post(
        '/api/youtube/update-video-metadata',
        {
          videoId: selectedVideo.videoId,
          title: newTitle || undefined,
          description: newDescription || undefined,
          tags: newTags || undefined,
        },
        { headers: getAuthHeaders() }
      );

      if (res.data.success) {
        setUpdateMessage({
          type: 'success',
          text: '✓ Video updated successfully on YouTube!',
        });

        // Update local state
        setSelectedVideo({
          ...selectedVideo,
          title: newTitle,
          description: newDescription,
        });

        setTimeout(() => {
          setUpdateMessage(null);
        }, 3000);
      }
    } catch (err: any) {
      setUpdateMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update video',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#181818] border border-[#212121] rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <VideoIcon className="w-5 h-5 text-[#FF0000]" /> Update Existing Videos
          </h2>
          <p className="text-xs text-[#888]">Replace old metadata with new SEO content</p>
        </div>
        <button
          onClick={fetchVideos}
          disabled={loading}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors disabled:opacity-50"
          title="Refresh videos"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 text-[#FF0000] animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5 text-[#666] hover:text-white" />
          )}
        </button>
      </div>

      {/* Video Selector */}
      <div className="relative">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 bg-[#0F0F0F] border border-[#333] rounded-lg text-left flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
        >
          <div>
            {selectedVideo ? (
              <div className="flex items-center gap-3">
                <img
                  src={selectedVideo.thumbnail}
                  alt="Video"
                  className="w-12 h-9 rounded object-cover"
                />
                <div>
                  <p className="text-white font-semibold text-sm line-clamp-1">
                    {selectedVideo.title}
                  </p>
                  <p className="text-xs text-[#888]">
                    {new Date(selectedVideo.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[#888] text-sm">Select a video to update...</p>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#666] transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#181818] border border-[#333] rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto"
            >
              {videos.length > 0 ? (
                videos.map((video) => (
                  <button
                    key={video.videoId}
                    onClick={() => {
                      handleVideoSelect(video);
                      setExpanded(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#2a2a2a] border-b border-[#333] last:border-0 transition-colors flex items-center gap-3"
                  >
                    <img
                      src={video.thumbnail}
                      alt="Video"
                      className="w-12 h-9 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium line-clamp-2">
                        {video.title}
                      </p>
                      <p className="text-xs text-[#666]">
                        {new Date(video.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedVideo?.videoId === video.videoId && (
                      <Check className="w-5 h-5 text-[#FF0000]" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-[#888] text-sm">No videos found</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Details */}
      {selectedVideo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 border-t border-[#333] pt-4"
        >
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg p-3 flex items-start gap-2">
            <Check className="w-5 h-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#22c55e]">
              Video selected! The title and description have been loaded into the optimizer inputs above. You can now use AI to improve them and push the changes directly to YouTube from the main button above.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
