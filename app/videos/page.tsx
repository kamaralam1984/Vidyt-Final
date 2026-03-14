'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Video, Play, Eye, Calendar, Trash2 } from 'lucide-react';
import { getToken, isAuthenticated } from '@/utils/auth';

export default function VideosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      if (!isAuthenticated()) {
        console.warn('User not authenticated, skipping video fetch');
        setLoading(false);
        return;
      }

      const token = getToken();
      const response = await axios.get('/api/videos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setVideos(response.data.videos || []);
    } catch (error: any) {
      console.error('Error fetching videos:', error);
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/auth?mode=login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: string, videoTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${videoTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      if (!isAuthenticated()) {
        alert('Please login to delete videos.');
        window.location.href = '/auth?mode=login';
        return;
      }

      const token = getToken();
      await axios.delete(`/api/videos/${videoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Remove the video from the list
      setVideos(videos.filter(v => v._id !== videoId));
      alert('Video deleted successfully');
    } catch (error: any) {
      console.error('Error deleting video:', error);
      if (error?.response?.status === 401) {
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/auth?mode=login';
      } else {
        alert(error.response?.data?.error || 'Failed to delete video');
      }
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
          <h1 className="text-3xl font-bold text-white mb-2">My Videos</h1>
          <p className="text-[#AAAAAA] mb-6">
            View and manage your analyzed videos
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-[#AAAAAA]">Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 bg-[#181818] border border-[#212121] rounded-xl shadow-lg">
              <Video className="w-16 h-16 mx-auto text-[#AAAAAA] mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                No videos yet
              </h2>
              <p className="text-[#AAAAAA] mb-4">
                Upload a video or import from YouTube to get started
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <motion.div
                  key={video._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {video.thumbnailUrl && (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-[#AAAAAA]">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{video.views?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-[#AAAAAA]">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <a
                        href={`/videos/${video._id}`}
                        className="flex-1 text-center px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors text-sm"
                      >
                        View Analysis
                      </a>
                      <button
                        onClick={() => handleDelete(video._id, video.title)}
                        className="px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors text-sm flex items-center justify-center"
                        title="Delete video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
