'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Calendar as CalendarIcon, Plus, X, Clock, Loader2, AlertCircle, Upload, Check, File, Trash2, Sparkles, TrendingUp } from 'lucide-react';
import { getAuthHeaders, getToken } from '@/utils/auth';

interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  scheduledAt: string;
  status: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface CalendarData {
  events: ScheduledPost[];
  totalScheduled: number;
  totalPosted: number;
  upcomingPosts: ScheduledPost[];
}

export default function CalendarPage() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    platform: 'youtube' as 'youtube' | 'facebook' | 'instagram' | 'tiktok',
    scheduledAt: '',
    description: '',
    hashtags: '',
    videoUrl: '',
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [seoRankScore, setSeoRankScore] = useState<number | null>(null);
  const [titleSeoLoading, setTitleSeoLoading] = useState(false);
  const [rank1Mode, setRank1Mode] = useState(true);
  const titleSeoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleSeoAbortRef = useRef<AbortController | null>(null);
  const titleSeoGenRef = useRef(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay(), year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  useEffect(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    void loadCalendar(monthStart, monthEnd);
  }, [year, month]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, []);

  // Auto-generate SEO when title changes
  useEffect(() => {
    if (!formData.videoFile || !formData.title.trim() || formData.title.trim().length < 2) {
      return;
    }

    if (titleSeoDebounceRef.current) clearTimeout(titleSeoDebounceRef.current);
    titleSeoAbortRef.current?.abort();

    titleSeoDebounceRef.current = setTimeout(async () => {
      const myGen = ++titleSeoGenRef.current;
      const ac = new AbortController();
      titleSeoAbortRef.current = ac;
      setTitleSeoLoading(true);
      setSeoRankScore(null);
      
      try {
        const token = getToken();
        const { data } = await axios.post(
          '/api/youtube/title-seo',
          { title: formData.title.trim(), rank1Mode },
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: ac.signal,
          }
        );

        if (ac.signal.aborted || myGen !== titleSeoGenRef.current) return;

        // Auto-fill description
        if (data?.description) {
          setFormData((prev) => ({
            ...prev,
            description: data.description,
          }));
        }

        // Auto-fill hashtags
        if (Array.isArray(data?.hashtags)) {
          const hashtagsStr = data.hashtags
            .map((h: string) => `#${String(h).replace(/^#/, '')}`)
            .join(' ');
          setFormData((prev) => ({
            ...prev,
            hashtags: hashtagsStr,
          }));
        }

        // Show viral/SEO rank score
        if (typeof data?.seoRankScore === 'number') {
          setSeoRankScore(data.seoRankScore);
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') return;
        console.error('Title SEO generation error:', err);
      } finally {
        if (myGen === titleSeoGenRef.current) setTitleSeoLoading(false);
      }
    }, 800);

    return () => {
      if (titleSeoDebounceRef.current) clearTimeout(titleSeoDebounceRef.current);
      titleSeoAbortRef.current?.abort();
    };
  }, [formData.title, formData.videoFile, rank1Mode]);

  const loadCalendar = async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const response = await axios.get('/api/schedule/calendar', {
        headers: getAuthHeaders(),
        params,
      });

      if (response.data?.calendar) {
        const cal = response.data.calendar;
        setCalendarData({
          events: cal.events || [],
          totalScheduled: cal.totalScheduled || 0,
          totalPosted: cal.totalPosted || 0,
          upcomingPosts: cal.upcomingPosts || [],
        });
        setPosts(cal.events || []);
      } else {
        setPosts(response.data.posts || []);
        setCalendarData(null);
      }
    } catch (error: any) {
      console.error('Calendar load error:', error);
      setError(error?.response?.data?.error || 'Failed to load calendar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      // Use FormData for file upload support
      const uploadFormData = new FormData();
      uploadFormData.append('title', formData.title);
      uploadFormData.append('platform', formData.platform);
      uploadFormData.append('scheduledAt', formData.scheduledAt);
      if (formData.description) uploadFormData.append('description', formData.description);
      if (formData.videoUrl) uploadFormData.append('videoUrl', formData.videoUrl);
      if (formData.videoFile) uploadFormData.append('videoFile', formData.videoFile);
      if (formData.thumbnailFile) uploadFormData.append('thumbnailFile', formData.thumbnailFile);
      uploadFormData.append('hashtags', JSON.stringify(formData.hashtags.split(',').map(t => t.trim()).filter(Boolean)));

      await axios.post('/api/schedule/post', uploadFormData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        },
      });

      setShowScheduleForm(false);
      setSelectedDay(null);
      setUploadProgress(0);
      setVideoPreview(null);
      setThumbnailPreview(null);
      setFormData({
        title: '',
        platform: 'youtube',
        scheduledAt: '',
        description: '',
        hashtags: '',
        videoUrl: '',
        videoFile: null,
        thumbnailFile: null,
      });
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      await loadCalendar(monthStart, monthEnd);
    } catch (error: any) {
      console.error('Schedule error:', error);
      setError(error?.response?.data?.error || 'Failed to schedule post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVideoFileSelect = (file: File | null) => {
    if (!file) {
      setFormData({ ...formData, videoFile: null });
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
      setSeoRankScore(null);
      return;
    }

    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    if (file.size > 5 * 1024 * 1024 * 1024) { // 5GB limit
      setError('Video file must be less than 5GB');
      return;
    }

    // Extract filename and set as title
    const filename = file.name.split('.').slice(0, -1).join('.');
    setFormData((prev) => ({ 
      ...prev, 
      videoFile: file,
      title: filename, // Auto-fill title from filename
    }));
    const preview = URL.createObjectURL(file);
    setVideoPreview(preview);
    setError(null);
  };

  const handleThumbnailFileSelect = (file: File | null) => {
    if (!file) {
      setFormData({ ...formData, thumbnailFile: null });
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Thumbnail image must be less than 10MB');
      return;
    }

    setFormData({ ...formData, thumbnailFile: file });
    const preview = URL.createObjectURL(file);
    setThumbnailPreview(preview);
    setError(null);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleVideoFileSelect(files[0]);
    }
  };

  const handleCancel = async (postId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) return;

    try {
      setError(null);
      await axios.delete('/api/schedule/post', {
        headers: getAuthHeaders(),
        params: { postId },
      });
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      await loadCalendar(monthStart, monthEnd);
    } catch (error: any) {
      console.error('Cancel error:', error);
      setError(error?.response?.data?.error || 'Failed to cancel post.');
    }
  };

  const getPostsForDate = (day: number) => {
    const date = new Date(year, month, day);
    return posts.filter(post => {
      const postDate = new Date(post.scheduledAt);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const selectedDayPosts = selectedDay ? getPostsForDate(selectedDay) : [];

  const openScheduleForDay = (day?: number) => {
    let scheduledAt = '';
    if (day) {
      const dt = new Date(year, month, day, 10, 0, 0);
      const offset = dt.getTimezoneOffset() * 60000;
      scheduledAt = new Date(dt.getTime() - offset).toISOString().slice(0, 16);
      setSelectedDay(day);
    }
    setFormData((prev) => ({ ...prev, scheduledAt }));
    setShowScheduleForm(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <CalendarIcon className="w-8 h-8 text-[#FF0000]" /> Content Calendar
              </h1>
              <p className="text-[#AAAAAA]">
                Schedule and manage your content posts
              </p>
            </div>
            <motion.button
              onClick={() => openScheduleForDay()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Schedule Post
            </motion.button>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#888]">Scheduled</p>
              <p className="text-2xl font-bold text-white mt-1">{calendarData?.totalScheduled ?? posts.filter((p) => p.status === 'scheduled').length}</p>
            </div>
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#888]">Posted</p>
              <p className="text-2xl font-bold text-white mt-1">{calendarData?.totalPosted ?? posts.filter((p) => p.status === 'posted').length}</p>
            </div>
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#888]">This Month Total</p>
              <p className="text-2xl font-bold text-white mt-1">{posts.length}</p>
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {monthNames[month]} {year}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="px-4 py-2 rounded-lg bg-[#212121] text-[#DDD] hover:bg-[#2A2A2A]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 rounded-lg bg-[#FF0000] text-white hover:bg-[#CC0000]"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="px-4 py-2 rounded-lg bg-[#212121] text-[#DDD] hover:bg-[#2A2A2A]"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dayNames.map(day => (
                <div key={day} className="text-center font-semibold text-[#777] py-2">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayPosts = getPostsForDate(day);
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                
                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-24 p-2 border border-[#212121] rounded-lg cursor-pointer transition-all ${
                      selectedDay === day ? 'ring-1 ring-[#FF0000]/60' : ''
                    } ${
                      isToday ? 'bg-[#212121] border-[#FF0000]' : ''
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-[#FF0000]' : 'text-white'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map(post => (
                        <div
                          key={post.id}
                          className={`text-xs p-1 rounded truncate ${
                            post.status === 'scheduled' ? 'bg-[#212121] text-[#00FF00]' :
                            post.status === 'posted' ? 'bg-[#212121] text-[#FF0000]' :
                            'bg-[#212121] text-[#AAAAAA]'
                          }`}
                          title={post.title}
                        >
                          {post.platform}: {post.title.substring(0, 15)}...
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <div className="text-xs text-[#AAAAAA]">
                          +{dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDay !== null && (
            <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {monthNames[month]} {selectedDay}, {year}
                </h2>
                <button
                  onClick={() => openScheduleForDay(selectedDay)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF0000] text-white hover:bg-[#CC0000]"
                >
                  <Plus className="w-4 h-4" />
                  Schedule on this day
                </button>
              </div>
              {selectedDayPosts.length === 0 ? (
                <p className="text-[#AAAAAA] text-sm">No posts on this date.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayPosts
                    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                    .map((post) => (
                      <div key={post.id} className="p-3 bg-[#121212] border border-[#222] rounded-lg flex items-center justify-between gap-4">
                        <div>
                          <p className="text-white font-medium">{post.title}</p>
                          <p className="text-xs text-[#999] mt-1">
                            <span className="capitalize">{post.platform}</span> · {new Date(post.scheduledAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {post.status === 'scheduled' && (
                          <button onClick={() => handleCancel(post.id)} className="text-sm text-red-400 hover:text-red-300">
                            Cancel
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Scheduled Posts List */}
          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Upcoming Scheduled Posts
            </h2>
            <div className="space-y-4">
              {posts.filter(p => p.status === 'scheduled').length === 0 ? (
                <p className="text-[#AAAAAA] text-center py-8">
                  No scheduled posts. Click &quot;Schedule Post&quot; to add one.
                </p>
              ) : (
                posts
                  .filter(p => p.status === 'scheduled')
                  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                  .map(post => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 bg-[#212121] rounded-lg border border-[#2A2A2A]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#212121] rounded-lg flex items-center justify-center border border-[#2A2A2A]">
                          <Clock className="w-6 h-6 text-[#FF0000]" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{post.title}</p>
                          <div className="flex gap-4 mt-1 text-sm text-[#AAAAAA]">
                            <span className="capitalize">{post.platform}</span>
                            <span>{new Date(post.scheduledAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancel(post.id)}
                        className="px-4 py-2 text-[#FF0000] hover:bg-[#212121] rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Schedule Form Modal */}
          {showScheduleForm && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#181818] border border-[#212121] rounded-xl shadow-xl p-6 w-full max-w-2xl my-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Schedule Post</h2>
                  <button
                    onClick={() => setShowScheduleForm(false)}
                    className="p-2 hover:bg-[#212121] rounded-lg text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSchedule} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-[#AAAAAA]">
                        Title
                      </label>
                      {titleSeoLoading && (
                        <div className="flex items-center gap-1 text-xs text-[#FF0000]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating SEO...
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Video title (auto-filled from filename or SEO)"
                      className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white placeholder-gray-600"
                    />
                  </div>

                  {/* Viral Score Display */}
                  {seoRankScore !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border flex items-center gap-3 ${
                        seoRankScore >= 90
                          ? 'bg-green-500/10 border-green-500/30'
                          : seoRankScore >= 70
                          ? 'bg-yellow-500/10 border-yellow-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <TrendingUp
                        className={`w-5 h-5 ${
                          seoRankScore >= 90
                            ? 'text-green-400'
                            : seoRankScore >= 70
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#AAAAAA]">Viral Score / SEO Rank</p>
                        <p className={`text-lg font-bold ${
                          seoRankScore >= 90
                            ? 'text-green-400'
                            : seoRankScore >= 70
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}>
                          {seoRankScore}/100
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        seoRankScore >= 90
                          ? 'bg-green-500/20 text-green-300'
                          : seoRankScore >= 70
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {seoRankScore >= 90 ? '🔥 VIRAL' : seoRankScore >= 70 ? '⭐ GOOD' : '❌ LOW'}
                      </span>
                    </motion.div>
                  )}

                  {/* Rank Mode Toggle */}
                  {formData.videoFile && (
                    <div className="flex items-center gap-2 p-3 bg-[#212121] rounded-lg">
                      <Sparkles className="w-4 h-4 text-[#FF0000]" />
                      <button
                        type="button"
                        onClick={() => setRank1Mode(!rank1Mode)}
                        className={`text-xs font-semibold px-3 py-1 rounded transition-all ${
                          rank1Mode
                            ? 'bg-[#FF0000] text-white'
                            : 'bg-[#FF0000]/20 text-[#FF0000]'
                        }`}
                      >
                        {rank1Mode ? '🎯 Rank 1 Mode' : '📊 Viral Mode'}
                      </button>
                      <p className="text-xs text-[#888] flex-1">
                        {rank1Mode ? 'Optimized for #1 ranking' : 'Optimized for viral potential'}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                        Platform
                      </label>
                      <select
                        required
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                        className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white"
                      >
                        <option value="youtube">YouTube</option>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                        Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        min={new Date().toISOString().slice(0, 16)}
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Add description for your post... (auto-generated if SEO available)"
                      className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white placeholder-gray-600"
                    />
                    {formData.description && titleSeoLoading === false && seoRankScore !== null && (
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Auto-generated by AI SEO
                      </p>
                    )}
                  </div>

                  {/* Video Upload Section */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#AAAAAA]">
                      Video Upload (Optional)
                    </label>
                    <div
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleVideoDrop}
                      onClick={() => videoInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                        dragActive
                          ? 'border-[#FF0000] bg-[#FF0000]/5'
                          : 'border-[#212121] hover:border-[#FF0000]/50'
                      }`}
                    >
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleVideoFileSelect(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      {videoPreview ? (
                        <div className="space-y-2">
                          <Check className="w-8 h-8 text-green-400 mx-auto" />
                          <p className="text-sm text-green-400 font-medium">
                            {formData.videoFile?.name}
                          </p>
                          <p className="text-xs text-[#888]">
                            {(formData.videoFile!.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVideoFileSelect(null);
                            }}
                            className="text-xs text-[#FF0000] hover:text-[#CC0000] mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-[#FF0000] mx-auto" />
                          <div className="text-sm text-[#AAAAAA]">
                            Drag and drop your video here, or click to select
                          </div>
                          <p className="text-xs text-[#666]">MP4, WebM, MOV, etc. (Max 5GB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alternative Video URL */}
                  <div>
                    <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                      Or Video URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... or any video URL"
                      className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white"
                    />
                  </div>

                  {/* Thumbnail Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#AAAAAA]">
                      Thumbnail (Optional)
                    </label>
                    <div className="flex gap-4 items-start">
                      <div
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-[#212121] rounded-lg p-4 text-center cursor-pointer hover:border-[#FF0000]/50 transition-all"
                      >
                        <input
                          ref={thumbnailInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleThumbnailFileSelect(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        {thumbnailPreview ? (
                          <div className="space-y-2">
                            <Check className="w-6 h-6 text-green-400 mx-auto" />
                            <p className="text-xs text-green-400">Thumbnail selected</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <File className="w-6 h-6 text-[#888] mx-auto" />
                            <p className="text-xs text-[#888]">Click to upload</p>
                          </div>
                        )}
                      </div>
                      {thumbnailPreview && (
                        <div className="relative">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-24 h-24 object-cover rounded-lg border border-[#212121]"
                          />
                          <button
                            type="button"
                            onClick={() => handleThumbnailFileSelect(null)}
                            className="absolute top-1 right-1 bg-[#FF0000] text-white p-1 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                      Hashtags (comma-separated or auto-generated)
                    </label>
                    <input
                      type="text"
                      value={formData.hashtags}
                      onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                      placeholder="#viral #trending #fyp (auto-generated from SEO)"
                      className="w-full p-3 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white placeholder-gray-600"
                    />
                    {formData.hashtags && titleSeoLoading === false && seoRankScore !== null && (
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> SEO-optimized hashtags
                      </p>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-[#888]">Uploading...</p>
                        <p className="text-xs font-semibold text-[#FF0000]">{uploadProgress}%</p>
                      </div>
                      <div className="w-full bg-[#212121] rounded-full h-2">
                        <div
                          className="bg-[#FF0000] h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-[#212121]">
                    <button
                      type="submit"
                      disabled={submitting || uploadProgress > 0}
                      className="flex-1 px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        'Schedule Post'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowScheduleForm(false)}
                      className="px-6 py-3 bg-[#212121] text-[#AAAAAA] rounded-lg hover:bg-[#2A2A2A] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
