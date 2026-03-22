'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Youtube, Facebook, Instagram, Music, Loader2, CheckCircle2, Globe, Lock, EyeOff, Share2, Copy, X } from 'lucide-react';
import axios from 'axios';
import { getToken, isAuthenticated, getAuthHeaders } from '@/utils/auth';
import type { AxiosProgressEvent } from 'axios';

interface VideoUploadProps {
  onAnalysisComplete: (data: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isYoutubeConnected?: boolean;
}

export default function VideoUpload({ onAnalysisComplete, loading, setLoading, isYoutubeConnected }: VideoUploadProps) {
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
  const [ytPrivacy, setYtPrivacy] = useState<'public' | 'private' | 'unlisted'>('public');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File) => {
    setSelectedVideoFile(file);
    setYtTitle(file.name.split('.').slice(0, -1).join('.'));
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

  const handleYoutubeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoFile) return;

    setIsUploadingToYoutube(true);
    setUploadProgress(0);
    setYoutubeUploadError(null);
    setYoutubeUploadSuccess(null);

    const formData = new FormData();
    formData.append('video', selectedVideoFile);
    formData.append('title', ytTitle);
    formData.append('description', ytDescription);
    formData.append('tags', ytTags);
    formData.append('privacyStatus', ytPrivacy);

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
        setYoutubeUploadSuccess({
          videoId: response.data.videoId,
          url: response.data.url
        });
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

          {selectedVideoFile && isYoutubeConnected && !youtubeUploadSuccess && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-8 pt-8 border-t border-[#212121]"
            >
              <div className="flex items-center gap-2 mb-6">
                <Youtube className="w-6 h-6 text-[#FF0000]" />
                <h3 className="text-lg font-bold text-white">Upload to YouTube</h3>
              </div>

              <form onSubmit={handleYoutubeUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">Video Title</label>
                    <input 
                      type="text" 
                      value={ytTitle}
                      onChange={(e) => setYtTitle(e.target.value)}
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
                  <label className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">Description</label>
                  <textarea 
                    value={ytDescription}
                    onChange={(e) => setYtDescription(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-[#212121] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000] min-h-[100px]"
                    placeholder="Tell your viewers about your video..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={ytTags}
                    onChange={(e) => setYtTags(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-[#212121] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000]"
                    placeholder="viral, ai, nextjs..."
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
                }}
                className="mt-8 text-sm text-[#AAAAAA] hover:text-white"
              >
                Upload another video
              </button>
            </motion.div>
          )}

          {(!selectedVideoFile || !isYoutubeConnected) && (
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
      ) : uploadType === 'youtube' && !isYoutubeConnected ? (
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
