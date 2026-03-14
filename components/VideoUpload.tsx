'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Youtube, Facebook, Instagram, Music, Loader2 } from 'lucide-react';
import axios from 'axios';
import { getToken, isAuthenticated } from '@/utils/auth';

interface VideoUploadProps {
  onAnalysisComplete: (data: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function VideoUpload({ onAnalysisComplete, loading, setLoading }: VideoUploadProps) {
  const [uploadType, setUploadType] = useState<'file' | 'youtube' | 'facebook' | 'instagram' | 'tiktok'>('file');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
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
      onAnalysisComplete(response.data.analysis);
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error?.response?.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        alert(error?.response?.data?.error || 'Failed to upload video');
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
        
      const response = await axios.post(apiEndpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onAnalysisComplete(response.data.analysis);
      
      // Clear the URL
      if (uploadType === 'youtube') setYoutubeUrl('');
      if (uploadType === 'facebook') setFacebookUrl('');
      if (uploadType === 'instagram') setInstagramUrl('');
      if (uploadType === 'tiktok') setTiktokUrl('');
    } catch (error: any) {
      console.error(`${uploadType} import error:`, error);
      console.error('Error response:', error?.response?.data);
      
      // Extract error message from response
      let errorMessage = `Failed to import ${uploadType} video`;
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        const errorData = error?.response?.data;
        if (errorData?.error === 'Invalid token') {
          errorMessage = 'Your session has expired. Please login again.';
        } else {
          errorMessage = 'Please login to analyze videos.';
        }
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
        if (error.response.data.details) {
          errorMessage += `\n\nDetails: ${error.response.data.details}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show error in alert (can be replaced with a toast notification)
      alert(errorMessage);
    } finally {
      setLoading(false);
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
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? 'border-[#FF0000] bg-[#212121]'
              : 'border-[#212121]'
          }`}
        >
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
