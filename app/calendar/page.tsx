'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Calendar as CalendarIcon, Plus, X, Clock, Loader2, AlertCircle, Upload, Check, File, Trash2, Sparkles, TrendingUp, Youtube, Facebook, Instagram, Film, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { getAuthHeaders, getToken } from '@/utils/auth';
import { useTranslations } from '@/context/translations';

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

const PLATFORM_ICON: Record<string, typeof Youtube> = { youtube: Youtube, facebook: Facebook, instagram: Instagram, tiktok: Film };
const PLATFORM_COLOR: Record<string, string> = { youtube: 'bg-red-500', facebook: 'bg-blue-500', instagram: 'bg-pink-500', tiktok: 'bg-white/20' };

export default function CalendarPage() {
  const { t } = useTranslations();
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
    privacyStatus: 'public' as 'public' | 'private' | 'unlisted',
  });
  const [autoSeoLoading, setAutoSeoLoading] = useState(false);
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
  const [youtubeLinked, setYoutubeLinked] = useState<boolean | null>(null);

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

  // Check if YouTube is linked for auto-upload
  useEffect(() => {
    const checkYoutube = async () => {
      try {
        const res = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
        setYoutubeLinked(!!res.data?.user?.youtubeGoogleConnected || !!res.data?.user?.isYoutubeConnected);
      } catch { setYoutubeLinked(false); }
    };
    checkYoutube();
  }, []);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, []);

  // Auto-generate SEO when title changes (works with AND without video file)
  useEffect(() => {
    if (!formData.title.trim() || formData.title.trim().length < 3) {
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

        // If description or hashtags still empty, use AI keyword intelligence
        if (!data?.description || !data?.hashtags?.length) {
          try {
            setAutoSeoLoading(true);
            const aiRes = await axios.post('/api/ai/keyword-intelligence', {
              primaryKeyword: formData.title.trim(),
              currentPage: 'CONTENT_CALENDAR',
              platform: formData.platform,
              contentType: 'video',
            }, { headers: getAuthHeaders(), signal: ac.signal });

            if (ac.signal.aborted || myGen !== titleSeoGenRef.current) return;
            const aiData = aiRes.data?.data;
            if (aiData) {
              if (!data?.description) {
                const desc = aiData.titles?.[0] ? `${aiData.titles[0]}\n\n` : '';
                const keywords = (aiData.viral_keywords || aiData.suggested_keywords || []).slice(0, 10).join(', ');
                setFormData((prev) => ({
                  ...prev,
                  description: prev.description || `${desc}${keywords ? `Keywords: ${keywords}` : ''}`,
                }));
              }
              if (!data?.hashtags?.length && aiData.hashtags?.length) {
                setFormData((prev) => ({
                  ...prev,
                  hashtags: prev.hashtags || aiData.hashtags.map((h: string) => `#${h.replace(/^#/, '')}`).join(' '),
                }));
              }
            }
          } catch { /* AI fallback silent */ } finally { setAutoSeoLoading(false); }
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') return;

        // Fallback: try AI keyword intelligence directly
        try {
          setAutoSeoLoading(true);
          const aiRes = await axios.post('/api/ai/keyword-intelligence', {
            primaryKeyword: formData.title.trim(),
            currentPage: 'CONTENT_CALENDAR',
            platform: formData.platform,
            contentType: 'video',
          }, { headers: getAuthHeaders(), signal: ac.signal });

          if (ac.signal.aborted || myGen !== titleSeoGenRef.current) return;
          const aiData = aiRes.data?.data;
          if (aiData) {
            if (aiData.hashtags?.length) {
              setFormData((prev) => ({ ...prev, hashtags: prev.hashtags || aiData.hashtags.map((h: string) => `#${h.replace(/^#/, '')}`).join(' ') }));
            }
            const keywords = [...(aiData.viral_keywords || []), ...(aiData.suggested_keywords || [])].slice(0, 8);
            if (keywords.length) {
              setFormData((prev) => ({ ...prev, description: prev.description || `${formData.title}\n\n${keywords.join(', ')}\n\n${(aiData.hashtags || []).slice(0, 10).map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')}` }));
            }
            setSeoRankScore(aiData.keyword_scores?.[0]?.seo_score || 70);
          }
        } catch { /* silent */ } finally { setAutoSeoLoading(false); }

        console.error('Title SEO generation error:', err);
      } finally {
        if (myGen === titleSeoGenRef.current) setTitleSeoLoading(false);
      }
    }, 800);

    return () => {
      if (titleSeoDebounceRef.current) clearTimeout(titleSeoDebounceRef.current);
      titleSeoAbortRef.current?.abort();
    };
  }, [formData.title, rank1Mode]);

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
      uploadFormData.append('hashtags', JSON.stringify(formData.hashtags.split(/[,\s]+/).map(t => t.trim()).filter(Boolean)));
      uploadFormData.append('privacyStatus', formData.privacyStatus);

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
        privacyStatus: 'public',
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
          {/* Animated Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000]/10 via-amber-500/10 to-[#FF0000]/10 animate-pulse" />
            <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-[#FF0000]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF0000] to-amber-600 flex items-center justify-center shadow-lg shadow-[#FF0000]/30">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#FF4444]">
                      {t('calendar.title')}
                    </h1>
                    <p className="text-sm text-[#888] mt-0.5">{t('calendar.subtitle')}</p>
                  </div>
                </div>
                <motion.button onClick={() => openScheduleForDay()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF0000] to-[#CC0000] text-white rounded-xl font-black text-sm shadow-lg shadow-[#FF0000]/20 transition">
                  <Plus className="w-5 h-5" /> Schedule Post
                </motion.button>
              </div>
            </div>
          </motion.div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#181818] border border-[#212121] rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#888] font-bold">Scheduled</p>
                <p className="text-2xl font-black text-amber-400 mt-0.5">{calendarData?.totalScheduled ?? posts.filter((p) => p.status === 'scheduled').length}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-[#181818] border border-[#212121] rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#888] font-bold">Posted</p>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">{calendarData?.totalPosted ?? posts.filter((p) => p.status === 'posted').length}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#181818] border border-[#212121] rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#888] font-bold">This Month</p>
                <p className="text-2xl font-black text-purple-400 mt-0.5">{posts.length}</p>
              </div>
            </motion.div>
          </div>

          {/* YouTube Connection Status */}
          {youtubeLinked === false && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-400">YouTube Not Connected</p>
                  <p className="text-xs text-[#888]">Connect your YouTube account for auto-upload. Scheduled posts will fail without it.</p>
                </div>
              </div>
              <button onClick={() => window.location.href = '/api/youtube/auth'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0">
                <Youtube className="w-4 h-4" /> Connect YouTube
              </button>
            </motion.div>
          )}
          {youtubeLinked === true && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-emerald-400 font-medium">YouTube connected — scheduled posts will auto-upload at the set time</p>
            </div>
          )}

          {/* Calendar View */}
          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">
                {monthNames[month]} <span className="text-[#FF0000]">{year}</span>
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="p-2.5 rounded-xl bg-[#212121] text-[#DDD] hover:bg-[#2A2A2A] hover:text-white transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 rounded-xl bg-[#FF0000] text-white hover:bg-[#CC0000] font-bold text-sm transition">
                  Today
                </button>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="p-2.5 rounded-xl bg-[#212121] text-[#DDD] hover:bg-[#2A2A2A] hover:text-white transition">
                  <ChevronRightIcon className="w-5 h-5" />
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
                const isSelected = selectedDay === day;

                return (
                  <motion.div
                    key={day}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-24 p-2 rounded-xl cursor-pointer transition-all border ${
                      isSelected ? 'border-[#FF0000] bg-[#FF0000]/5 shadow-lg shadow-[#FF0000]/10' :
                      isToday ? 'border-[#FF0000]/50 bg-[#181818]' :
                      dayPosts.length > 0 ? 'border-[#333] bg-[#151515] hover:border-[#555]' :
                      'border-[#1a1a1a] hover:border-[#333] hover:bg-[#111]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-black ${isToday ? 'text-[#FF0000]' : isSelected ? 'text-white' : 'text-[#AAA]'}`}>
                        {day}
                      </span>
                      {dayPosts.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#FF0000]/20 text-[#FF0000] text-[10px] font-bold flex items-center justify-center">
                          {dayPosts.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 2).map(post => {
                        const pColor = PLATFORM_COLOR[post.platform] || 'bg-[#333]';
                        return (
                          <div key={post.id} className="flex items-center gap-1.5 text-[10px] truncate" title={post.title}>
                            {post.thumbnailUrl ? (
                              <img src={post.thumbnailUrl} alt="" className="w-4 h-3 rounded-sm object-cover flex-shrink-0" />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full ${pColor} flex-shrink-0`} />
                            )}
                            <span className={`truncate ${post.status === 'posted' ? 'text-emerald-400' : 'text-[#AAA]'}`}>
                              {post.title.substring(0, 12)}{post.title.length > 12 ? '...' : ''}
                            </span>
                          </div>
                        );
                      })}
                      {dayPosts.length > 2 && (
                        <div className="text-[10px] text-[#666]">+{dayPosts.length - 2} more</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {selectedDay !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#FF0000]" />
                  {monthNames[month]} {selectedDay}, {year}
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedDay(null)}
                    className="p-2 rounded-lg bg-[#222] text-[#888] hover:text-white transition">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={() => openScheduleForDay(selectedDay)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF0000] text-white hover:bg-[#CC0000] font-bold text-sm">
                    <Plus className="w-4 h-4" /> Schedule
                  </button>
                </div>
              </div>
              {selectedDayPosts.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-10 h-10 text-[#333] mx-auto mb-2" />
                  <p className="text-[#888] text-sm">No posts on this date. Click &quot;Schedule&quot; to add one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayPosts
                    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                    .map((post) => {
                      const PIcon = PLATFORM_ICON[post.platform] || CalendarIcon;
                      const pBg = PLATFORM_COLOR[post.platform] || 'bg-[#333]';
                      return (
                        <motion.div key={post.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="p-4 bg-[#111] border border-[#222] rounded-xl flex items-center gap-4 hover:border-[#444] transition group">
                          {/* Thumbnail */}
                          {post.thumbnailUrl ? (
                            <img src={post.thumbnailUrl} alt="" className="w-20 h-12 rounded-lg object-cover flex-shrink-0 border border-[#333]" />
                          ) : (
                            <div className="w-20 h-12 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center flex-shrink-0">
                              <PIcon className="w-5 h-5 text-[#555]" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{post.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-2 h-2 rounded-full ${pBg}`} />
                              <span className="text-xs text-[#888] capitalize">{post.platform}</span>
                              <span className="text-xs text-[#555]">·</span>
                              <span className="text-xs text-[#888]">{new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${post.status === 'posted' ? 'bg-emerald-500/20 text-emerald-400' : post.status === 'scheduled' ? 'bg-amber-500/20 text-amber-400' : 'bg-[#333] text-[#888]'}`}>
                                {post.status === 'posted' ? '✓ Posted' : post.status === 'scheduled' ? '◷ Scheduled' : post.status}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {post.status === 'scheduled' && (
                              <>
                                <button onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    title: post.title,
                                    platform: post.platform as any,
                                    description: post.description || '',
                                    scheduledAt: new Date(new Date(post.scheduledAt).getTime() - new Date(post.scheduledAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16),
                                  }));
                                  setShowScheduleForm(true);
                                }}
                                  className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition">
                                  Edit
                                </button>
                                <button onClick={() => handleCancel(post.id)}
                                  className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/20 transition">
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </motion.div>
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
                  {formData.title.trim().length > 2 && (
                    <div className="flex items-center gap-2 p-3 bg-[#212121] rounded-xl">
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

                  {/* Privacy Status */}
                  <div>
                    <label className="block text-sm font-medium text-[#AAAAAA] mb-2">Visibility</label>
                    <div className="flex gap-2">
                      {([
                        { value: 'public', label: 'Public', icon: '🌍', desc: 'Everyone can see' },
                        { value: 'unlisted', label: 'Unlisted', icon: '🔗', desc: 'Only with link' },
                        { value: 'private', label: 'Private', icon: '🔒', desc: 'Only you' },
                      ] as const).map((opt) => (
                        <button key={opt.value} type="button"
                          onClick={() => setFormData({ ...formData, privacyStatus: opt.value })}
                          className={`flex-1 p-3 rounded-xl border text-center transition ${
                            formData.privacyStatus === opt.value
                              ? opt.value === 'public' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                : opt.value === 'unlisted' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                : 'bg-red-500/10 border-red-500/50 text-red-400'
                              : 'border-[#333] text-[#888] hover:border-[#555]'
                          }`}>
                          <span className="text-lg">{opt.icon}</span>
                          <p className="text-xs font-bold mt-1">{opt.label}</p>
                          <p className="text-[9px] opacity-70">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto SEO Status */}
                  {(titleSeoLoading || autoSeoLoading) && (
                    <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      <p className="text-xs text-purple-400 font-medium">
                        {titleSeoLoading ? 'Generating viral title SEO...' : 'AI generating keywords & hashtags...'}
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-[#AAAAAA]">Description</label>
                      <span className={`text-xs font-mono ${formData.description.length >= 200 ? 'text-emerald-400' : 'text-[#666]'}`}>
                        {formData.description.length} chars {formData.description.length >= 200 ? '✓' : ''}
                      </span>
                    </div>
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
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF0000] to-[#CC0000] text-white rounded-xl hover:from-[#E60000] hover:to-[#AA0000] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF0000]/20"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {formData.videoFile ? 'Uploading to YouTube...' : 'Scheduling...'}
                        </>
                      ) : (
                        <>
                          <CalendarIcon className="w-4 h-4" />
                          {formData.privacyStatus === 'public' ? '🌍 Schedule & Publish' : formData.privacyStatus === 'unlisted' ? '🔗 Schedule Unlisted' : '🔒 Schedule Private'}
                        </>
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
